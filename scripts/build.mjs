/**
 * Baut die Website nach dist/ (Node ≥ 18, keine Abhängigkeiten).
 *   node scripts/build.mjs      → dist/
 *   node scripts/sync.mjs       → kopiert dist/ in die Repo-Wurzel (GitHub Pages liefert von main /)
 * Sibling-Links auf /fhir-viewer/ und /cda-viewer/ erscheinen nur, wenn die Seite mit 200 antwortet
 * (Umgehen/erzwingen: SIBLINGS=fhir,cda  oder  SIBLINGS=none).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { SITE, render, url, abs } from "./lib/layout.mjs";
import { ALL_EXAMPLES } from "../src/assets/js/core/examples.js";
import { BANNED } from "./lib/banned.mjs";
import { quellenMd } from "./lib/sources.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const problems = [];
const warn = (m) => problems.push(m);

/* ---------- Geschwister-Werkzeuge ---------- */
const SIB = [
  { key: "ldt", name: "LDT- und BDT-Viewer", path: "ldt-bdt-viewer/", desc: "Labordaten (LDT) und Praxisdaten (BDT) lesen", always: true },
  { key: "gdt", name: "GDT-Viewer", path: "gdt-viewer/", desc: "GDT-Dateien zwischen Praxissoftware und Geräten lesen", always: true },
  { key: "dicom", name: "DICOM-Viewer", path: "dicom-viewer/", desc: "DICOM-Bilder und Radiologie-CDs im Browser öffnen", always: true },
  { key: "fhir", name: "FHIR-Viewer", path: "fhir-viewer/", desc: "FHIR-Ressourcen als JSON lesbar anzeigen" },
  { key: "cda", name: "CDA-Viewer", path: "cda-viewer/", desc: "CDA-Dokumente (Arztbriefe als XML) lesen" },
];
async function resolveSiblings() {
  const forced = process.env.SIBLINGS;
  const out = [];
  for (const s of SIB) {
    const u = `${SITE.origin}/${s.path}`;
    let ok = s.always;
    if (forced === "none") ok = s.always;
    else if (forced) ok = s.always || forced.split(",").includes(s.key);
    else if (!s.always) {
      try { const r = await fetch(u, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000) }); ok = r.status === 200; } catch { ok = false; }
    }
    console.log(`  Geschwister ${s.name}: ${ok ? "verlinkt" : "nicht verlinkt (nicht erreichbar)"}`);
    if (ok) out.push({ key: s.key, name: s.name, url: u, desc: s.desc });
  }
  return out;
}

/* ---------- Helfer ---------- */
const write = (rel, data) => { const p = join(dist, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, data); };
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const minCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").trim();
const text = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<\/(p|h[1-6]|li|tr|div|pre|section|details|summary|table|ul|ol|dt|dd)>/g, "\n").replace(/<br\s*\/?>/g, "\n").replace(/<\/(td|th)>/g, " | ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

/* ---------- Seiten laden ---------- */
async function loadPages() {
  const dir = join(root, "scripts", "pages");
  const pages = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".mjs") && !x.startsWith("_")).sort()) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    const v = typeof mod.default === "function" ? await mod.default() : mod.default;
    pages.push(...[].concat(v));
  }
  return pages;
}

