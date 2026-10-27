// Gemeinsames Seitengerüst: Head, Navigation, Footer, JSON-LD, Viewer-Markup.
export const SITE = {
  origin: "https://freimoser.github.io",
  base: "/hl7v2-viewer/",
  name: "HL7-v2-Viewer",
  date: "2026-10-27",
  repo: "https://github.com/freimoser/hl7v2-viewer",
  dev: { name: "Thomas Freimoser", url: "https://freimoser.de/", linkedin: "https://www.linkedin.com/in/thomas-freimoser/", impressum: "https://freimoser.de/impressum/" },
  verify: { google: "6pYvtFCnU7UFcQFajtMSkQ7tYMy3Z_Bt7teKiT5yKNg", bing: "E1F30DEB311AAF5458907DB431B481AC" },
  indexNowKey: "c67e9b3d19be863e1c5ec56c3a89f916",
  // Schalter für den einen optionalen Fließtext-Link (erst nach Freigabe der Formulierung auf enabled: false setzen).
  flexchange: { enabled: false, url: "https://flexchange-medical.de/products_flx-suite.php" },
  siblings: [], // wird vom Build gesetzt: [{name, url, desc}]
};

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const url = (path = "") => SITE.base + path;
export const abs = (path = "") => SITE.origin + SITE.base + path;
/** Link zum Viewer mit vorgewähltem Beispiel. */
export const openLink = (id, label = "Im Viewer öffnen") => `<a class="btn pri" href="${url("")}#beispiel=${id}">${esc(label)}</a>`;

const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'none'; connect-src 'none'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'";

const NAV = [
  ["", "Viewer"],
  ["hl7-nachricht-aufbau/", "Aufbau"],
  ["hl7-nachrichtentypen/", "Nachrichtentypen"],
  ["hl7-segmente/", "Segmente"],
  ["hl7-fehler/", "Häufige Fehler"],
  ["#anonymisieren", "Anonymisieren", true],
];

export const DISCLAIMER = "HL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt und wird von HL7 International weder bereitgestellt noch empfohlen.";

function ld(page) {
  const graph = [];
  const pageUrl = abs(page.path);
  const person = { "@type": "Person", "@id": SITE.dev.url + "#thomas-freimoser", name: SITE.dev.name, url: SITE.dev.url, sameAs: [SITE.dev.linkedin] };
  graph.push(person);
  if (page.path === "") {
    graph.push({
      "@type": "WebApplication", "@id": pageUrl + "#app", name: SITE.name, url: pageUrl,
      description: page.description, applicationCategory: "DeveloperApplication", operatingSystem: "Alle Systeme mit aktuellem Webbrowser",
      browserRequirements: "JavaScript, aktueller Browser", inLanguage: "de", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: ["HL7-v2-Nachricht als Baum, Tabelle oder Rohtext anzeigen", "Erklärung zu jedem Feld per Hover oder Tippen", "Erkennung des Nachrichtentyps aus MSH-9", "Hinweise zu fehlenden Segmenten und falschen Trennzeichen", "Export als JSON und CSV", "Zeilenumbrüche reparieren und MLLP-Rahmen entfernen oder ergänzen", "Anonymisierungshilfe für Testdaten", "Verarbeitung nur lokal im Browser, kein Upload"],
      author: { "@id": person["@id"] }, dateModified: SITE.date,
    });
  } else if (page.article !== false && !page.noindex) {
    graph.push({ "@type": "TechArticle", "@id": pageUrl + "#article", headline: page.h1, description: page.description, url: pageUrl, inLanguage: "de", author: { "@id": person["@id"] }, datePublished: SITE.date, dateModified: SITE.date, isPartOf: { "@type": "WebSite", name: SITE.name, url: abs("") } });
  }
  if (page.faq?.length) graph.push({ "@type": "FAQPage", "@id": pageUrl + "#faq", mainEntity: page.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) });
  if (page.path !== "") {
    const crumbs = [[SITE.name, ""], ...(page.crumbs || []), [page.crumb || page.h1, page.path]];
    graph.push({ "@type": "BreadcrumbList", "@id": pageUrl + "#crumbs", itemListElement: crumbs.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: abs(p) })) });
  }
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
}

