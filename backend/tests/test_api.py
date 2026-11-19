import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from chat.models import Conversation
from gallery.models import MediaItem
from leads.models import Lead
from reviews.models import Review

pytestmark = pytest.mark.django_db


def png_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (40, 30), (18, 87, 214)).save(buf, "PNG")
    return buf.getvalue()


# ---------- auth ----------
def test_login_returns_token_for_staff(api, staff):
    r = api.post("/api/auth/login/", {"username": "boss", "password": "pw-strong-123"}, format="json")
    assert r.status_code == 200 and r.data["token"]


def test_login_rejects_wrong_password(api, staff):
    r = api.post("/api/auth/login/", {"username": "boss", "password": "nope"}, format="json")
    assert r.status_code == 400


def test_admin_endpoints_need_token(api):
    for url in ["/api/admin/leads/", "/api/admin/stats/", "/api/admin/conversations/", "/api/admin/gallery/"]:
        assert api.get(url).status_code == 401


def test_logout_deletes_token(admin_api):
    assert admin_api.post("/api/auth/logout/").status_code == 204
    assert admin_api.get("/api/auth/me/").status_code == 401


# ---------- leads ----------
def test_public_lead_created_and_listed(api, admin_api):
    r = api.post("/api/leads/", {"name": "Anna", "phone": "07700 900123", "job": "Leak or burst pipe", "urgent": True, "source": "hero"}, format="json")
    assert r.status_code == 201
    rows = admin_api.get("/api/admin/leads/").data
    assert rows[0]["name"] == "Anna" and rows[0]["status"] == "new" and rows[0]["source"] == "hero"


def test_lead_needs_contact(api):
    r = api.post("/api/leads/", {"name": "Anna"}, format="json")
    assert r.status_code == 400 and "phone" in r.data


def test_honeypot_lead_is_dropped(api):
    r = api.post("/api/leads/", {"name": "Bot", "phone": "0123456789", "website": "spam.example"}, format="json")
    assert r.status_code == 201 and Lead.objects.count() == 0


def test_status_change_records_first_contact(admin_api):
    lead = Lead.objects.create(name="Ben", phone="07700900000")
    r = admin_api.patch(f"/api/admin/leads/{lead.id}/", {"status": "contacted", "notes": "Rang back"}, format="json")
    assert r.status_code == 200 and r.data["first_contacted_at"]


# ---------- gallery ----------
def test_upload_photo_shows_in_public_gallery(api, admin_api):
    f = SimpleUploadedFile("job.png", png_bytes(), content_type="image/png")
    r = admin_api.post("/api/admin/gallery/", {"title": "New boiler", "alt": "Boiler fitted in a cupboard", "category": "Heating", "file": f}, format="multipart")
    assert r.status_code == 201, r.data
    assert r.data["kind"] == "image"
    pub = api.get("/api/gallery/").data
    assert pub[0]["title"] == "New boiler" and pub[0]["src"].startswith("http") and pub[0]["video"] is None


def test_upload_video_is_detected(admin_api):
    f = SimpleUploadedFile("clip.mp4", b"\x00\x00\x00\x18ftypmp42" + b"0" * 100, content_type="video/mp4")
    r = admin_api.post("/api/admin/gallery/", {"title": "Clip", "alt": "Short clip of a repair", "file": f}, format="multipart")
    assert r.status_code == 201 and r.data["kind"] == "video"


def test_upload_rejects_other_files(admin_api):
    f = SimpleUploadedFile("notes.txt", b"hello", content_type="text/plain")
    r = admin_api.post("/api/admin/gallery/", {"title": "x", "alt": "x", "file": f}, format="multipart")
    assert r.status_code == 400


def test_unpublished_hidden_and_reorder(api, admin_api):
    MediaItem.objects.all().delete()  # start from an empty gallery (migrations add our job photos)
    a = MediaItem.objects.create(title="A", alt="a", external_url="https://e.x/a.jpg")
    b = MediaItem.objects.create(title="B", alt="b", external_url="https://e.x/b.jpg", published=False)
    assert [x["title"] for x in api.get("/api/gallery/").data] == ["A"]
    c = MediaItem.objects.create(title="C", alt="c", external_url="https://e.x/c.jpg")
    assert admin_api.post("/api/admin/gallery/reorder/", {"ids": [c.id, a.id, b.id]}, format="json").status_code == 204
    assert [x["title"] for x in api.get("/api/gallery/").data] == ["C", "A"]


# ---------- reviews ----------
def test_review_publish_requires_consent(admin_api, api):
    r = admin_api.post("/api/admin/reviews/", {"name": "Cara", "quote": "Fixed fast.", "published": True}, format="json")
    assert r.status_code == 400
    r = admin_api.post("/api/admin/reviews/", {"name": "Cara", "quote": "Fixed fast.", "published": True, "consent": True}, format="json")
    assert r.status_code == 201
    assert api.get("/api/reviews/").data[0]["name"] == "Cara"


# ---------- chat (REST) ----------
def test_chat_start_and_token_check(api, admin_api):
    r = api.post("/api/chat/start/", {"name": "Dan", "message": "Radiator cold at the top"}, format="json")
    assert r.status_code == 201 and r.data["messages"][0]["sender"] == "visitor"
    cid, tok = r.data["id"], r.data["token"]
    assert api.get(f"/api/chat/{cid}/messages/?token=wrong").status_code == 404
    assert api.get(f"/api/chat/{cid}/messages/?token={tok}").status_code == 200
    conv = admin_api.get("/api/admin/conversations/").data[0]
    assert conv["unread_for_admin"] == 1 and conv["last_message"]["body"] == "Radiator cold at the top"


