"""
Real-data run: start from an EMPTY database (no --demo), send requests through every public form and the chat,
then work them in the dashboard: record payments, search, filter, edit, export, delete.

Run with both servers up and a staff user admin / $ADMIN_PASSWORD. Records are named "E2E …" so they're easy to spot.
"""
import csv, io, os, re, sys, time
from PIL import Image
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE_URL", "http://localhost:3000")
SHOTS = os.environ.get("SHOTS_DIR", "/tmp/shots-real"); os.makedirs(SHOTS, exist_ok=True)
_b = io.BytesIO(); Image.new("RGB", (64, 48), (200, 210, 225)).save(_b, "JPEG"); FAKE = _b.getvalue()
errors = []


def wire(page, tag):
    page.on("pageerror", lambda e: errors.append(f"[{tag}] pageerror {e}"))
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errors.append(f"[{tag}] console {m.text}"))
    page.route(re.compile(r"https://(images|videos)\.pexels\.com/.*"), lambda r: r.fulfill(status=200, body=FAKE, content_type="image/jpeg"))


with sync_playwright() as p:
    b = p.chromium.launch()
    vis = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page(); wire(vis, "visitor")

    # 1. Contact page form
    vis.goto(f"{BASE}/contact")
    vis.fill("#name", "E2E Maria Gonzalez"); vis.fill("#phone", "(718) 555-0123"); vis.fill("#email", "maria.e2e@example.com")
    vis.fill("#postcode", "11372")
    vis.locator("#job").select_option(index=2)
    vis.fill("#message", "Kitchen sink backs up every time the dishwasher runs. 4th floor walk-up in Jackson Heights.")
    vis.get_by_role("button", name="Send my request").click()
    expect(vis.get_by_text("Thanks, we've got it.")).to_be_visible(timeout=10000)
    print("contact form sent")

    # 2. Quick quote on a service page
    vis.goto(f"{BASE}/services/gas")
    vis.locator("input[name=name]").first.fill("E2E Tom Okafor")
    vis.locator("input[name=phone]").first.fill("(347) 555-0188")
    vis.get_by_role("button", name="Request my callback").click()
    expect(vis.get_by_role("status").filter(has_text=re.compile("call", re.I)).first).to_be_visible(timeout=10000)
    print("quick quote sent")

    # 3. COI request for buildings
    vis.goto(f"{BASE}/buildings")
    vis.get_by_role("button", name="Request the certificate").click()  # empty -> errors, nothing sent
    expect(vis.get_by_text("Add the building address.")).to_be_visible()
    vis.fill("#coi-name", "E2E Priya Shah"); vis.fill("#coi-email", "pshah.e2e@example.com")
    vis.fill("#coi-building", "245 E 63rd St, New York, NY 10065"); vis.fill("#coi-unit", "12B")
    vis.fill("#coi-company", "E2E Gotham Property Mgmt"); vis.fill("#coi-holders", "245 E 63rd Owners Corp; Gotham Property Mgmt")
    vis.get_by_role("button", name="Request the certificate").click()
    expect(vis.get_by_text("Request received.")).to_be_visible(timeout=10000)
    vis.screenshot(path=f"{SHOTS}/01-coi-sent.png")
    print("COI request sent")

    # 4. Area checker + problem finder (NYC)
    vis.goto(f"{BASE}/")
    vis.fill("#area", "11215"); vis.get_by_role("button", name="Check", exact=True).click()
    expect(vis.get_by_text("Yes, we cover Brooklyn (11215)")).to_be_visible()
    vis.fill("#area", "astoria"); vis.get_by_role("button", name="Check", exact=True).click()
    expect(vis.get_by_text("Yes, we cover Queens")).to_be_visible()
    vis.fill("#area", "07030"); vis.get_by_role("button", name="Check", exact=True).click()
    expect(vis.get_by_text(re.compile("couldn't find"))).to_be_visible()
    vis.get_by_text("I smell gas").first.click()
    expect(vis.get_by_text(re.compile("Leave the building first"))).to_be_visible()
    assert vis.locator("a[href^='sms:']").count() >= 2, "text-us links missing"
    print("NYC area checker, gas advice and text links ok")

    # 5. Chat
    vis.get_by_role("button", name=re.compile("Message us")).click()
    vis.locator("#chat-draft").fill("E2E chat: radiator banging all night in our pre-war apartment, can you help?")
    vis.get_by_role("button", name="Send", exact=True).click()  # phone: Enter makes a new line, the button sends
    expect(vis.locator("#chat-panel").get_by_text("radiator banging")).to_be_visible()
    print("chat sent")

    # 6. Dashboard: everything arrived, nothing is demo
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); admin = ctx.new_page(); wire(admin, "admin")
    admin.goto(f"{BASE}/admin/login")
    admin.fill("input[name=username]", "admin"); admin.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026"))
    admin.click("button[type=submit]"); admin.wait_for_url(f"{BASE}/admin")
    expect(admin.get_by_text("Remove demo data")).to_have_count(0)
    admin.goto(f"{BASE}/admin/leads")
    for n in ["E2E Maria Gonzalez", "E2E Tom Okafor", "E2E Priya Shah"]:
        expect(admin.get_by_role("button", name=re.compile(n))).to_be_visible(timeout=8000)
    expect(admin.get_by_text("Building / COI request")).to_be_visible()
    expect(admin.get_by_text("Contact form").first).to_be_visible()
    admin.goto(f"{BASE}/admin/inbox")
    expect(admin.get_by_text(re.compile("radiator banging")).first).to_be_visible(timeout=8000)
    print("all forms + chat reached the dashboard")

    # 7. Empty Paid customers page
    admin.goto(f"{BASE}/admin/customers")
    expect(admin.get_by_text("No payments yet")).to_be_visible(timeout=8000)
    admin.screenshot(path=f"{SHOTS}/02-customers-empty.png")

    # 8. Record payment from a lead
    admin.goto(f"{BASE}/admin/leads")
    admin.get_by_role("button", name=re.compile("E2E Maria Gonzalez")).click()
    d = admin.get_by_role("dialog", name="Lead: E2E Maria Gonzalez")
    expect(d.get_by_text("Not paid yet")).to_be_visible()
    d.get_by_role("button", name="Record payment").click()
    pay = admin.get_by_role("dialog", name="Record a payment")
    expect(pay.locator("#pay-customer_name")).to_have_value("E2E Maria Gonzalez")
    expect(pay.locator("#pay-phone")).to_have_value("(718) 555-0123")
    pay.get_by_role("button", name="Record payment").click()  # no amount -> error, nothing saved
    expect(pay.get_by_text("Add the amount paid.")).to_be_visible()
    pay.locator("#pay-amount").fill("385")
    pay.locator("#pay-service").fill("Blocked drain")
    pay.get_by_text("Zelle", exact=True).click()
    pay.locator("#pay-invoice_number").fill("E2E-1001")
    admin.screenshot(path=f"{SHOTS}/03-record-payment.png")
    pay.get_by_role("button", name="Record payment").click()
    expect(admin.get_by_text("Payment recorded: $385.00")).to_be_visible()
    expect(d.get_by_text("Paid $385.00")).to_be_visible(timeout=8000)
    expect(d.get_by_role("button", name="Booked", exact=True)).to_have_attribute("aria-pressed", "true")
    d.get_by_role("button", name="Close").click()
    expect(admin.get_by_text("Paid $385")).to_be_visible()
    print("payment recorded from lead; lead marked booked")

    # 9. Record a walk-in payment from the Customers page
    admin.goto(f"{BASE}/admin/customers")
    admin.get_by_role("button", name="Record payment").first.click()
    pay = admin.get_by_role("dialog", name="Record a payment")
    pay.locator("#pay-amount").fill("1240.50"); pay.locator("#pay-service").fill("Water heater")
    pay.locator("#pay-customer_name").fill("E2E Daniel Cohen"); pay.locator("#pay-email").fill("dcohen.e2e@example.com")
    pay.locator("#pay-address").fill("10025"); pay.locator("#pay-description").fill("Replaced 40-gal gas water heater")
    pay.get_by_text("Check", exact=True).click()
    pay.get_by_role("button", name="Record payment").click()
    expect(admin.get_by_text("Payment recorded: $1,240.50")).to_be_visible()
    rows = admin.locator("table").filter(has=admin.locator("caption", has_text="Payments, newest first")).locator("tbody tr")
    expect(rows).to_have_count(2)
    expect(admin.get_by_text("$1,625.50", exact=True)).to_be_visible()  # filtered total
    expect(admin.get_by_role("link", name="(718) 555-0123")).to_have_attribute("href", "tel:7185550123")
    expect(admin.get_by_role("link", name="dcohen.e2e@example.com")).to_have_attribute("href", "mailto:dcohen.e2e@example.com")
    admin.screenshot(path=f"{SHOTS}/04-customers.png", full_page=True)

    # 10. Search + filters
    admin.get_by_placeholder("Name, phone, email, invoice…").fill("cohen")
    expect(rows).to_have_count(1); expect(admin.get_by_role("button", name=re.compile("E2E Daniel Cohen"))).to_be_visible()
    admin.get_by_placeholder("Name, phone, email, invoice…").fill("E2E-1001")
    expect(rows).to_have_count(1); expect(admin.get_by_role("button", name=re.compile("E2E Maria Gonzalez"))).to_be_visible()
    admin.get_by_placeholder("Name, phone, email, invoice…").fill("")
    admin.get_by_label("Paid by").select_option("check")
    expect(rows).to_have_count(1)
    admin.get_by_role("button", name="Clear filters").click()
    expect(rows).to_have_count(2)
    print("search + filters ok")

    # 11. CSV export has both customers
    with admin.expect_download() as dl:
        admin.get_by_role("button", name="Export CSV").click()
    data = list(csv.DictReader(io.StringIO(open(dl.value.path()).read())))
    assert {r["Customer"] for r in data} == {"E2E Maria Gonzalez", "E2E Daniel Cohen"}, data
    assert next(r for r in data if r["Customer"] == "E2E Daniel Cohen")["Amount"] == "1240.50"
    print("CSV export ok")

    # 12. Edit then delete
    admin.get_by_role("button", name=re.compile("E2E Daniel Cohen")).click()
    ed = admin.get_by_role("dialog", name="Payment from E2E Daniel Cohen")
    ed.locator("#pay-amount").fill("1300"); ed.get_by_role("button", name="Save changes").click()
    expect(admin.get_by_text("Payment updated")).to_be_visible()
    expect(admin.locator("td", has_text="$1,300.00")).to_be_visible()
    admin.get_by_role("button", name=re.compile("E2E Daniel Cohen")).click()
    ed = admin.get_by_role("dialog", name="Payment from E2E Daniel Cohen")
    ed.get_by_role("button", name="Delete payment").click(); ed.get_by_role("button", name="Delete", exact=True).click()
    expect(admin.get_by_text("Payment deleted")).to_be_visible()
    expect(rows).to_have_count(1)
    print("edit + delete ok")

    # 13. Phone layout
    m = b.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True, storage_state=ctx.storage_state()).new_page(); wire(m, "mobile")
    m.goto(f"{BASE}/admin/customers")
    expect(m.get_by_text("Paid this month")).to_be_visible(timeout=8000)
    expect(m.get_by_role("button", name=re.compile("E2E Maria Gonzalez"))).to_be_visible(timeout=8000)
    expect(m.get_by_role("link", name="Call (718) 555-0123")).to_be_visible()
    over = m.evaluate("document.documentElement.scrollWidth - innerWidth")
    assert over <= 1, f"customers page scrolls sideways on a phone by {over}px"
    m.screenshot(path=f"{SHOTS}/05-customers-phone.png", full_page=True)

    b.close()

if errors:
    print("\n".join(errors)); sys.exit(1)
print("REAL DATA FLOW OK")
