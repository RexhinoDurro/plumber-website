import datetime as dt

import pytest
from django.utils import timezone

from leads.models import Lead, Payment


@pytest.fixture
def staff(client, django_user_model):
    from rest_framework.authtoken.models import Token

    u = django_user_model.objects.create_user("boss", password="pw", is_staff=True)
    return {"HTTP_AUTHORIZATION": f"Token {Token.objects.create(user=u).key}"}


def test_payments_need_staff(client):
    assert client.get("/api/admin/payments/").status_code == 401


def test_record_payment_from_lead_fills_contact_and_books(client, staff):
    lead = Lead.objects.create(name="Rosa Rivera", phone="(718) 555-0101", email="rosa@example.com", postcode="11215", job="Blocked drain", status="quoted")
    r = client.post(
        "/api/admin/payments/",
        {"lead": lead.id, "customer_name": lead.name, "service": "Blocked drain", "amount": "285.00", "method": "zelle"},
        content_type="application/json",
        **staff,
    )
    assert r.status_code == 201, r.content
    p = Payment.objects.get()
    assert (p.phone, p.email, p.address) == ("(718) 555-0101", "rosa@example.com", "11215")
    lead.refresh_from_db()
    assert lead.status == "booked"
    lr = client.get(f"/api/admin/leads/{lead.id}/", **staff).json()
    assert lr["paid_total"] == "285.00"


def test_payment_validation(client, staff):
    r = client.post("/api/admin/payments/", {"customer_name": "X Y", "service": "Leak", "amount": "0"}, content_type="application/json", **staff)
    assert r.status_code == 400
    body = r.json()
    assert "amount" in body


def test_payment_filters_summary_and_csv(client, staff):
    today = timezone.localdate()
    last_month = (today.replace(day=1) - dt.timedelta(days=3))
    Payment.objects.create(customer_name="Wei Chen", phone="(212) 555-0199", service="Leak or burst pipe", amount=400, paid_at=today)
    Payment.objects.create(customer_name="Grace Kim", email="grace@example.com", service="Boiler or heating", amount=600, paid_at=today, method="check")
    Payment.objects.create(customer_name="Old Job", phone="1", service="Leak or burst pipe", amount=100, paid_at=last_month)

    assert client.get("/api/admin/payments/?q=grace", **staff).json()["count"] == 1
    page = client.get("/api/admin/payments/?service=Leak or burst pipe", **staff).json()
    assert page["count"] == 2 and page["total"] == "500.00"
    assert client.get(f"/api/admin/payments/?month={today:%Y-%m}", **staff).json()["count"] == 2
    p1 = client.get("/api/admin/payments/?limit=2", **staff).json()
    assert len(p1["results"]) == 2 and p1["next_offset"] == 2
    p2 = client.get("/api/admin/payments/?limit=2&offset=2", **staff).json()
    assert len(p2["results"]) == 1 and p2["next_offset"] is None

    s = client.get("/api/admin/payments/summary/", **staff).json()
    assert s["this_month"] == {"total": "1000.00", "count": 2, "average": "500.00"}
    assert s["last_month"]["total"] == "100.00"
    assert s["by_service"][0]["service"] in ("Leak or burst pipe", "Boiler or heating")
    assert s["months"][-1]["month"] == f"{today:%Y-%m}" and len(s["months"]) == 12

    csv = client.get("/api/admin/payments/export/", **staff)
    assert csv["Content-Type"] == "text/csv"
    text = csv.content.decode()
    assert "Wei Chen" in text and "Check" in text and text.startswith("Date,Customer,Phone")


def test_coi_lead_source(client, db):
    r = client.post(
        "/api/leads/",
        {"name": "Building Manager", "email": "pm@example.com", "job": "Certificate of insurance", "message": "COI request", "source": "coi"},
        content_type="application/json",
    )
    assert r.status_code == 201, r.content
    assert Lead.objects.get().source == "coi"


def test_demo_includes_and_clears_payments(db):
    from gallery.management.commands._demo import clear_demo, make_demo

    made = make_demo()
    assert made["payments"] > 40 and Payment.objects.filter(demo=True).count() == made["payments"]
    clear_demo()
    assert Payment.objects.count() == 0


def test_lead_counts_and_server_search(client, staff):
    for i in range(3):
        Lead.objects.create(name=f"Old {i}", phone="1", status="booked" if i else "new")
    Lead.objects.create(name="Zed Unique", phone="2", status="new")
    c = client.get("/api/admin/leads/counts/", **staff).json()
    assert c["all"] == 4 and c["new"] == 2 and c["booked"] == 2 and c["lost"] == 0
    assert client.get("/api/admin/leads/counts/?q=zed", **staff).json()["all"] == 1
    r = client.get("/api/admin/leads/?q=zed&limit=1", **staff)
    assert [l["name"] for l in r.json()] == ["Zed Unique"] and r["X-Total-Count"] == "1"
