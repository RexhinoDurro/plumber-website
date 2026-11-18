"""
Real-time chat over WebSockets.

Visitor socket:  /ws/chat/<conversation-id>/?token=<visitor token>
Admin socket:    /ws/admin/?token=<staff API token>

Events sent to clients are JSON objects with a "type": message, typing, presence,
conversation, conversation_new, lead_new, status, hello.
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from core.realtime import ADMINS, VISITORS, conv_group

from . import presence
from .models import Conversation, Message
from .services import add_message, conversation_payload


def _query_token(scope) -> str:
    qs = parse_qs(scope.get("query_string", b"").decode())
    return (qs.get("token") or [""])[0]


class BroadcastMixin:
    async def broadcast(self, event):
        await self.send_json(event["payload"])


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
        await self.send_json({"type": "hello", "online": presence.admins_online() > 0, "status": self.conv.status})

    async def disconnect(self, code):
        if getattr(self, "group", None):
            await self.channel_layer.group_discard(self.group, self.channel_name)
            await self.channel_layer.group_discard(VISITORS, self.channel_name)

    async def receive_json(self, content, **kwargs):
        kind = content.get("type")
        if kind == "message":
            body = str(content.get("body", "")).strip()
            if body:
                await database_sync_to_async(add_message)(self.conv, Message.Sender.VISITOR, body)
        elif kind == "typing":
            await self.channel_layer.group_send(
                ADMINS, {"type": "broadcast", "payload": {"type": "typing", "conversation": self.conv_id, "who": "visitor"}}
            )
        elif kind == "read":
            await database_sync_to_async(Conversation.objects.filter(pk=self.conv_id).update)(unread_for_visitor=0)

    @database_sync_to_async
    def _get_conversation(self, pk, token):
        try:
            conv = Conversation.objects.get(pk=pk)
        except (Conversation.DoesNotExist, ValueError, Exception):
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
            await self.channel_layer.group_send(VISITORS, {"type": "broadcast", "payload": {"type": "presence", "online": True}})
        await self.send_json({"type": "hello", "admins_online": n})

    async def disconnect(self, code):
        if getattr(self, "counted", False):
            await self.channel_layer.group_discard(ADMINS, self.channel_name)
            n = presence.change(-1)
            if n == 0:
                await self.channel_layer.group_send(VISITORS, {"type": "broadcast", "payload": {"type": "presence", "online": False}})

    async def receive_json(self, content, **kwargs):
        kind = content.get("type")
        conv_id = str(content.get("conversation", ""))
        conv = await self._conversation(conv_id) if conv_id else None
        if conv is None:
            return
        if kind == "message":
            body = str(content.get("body", "")).strip()
            if body:
                await database_sync_to_async(add_message)(conv, Message.Sender.ADMIN, body)
        elif kind == "typing":
            await self.channel_layer.group_send(
                conv_group(conv_id), {"type": "broadcast", "payload": {"type": "typing", "conversation": conv_id, "who": "admin"}}
            )
        elif kind == "read":
            payload = await self._mark_read(conv_id)
            await self.channel_layer.group_send(ADMINS, {"type": "broadcast", "payload": {"type": "conversation", "conversation": payload}})

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

    @database_sync_to_async
    def _mark_read(self, pk):
        Conversation.objects.filter(pk=pk).update(unread_for_admin=0)
        return conversation_payload(Conversation.objects.get(pk=pk))