export function head(page, cssHref) {
  const pageUrl = abs(page.path);
  const robots = page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large";
  const t = esc(page.title), d = esc(page.description);
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>${t}</title>
<meta name="description" content="${d}">
<meta name="robots" content="${robots}">
<meta name="google-site-verification" content="${SITE.verify.google}">
<meta name="msvalidate.01" content="${SITE.verify.bing}">
<meta name="theme-color" content="#0b1117">
<meta name="author" content="${SITE.dev.name}">
${page.keywords ? `<meta name="keywords" content="${esc(page.keywords)}">\n` : ""}${page.noindex ? "" : `<link rel="canonical" href="${pageUrl}">\n`}<link rel="icon" href="${url("favicon.svg")}" type="image/svg+xml">
<link rel="icon" href="${url("favicon-48.png")}" type="image/png" sizes="48x48">
<link rel="apple-touch-icon" href="${url("apple-touch-icon.png")}">
<link rel="manifest" href="${url("site.webmanifest")}">
<link rel="stylesheet" href="${cssHref}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${abs("og-image.png")}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="HL7-v2-Viewer: HL7-v2-Nachrichten im Browser lesen">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${abs("og-image.png")}">
${page.noindex ? "" : ld(page) + "\n"}</head>`;
}

function header(page) {
  const links = NAV.map(([p, l, hash]) => {
    const href = hash ? url("") + p : url(p);
    const cur = !hash && p === page.path ? ' aria-current="page"' : "";
    return `<a href="${href}"${cur}>${l}</a>`;
  }).join("");
  return `<header class="top"><div class="wrap"><a class="brand" href="${url("")}"><img src="${url("favicon.svg")}" alt="" width="28" height="28">${SITE.name}</a><button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menü"><span></span></button><nav class="main" id="site-nav" aria-label="Hauptnavigation">${links}</nav></div></header>`;
}

export function about() {
  return `<section class="about"><div class="wrap"><img src="${url("favicon.svg")}" alt="" width="44" height="44"><div><h2>Über den Entwickler</h2><p>Entwickelt von <strong>${SITE.dev.name}</strong>, München / Remote. Dieses Werkzeug liest HL7-v2-Nachrichten lokal im Browser; es gibt keinen Upload und kein Tracking.</p><div class="btns"><a class="btn" href="${SITE.dev.url}">freimoser.de</a><a class="btn" href="${SITE.dev.linkedin}">LinkedIn</a></div></div></div></section>`;
}

export function tools() {
  if (!SITE.siblings.length) return "";
  return `<section class="xlink" id="weitere-werkzeuge"><h2>Weitere Werkzeuge</h2><p>Kostenlose Viewer für andere Formate aus dem Praxis- und Laboralltag. Alle laufen ebenfalls im Browser.</p><ul class="tl">${SITE.siblings.map((s) => `<li><a href="${s.url}">${esc(s.name)}</a> – ${esc(s.desc)}</li>`).join("")}</ul></section>`;
}

function footer() {
  const sib = SITE.siblings.map((s) => `<a href="${s.url}">${esc(s.name)}</a>`).join("");
  return `<footer><div class="wrap"><div class="cols">
<div><strong>Werkzeug</strong><a href="${url("")}">Viewer</a><a href="${url("")}#anonymisieren">Anonymisieren</a><a href="${url("quellen/")}">Quellen</a><a href="${SITE.repo}">Quellcode</a></div>
<div><strong>Wissen</strong><a href="${url("hl7-nachricht-aufbau/")}">Aufbau</a><a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen</a><a href="${url("hl7-segmente/")}">Segmente</a><a href="${url("hl7-fehler/")}">Häufige Fehler</a></div>
<div><strong>Weitere Werkzeuge</strong>${sib}</div>
<div><strong>Rechtliches</strong><a href="${SITE.dev.impressum}">Impressum</a><a href="${url("datenschutz/")}">Datenschutz</a></div>
</div><p class="disc">${DISCLAIMER}</p><p class="disc">Nur zur Ansicht: kein Medizinprodukt und kein Konformitätsprüfer. © ${SITE.date.slice(0, 4)} ${SITE.dev.name}, München / Remote. Quellcode unter MIT-Lizenz, Beispielnachrichten frei erfunden (CC0). <a href="${url("quellen/")}">Quellen und Lizenzen</a>.</p></div></footer>`;
}

const NOTICE = `<p class="mdr" role="note">Nur zur Ansicht, kein Medizinprodukt, keine Konformitätsprüfung. Ihre Nachrichten bleiben im Browser. Bitte nutzen Sie Testdaten oder anonymisierte Daten.</p>`;

function crumbs(page) {
  if (page.path === "") return "";
  const items = [[SITE.name, ""], ...(page.crumbs || []), [page.crumb || page.h1, null]];
  return `<nav class="crumbs" aria-label="Brotkrumen">${items.map(([n, p]) => (p === null ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${url(p)}">${esc(n)}</a>`)).join(" › ")}</nav>`;
}

export function render(page, { cssHref, jsHref, siteJs }) {
  const scripts = [siteJs, ...(page.scripts || [])].filter(Boolean).map((s) => `<script type="module" src="${s}"></script>`).join("");
  return `${head(page, cssHref)}
