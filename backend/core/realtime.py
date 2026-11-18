"""Small helpers to push events to WebSocket groups from normal (sync) Django code."""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

ADMINS = "admins"
VISITORS = "visitors"


def conv_group(conversation_id) -> str:
    return f"conv_{str(conversation_id).replace('-', '')}"


def push(group: str, payload: dict) -> None:
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(group, {"type": "broadcast", "payload": payload})
