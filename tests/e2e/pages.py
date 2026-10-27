"""Alle Sitemap-URLs: Status 200, kein horizontaler Überlauf bei 320/360/1280, keine Konsolenfehler, Hamburger ≤760 px."""
import sys, re, urllib.request
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8766/hl7v2-viewer/"
SHOTS = "/workspace/work-hl7/shots/"
sm = urllib.request.urlopen(BASE + "sitemap.xml").read().decode()
urls = [re.sub(r"^https://freimoser\.github\.io/hl7v2-viewer/", BASE, u) for u in re.findall(r"<loc>([^<]+)</loc>", sm)]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    for w in (320, 360, 1280):
        ctx = b.new_context(viewport={"width": w, "height": 800})
        pg = ctx.new_page()
        msgs = []
        pg.on("console", lambda m: msgs.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: msgs.append(str(e)))
        for u in urls:
            r = pg.goto(u, wait_until="networkidle")
            if r.status != 200: fails.append((w, u, r.status))
            ov = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            if ov > 0:
                wide = pg.evaluate("[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,3).map(e=>e.tagName+'.'+e.className)")
                fails.append((w, u, f"overflow {ov}px {wide}"))
            if w <= 760 and pg.locator("button.nav-toggle, #nav-toggle, .menu-btn").count() == 0: fails.append((w, u, "kein Hamburger"))
            slug = u.replace(BASE, "").strip("/").replace("/", "-") or "index"
            if slug in ("hl7-fehler", "quellen", "datenschutz", "hl7-segmente-pid", "hl7-nachrichtentypen-oru-r01"):
                pg.screenshot(path=f"{SHOTS}hl7v2-seite-{slug}-{w}.png", full_page=(w != 1280))
        if msgs: fails.append((w, "console", msgs[:3]))
        r = pg.goto(BASE + "gibt-es-nicht/", wait_until="networkidle")
        print(w, "404-Status", r.status)
        ctx.close()
    b.close()
print(len(urls), "URLs;", "FEHLER:" if fails else "alles OK")
for f in fails: print(" ", f)
sys.exit(1 if fails else 0)
