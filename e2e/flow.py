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
    time.sleep(1.2)
    admin.screenshot(path=f"{SHOTS}/02-overview.png", full_page=True)
    print("login + overview ok")

    # --- visitor opens the site: chat button shows online
    vis_ctx = b.new_context(viewport={"width": 1280, "height": 860})
    vis = vis_ctx.new_page(); wire(vis, "visitor")
    vis.goto(f"{BASE}/services")
    fab = vis.get_by_role("button", name=re.compile("Message us"))
    expect(fab).to_be_visible()
    fab.click()
    panel = vis.locator("#chat-panel")
    expect(panel.get_by_text("Online now")).to_be_visible(timeout=8000)
    vis.screenshot(path=f"{SHOTS}/03-visitor-chat-start.png")
    panel.locator("input[name=name]").fill("Réka Teszt")
    panel.locator("input[name=contact]").fill("+36 30 555 1234")
    panel.locator("textarea[name=message]").fill("Hi, my kitchen tap is dripping non-stop. Can you come this week?")
    panel.get_by_role("button", name="Start chat").click()
    expect(panel.get_by_text("kitchen tap is dripping")).to_be_visible()
    print("visitor started chat")

    # --- admin gets the alert + sees it in the inbox
    expect(admin.get_by_text("New chat message")).to_be_visible(timeout=8000)
    admin.goto(f"{BASE}/admin/inbox")
    row = admin.get_by_role("button", name=re.compile("Réka Teszt"))
    expect(row).to_be_visible(timeout=8000)
    row.click()
    expect(admin.locator("[role=log]").get_by_text("kitchen tap is dripping")).to_be_visible()

    # visitor typing -> admin sees indicator
    vis.locator("#chat-draft").fill("Also the")
    expect(admin.get_by_label(re.compile("is typing"))).to_be_visible(timeout=5000)
    print("typing indicator ok")

    # admin replies with a quick reply -> visitor receives it live
    admin.get_by_role("button", name="Ask postcode").click()
    admin.get_by_role("button", name="Send", exact=True).click()
    expect(panel.get_by_text("What's your postcode?")).to_be_visible(timeout=8000)
    print("admin -> visitor ok")

    # visitor answers -> admin sees it live in the open thread
    vis.locator("#chat-draft").fill("District XIII, 1134")
    vis.keyboard.press("Enter")
    expect(admin.locator("[role=log]").get_by_text("District XIII, 1134")).to_be_visible(timeout=8000)
    print("visitor -> admin ok")
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

    # --- admin leaves -> visitor sees "Away"
    admin_ctx.close()
    vis.goto(f"{BASE}/about")
    vis.get_by_role("button", name=re.compile("Message us")).click()
    expect(vis.locator("#chat-panel").get_by_text(re.compile("Away"))).to_be_visible(timeout=8000)
    print("presence away ok")

    # --- mobile
    m = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page(); wire(m, "mobile")
    m.goto(f"{BASE}/")
    m.screenshot(path=f"{SHOTS}/11-mobile-fab.png")
    m.get_by_role("button", name=re.compile("Message us")).click()
    m.screenshot(path=f"{SHOTS}/12-mobile-chat.png")
    m.goto(f"{BASE}/admin/login")
    m.fill("input[name=username]", "admin"); m.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026")); m.click("button[type=submit]")
    m.wait_for_url(f"{BASE}/admin"); time.sleep(1.2)
    m.screenshot(path=f"{SHOTS}/13-mobile-overview.png", full_page=True)
    w = m.evaluate("document.documentElement.scrollWidth")
    print("mobile overview width", w)
    b.close()

print("ERRORS:", errors or "none")
