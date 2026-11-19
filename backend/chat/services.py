"""Shared chat actions used by both the REST views and the WebSocket consumers."""

import re

from django.db.models import F
from django.utils import timezone

from core.realtime import ADMINS, conv_group, push

from . import presence
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

PHONE = re.compile(r"(?:\+|00)?\d[\d\s\-()]{6,}\d")
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")


def _jsonable(d):
    if isinstance(d, dict):
        return {k: (str(v) if k in ("id", "lead") and v is not None and not isinstance(v, int) else _jsonable(v)) for k, v in d.items()}
    if hasattr(d, "isoformat"):
        return d.isoformat()
    return d


def message_payload(m: Message) -> dict:
    return _jsonable(dict(MessageSerializer(m).data))


def conversation_payload(conversation: Conversation) -> dict:
    data = _jsonable(dict(ConversationSerializer(conversation).data))
    data["id"] = str(conversation.id)
    return data


def _learn_contact(conversation: Conversation, body: str) -> None:
    """If the visitor types a phone number or email, remember it as their contact."""
    if conversation.visitor_contact or not body:
        return
    m = EMAIL.search(body) or PHONE.search(body)
    if m and (m.re is EMAIL or sum(c.isdigit() for c in m.group()) >= 7):
        conversation.visitor_contact = m.group().strip()[:120]
        conversation.save(update_fields=["visitor_contact"])


def add_message(conversation: Conversation, sender: str, body: str = "", client_id: str = "", attachment=None) -> Message:
    body = (body or "").strip()[:2000]
    now = timezone.now()
    other_online = presence.admins_online() > 0 if sender == Message.Sender.VISITOR else presence.visitor_online(conversation.id)
    msg = Message.objects.create(
        conversation=conversation,
        sender=sender,
        body=body,
        client_id=(client_id or "")[:40],
        attachment=attachment or "",
        delivered_at=now if other_online else None,
    )
    updates = {"last_message_at": now}
    if sender == Message.Sender.VISITOR:
        updates["unread_for_admin"] = F("unread_for_admin") + 1
        updates["status"] = Conversation.Status.OPEN
    else:
        updates["unread_for_visitor"] = F("unread_for_visitor") + 1
        if conversation.first_admin_reply_at is None:
            updates["first_admin_reply_at"] = now
    Conversation.objects.filter(pk=conversation.pk).update(**updates)
    conversation.refresh_from_db()
    if sender == Message.Sender.VISITOR:
        _learn_contact(conversation, body)

    event = {"type": "message", "conversation": str(conversation.id), "message": message_payload(msg)}
    push(conv_group(conversation.id), event)
    push(ADMINS, event)
    push(ADMINS, {"type": "conversation", "conversation": conversation_payload(conversation)})
    return msg


def mark_read(conversation_id, reader: str) -> int:
    """`reader` read everything the other side sent. Tells both sides so ticks turn blue."""
    other = Message.Sender.ADMIN if reader == Message.Sender.VISITOR else Message.Sender.VISITOR
    now = timezone.now()
    qs = Message.objects.filter(conversation_id=conversation_id, sender=other, read_at__isnull=True)
    n = qs.update(read_at=now, delivered_at=now) if qs.filter(delivered_at__isnull=True).exists() else qs.update(read_at=now)
    if reader == Message.Sender.ADMIN:
        Conversation.objects.filter(pk=conversation_id).update(unread_for_admin=0)
    else:
        Conversation.objects.filter(pk=conversation_id).update(unread_for_visitor=0)
    if n:
        event = {"type": "receipt", "conversation": str(conversation_id), "sender": other, "status": "read", "at": now.isoformat()}
        push(conv_group(conversation_id), event)
        push(ADMINS, event)
    return n


def mark_delivered(conversation_id, sender: str) -> int:
    """Messages from `sender` reached the other side (they came online)."""
    now = timezone.now()
    filt = {"sender": sender, "delivered_at__isnull": True}
    if conversation_id:
        filt["conversation_id"] = conversation_id
    convs = set(Message.objects.filter(**filt).values_list("conversation_id", flat=True))
    n = Message.objects.filter(**filt).update(delivered_at=now)
    for cid in convs:
        event = {"type": "receipt", "conversation": str(cid), "sender": sender, "status": "delivered", "at": now.isoformat()}
        push(conv_group(cid), event)
        push(ADMINS, event)
    return n
