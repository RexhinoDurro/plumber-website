"""Shared chat actions used by both the REST views and the WebSocket consumers."""

from django.db.models import F
from django.utils import timezone

from core.realtime import ADMINS, conv_group, push

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


def add_message(conversation: Conversation, sender: str, body: str) -> Message:
    body = body.strip()[:2000]
    msg = Message.objects.create(conversation=conversation, sender=sender, body=body)
    updates = {"last_message_at": timezone.now()}
    if sender == Message.Sender.VISITOR:
        updates["unread_for_admin"] = F("unread_for_admin") + 1
        updates["status"] = Conversation.Status.OPEN
    else:
        updates["unread_for_visitor"] = F("unread_for_visitor") + 1
        if conversation.first_admin_reply_at is None:
            updates["first_admin_reply_at"] = timezone.now()
    Conversation.objects.filter(pk=conversation.pk).update(**updates)
    conversation.refresh_from_db()

    data = MessageSerializer(msg).data
    data["created_at"] = msg.created_at.isoformat()
    event = {"type": "message", "conversation": str(conversation.id), "message": data}
    push(conv_group(conversation.id), event)
    push(ADMINS, event)
    conv = ConversationSerializer(conversation).data
    push(ADMINS, {"type": "conversation", "conversation": _jsonable(conv)})
    return msg


def _jsonable(d):
    out = {}
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = _jsonable(v)
        else:
            out[k] = str(v) if k in ("id", "lead") and v is not None else v
    return out


def conversation_payload(conversation: Conversation) -> dict:
    return _jsonable(ConversationSerializer(conversation).data)
