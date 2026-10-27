/** Lokaler Server: liefert dist/ unter /hl7v2-viewer/ aus, wie GitHub Pages (Standard: dist, ROOT=. für die Repo-Wurzel). */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = process.env.ROOT ? resolve(here, process.env.ROOT) : join(here, "dist");
const BASE = "/hl7v2-viewer/";
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json", ".hl7": "application/octet-stream" };
const port = Number(process.env.PORT || 8766);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/") { res.writeHead(302, { Location: BASE }); return res.end(); }
  let status = 200, file = null;
  if (path.startsWith(BASE) && !path.includes("..")) {
    let p = join(dist, path.slice(BASE.length));
    try {
      const s = await stat(p);
      if (s.isDirectory()) {
        if (!path.endsWith("/")) { res.writeHead(301, { Location: path + "/" }); return res.end(); }
        p = join(p, "index.html");
      }
      await stat(p);
      file = p;
    } catch { /* 404 */ }
  }
  if (!file) { status = 404; file = join(dist, "404.html"); }
  try {
    let body = await readFile(file);
    const headers = { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" };
    if (/gzip/.test(req.headers["accept-encoding"] || "") && /\.(html|css|js|json|svg|xml|txt|webmanifest)$/.test(file)) { body = gzipSync(body); headers["Content-Encoding"] = "gzip"; }
    res.writeHead(status, headers);
    res.end(body);
  } catch { res.writeHead(500); res.end("Fehler"); }
}).listen(port, () => console.log(`http://localhost:${port}${BASE}`));
