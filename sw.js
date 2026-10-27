/* Service Worker: macht den Viewer nach dem ersten Besuch offline nutzbar. Speichert nur Dateien dieser Website, niemals Ihre Nachrichten. */
const VERSION = "84dc83a619";
const BASE = "/hl7v2-viewer/";
const URLS = ["/hl7v2-viewer/apple-touch-icon.png","/hl7v2-viewer/assets/css/styles.css","/hl7v2-viewer/assets/js/anon-panel.js","/hl7v2-viewer/assets/js/app.js","/hl7v2-viewer/assets/js/core/anonymize.js","/hl7v2-viewer/assets/js/core/dict.js","/hl7v2-viewer/assets/js/core/examples.js","/hl7v2-viewer/assets/js/core/export.js","/hl7v2-viewer/assets/js/core/messages.js","/hl7v2-viewer/assets/js/core/parser.js","/hl7v2-viewer/assets/js/core/validate.js","/hl7v2-viewer/assets/js/site.js","/hl7v2-viewer/assets/js/worker.js","/hl7v2-viewer/datenschutz/","/hl7v2-viewer/favicon-32.png","/hl7v2-viewer/favicon-48.png","/hl7v2-viewer/favicon-96.png","/hl7v2-viewer/favicon.ico","/hl7v2-viewer/favicon.svg","/hl7v2-viewer/hl7-fehler/","/hl7v2-viewer/hl7-nachricht-aufbau/","/hl7v2-viewer/hl7-nachrichtentypen/adt-a01/","/hl7v2-viewer/hl7-nachrichtentypen/adt-a08/","/hl7v2-viewer/hl7-nachrichtentypen/","/hl7v2-viewer/hl7-nachrichtentypen/orm-o01/","/hl7v2-viewer/hl7-nachrichtentypen/oru-r01/","/hl7v2-viewer/hl7-segmente/","/hl7v2-viewer/hl7-segmente/msh/","/hl7v2-viewer/hl7-segmente/obr/","/hl7v2-viewer/hl7-segmente/obx/","/hl7v2-viewer/hl7-segmente/pid/","/hl7v2-viewer/hl7-segmente/pv1/","/hl7v2-viewer/icon-192.png","/hl7v2-viewer/icon-512-maskable.png","/hl7v2-viewer/icon-512.png","/hl7v2-viewer/","/hl7v2-viewer/og-image.png","/hl7v2-viewer/quellen/","/hl7v2-viewer/site.webmanifest"];
const CACHE = "hl7v2-viewer-" + VERSION;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("hl7v2-viewer-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      });
      return hit || net.catch(() => caches.match(BASE + "404.html"));
    })
  );
});
