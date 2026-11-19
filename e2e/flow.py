"""Run with both servers up and a staff user admin / $ADMIN_PASSWORD. Creates test records named "Réka Teszt" and "Bence Próba"."""
"""End-to-end: visitor <-> admin live chat, lead form -> dashboard, upload -> public gallery."""
import re, sys, time, io
from PIL import Image
from playwright.sync_api import sync_playwright, expect

import os
BASE = os.environ.get("BASE_URL", "http://localhost:3000")
SHOTS = os.environ.get("SHOTS_DIR", "/tmp/shots"); os.makedirs(SHOTS, exist_ok=True)
_b = io.BytesIO(); Image.new("RGB", (64, 48), (200, 210, 225)).save(_b, "JPEG"); FAKE = _b.getvalue()  # stand-in for Pexels images
errors = []

def stub(route):
    route.fulfill(status=200, body=FAKE, content_type="image/jpeg")

def wire(page, tag):
    page.on("pageerror", lambda e: errors.append(f"[{tag}] pageerror {e}"))
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errors.append(f"[{tag}] console {m.text}"))
    page.route(re.compile(r"https://(images|videos)\.pexels\.com/.*"), stub)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    admin_ctx = b.new_context(viewport={"width": 1440, "height": 900})
    admin = admin_ctx.new_page(); wire(admin, "admin")

    # --- login
    admin.goto(f"{BASE}/admin/login")
    admin.screenshot(path=f"{SHOTS}/01-login.png")
    admin.fill("input[name=username]", "admin"); admin.fill("input[name=password]", "wrong-pass")
    admin.click("button[type=submit]")
    expect(admin.get_by_text("Wrong username or password.")).to_be_visible()
    admin.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026")); admin.click("button[type=submit]")
    admin.wait_for_url(f"{BASE}/admin")
    expect(admin.get_by_text("Waiting for a reply")).to_be_visible()
    expect(admin.get_by_text("Live: visitors see you online")).to_be_visible(timeout=8000)
    expect(admin.get_by_text("When requests come in")).to_be_visible()
    expect(admin.get_by_text("What the numbers say")).to_be_visible()
    assert admin.evaluate("navigator.serviceWorker.getRegistration('/admin').then(r => !!r)"), "dashboard service worker not registered"
    expect(admin.get_by_role("button", name="Turn on alerts")).to_be_visible()
    time.sleep(1.2)
    admin.screenshot(path=f"{SHOTS}/02-overview.png", full_page=True)
    print("login + overview ok")

    # --- visitor opens the site: no form, just type
    vis_ctx = b.new_context(viewport={"width": 1280, "height": 860})
    vis = vis_ctx.new_page(); wire(vis, "visitor")
    vis.goto(f"{BASE}/services")
    vis.get_by_role("button", name=re.compile("Message us")).click()
    panel = vis.locator("#chat-panel")
    expect(panel.locator("header").get_by_text("online", exact=True)).to_be_visible(timeout=8000)
    assert panel.locator("input[name=name]").count() == 0, "chat should not ask for a name"
    vis.screenshot(path=f"{SHOTS}/03-visitor-chat-start.png")
    vis.locator("#chat-draft").fill("Hi, my kitchen faucet is dripping non-stop. Can you come this week?")
    vis.keyboard.press("Enter")
    expect(panel.get_by_text("kitchen faucet is dripping")).to_be_visible()
    expect(panel.get_by_label("Delivered").first).to_be_visible(timeout=8000)  # staff online: two grey ticks
    print("visitor started chat without a form; delivered ticks ok")

    # the chat asks where to reply if they leave (inside the chat, not a form up front)
    card = panel.get_by_role("form", name="Where should we reply if you leave?")
    expect(card).to_be_visible()
    card.get_by_role("radio", name="Email").click()
    card.get_by_label("Your email").fill("reka@example.com")
    card.get_by_role("button", name="Save").click()
    expect(panel.get_by_text("reka@example.com")).to_be_visible()
    print("contact card ok")

    # --- admin gets the alert and opens the chat -> visitor's ticks turn to Read
    expect(admin.get_by_text("New chat message")).to_be_visible(timeout=8000)
    admin.goto(f"{BASE}/admin/inbox")
    row = admin.get_by_role("button", name=re.compile("kitchen faucet is dripping"))
    expect(row).to_be_visible(timeout=8000)
    expect(row.get_by_text(re.compile("^Visitor "))).to_be_visible()
    row.click()
    expect(admin.locator("[role=log]").get_by_text("kitchen faucet is dripping")).to_be_visible()
    expect(panel.get_by_label("Read").first).to_be_visible(timeout=8000)
    print("read receipts ok")

    # visitor typing -> admin sees it in the header and as a bubble
    vis.locator("#chat-draft").fill("Also the")
    expect(admin.get_by_label(re.compile("is typing"))).to_be_visible(timeout=5000)
    vis.locator("#chat-draft").fill("")
    print("typing indicator ok")

    # admin quick reply sends straight away -> visitor sees it live, header says typing first
    admin.locator("#reply").fill("One sec")
    expect(panel.locator("header").get_by_text("typing…")).to_be_visible(timeout=5000)
    admin.locator("#reply").fill("")
    # free text typed on the keyboard
    admin.locator("#reply").type("Hi! Sorry to hear that. We can come Thursday between 9 and 11, does that work?")
    admin.keyboard.press("Enter")
    expect(panel.get_by_text("We can come Thursday between 9 and 11")).to_be_visible(timeout=8000)
    # saved reply via the "/" shortcut: fills the box, can be edited, Enter sends
    admin.locator("#reply").type("/zip")
    expect(admin.get_by_role("listbox", name="Saved replies")).to_be_visible()
    admin.keyboard.press("Enter")
    expect(admin.locator("#reply")).to_have_value(re.compile("What's your ZIP code"))
    admin.keyboard.press("Enter")
    expect(panel.get_by_text("What's your ZIP code?")).to_be_visible(timeout=8000)
    print("admin -> visitor ok (typed + saved reply)")

    # visitor answers with a phone number -> picked up as their contact
    vis.locator("#chat-draft").fill("District XIII, 1134. Call me on +36 30 555 1234")
    vis.keyboard.press("Enter")
    expect(admin.locator("[role=log]").get_by_text("District XIII, 1134")).to_be_visible(timeout=8000)
    expect(admin.locator("header").get_by_role("link", name="Email")).to_be_visible(timeout=8000)
    print("visitor -> admin ok, contact shown")

    # visitor sends a photo -> admin sees it in the thread
    pbuf = io.BytesIO(); Image.new("RGB", (800, 600), (90, 120, 160)).save(pbuf, "JPEG")
    panel.locator("input[type=file]").set_input_files(files=[{"name": "leak.jpg", "mimeType": "image/jpeg", "buffer": pbuf.getvalue()}])
    expect(admin.locator("[role=log] img[alt='Photo sent in the chat']")).to_have_count(1, timeout=10000)
    print("visitor photo -> admin ok")

    # admin names the customer
    name_input = admin.get_by_label("Name")
    if name_input.is_visible():
        name_input.fill("Réka Teszt"); name_input.press("Enter")
        expect(admin.locator("header").get_by_text("Réka Teszt")).to_be_visible(timeout=5000)
    time.sleep(0.6)
    admin.screenshot(path=f"{SHOTS}/04-inbox.png")
    vis.screenshot(path=f"{SHOTS}/05-visitor-chat.png")

    # chat survives a reload (session in localStorage)
    vis.reload()
    vis.get_by_role("button", name=re.compile("Message us")).click()
    expect(vis.locator("#chat-panel").get_by_text("District XIII, 1134")).to_be_visible(timeout=8000)
    print("visitor reload keeps chat ok")

    # convert to lead
    admin.get_by_role("button", name="Add to leads").click()
    expect(admin.get_by_text("Added to leads")).to_be_visible()
    print("chat -> lead ok")

    # --- lead form on home page -> dashboard gets it live
    admin.goto(f"{BASE}/admin/leads")
    expect(admin.get_by_role("table")).to_be_visible()
    vis.goto(f"{BASE}/")
    qq = vis.locator("form").filter(has=vis.get_by_role("button", name="Request my callback"))
    qq.locator("input[name=name]").fill("Bence Próba")
    qq.locator("input[name=phone]").fill("+36 70 111 2233")
    qq.get_by_role("button", name="Request my callback").click()
    expect(vis.get_by_text(re.compile("call you back|Thanks", re.I)).first).to_be_visible(timeout=10000)
    expect(admin.get_by_role("row", name=re.compile("Bence Próba"))).to_be_visible(timeout=8000)
    expect(admin.get_by_text(re.compile("New .*request from Bence"))).to_be_visible()
    print("form -> live lead ok")
    admin.get_by_role("row", name=re.compile("Bence Próba")).click()
    dlg = admin.get_by_role("dialog", name=re.compile("Bence"))
    dlg.get_by_role("button", name="Quoted").click()
    expect(admin.get_by_text("Moved to Quoted")).to_be_visible()
    dlg.get_by_role("button", name="Booked").click()
    expect(dlg.get_by_text("Ask for a Google review")).to_be_visible()
    expect(dlg.get_by_role("link", name="WhatsApp")).to_have_attribute("href", re.compile(r"^https://wa\.me/36701112233\?text="))
    print("review request ok")
    admin.screenshot(path=f"{SHOTS}/06-leads-drawer.png")
    admin.keyboard.press("Escape")
    print("lead stage change ok")

    # --- upload a photo -> appears on the public gallery
    buf = io.BytesIO(); Image.new("RGB", (1200, 900), (18, 87, 214)).save(buf, "JPEG"); 
    admin.goto(f"{BASE}/admin/gallery")
    admin.locator("input[type=file]").set_input_files(files=[{"name": "new-boiler-fit.jpg", "mimeType": "image/jpeg", "buffer": buf.getvalue()}])
    admin.get_by_role("button", name=re.compile("^Upload")).first.click()
    expect(admin.get_by_text(re.compile("Describe what it shows"))).to_be_visible()
    admin.get_by_placeholder(re.compile("walk-in shower")).fill("Combi boiler fitted in a kitchen cupboard, pipes boxed in")
    admin.get_by_label("Type of job").first.select_option("Heating")
    admin.get_by_role("button", name=re.compile("^Upload")).first.click()
    expect(admin.get_by_text(re.compile("live on the website"))).to_be_visible(timeout=10000)
    admin.screenshot(path=f"{SHOTS}/07-gallery-manager.png", full_page=False)
    vis.goto(f"{BASE}/gallery")
    expect(vis.get_by_role("button", name=re.compile("Open photo: new boiler fit", re.I))).to_be_visible(timeout=10000)
    vis.screenshot(path=f"{SHOTS}/08-public-gallery.png")
    print("upload -> public gallery ok")

    admin.goto(f"{BASE}/admin/reviews"); time.sleep(0.8)
    admin.screenshot(path=f"{SHOTS}/09-reviews.png")
    admin.goto(f"{BASE}/admin"); time.sleep(1.2)
    admin.screenshot(path=f"{SHOTS}/10-overview-after.png", full_page=True)

    # --- visitor leaves; a reply they don't see goes to their email with a link back into the chat
    import json as _json
    sess = _json.loads(vis.evaluate("localStorage.getItem('northline-chat')"))
    LOG = os.environ.get("BACKEND_LOG", "/tmp/daphne.log")
    log_start = os.path.getsize(LOG) if os.path.exists(LOG) else 0
    vis.close()
    time.sleep(1.5)
    admin.goto(f"{BASE}/admin/inbox#{sess['id']}")
    expect(admin.locator("[role=log]").get_by_text("District XIII, 1134")).to_be_visible(timeout=8000)
    admin.locator("#reply").fill("Good news: the part arrived, we can come Friday at 9.")
    admin.keyboard.press("Enter")
    deadline = time.time() + 12
    log = ""
    while time.time() < deadline:
        with open(LOG, encoding="utf-8", errors="ignore") as fh:
            fh.seek(log_start)
            log = fh.read()
        if f"chat={sess['id']}" in log:
            break
        time.sleep(0.5)
    assert "replied to your message" in log and f"chat={sess['id']}" in log, "offline reply email not sent"
    print("offline reply emailed ok")
    fresh = b.new_context(viewport={"width": 1280, "height": 860}).new_page(); wire(fresh, "resume")
    fresh.goto(f"{BASE}/?chat={sess['id']}&t={sess['token']}")
    expect(fresh.locator("#chat-panel").get_by_text("can come Friday at 9")).to_be_visible(timeout=8000)
    assert "chat=" not in fresh.url
    print("resume link ok")
    vis = vis_ctx.new_page(); wire(vis, "visitor2")

    # --- admin leaves -> visitor sees "last seen today at ..."
    admin_ctx.close()
    vis.goto(f"{BASE}/about")
    vis.get_by_role("button", name=re.compile("Message us")).click()
    expect(vis.locator("#chat-panel header").get_by_text(re.compile("last seen today at"))).to_be_visible(timeout=8000)
    print("last seen ok")

    # --- mobile
    m = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page(); wire(m, "mobile")
    m.goto(f"{BASE}/")
    m.screenshot(path=f"{SHOTS}/11-mobile-fab.png")
    m.get_by_role("button", name=re.compile("Message us")).click()
    m.screenshot(path=f"{SHOTS}/12-mobile-chat-empty.png")
    expect(m.locator("#chat-draft")).to_be_focused()  # keyboard opens straight away
    m.locator("#chat-draft").type("Hello, water is coming through my bathroom ceiling. Is anyone free today?")
    m.get_by_role("button", name="Send", exact=True).click()
    expect(m.locator("#chat-panel [role=log]").get_by_text("water is coming through my bathroom ceiling")).to_be_visible(timeout=8000)
    time.sleep(0.8)
    m.screenshot(path=f"{SHOTS}/12-mobile-chat.png")
    print("mobile typing ok")
    # nobody online -> automatic holding reply (AUTO_REPLY_SECONDS=5 in the test server)
    expect(m.locator("#chat-panel [role=log]").get_by_text(re.compile("out on a job right now and will reply"))).to_be_visible(timeout=15000)
    print("auto-reply ok")
    m.goto(f"{BASE}/admin/login")
    m.fill("input[name=username]", "admin"); m.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026")); m.click("button[type=submit]")
    m.wait_for_url(f"{BASE}/admin"); time.sleep(1.2)
    m.screenshot(path=f"{SHOTS}/13-mobile-overview.png", full_page=True)
    w = m.evaluate("document.documentElement.scrollWidth")
    print("mobile overview width", w)
    b.close()

print("ERRORS:", errors or "none")
