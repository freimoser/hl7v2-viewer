import sys, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8766/hl7v2-viewer/"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width":1280,"height":900}, accept_downloads=True)
    pg = ctx.new_page()
    msgs=[]
    pg.on("console", lambda m: msgs.append((m.type, m.text)) if m.type in ("error","warning") else None)
    pg.on("pageerror", lambda e: msgs.append(("pageerror", str(e))))
    pg.goto(BASE, wait_until="networkidle")
    print("title:", pg.title())
    chips = pg.locator("#examples button, #examples a").count()
    print("example chips:", chips)
    pg.screenshot(path="/workspace/work-hl7/shots/hl7v2-smoke-1.png", full_page=False)
    print(msgs)
    b.close()
