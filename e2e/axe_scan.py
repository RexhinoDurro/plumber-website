"""WCAG 2.2 AA scan with axe-core on the main pages (public site + dashboard). Fails on serious/critical issues."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3000")
AXE = open(os.path.join(os.path.dirname(__file__), "..", "node_modules/axe-core/axe.min.js")).read()
PUBLIC = ["/", "/contact", "/buildings", "/areas", "/services/gas", "/emergency", "/accessibility"]
ADMIN = ["/admin", "/admin/leads", "/admin/customers"]
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for width in (390, 1440):
        pg = b.new_page(viewport={"width": width, "height": 900}, reduced_motion="reduce")  # no mid-fade false positives
        pg.route("**/*pexels.com/**", lambda r: r.abort())
        def scan(path):
            global bad
            pg.goto(BASE + path); pg.wait_for_timeout(700); pg.add_script_tag(content=AXE)
            res = pg.evaluate("axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes[0].target.join(' '), msg: v.nodes[0].failureSummary.slice(0, 160)})))")
            serious = [v for v in res if v["impact"] in ("serious", "critical")]
            bad += len(serious)
            print(f"{width:>4} {path:<18} {'OK' if not res else ''}", *[f"\n      {v['impact']} {v['id']} x{v['n']} {v['ex']} :: {v['msg']}" for v in res])
        for path in PUBLIC: scan(path)
        pg.goto(BASE + "/admin/login"); pg.fill("input[name=username]", "admin"); pg.fill("input[name=password]", os.environ.get("ADMIN_PASSWORD", "plumber-demo-2026"))
        pg.click("button[type=submit]"); pg.wait_for_url(BASE + "/admin")
        for path in ADMIN: scan(path)
    b.close()
print("serious/critical:", bad); sys.exit(1 if bad else 0)