<body>
<a class="skip" href="#main">Zum Inhalt</a>
${header(page)}
<main class="wrap" id="main">
${NOTICE}
${crumbs(page)}
${page.bodyFull ? page.bodyFull : `<h1>${esc(page.h1)}</h1>\n${page.body}`}
</main>
${page.about === false ? "" : about()}
${footer()}
${scripts}
</body>
</html>
`;
}

export const EXAMPLE_NOTE = "Alle Beispielnachrichten sind frei erfunden. Namen, Nummern und Adressen sind Platzhalter, die E-Mail-Adresse nutzt die reservierte Endung .invalid.";

/** Markup des Viewers (IDs werden von app.js erwartet). */
export function viewerHtml() {
  return `<section id="viewer" class="viewer" aria-labelledby="viewer-h">
<h2 id="viewer-h" class="vh">HL7-Nachricht einfügen</h2>
<div class="inbox">
<label for="hl7-in" class="lbl">Nachricht hier einfügen oder eine Datei öffnen</label>
<textarea id="hl7-in" rows="9" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" placeholder="MSH|^~\\&amp;|SENDER|…"></textarea>
<div class="row">
<label class="btn filebtn">Datei öffnen<input type="file" id="file" accept=".hl7,.txt,.msg,.dat,.mllp,text/plain"></label>
<label class="sel">Zeichensatz <select id="charset"><option value="auto">automatisch</option><option value="utf-8">UTF-8</option><option value="iso-8859-1">ISO-8859-1</option><option value="windows-1252">Windows-1252</option><option value="iso-8859-15">ISO-8859-15</option></select></label>
<button type="button" class="btn ghost" id="clear">Leeren</button>
</div>
<p class="muted small" id="file-note"></p>
<div class="exrow"><span class="lbl2">Beispiel laden:</span><div class="chips" id="examples"></div></div>
<p class="muted small" id="ex-note"></p>
<p class="status" id="status" role="status" aria-live="polite"></p>
</div>
<div id="result" hidden></div>
<div id="exports" class="card" hidden>
<h3>Weiterverarbeiten</h3>
<div class="row"><button type="button" class="btn" id="ex-json">Als JSON speichern</button><button type="button" class="btn" id="ex-csv">Als CSV speichern</button><label class="chk"><input type="checkbox" id="csv-safe" checked> Zellen gegen Formeln in Excel absichern</label></div>
<div class="row"><button type="button" class="btn" id="fix-copy">Zeilenumbrüche reparieren und kopieren</button><button type="button" class="btn" id="fix-dl">Als Datei speichern</button><label class="chk"><input type="checkbox" id="fix-mllp"> MLLP-Rahmen ergänzen</label></div>
<p class="muted small" id="fix-note">Reparatur: Segmente werden mit CR (\\r) getrennt, wie es der Standard verlangt.</p>
</div>
<div id="tip" role="tooltip" hidden></div>
</section>`;
}

export function anonPanelHtml() {
  return `<section id="anonymisieren" class="card anon" aria-labelledby="anon-h"><h2 id="anon-h">Anonymisierungshilfe für Testdaten</h2>
<p>Ersetzt Namen, Kennungen, Adressen, Telefonnummern und Freitexte der oben eingefügten Nachricht durch Platzhalter. Das ist Schwärzen für Tests und Fehlersuche, <strong>keine Anonymisierungsgarantie</strong>: Prüfen Sie das Ergebnis, vor allem Freitexte und Z-Segmente.</p>
<div id="anon-panel">
<div class="row"><label class="sel">Datumsfelder <select id="anon-dates"><option value="year">nur Jahr behalten</option><option value="keep">unverändert</option><option value="remove">entfernen</option></select></label></div>
<div class="checks"><label class="chk"><input type="checkbox" id="anon-ids" checked> Kennungen ersetzen</label><label class="chk"><input type="checkbox" id="anon-doc" checked> Ärztinnen und Ärzte ersetzen</label><label class="chk"><input type="checkbox" id="anon-free" checked> Freitexte (NTE, OBX-Text) ersetzen</label><label class="chk"><input type="checkbox" id="anon-z" checked> Z-Segmente leeren</label></div>
<div class="row"><button type="button" class="btn pri" id="anon-run">Nachricht anonymisieren</button><button type="button" class="btn" id="anon-copy">Kopieren</button><button type="button" class="btn" id="anon-dl">Als Datei speichern</button><button type="button" class="btn" id="anon-show">Im Viewer anzeigen</button></div>
<p class="muted small" id="anon-report" role="status">Fügen Sie oben eine Nachricht ein und klicken Sie auf „Nachricht anonymisieren“.</p>
<label for="anon-out" class="lbl">Ergebnis</label><textarea id="anon-out" rows="6" readonly spellcheck="false"></textarea>
</div></section>`;
}
