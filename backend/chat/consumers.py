"""
Real-time chat over WebSockets.

Visitor socket:  /ws/chat/<conversation-id>/?token=<visitor token>
Admin socket:    /ws/admin/?token=<staff API token>

Client -> server: {"type": "message", "body", "client_id"} · {"type": "typing"} · {"type": "read"}
(admins add "conversation": <id>).
Server -> client: hello, message, receipt (delivered/read ticks), typing, presence,
visitor_presence, conversation, conversation_new, lead_new, status.
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from core.realtime import ADMINS, VISITORS, conv_group

from . import presence
from .models import Conversation, Message
from .services import add_message, mark_delivered, mark_read


def _query_token(scope) -> str:
    qs = parse_qs(scope.get("query_string", b"").decode())
    return (qs.get("token") or [""])[0]


class BroadcastMixin:
    async def broadcast(self, event):
        await self.send_json(event["payload"])

    async def to(self, group, payload):
        await self.channel_layer.group_send(group, {"type": "broadcast", "payload": payload})


class VisitorConsumer(BroadcastMixin, AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conv_id = str(self.scope["url_route"]["kwargs"]["conversation_id"])
        self.conv = await self._get_conversation(self.conv_id, _query_token(self.scope))
        if self.conv is None:
            await self.close(code=4401)
            return
        self.group = conv_group(self.conv_id)
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.channel_layer.group_add(VISITORS, self.channel_name)
        await self.accept()
        if presence.visitor_change(self.conv_id, +1) == 1:
            await self.to(ADMINS, {"type": "visitor_presence", "conversation": self.conv_id, "online": True})
            # Replies sent while they were away have now reached their device.
            await database_sync_to_async(mark_delivered)(self.conv_id, Message.Sender.ADMIN)
        await self.send_json({"type": "hello", **presence.business_status(), "status": self.conv.status})

    async def disconnect(self, code):
        if getattr(self, "group", None):
            await self.channel_layer.group_discard(self.group, self.channel_name)
            await self.channel_layer.group_discard(VISITORS, self.channel_name)
            if presence.visitor_change(self.conv_id, -1) == 0:
                await self.to(
                    ADMINS,
                    {"type": "visitor_presence", "conversation": self.conv_id, "online": False, "last_seen": presence.visitor_last_seen(self.conv_id)},
                )

    async def receive_json(self, content, **kwargs):
        kind = content.get("type")
        if kind == "message":
            body = str(content.get("body", "")).strip()
            if body:
                await database_sync_to_async(add_message)(self.conv, Message.Sender.VISITOR, body, str(content.get("client_id", "")))
        elif kind == "typing":
            await self.to(ADMINS, {"type": "typing", "conversation": self.conv_id, "who": "visitor"})
        elif kind == "read":
            await database_sync_to_async(mark_read)(self.conv_id, Message.Sender.VISITOR)

    @database_sync_to_async
    def _get_conversation(self, pk, token):
        try:
            conv = Conversation.objects.get(pk=pk)
        except Exception:
            return None
        return conv if token and token == conv.visitor_token else None


class AdminConsumer(BroadcastMixin, AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = await self._user_for_token(_query_token(self.scope))
        if self.user is None:
            await self.close(code=4401)
            return
        await self.channel_layer.group_add(ADMINS, self.channel_name)
        await self.accept()
        self.counted = True
        n = presence.change(+1)
        if n == 1:
            await self.to(VISITORS, {"type": "presence", "online": True, "last_seen": None})
            await database_sync_to_async(mark_delivered)(None, Message.Sender.VISITOR)
        await self.send_json({"type": "hello", "admins_online": n})

    async def disconnect(self, code):
        if getattr(self, "counted", False):
            await self.channel_layer.group_discard(ADMINS, self.channel_name)
            if presence.change(-1) == 0:
                await self.to(VISITORS, {"type": "presence", "online": False, "last_seen": presence.admins_last_seen()})

    async def receive_json(self, content, **kwargs):
        kind = content.get("type")
        conv_id = str(content.get("conversation", ""))
        conv = await self._conversation(conv_id) if conv_id else None
        if conv is None:
            return
        if kind == "message":
            body = str(content.get("body", "")).strip()
            if body:
                await database_sync_to_async(add_message)(conv, Message.Sender.ADMIN, body, str(content.get("client_id", "")))
        elif kind == "typing":
            await self.to(conv_group(conv_id), {"type": "typing", "conversation": conv_id, "who": "admin"})
        elif kind == "read":
            await database_sync_to_async(mark_read)(conv_id, Message.Sender.ADMIN)

    @database_sync_to_async
    def _user_for_token(self, key):
        from rest_framework.authtoken.models import Token

        if not key:
            return None
        try:
            user = Token.objects.select_related("user").get(key=key).user
        except Token.DoesNotExist:
            return None
        return user if user.is_active and user.is_staff else None

    @database_sync_to_async
    def _conversation(self, pk):
        try:
            return Conversation.objects.get(pk=pk)
        except Exception:
            return None
