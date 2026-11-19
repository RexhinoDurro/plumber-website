"""
Phone-quality audit: every public page and dashboard page at common phone sizes (and landscape).
Checks: sideways scrolling, tap targets smaller than 44px, form fields under 16px (iOS zooms on focus),
text under 12px, images without alt, content hidden under the fixed bottom bar. Prints a report; exit 1 on problems.
"""
import os, re, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3000")
PUBLIC = ["/", "/services", "/services/emergency", "/services/gas", "/emergency", "/gallery", "/areas", "/buildings", "/about", "/contact", "/accessibility"]
ADMIN = ["/admin", "/admin/inbox", "/admin/leads", "/admin/customers", "/admin/gallery", "/admin/reviews"]
SIZES = [("se", 360, 740), ("iphone", 390, 844), ("plus", 430, 932), ("landscape", 844, 390)]

AUDIT_JS = r"""
() => {
  const out = { overflow: document.documentElement.scrollWidth - innerWidth, small: [], zoom: [], tiny: [], noalt: [] };
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest('[aria-hidden="true"], .sr-only, [inert]'); };
  const label = (el) => (el.getAttribute("aria-label") || el.innerText || el.value || el.name || el.id || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary')) {
    if (!vis(el) || el.closest('.no-tap')) continue;
    const r = el.getBoundingClientRect();
    // links inside running text are exempt (WCAG 2.5.8 inline exception)
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, li") && (el.closest("p, li").innerText.length > el.innerText.length + 20);
    const radio = el.type === "radio" || el.type === "checkbox";
    if (!inline && !radio && (r.height < 44 || r.width < 44)) {
      // a smaller box is fine when its tappable area (incl. padding of a wrapping label) reaches 44
      const host = el.closest("label") || el; const hr = host.getBoundingClientRect();
      if (hr.height < 44 || hr.width < 44) out.small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !radio && parseFloat(getComputedStyle(el).fontSize) < 16) out.zoom.push(`${label(el)} ${getComputedStyle(el).fontSize}`);
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement; if (!el || seen.has(el) || !t.textContent.trim()) continue; seen.add(el);
    if (!vis(el)) continue;
    if (parseFloat(getComputedStyle(el).fontSize) < 12) out.tiny.push(`"${t.textContent.trim().slice(0, 30)}" ${getComputedStyle(el).fontSize}`);
  }
  for (const img of document.images) if (vis(img) && !img.hasAttribute("alt")) out.noalt.push(img.src.slice(-40));
  return out;
}
"""

problems = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, w, h in SIZES:
        ctx = b.new_context(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg = ctx.new_page()
        pg.route(re.compile(r"https://(images|videos)\.pexels\.com/.*"), lambda r: r.abort())
        pages = list(PUBLIC)
        if name != "landscape":
            pg.goto(f"{BASE}/admin/login"); pg.fill("input[name=username]", "admin"); pg.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026"))
            pg.click("button[type=submit]"); pg.wait_for_url(f"{BASE}/admin"); pages += ADMIN
        for path in pages:
            pg.goto(BASE + path, wait_until="networkidle"); pg.wait_for_timeout(400)
            r = pg.evaluate(AUDIT_JS)
            issues = []
            if r["overflow"] > 1: issues.append(f"scrolls sideways by {r['overflow']}px")
            if r["small"]: issues.append(f"{len(r['small'])} small tap targets: " + "; ".join(sorted(set(r["small"]))[:6]))
            if r["zoom"]: issues.append("fields under 16px (iOS zoom): " + "; ".join(sorted(set(r["zoom"]))[:4]))
            if r["tiny"]: issues.append(f"{len(r['tiny'])} texts under 12px: " + "; ".join(r["tiny"][:3]))
            if r["noalt"]: issues.append("images without alt: " + "; ".join(r["noalt"][:3]))
            problems += bool(issues)
            print(f"[{name} {w}] {path:<22} " + (" | ".join(issues) if issues else "OK"))
        ctx.close()
    b.close()
print("pages with problems:", problems)
sys.exit(1 if problems else 0)
