"""Live chat over WebSockets, visitor <-> admin, both directions."""

import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator

from chat.models import Conversation, Message
from config.asgi import application

pytestmark = [pytest.mark.django_db(transaction=True), pytest.mark.asyncio]
ORIGIN = [(b"origin", b"http://localhost:3000")]


async def until(comm, kind, tries=8):
    for _ in range(tries):
        msg = await comm.receive_json_from(timeout=2)
        if msg.get("type") == kind:
            return msg
    raise AssertionError(f"no {kind} event")


@sync_to_async
def make_conv():
    c = Conversation.objects.create(visitor_name="Hana")
    return str(c.id), c.visitor_token


async def test_visitor_and_admin_talk_live(token):
    cid, vtok = await make_conv()

    admin = WebsocketCommunicator(application, f"/ws/admin/?token={token}", headers=ORIGIN)
    ok, _ = await admin.connect()
    assert ok
    assert (await admin.receive_json_from())["type"] == "hello"

    visitor = WebsocketCommunicator(application, f"/ws/chat/{cid}/?token={vtok}", headers=ORIGIN)
    ok, _ = await visitor.connect()
    assert ok
    hello = await visitor.receive_json_from()
    assert hello["type"] == "hello" and hello["online"] is True  # admin is online

    # visitor -> admin
    await visitor.send_json_to({"type": "message", "body": "Water under the sink"})
    got = await until(admin, "message")
    assert got["message"]["body"] == "Water under the sink" and got["message"]["sender"] == "visitor"

    # typing indicator admin -> visitor
    await admin.send_json_to({"type": "typing", "conversation": cid})
    assert (await until(visitor, "typing"))["who"] == "admin"

    # admin -> visitor
    await admin.send_json_to({"type": "message", "conversation": cid, "body": "Turn the stopcock off, we're coming"})
    got = await until(visitor, "message")
    assert got["message"]["sender"] == "admin"

    count = await sync_to_async(Message.objects.filter(conversation_id=cid).count)()
    assert count == 2

    # admin leaves -> visitor sees offline
    await admin.disconnect()
    assert (await until(visitor, "presence"))["online"] is False
    await visitor.disconnect()


async def test_visitor_needs_right_token():
    cid, _ = await make_conv()
    comm = WebsocketCommunicator(application, f"/ws/chat/{cid}/?token=bad", headers=ORIGIN)
    ok, _ = await comm.connect()
    assert not ok


async def test_admin_needs_staff_token():
    comm = WebsocketCommunicator(application, "/ws/admin/?token=bad", headers=ORIGIN)
    ok, _ = await comm.connect()
    assert not ok


async def test_foreign_origin_rejected(token):
    comm = WebsocketCommunicator(application, f"/ws/admin/?token={token}", headers=[(b"origin", b"https://evil.example")])
    ok, _ = await comm.connect()
    assert not ok
