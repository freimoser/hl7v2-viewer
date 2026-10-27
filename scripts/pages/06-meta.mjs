import { url, esc, SITE, DISCLAIMER } from "../lib/layout.mjs";
import { SOURCES, OWN, GAPS, RETRIEVED } from "../lib/sources.mjs";

const quellen = {
  path: "quellen/",
  title: "Quellen und Lücken: Belege für den HL7-v2-Viewer",
  description: "Quellen des HL7-v2-Viewers: welche Seiten geöffnet wurden, wofür sie dienen und was nicht belegt ist. Eigene Beispiele sind frei erfunden.",
  h1: "Quellen und Lücken",
  crumb: "Quellen",
  keywords: "HL7 Quellen, HL7 v2 Spezifikation, MLLP Quelle",
  body: `
<p class="lead"><strong>Hier steht, worauf sich die Aussagen auf dieser Website stützen und was nicht belegt ist.</strong> Abrufdatum: ${RETRIEVED}.</p>
<h2 id="dokumente">Geöffnete Dokumente</h2>
<div class="tbl-wrap"><table><thead><tr><th>Thema</th><th>Dokument</th><th>Genutzt für</th></tr></thead><tbody>
${SOURCES.map((s) => `<tr><td>${esc(s.topic)}</td><td><a href="${s.url}" rel="noopener">${esc(s.doc)}</a><br><span class="small muted">${esc(s.publisher)}</span></td><td>${esc(s.used)}</td></tr>`).join("\n")}
</tbody></table></div>
<h2 id="eigene">Eigene Arbeit</h2>
<ul>${OWN.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<h2 id="luecken">Lücken</h2>
<p>Was nicht geprüft werden konnte, ist hier offen benannt statt geraten.</p>
<ul>${GAPS.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<h2 id="marken">Marken</h2>
<p>${esc(DISCLAIMER)}</p>
<p><a href="${url("")}">Zum Viewer</a></p>`,
};

const datenschutz = {
  path: "datenschutz/",
  title: "Datenschutz: HL7-v2-Viewer ohne Upload und Tracking",
  description: "Datenschutz beim HL7-v2-Viewer: Ihre Nachrichten werden nur lokal im Browser verarbeitet. Keine Cookies, kein Tracking, kein Upload, keine Drittdienste.",
  h1: "Datenschutz",
  crumb: "Datenschutz",
  keywords: "HL7 Viewer Datenschutz, HL7 online ohne Upload",
  body: `
<p class="lead"><strong>Ihre HL7-Nachrichten verlassen Ihr Gerät nicht.</strong> Der Viewer läuft vollständig in Ihrem Browser, es gibt keinen Server, der sie empfangen könnte.</p>
<h2 id="verantwortlicher">Verantwortlicher</h2>
<p>${esc(SITE.dev.name)}, München / Remote. Kontakt und vollständige Angaben: <a href="${SITE.dev.impressum}" rel="noopener">Impressum</a>.</p>
<h2 id="nachrichten">Ihre Nachrichten</h2>
<p>Text, den Sie einfügen, und Dateien, die Sie öffnen, werden nur im Arbeitsspeicher Ihres Browsers verarbeitet. Es findet keine Übertragung statt. Das erzwingt die Seite technisch: Die Content-Security-Policy der Seiten enthält <code>connect-src 'none'</code>, der Browser blockiert damit jede Netzwerkverbindung, die ein Skript aufbauen wollte. Exporte (JSON, CSV, anonymisierter Text) erzeugt Ihr Browser lokal als Download. Prüfen können Sie das in den Entwicklerwerkzeugen Ihres Browsers im Reiter „Netzwerk“.</p>
<p>Wenn Sie echte Patientendaten prüfen, entscheiden Sie selbst, ob das nach den Regeln Ihrer Einrichtung zulässig ist. Der Viewer bietet eine Anonymisierung an. Sie ist eine Hilfe und garantiert nicht, dass in Freitexten keine Hinweise auf Personen stehen bleiben.</p>
<h2 id="hosting">Hosting</h2>
<p>Die Seite wird über GitHub Pages (GitHub Inc.) ausgeliefert. Beim Aufruf verarbeitet GitHub technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und angeforderte Datei, um die Seite bereitzustellen und abzusichern (Art. 6 Abs. 1 lit. f DSGVO). Wir haben darauf keinen Einfluss und erhalten diese Daten nicht. Details: <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">Datenschutzerklärung von GitHub</a>.</p>
<h2 id="speicher">Cookies und Speicher</h2>
<p>Die Seite setzt keine Cookies und nutzt weder Local Storage noch Session Storage. Ein Service Worker legt ausschließlich die Dateien dieser Website im Cache Ihres Browsers ab, damit der Viewer auch offline startet. Nachrichten werden dort nicht gespeichert. Sie löschen diesen Cache in den Website-Einstellungen Ihres Browsers.</p>
<h2 id="extern">Keine externen Dienste</h2>
<p>Es gibt keine Reichweitenmessung, keine Schriften, Skripte oder Bilder von Dritten und keine Einbindung sozialer Netzwerke. Links zu anderen Seiten (zum Beispiel zur Impressumsseite oder zu den Quellen) laden erst beim Anklicken.</p>
<h2 id="verifizierung">Search Console und Bing Webmaster Tools</h2>
<p>Die Seite enthält Bestätigungs-Meta-Tags für diese Dienste. Dabei werden keine Daten von Besucherinnen und Besuchern übertragen.</p>
<h2 id="rechte">Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Da wir keine personenbezogenen Daten von Ihnen speichern, laufen diese Rechte gegenüber uns meist ins Leere; gegenüber dem Hoster gelten sie nach dessen Datenschutzerklärung.</p>
<p><a href="${url("")}">Zum Viewer</a></p>`,
};

const notFound = {
  path: "404",
  noindex: true,
  title: "Seite nicht gefunden – HL7-v2-Viewer",
  description: "Diese Seite gibt es nicht. Zum HL7-v2-Viewer, zu den Segmenten oder zu den Nachrichtentypen.",
  h1: "Seite nicht gefunden",
  crumb: "404",
  article: false,
  body: `
<p class="lead">Diese Adresse gibt es nicht (mehr).</p>
<ul>
<li><a href="${url("")}">HL7-v2-Viewer</a></li>
<li><a href="${url("hl7-segmente/")}">Segmente erklärt</a></li>
<li><a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen</a></li>
<li><a href="${url("hl7-fehler/")}">Häufige Fehler</a></li>
</ul>`,
};
export default [quellen, datenschutz, notFound];