async function main() {
  console.log("Build HL7-v2-Viewer");
  SITE.siblings = await resolveSiblings();
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  // Assets
  cpSync(join(root, "src", "assets", "js"), join(dist, "assets", "js"), { recursive: true });
  const css = minCss(readFileSync(join(root, "src", "assets", "css", "styles.css"), "utf8"));
  const cssHash = createHash("sha1").update(css).digest("hex").slice(0, 8);
  write("assets/css/styles.css", css);
  if (existsSync(join(root, "src", "static"))) cpSync(join(root, "src", "static"), dist, { recursive: true });

  // Beispieldateien (CR als Segmenttrenner, wie vom Standard vorgesehen)
  for (const e of ALL_EXAMPLES) write(`beispiele/${e.file}`, e.id === "fehlerhaft" ? e.text.replace(/\r/g, "\n") : e.text.replace(/\r?\n/g, "\r"));

  // Seiten
  const pages = await loadPages();
  const seen = { path: new Set(), title: new Set(), desc: new Set(), h1: new Set() };
  const html = new Map();
  for (const p of pages) {
    if (seen.path.has(p.path)) warn(`doppelter Pfad ${p.path}`);
    seen.path.add(p.path);
    if (!p.noindex) {
      if (p.title.length > 60) warn(`Title zu lang (${p.title.length}): ${p.title}`);
      if (p.description.length > 155) warn(`Description zu lang (${p.description.length}): ${p.path}`);
      if (p.description.length < 70) warn(`Description kurz (${p.description.length}): ${p.path}`);
      for (const k of ["title", "desc", "h1"]) {
        const v = k === "title" ? p.title : k === "desc" ? p.description : p.h1;
        if (seen[k].has(v)) warn(`doppelter ${k}: ${v}`);
        seen[k].add(v);
      }
    }
    const body = p.bodyFull || p.body;
    const h1n = (body.match(/<h1[\s>]/g) || []).length + (p.bodyFull ? 0 : 1);
    if (h1n !== 1) warn(`${p.path || "/"}: ${h1n} H1`);
    const out = render(p, { cssHref: `${url("assets/css/styles.css")}?v=${cssHash}`, siteJs: url("assets/js/site.js") });
    html.set(p.path, out);
    write(p.path === "404" ? "404.html" : join(p.path, "index.html"), out);
  }

  // Sitemap, robots, Manifest
  const indexable = pages.filter((p) => !p.noindex);
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${SITE.date}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  const bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"];
  write("robots.txt", `User-agent: *\nAllow: /\n\n${bots.map((b) => `User-agent: ${b}\nAllow: /\n`).join("\n")}\nSitemap: ${abs("sitemap.xml")}\n`);
  write("site.webmanifest", JSON.stringify({ name: SITE.name, short_name: "HL7-v2-Viewer", description: pages[0].description, lang: "de", start_url: url(""), scope: url(""), display: "standalone", background_color: "#0b1117", theme_color: "#0b1117", icons: [{ src: url("icon-192.png"), sizes: "192x192", type: "image/png" }, { src: url("icon-512.png"), sizes: "512x512", type: "image/png" }, { src: url("icon-512-maskable.png"), sizes: "512x512", type: "image/png", purpose: "maskable" }] }, null, 2) + "\n");

  // llms.txt
  const home = pages.find((p) => p.path === "");
  const list = (arr) => arr.map((p) => `- [${p.h1}](${abs(p.path)}): ${p.description}`).join("\n");
  const content = indexable.filter((p) => p.path !== "" && !["datenschutz/", "quellen/"].includes(p.path));
  write("llms.txt", `# ${home.title}\n\n> ${home.description}\n\nHL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt von ${SITE.dev.name} (München / Remote) und wird von HL7 International weder bereitgestellt noch empfohlen. Nur zur Ansicht, kein Medizinprodukt, kein Konformitätsprüfer.\n\n## Seiten\n\n- [${home.h1}](${abs("")}): ${home.description}\n${list(content)}\n- [Quellen und Lücken](${abs("quellen/")}): Welche Quellen geöffnet wurden und was nicht belegt ist.\n- [Datenschutz](${abs("datenschutz/")}): Keine Cookies, kein Tracking, keine Übertragung der Nachrichten.\n\n## Verwandte Tools\n\n${SITE.siblings.map((s) => `- [${s.name}](${s.url}): ${s.desc}`).join("\n")}\n`);
  write("llms-full.txt", `# ${home.title}\n\n> ${home.description}\n\nStand: ${SITE.date}. Autor: ${SITE.dev.name}, ${SITE.dev.url}\n\n${indexable.map((p) => `---\n\nURL: ${abs(p.path)}\n\n# ${p.h1}\n\n${text(p.body)}`).join("\n\n")}\n`);

  writeFileSync(join(root, "quellen.md"), quellenMd(abs("")));

  // Service Worker
  const files = walk(dist).map((f) => "/" + relative(dist, f).split("\\").join("/")).filter((f) => !/(llms|sitemap|robots|^\/sw\.js|\.nojekyll|c67e9b|\/beispiele\/)/.test(f));
  const precache = files.map((f) => (f.endsWith("/index.html") ? f.slice(0, -10) : f)).filter((f) => f !== "/404.html").map((f) => SITE.base.slice(0, -1) + f);
  const version = createHash("sha1").update(walk(dist).sort().map((f) => readFileSync(f)).join("|")).digest("hex").slice(0, 10);
  write("sw.js", readFileSync(join(root, "src", "sw.template.js"), "utf8").replace("__VERSION__", version).replace("__BASE__", SITE.base).replace("__URLS__", JSON.stringify(precache.map((u) => u.replace(/^\/hl7v2-viewer\/hl7v2-viewer/, "/hl7v2-viewer")))));

  checks(pages, html);
  console.log(`Seiten: ${pages.length} (indexierbar: ${indexable.length}), Dateien: ${walk(dist).length}`);
  if (problems.length) { console.log("\nPROBLEME:\n- " + problems.join("\n- ")); process.exit(1); }
  console.log("Build ok, keine Probleme.");
}

/* ---------- Prüfungen ---------- */
function checks(pages, html) {
  const fileExists = (p) => { const f = join(dist, p); return existsSync(f) && (!statSync(f).isDirectory() || existsSync(join(f, "index.html"))); };
  const ids = new Map();
  for (const [p, h] of html) ids.set(p, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  let flex = 0, n = 0;
  for (const [p, h] of html) {
    if (/<script(?![^>]*(type="module"|application\/ld\+json))/.test(h)) warn(`${p}: Inline-Script`);
    if (/\sstyle="|\son[a-z]+="/.test(h)) warn(`${p}: Inline-Style oder Handler`);
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { warn(`${p}: JSON-LD ungültig`); } }
    for (const m of h.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      const href = m[1].replace(/&amp;/g, "&");
      if (href.includes("flexchange-medical.de")) flex++;
      if (!href.startsWith(SITE.base)) { if (href === "#main") continue; if (!/^(https:\/\/|mailto:)/.test(href)) warn(`${p}: ungewöhnlicher Link ${href}`); continue; }
      n++;
      const [path, frag] = href.slice(SITE.base.length).split("#");
      const pp = path === "" ? "" : path;
      if (!(html.has(pp) || fileExists(pp))) { warn(`${p || "/"}: toter Link ${href}`); continue; }
      if (frag && html.has(pp) && !/^beispiel=/.test(frag) && !ids.get(pp).has(frag)) warn(`${p || "/"}: Anker fehlt ${href}`);
    }
    for (const m of h.matchAll(/(?:src|href)="(\/hl7v2-viewer\/[^"#?]+)/g)) if (!fileExists(m[1].slice(SITE.base.length))) warn(`${p}: fehlende Datei ${m[1]}`);
  }
  const flexWant = SITE.flexchange.enabled ? 1 : 0;
  if (flex !== flexWant) warn(`FleXChange-Link: ${flex} statt ${flexWant} (SITE.flexchange.enabled=${SITE.flexchange.enabled}; erlaubt sind 0 oder genau 1)`);
  const bad = BANNED;
  for (const f of walk(dist)) if (!/\.(png|ico)$/.test(f) && bad.test(readFileSync(f, "utf8"))) warn(`verbotener Begriff in ${relative(dist, f)}`);
  console.log(`Interne Links geprüft: ${n}`);
}

main();
