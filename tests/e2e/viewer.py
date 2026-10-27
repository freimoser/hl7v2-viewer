import sys, json, re
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8766/hl7v2-viewer/"
SH = "/workspace/work-hl7/shots/"
fails = []
def ok(c, m):
    print(("OK   " if c else "FAIL ") + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width":1280,"height":900}, accept_downloads=True)
    pg = ctx.new_page()
    msgs=[]
    pg.on("console", lambda m: msgs.append((m.type, m.text)) if m.type in ("error","warning") else None)
    pg.on("pageerror", lambda e: msgs.append(("pageerror", str(e))))
    reqs=[]
    pg.on("request", lambda r: reqs.append(r.url))
    pg.goto(BASE, wait_until="networkidle")
    ids = pg.eval_on_selector_all("#examples [data-ex], #examples button", "els=>els.map(e=>e.dataset.ex||e.textContent)")
    print(ids)
    n = pg.locator("#examples button").count()
    for i in range(n):
        pg.locator("#examples button").nth(i).click()
        pg.wait_for_timeout(250)
        label = pg.locator("#examples button").nth(i).inner_text()
        segs = pg.locator("#result details.seg, #result .seg").count()
        ok(pg.locator("#result").is_visible() and len(pg.locator("#result").inner_text())>50, f"Beispiel '{label}' geladen ({segs} Segmente)")
    # A01 laden und Tooltip prüfen
    pg.locator("#examples button").nth(0).click(); pg.wait_for_timeout(300)
    pg.screenshot(path=SH+"hl7v2-viewer-a01-1280.png", full_page=False)
    cmp_ = pg.locator(".cmp").first
    print("cmp count", pg.locator(".cmp").count())
    fld = pg.locator(".fld").nth(5)
    fld.scroll_into_view_if_needed()
    cmp_ = pg.locator(".fld .cmp").nth(2)
    cmp_.scroll_into_view_if_needed(); cmp_.hover(); pg.wait_for_timeout(300)
    tip = pg.locator("#tip")
    ok(tip.is_visible(), "Tooltip bei Hover auf Komponente sichtbar")
    print("tip:", tip.inner_text()[:200].replace("\n"," | "))
    pg.screenshot(path=SH+"hl7v2-viewer-tooltip-1280.png")
    # Tabellenansicht / Rohtext
    for tab in ["Tabelle","Rohtext"]:
        t = pg.get_by_role("tab", name=re.compile(tab)) if pg.get_by_role("tab", name=re.compile(tab)).count() else pg.locator(f".tab:has-text('{tab}')")
        if t.count():
            t.first.click(); pg.wait_for_timeout(200)
            ok(len(pg.locator("#result").inner_text())>50, f"Ansicht {tab}")
    pg.get_by_text("Baum", exact=False).first.click() if pg.locator(".tab:has-text('Baum')").count() else None
    # Export JSON
    with pg.expect_download(timeout=5000) as d:
        pg.click("#ex-json")
    dl = d.value; path = dl.path(); data = open(path, encoding="utf-8").read()
    j = json.loads(data); ok(True, f"JSON-Export {dl.suggested_filename}, {len(data)} Bytes, parsebar")
    with pg.expect_download(timeout=5000) as d:
        pg.click("#ex-csv")
    dl = d.value; data = open(dl.path(), encoding="utf-8-sig").read()
    ok(data.count("\n")>10, f"CSV-Export {dl.suggested_filename}, {data.count(chr(10))} Zeilen")
    # Anonymisieren
    pg.locator("#anon-run").scroll_into_view_if_needed()
    pg.click("#anon-run"); pg.wait_for_timeout(300)
    out = pg.input_value("#anon-out") if pg.locator("#anon-out").evaluate("e=>e.tagName")=="TEXTAREA" else pg.inner_text("#anon-out")
    ok("Beispielmann" not in out and "MSH" in out, "Anonymisierung entfernt Namen")
    print("anon report:", pg.inner_text("#anon-report")[:200].replace("\n"," | "))
    pg.screenshot(path=SH+"hl7v2-anon-1280.png")
    # Fehlerhaftes Beispiel + Reparatur
    pg.locator("#examples button", has_text="Testfall").click(); pg.wait_for_timeout(300)
    hints = pg.locator("#result .hints li, #result .hint").count()
    ok(hints>=4, f"Hinweise beim Fehlerbeispiel: {hints}")
    pg.screenshot(path=SH+"hl7v2-viewer-fehler-1280.png")
    # Eingabe mit LF, MLLP
    pg.fill("#hl7-in", "\x0bMSH|^~\\&|A|B|C|D|20260101||ADT^A01|1|P|2.5\nPID|1||X1\n\x1c\r")
    pg.wait_for_timeout(500)
    ok("MLLP" in pg.inner_text("#result") or "MLLP" in pg.inner_text("#status"), "MLLP erkannt")
    # Deep link
    pg2 = ctx.new_page(); pg2.goto(BASE+"#beispiel=oru-r01", wait_until="networkidle"); pg2.wait_for_timeout(500)
    ok("ORU" in pg2.inner_text("#result"), "Deep-Link #beispiel=oru-r01")
    # Netzwerk
    ext = [r for r in reqs if not r.startswith("http://localhost")]
    ok(not ext, f"keine externen Requests ({ext})")
    ok(not msgs, f"keine Konsolenfehler/Warnungen {msgs}")
    # Responsiv
    for w in (320, 360, 1280):
        pg3 = ctx.new_page(); pg3.set_viewport_size({"width":w,"height":800}); pg3.goto(BASE, wait_until="networkidle")
        pg3.locator("#examples button").nth(0).click(); pg3.wait_for_timeout(300)
        sw = pg3.evaluate("document.documentElement.scrollWidth"); ok(sw<=w, f"{w}px: scrollWidth {sw}")
        pg3.screenshot(path=SH+f"hl7v2-viewer-{w}.png", full_page=False)
        if w<=360:
            pg3.screenshot(path=SH+f"hl7v2-viewer-{w}-voll.png", full_page=True)
            btn = pg3.locator(".menu-btn"); ok(btn.is_visible(), f"{w}px: Hamburger sichtbar")
            btn.click(); pg3.wait_for_timeout(200); ok(pg3.locator("nav.main.open").count()==1, "Menü öffnet")
            pg3.screenshot(path=SH+f"hl7v2-menue-{w}.png")
            # Tap-Tooltip
            pg3.keyboard.press("Escape")
        pg3.close()
    b.close()
print("FAILS:", fails)
sys.exit(1 if fails else 0)
