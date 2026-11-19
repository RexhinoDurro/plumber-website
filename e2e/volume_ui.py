"""With e2e/volume.py data kept (KEEP=1): the dashboard stays fast and can find any customer, not just the newest."""
import os, re, sys, time
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE_URL", "http://localhost:3000")
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 1440, "height": 900}); page = ctx.new_page()
    errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(f"{BASE}/admin/login")
    page.fill("input[name=username]", "admin"); page.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026"))
    page.click("button[type=submit]"); page.wait_for_url(f"{BASE}/admin")

    t = time.time(); page.goto(f"{BASE}/admin/customers")
    rows = page.locator("table").filter(has=page.locator("caption", has_text="Payments, newest first")).locator("tbody tr")
    expect(rows).to_have_count(100, timeout=15000); print(f"customers page ready in {time.time() - t:.2f}s")
    expect(page.get_by_role("button", name=re.compile(r"Show more \(\d+ left\)"))).to_be_visible()
    page.get_by_role("button", name=re.compile("Show more")).click(); expect(rows).to_have_count(200)
    page.get_by_placeholder("Name, phone, email, invoice…").fill("LOAD-7")
    expect(page.get_by_text(re.compile(r"^\d+$")).first).to_be_visible()
    page.get_by_placeholder("Name, phone, email, invoice…").fill("load3@example.com")
    expect(rows).to_have_count(1, timeout=8000); print("customers: paging + search across 15,000 payments ok")
    page.screenshot(path="/tmp/shots-real/06-customers-volume.png")

    t = time.time(); page.goto(f"{BASE}/admin/leads")
    lrows = page.locator("tbody tr")
    expect(lrows).to_have_count(500, timeout=15000); print(f"leads page ready in {time.time() - t:.2f}s")
    expect(page.get_by_text(re.compile(r"Showing the newest 500 of 2\d{4}"))).to_be_visible()
    expect(page.get_by_role("tab", name=re.compile(r"All 2\d{4}"))).to_be_visible()
    page.get_by_placeholder("Search name, phone, area…").fill("load7@example.com")  # an old lead, far outside the newest 500
    expect(page.get_by_role("button", name=re.compile("LOAD Customer 7 "))).to_be_visible(timeout=8000)
    expect(page.get_by_role("tab", name=re.compile(r"All 1$"))).to_be_visible()
    page.get_by_role("button", name=re.compile("LOAD Customer 7 ")).click()
    expect(page.get_by_role("dialog", name="Lead: LOAD Customer 7")).to_be_visible()
    lead_id = page.evaluate("location.hash.slice(1)")
    page.goto(f"{BASE}/admin/leads#{lead_id}")  # direct link to an old lead
    expect(page.get_by_role("dialog", name="Lead: LOAD Customer 7")).to_be_visible(timeout=8000)
    print("leads: server search + direct link to an old lead ok")
    page.screenshot(path="/tmp/shots-real/07-leads-volume.png")
    b.close()
if errs: print(errs); sys.exit(1)
print("VOLUME UI OK")
