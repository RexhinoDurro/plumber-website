"""
Load test with a realistic amount of REAL (non-demo) data: years of leads and payments.
Usage: python manage.py shell < ../e2e/volume.py   (with DATABASE_URL set). Rows are named "LOAD …" and removed at the end
unless KEEP=1.
"""
import json, os, random, time, urllib.request
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from leads.models import Lead, Payment

N_LEADS, N_PAY = int(os.environ.get("N_LEADS", 20000)), int(os.environ.get("N_PAY", 15000))
API = os.environ.get("API", "http://localhost:8000")
rnd = random.Random(1)
now = timezone.now()
SERVICES = ["Leak or burst pipe", "Blocked drain", "Boiler or heating", "Water heater", "Gas or Local Law 152", "Bathroom", "Kitchen", "Pipework"]

t = time.time()
leads = Lead.objects.bulk_create(
    [
        Lead(name=f"LOAD Customer {i}", phone=f"(718) 555-{i % 10000:04d}", email=f"load{i}@example.com", postcode=str(10001 + i % 900),
             job=rnd.choice(SERVICES), message="Load test", status=rnd.choice(["new", "contacted", "quoted", "booked", "lost"]), source="contact")
        for i in range(N_LEADS)
    ],
    batch_size=2000,
)
Payment.objects.bulk_create(
    [
        Payment(lead=leads[i] if i < len(leads) and i % 2 == 0 else None, customer_name=f"LOAD Customer {i}", phone=f"(718) 555-{i % 10000:04d}",
                email=f"load{i}@example.com", service=rnd.choice(SERVICES), amount=Decimal(rnd.randrange(150, 9000)), method=rnd.choice(["card", "zelle", "check", "cash"]),
                paid_at=(now - timedelta(days=rnd.uniform(0, 3 * 365))).date(), invoice_number=f"LOAD-{i}")
        for i in range(N_PAY)
    ],
    batch_size=2000,
)
print(f"inserted {N_LEADS} leads + {N_PAY} payments in {time.time() - t:.1f}s")

tok = json.load(urllib.request.urlopen(urllib.request.Request(f"{API}/api/auth/login/", json.dumps({"username": "admin", "password": os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026")}).encode(), {"Content-Type": "application/json"})))["token"]


def hit(path):
    t = time.time()
    r = urllib.request.urlopen(urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Token {tok}"}))
    body = r.read()
    return (time.time() - t) * 1000, len(body), body


worst = 0
for path in [
    "/api/admin/payments/?limit=100", "/api/admin/payments/?limit=100&offset=10000", "/api/admin/payments/summary/",
    "/api/admin/payments/?q=LOAD-14321&limit=100", "/api/admin/payments/?service=Bathroom&limit=100", f"/api/admin/payments/?month={now:%Y-%m}&limit=100",
    "/api/admin/payments/export/", "/api/admin/leads/", "/api/admin/leads/?q=load19999", "/api/admin/stats/",
]:
    ms, size, body = hit(path)
    hit(path)
    ms = min(ms, hit(path)[0])
    worst = max(worst, ms if "export" not in path else 0)
    extra = ""
    if path.startswith("/api/admin/payments/?"):
        d = json.loads(body); extra = f"count={d['count']} total=${d['total']}"
    print(f"{ms:7.0f} ms  {size / 1024:8.0f} KB  {path}  {extra}")

if os.environ.get("KEEP") != "1":
    print("cleanup:", Payment.objects.filter(customer_name__startswith="LOAD").delete()[0], Lead.objects.filter(name__startswith="LOAD").delete()[0])
print("slowest page call:", round(worst), "ms")
