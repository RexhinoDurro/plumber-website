"""
Things that happen a little later, so no customer is left hanging:

- auto-reply: if nobody has answered a visitor within AUTO_REPLY_SECONDS, the business
  sends one friendly holding message (marked auto, so it never counts as a staff reply).
- offline notify: if staff reply while the visitor has left and they haven't read it after
  OFFLINE_NOTIFY_SECONDS, the reply goes out by email / SMS / WhatsApp with a link back.

Timers run in-process (fine for one server). With several servers, run them from a task queue.
"""

import threading
from datetime import timedelta

from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone


def _later(seconds: int, fn, *args):
    if seconds <= 0:
        return
    if getattr(settings, "FOLLOWUP_SYNC", False):  # tests call the checks directly
        return
    t = threading.Timer(seconds, _run, args=(fn, *args))
    t.daemon = True
    t.start()


def _run(fn, *args):
    close_old_connections()
    try:
        fn(*args)
    finally:
        close_old_connections()


def auto_reply_text(conversation) -> str:
    phone = settings.BUSINESS_PHONE
    if conversation.visitor_contact:
        return (
            "Thanks for your message. We're out on a job right now and will reply as soon as we can, "
            f"here or on {conversation.visitor_contact}. If water is leaking, call us on {phone}."
        )
    return (
        "Thanks for your message. We're out on a job right now and will reply as soon as we can. "
        f"If you might close this page, add your number or email below and we'll get back to you there. Leak right now? Call {phone}."
    )


def schedule_auto_reply(conversation_id, visitor_message_id):
    _later(settings.AUTO_REPLY_SECONDS, check_auto_reply, conversation_id, visitor_message_id)


def check_auto_reply(conversation_id, visitor_message_id) -> bool:
    """Send the holding message if nobody (person or auto) has answered since that visitor message."""
    from .models import Conversation, Message
    from .services import add_message

    try:
        conv = Conversation.objects.get(pk=conversation_id)
        msg = Message.objects.get(pk=visitor_message_id)
    except (Conversation.DoesNotExist, Message.DoesNotExist):
        return False
    if conv.status != Conversation.Status.OPEN:
        return False
    if conv.messages.filter(sender=Message.Sender.ADMIN, created_at__gte=msg.created_at).exists():
        return False  # someone answered (or an auto-reply already went)
    # One auto-reply per quiet spell: skip if there was one in the last hour.
    if conv.messages.filter(auto=True, created_at__gte=timezone.now() - timedelta(hours=1)).exists():
        return False
    add_message(conv, Message.Sender.ADMIN, auto_reply_text(conv), auto=True)
    return True


def schedule_offline_notify(conversation_id, admin_message_id):
    _later(settings.OFFLINE_NOTIFY_SECONDS, check_offline_notify, conversation_id, admin_message_id)


def check_offline_notify(conversation_id, admin_message_id) -> str | None:
    from . import presence
    from .models import Conversation, Message
    from .notify import notify_visitor

    try:
        conv = Conversation.objects.get(pk=conversation_id)
        msg = Message.objects.get(pk=admin_message_id)
    except (Conversation.DoesNotExist, Message.DoesNotExist):
        return None
    if msg.read_at or presence.visitor_online(conv.id):
        return None
    if conv.last_notified_at and conv.last_notified_at > timezone.now() - timedelta(minutes=10):
        return None  # don't flood them; the link shows every new message anyway
    unseen = list(conv.messages.filter(sender=Message.Sender.ADMIN, read_at__isnull=True, auto=False).order_by("created_at"))
    if not unseen:
        return None
    text = "\n".join(m.body or "[photo]" for m in unseen)[:1200]
    via = notify_visitor(conv, text)
    if via:
        Conversation.objects.filter(pk=conv.pk).update(last_notified_at=timezone.now())
    return via
