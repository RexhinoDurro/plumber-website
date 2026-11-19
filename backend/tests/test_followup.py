"""Nobody gets left hanging: auto-reply, replies sent by email when the visitor left, push to staff."""

from unittest import mock

import pytest
from django.core import mail

from accounts.models import PushSubscription
from chat import followup
from chat.models import Conversation, Message
from chat.services import add_message

pytestmark = pytest.mark.django_db


def start(api, text="Boiler making a banging noise"):
    r = api.post("/api/chat/start/", {"message": text}, format="json")
    return Conversation.objects.get(pk=r.data["id"]), r.data["token"]


def test_visitor_can_leave_contact_in_chat(api, admin_api):
    conv, tok = start(api)
    r = api.post(f"/api/chat/{conv.id}/contact/?token={tok}", {"via": "whatsapp", "value": "+36 30 999 1111", "name": "Zsófi"}, format="json")
    assert r.status_code == 200
    conv.refresh_from_db()
    assert conv.contact_via == "whatsapp" and conv.visitor_contact == "+36 30 999 1111" and conv.display_name == "Zsófi"
    assert api.post(f"/api/chat/{conv.id}/contact/?token={tok}", {"via": "email", "value": "not-an-email"}, format="json").status_code == 400
    assert api.post(f"/api/chat/{conv.id}/contact/?token=nope", {"via": "sms", "value": "+36301234567"}, format="json").status_code == 404
    assert api.get(f"/api/chat/{conv.id}/messages/?token={tok}").data["contact_via"] == "whatsapp"


def test_auto_reply_when_nobody_answers(api):
    conv, _ = start(api)
    first = conv.messages.get()
    assert followup.check_auto_reply(conv.id, first.id) is True
    auto = conv.messages.filter(auto=True).get()
    assert auto.sender == "admin" and "add your number" in auto.body
    conv.refresh_from_db()
    assert conv.first_admin_reply_at is None  # an automatic message is not a real reply
    # only once per quiet spell
    second = add_message(conv, "visitor", "Hello?")
    assert followup.check_auto_reply(conv.id, second.id) is False


def test_no_auto_reply_if_staff_answered(api):
    conv, _ = start(api)
    first = conv.messages.get()
    add_message(conv, "admin", "Hi, how can we help?")
    assert followup.check_auto_reply(conv.id, first.id) is False


def test_reply_emailed_when_visitor_left(api):
    conv, tok = start(api)
    api.post(f"/api/chat/{conv.id}/contact/?token={tok}", {"via": "email", "value": "anna@example.com"}, format="json")
    reply = add_message(conv, "admin", "We can come tomorrow at 9.")
    assert followup.check_offline_notify(conv.id, reply.id) == "email"
    assert len(mail.outbox) == 1
    m = mail.outbox[0]
    assert m.to == ["anna@example.com"] and "tomorrow at 9" in m.body and f"chat={conv.id}" in m.body
    # not again within 10 minutes
    reply2 = add_message(conv, "admin", "Also bring the boiler manual if you have it.")
    assert followup.check_offline_notify(conv.id, reply2.id) is None


def test_no_email_if_already_read(api):
    conv, tok = start(api)
    api.post(f"/api/chat/{conv.id}/contact/?token={tok}", {"via": "email", "value": "anna@example.com"}, format="json")
    reply = add_message(conv, "admin", "On our way")
    Message.objects.filter(pk=reply.pk).update(read_at=reply.created_at)
    assert followup.check_offline_notify(conv.id, reply.id) is None and not mail.outbox


def test_push_subscription_and_staff_push(admin_api, api):
    sub = {"endpoint": "https://push.example.com/abc", "keys": {"p256dh": "BKey", "auth": "AuthKey"}}
    assert admin_api.get("/api/admin/push/key/").data["key"]
    assert admin_api.post("/api/admin/push/subscribe/", {"subscription": sub}, format="json").status_code == 201
    assert PushSubscription.objects.count() == 1
    with mock.patch("pywebpush.webpush") as wp:
        api.post("/api/leads/", {"name": "Pál", "phone": "+36 30 111 2222", "job": "Blocked drain"}, format="json")
        start(api, "Water heater leaking")
    assert wp.call_count == 2
    import json

    titles = [json.loads(c.kwargs["data"])["title"] + json.loads(c.kwargs["data"])["body"] for c in wp.call_args_list]
    assert "Pál" in titles[0] and "Water heater leaking" in titles[1]
    assert admin_api.delete("/api/admin/push/subscribe/", {"subscription": sub}, format="json").status_code == 204
    assert PushSubscription.objects.count() == 0


def test_stats_has_insights_and_heatmap(admin_api, api):
    start(api)
    s = admin_api.get("/api/admin/stats/").data
    assert len(s["heatmap"]) == 7 and len(s["heatmap"][0]) == 24 and sum(map(sum, s["heatmap"])) == 1
    assert isinstance(s["insights"], list)


def test_review_request_is_recorded(admin_api):
    from leads.models import Lead

    lead = Lead.objects.create(name="Ida", phone="+36301112222", status="booked")
    r = admin_api.patch(f"/api/admin/leads/{lead.id}/", {"review_requested_at": "2026-11-19T10:00:00Z"}, format="json")
    assert r.status_code == 200 and r.data["review_requested_at"]
