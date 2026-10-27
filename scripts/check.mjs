/** Prüft das Build-Ergebnis (dist/ oder, mit --root, die ausgelieferte Repo-Wurzel). Exit 1 bei Fehlern. */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { BANNED } from "./lib/banned.mjs";
import { SITE } from "./lib/layout.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv.includes("--root") ? repo : join(repo, "dist");
const errors = [];
const err = (m) => errors.push(m);
const walk = (d, skip = []) => readdirSync(d).flatMap((n) => {
  if (skip.includes(n)) return [];
  const p = join(d, n); return statSync(p).isDirectory() ? walk(p, skip) : [p];
});
const SKIP = [".git", "node_modules", "dist"];
const files = walk(dir, dir === repo ? SKIP : []);
const rel = (f) => relative(dir, f).split("\\").join("/");
const htmlFiles = files.filter((f) => f.endsWith(".html") && (dir !== repo || !/^(src|scripts|tests)\//.test(rel(f))));
const read = (f) => readFileSync(f, "utf8");

// Sitemap
const sm = read(join(dir, "sitemap.xml"));
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)];
if (!locs.length) err("sitemap.xml ohne <loc>/<lastmod>");
const prefix = SITE.origin + SITE.base;
for (const [, loc, lm] of locs) {
  if (!loc.startsWith(prefix)) { err(`Sitemap-URL außerhalb ${prefix}: ${loc}`); continue; }
  const p = loc.slice(prefix.length);
  if (!existsSync(join(dir, p === "" ? "index.html" : p.endsWith("/") ? p + "index.html" : p))) err(`Sitemap-URL ohne Datei: ${loc}`);
  if (lm !== SITE.date) err(`lastmod ${lm} != ${SITE.date}: ${loc}`);
}
const robots = read(join(dir, "robots.txt"));
if (!robots.includes(`Sitemap: ${prefix}sitemap.xml`)) err("robots.txt ohne Sitemap-Zeile");
if (/Disallow:\s*\//.test(robots)) err("robots.txt sperrt etwas");
const key = SITE.indexNowKey;
if (!existsSync(join(dir, key + ".txt")) || read(join(dir, key + ".txt")).trim() !== key) err("IndexNow-Schlüsseldatei fehlt oder falsch");
for (const f of ["llms.txt", "llms-full.txt", "404.html", "favicon.svg", "og-image.png", "site.webmanifest", ".nojekyll", "sw.js"]) if (!existsSync(join(dir, f))) err("fehlt: " + f);
if (existsSync(join(dir, "og-image.png"))) {
  const b = readFileSync(join(dir, "og-image.png"));
  if (b.readUInt32BE(16) !== 1200 || b.readUInt32BE(20) !== 630) err("og-image.png nicht 1200×630");
}

// HTML-Seiten
let flex = 0;
for (const f of htmlFiles) {
  const h = read(f), n = rel(f);
  const is404 = n === "404.html";
  if (!h.includes(`content="${SITE.verify.google}"`)) err(`${n}: Google-Verifizierung fehlt`);
  if (!h.includes(`content="${SITE.verify.bing}"`)) err(`${n}: Bing-Verifizierung fehlt`);
  if (!/connect-src 'none'/.test(h)) err(`${n}: CSP ohne connect-src 'none'`);
  if (!/<meta name="viewport"/.test(h) || !/<meta name="theme-color"/.test(h)) err(`${n}: viewport/theme-color fehlt`);
  if (/<style[\s>]/i.test(h) || /\sstyle=/i.test(h)) err(`${n}: Inline-Style`);
  if (/\son[a-z]+=\s*["']/i.test(h)) err(`${n}: Inline-Event-Handler`);
  for (const m of h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const type = (m[1].match(/type="([^"]+)"/) || [])[1];
    if (type === "application/ld+json") {
      try { JSON.parse(m[2]); } catch (e) { err(`${n}: JSON-LD nicht parsbar`); }
    } else if (!/\ssrc="/.test(m[1])) err(`${n}: Inline-Skript`);
  }
  for (const m of h.matchAll(/<(?:script|link|img)\b[^>]*(?:src|href)="(https?:)?\/\/[^"]+"[^>]*>/gi)) {
    if (/<a\s/.test(m[0])) continue;
    if (/rel="(canonical|alternate)"/.test(m[0])) continue;
    err(`${n}: externe Ressource ${m[0].slice(0, 80)}`);
  }
  if (!is404) {
    const can = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    const want = prefix + (n === "index.html" ? "" : n.replace(/index\.html$/, ""));
    if (can !== want) err(`${n}: canonical ${can} != ${want}`);
    if (!/property="og:image"/.test(h) || !/name="twitter:card"/.test(h)) err(`${n}: OG/Twitter fehlt`);
    for (const m of h.matchAll(/"dateModified":"([^"]+)"/g)) if (m[1] !== SITE.date) err(`${n}: dateModified ${m[1]}`);
    if (!/<h1[\s>]/.test(h)) err(`${n}: kein H1`);
  } else if (!/noindex/.test(h)) err("404 ohne noindex");
  if (/hreflang/.test(h)) err(`${n}: hreflang ohne englische Version`);
  for (const m of h.matchAll(/href="([^"]*flexchange-medical\.de[^"]*)"/g)) flex++;
}
const flexWant = SITE.flexchange.enabled ? 1 : 0;
if (flex !== flexWant) err(`FleXChange-Link: ${flex} statt ${flexWant} (erlaubt: 0 oder genau 1; Schalter SITE.flexchange.enabled)`);
// Keine Erwähnung, solange der Schalter aus ist (auch nicht in Textdateien)
if (!SITE.flexchange.enabled) {
  for (const f of files) if (/\.(html|txt|md|xml|js|json|webmanifest|css|svg)$/.test(f) && !rel(f).startsWith("scripts/") && /flexchange|FLX Suite/i.test(read(f))) err(`${rel(f)}: Erwähnung FleXChange trotz ausgeschaltetem Schalter`);
}

// Verbotene Begriffe im gesamten Repo (nur Textdateien)
const bad = BANNED;
for (const f of walk(repo, SKIP)) if (/\.(html|txt|md|xml|js|mjs|json|css|svg|py|webmanifest)$/.test(f) || /LICENSE|THIRD/.test(f)) if (bad.test(read(f))) err(`verbotener Begriff in ${relative(repo, f)}`);

if (errors.length) { console.log("CHECK FEHLER:\n- " + errors.join("\n- ")); process.exit(1); }
console.log(`Check ok: ${htmlFiles.length} HTML-Seiten, ${locs.length} Sitemap-URLs, ${flex} FleXChange-Link(s).`);
