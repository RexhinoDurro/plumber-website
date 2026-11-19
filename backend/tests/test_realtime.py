"""Live chat over WebSockets, visitor <-> admin, both directions."""

import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator

from chat.models import Conversation, Message
from config.asgi import application

pytestmark = [pytest.mark.django_db(transaction=True), pytest.mark.asyncio]
ORIGIN = [(b"origin", b"http://localhost:3000")]


async def until(comm, kind, tries=12, **match):
    for _ in range(tries):
        msg = await comm.receive_json_from(timeout=2)
        if msg.get("type") == kind and all(msg.get(k) == v for k, v in match.items()):
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

    # admin sees the visitor come online
    assert (await until(admin, "visitor_presence"))["online"] is True

    # visitor -> admin; delivered straight away because staff are online; client_id echoed back
    await visitor.send_json_to({"type": "message", "body": "Water under the sink", "client_id": "tmp-1"})
    got = await until(admin, "message")
    assert got["message"]["body"] == "Water under the sink" and got["message"]["sender"] == "visitor"
    assert got["message"]["delivered_at"] and not got["message"]["read_at"]
    mine = await until(visitor, "message")
    assert mine["message"]["client_id"] == "tmp-1"

    # admin opens it -> visitor gets a "read" receipt (blue ticks)
    await admin.send_json_to({"type": "read", "conversation": cid})
    receipt = await until(visitor, "receipt")
    assert receipt["status"] == "read" and receipt["sender"] == "visitor"

    # typing indicator admin -> visitor
    await admin.send_json_to({"type": "typing", "conversation": cid})
    assert (await until(visitor, "typing"))["who"] == "admin"

    # admin -> visitor
    await admin.send_json_to({"type": "message", "conversation": cid, "body": "Turn the stopcock off, we're coming"})
    got = await until(visitor, "message")
    assert got["message"]["sender"] == "admin"

    count = await sync_to_async(Message.objects.filter(conversation_id=cid).count)()
    assert count == 2

    # visitor reads the reply -> admin gets a read receipt
    await visitor.send_json_to({"type": "read"})
    receipt = await until(admin, "receipt", sender="admin")
    assert receipt["status"] == "read"

    # admin leaves -> visitor sees offline with a "last seen" time
    await admin.disconnect()
    p = await until(visitor, "presence")
    assert p["online"] is False and p["last_seen"]
    await visitor.disconnect()


async def test_reply_while_visitor_away_is_delivered_when_they_return(token):
    cid, vtok = await make_conv()
    admin = WebsocketCommunicator(application, f"/ws/admin/?token={token}", headers=ORIGIN)
    await admin.connect()
    await admin.send_json_to({"type": "message", "conversation": cid, "body": "We can come at 9"})
    got = await until(admin, "message")
    assert got["message"]["delivered_at"] is None  # visitor not connected: one tick

    visitor = WebsocketCommunicator(application, f"/ws/chat/{cid}/?token={vtok}", headers=ORIGIN)
    await visitor.connect()
    receipt = await until(admin, "receipt")
    assert receipt["status"] == "delivered"  # two ticks once they're back
    await visitor.disconnect()
    await admin.disconnect()


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