def test_chat_needs_no_name_and_learns_phone(api, admin_api):
    r = api.post("/api/chat/start/", {"message": "Toilet won't stop running", "client_id": "c-1"}, format="json")
    assert r.status_code == 201 and r.data["messages"][0]["client_id"] == "c-1"
    conv = admin_api.get("/api/admin/conversations/").data[0]
    assert conv["display_name"].startswith("Visitor ") and conv["visitor_contact"] == ""
    cid = r.data["id"]
    from chat.models import Conversation as C
    from chat.services import add_message
    add_message(C.objects.get(pk=cid), "visitor", "You can call me on +36 30 123 4567")
    assert C.objects.get(pk=cid).visitor_contact == "+36 30 123 4567"
    r = admin_api.patch(f"/api/admin/conversations/{cid}/info/", {"visitor_name": "Laci"}, format="json")
    assert r.status_code == 200 and r.data["display_name"] == "Laci"


def test_photos_in_chat(api, admin_api):
    r = api.post("/api/chat/start/", {"message": "Look at this"}, format="json")
    cid, tok = r.data["id"], r.data["token"]
    photo = SimpleUploadedFile("leak.png", png_bytes(), content_type="image/png")
    assert api.post(f"/api/chat/{cid}/photo/?token=bad", {"photo": photo}, format="multipart").status_code == 404
    photo = SimpleUploadedFile("leak.png", png_bytes(), content_type="image/png")
    r = api.post(f"/api/chat/{cid}/photo/?token={tok}", {"photo": photo}, format="multipart")
    assert r.status_code == 201 and r.data["image"].startswith("http") and r.data["sender"] == "visitor"
    bad = SimpleUploadedFile("x.pdf", b"%PDF", content_type="application/pdf")
    assert api.post(f"/api/chat/{cid}/photo/?token={tok}", {"photo": bad}, format="multipart").status_code == 400
    photo = SimpleUploadedFile("fixed.png", png_bytes(), content_type="image/png")
    r = admin_api.post(f"/api/admin/conversations/{cid}/photo/", {"photo": photo}, format="multipart")
    assert r.status_code == 201 and r.data["sender"] == "admin"
    assert admin_api.get("/api/admin/conversations/").data[0]["last_message"]["image"]


def test_admin_reply_and_convert_to_lead(api, admin_api):
    r = api.post("/api/chat/start/", {"name": "Eve", "message": "Boiler pressure dropping, call me on 07700 900555"}, format="json")
    cid = r.data["id"]
    assert admin_api.post(f"/api/admin/conversations/{cid}/reply/", {"body": "On it"}, format="json").status_code == 201
    conv = Conversation.objects.get(pk=cid)
    assert conv.first_admin_reply_at is not None and conv.unread_for_visitor == 1
    r = admin_api.post(f"/api/admin/conversations/{cid}/to-lead/")
    assert r.status_code == 201
    lead = Lead.objects.get(pk=r.data["lead"])
    assert lead.source == "chat" and lead.phone == "07700 900555" and "Boiler pressure" in lead.notes


def test_stats(admin_api, api):
    api.post("/api/leads/", {"name": "Fay", "phone": "07700900111"}, format="json")
    api.post("/api/chat/start/", {"name": "Gus", "message": "hi"}, format="json")
    s = admin_api.get("/api/admin/stats/").data
    assert s["requests_week"] == 2 and s["open_chats"] == 1 and len(s["days"]) == 14 and s["activity"]
    # both are waiting for a first answer, oldest first
    assert s["waiting_count"] == 2 and s["waiting"][0]["name"] == "Fay"


def test_demo_data_is_hidden_and_removable(admin_api, api):
    from django.core.management import call_command

    call_command("seed_demo", "--demo")
    assert admin_api.get("/api/admin/stats/").data["demo_records"] > 0
    assert api.get("/api/reviews/").data == []  # demo reviews never reach the website
    assert admin_api.post("/api/admin/demo/clear/").data["deleted"] > 0
    assert admin_api.get("/api/admin/stats/").data["demo_records"] == 0


def test_demo_review_cannot_be_published(admin_api):
    r = Review.objects.create(name="Sample", quote="x", demo=True, consent=True)
    assert admin_api.patch(f"/api/admin/reviews/{r.id}/", {"published": True}, format="json").status_code == 400


def test_throttle_uses_visitor_ip_with_internal_key(settings, api):
    from django.test import override_settings

    from core.throttles import PublicPostThrottle as _T

    original = _T.THROTTLE_RATES
    with override_settings(INTERNAL_API_KEY="k1", REST_FRAMEWORK={**settings.REST_FRAMEWORK, "DEFAULT_THROTTLE_RATES": {"public_post": "2/hour", "login": "10/minute"}}):
        from core.throttles import PublicPostThrottle

        PublicPostThrottle.THROTTLE_RATES = {"public_post": "2/hour"}
        body = {"name": "Ivy", "phone": "07700900333"}
        h1 = {"HTTP_X_INTERNAL_KEY": "k1", "HTTP_X_CLIENT_IP": "1.1.1.1"}
        h2 = {"HTTP_X_INTERNAL_KEY": "k1", "HTTP_X_CLIENT_IP": "2.2.2.2"}
        assert api.post("/api/leads/", body, format="json", **h1).status_code == 201
        assert api.post("/api/leads/", body, format="json", **h1).status_code == 201
        assert api.post("/api/leads/", body, format="json", **h1).status_code == 429
        # a different visitor behind the same web server is not blocked
        assert api.post("/api/leads/", body, format="json", **h2).status_code == 201
    _T.THROTTLE_RATES = original
