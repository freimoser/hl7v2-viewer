import { url, esc, viewerHtml, anonPanelHtml, tools, EXAMPLE_NOTE, SITE } from "../lib/layout.mjs";
import { faqHtml } from "../lib/ann.mjs";
import { EXAMPLES, BROKEN_EXAMPLE } from "../../src/assets/js/core/examples.js";

const faq = [
  ["Was ist eine HL7-v2-Nachricht?",
    `Eine HL7-v2-Nachricht ist ein Text im Pipe-Format. Jede Zeile ist ein Segment (zum Beispiel MSH, PID oder PV1). Innerhalb der Zeile trennt <code>|</code> die Felder, <code>^</code> die Komponenten, <code>~</code> Wiederholungen und <code>&amp;</code> Subkomponenten. Krankenhaus-, Labor- und Praxissysteme tauschen darüber Patientenstammdaten, Aufträge und Befunde aus. Den Aufbau erklärt die Seite <a href="${url("hl7-nachricht-aufbau/")}">Aufbau einer HL7-v2-Nachricht</a>.`],
  ["Wie lese ich eine HL7-Nachricht?",
    "Fügen Sie die Nachricht oben ein. Der Viewer zerlegt sie in Segmente und Felder, nennt zu jedem Wert den Pfad (zum Beispiel PID-5.1) und erklärt ihn beim Überfahren oder Antippen. Von Hand lesen Sie so: zuerst MSH-9 für den Nachrichtentyp, dann Segment für Segment die Felder abzählen. Bei MSH zählt das Trennzeichen direkt hinter „MSH“ bereits als Feld 1."],
  ["Was bedeuten ADT, ORU und ORM?",
    `ADT meldet Ereignisse der Patientenverwaltung (A01 Aufnahme, A08 Änderung), ORU überträgt Ergebnisse und Befunde (R01) und ORM überträgt Aufträge (O01). Der Code steht in MSH-9, gefolgt vom Auslöseereignis. Eine Tabelle mit Beispielen finden Sie unter <a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen im Überblick</a>.`],
  ["Welche Trennzeichen verwendet HL7 v2?",
    "Üblich sind | für Felder, ^ für Komponenten, ~ für Wiederholungen, \\ als Escape-Zeichen und &amp; für Subkomponenten. Die Zeichen stehen in MSH-1 und MSH-2; der Viewer liest sie von dort und meldet es, wenn sie vom Üblichen abweichen. Segmente enden laut Standard mit einem Wagenrücklauf (CR)."],
  ["Warum steht meine Nachricht nur in einer Zeile oder wird falsch getrennt?",
    "Segmente sind mit CR getrennt. Beim Kopieren aus E-Mails, Logs oder Editoren wird daraus oft LF, oder die Umbrüche gehen verloren. Der Viewer liest CR, LF und CRLF und erkennt außerdem wörtliche „\\r“-Zeichenfolgen sowie Segmente, die durch Leerzeichen getrennt sind. Er sagt dabei jeweils, was er angenommen hat. Mit „Zeilenumbrüche reparieren“ erhalten Sie die Nachricht mit CR zurück."],
  ["Wo steht die HL7-Version einer Nachricht?",
    "In MSH-12, zum Beispiel 2.5.1. Die Version sagt, nach welchem Regelwerk die Nachricht aufgebaut sein soll. Der Viewer zeigt sie in der Zusammenfassung an, prüft aber nicht gegen die Regeln einer bestimmten Version."],
  ["Was ist ein Z-Segment?",
    "Segmentnamen, die mit Z beginnen, sind für lokale Erweiterungen reserviert. Was darin steht, legen nur die beteiligten Systeme fest. Der Viewer zeigt solche Segmente an und markiert sie als lokal, kann ihre Felder aber nicht erklären. Das erledigt die Schnittstellenbeschreibung des Absenders."],
  ["Werden meine Nachrichten hochgeladen?",
    "Nein. Die Auswertung läuft im Browser, und die Seite verbietet über eine Content-Security-Policy mit <code>connect-src 'none'</code> jede Netzwerkverbindung aus dem Seitencode. Das lässt sich in den Entwicklertools prüfen. Echte Patientendaten gehören trotzdem nicht in Testwerkzeuge. Nutzen Sie Testdaten oder anonymisieren Sie zuerst."],
];

const exCards = [...EXAMPLES, BROKEN_EXAMPLE].map((e) => `<div class="card"><h3>${esc(e.title)}</h3><p>${esc(e.note)}</p><p class="btns"><a class="btn pri" href="${url("")}#beispiel=${e.id}">Im Viewer öffnen</a> <a class="btn" href="${url("beispiele/" + e.file)}" download>${esc(e.file)}</a></p></div>`).join("");

export default {
  path: "",
  title: "HL7 Viewer & Parser (v2) online – Nachricht lesen",
  description: "HL7-v2-Nachrichten (ADT, ORU, ORM) einfügen und Segmente, Felder und Komponenten lesbar anzeigen. Kostenlos, lokal im Browser, ohne Upload.",
  h1: "HL7-v2-Nachrichten lesen: Viewer und Parser im Browser",
  keywords: "HL7 Viewer online, HL7 Parser online, HL7 v2 Viewer, HL7 Nachricht lesen, HL7 message example, ADT A01, ORU R01, ORM O01, Pipe-Format",
  scripts: [url("assets/js/app.js")],
  faq,
  body: `
<p class="lead"><strong>Der HL7-v2-Viewer zerlegt HL7-v2-Nachrichten im Pipe-Format im Browser in Segmente, Felder und Komponenten und zeigt sie lesbar an.</strong> Er ist kostenlos, braucht keine Anmeldung, und Ihre Nachricht wird nicht hochgeladen. HL7 v2 ist ein Nachrichtenstandard, über den Systeme im Gesundheitswesen Daten austauschen, etwa Krankenhausinformationssystem, Labor und Radiologie.</p>
<p class="note">Dass nichts übertragen wird, ist technisch erzwungen: Die Seite setzt eine Content-Security-Policy mit <code>connect-src 'none'</code>, der Browser blockiert damit Netzwerkverbindungen aus dem Seitencode. In den Entwicklertools (Reiter „Netzwerk“) bleibt es beim Einfügen und Auswerten still. Das Laden der Seite selbst geht natürlich an den Hoster, siehe <a href="${url("datenschutz/")}">Datenschutz</a>.</p>
${viewerHtml()}
<section aria-labelledby="kann-h">
<h2 id="kann-h">Was der Viewer kann und was nicht</h2>
<div class="grid">
<div class="card"><h3>Das zeigt der Viewer</h3><ul>
<li>Baumansicht, Tabelle und Rohtext mit farbigen Trennzeichen</li>
<li>zu jedem Feld Pfad (<code>PID-5.1</code>), Name und Kurzerklärung beim Überfahren oder Antippen</li>
<li>Nachrichtentyp aus MSH-9 mit kurzer Erklärung, Version, Absender, Zeitstempel</li>
<li>Hinweise bei fehlendem MSH, leeren Pflichtfeldern, falschen Datumsformaten und auffälligen Trennzeichen</li>
<li>Export als JSON oder CSV, Reparatur von Zeilenumbrüchen, Anonymisierungshilfe</li>
<li>mehrere Nachrichten in einer Datei, MLLP-Rahmen und Z-Segmente</li>
</ul></div>
<div class="card limits"><h3>Das leistet er nicht</h3><ul class="limits">
<li>Er ist <strong>kein Konformitätsprüfer</strong>: Er prüft nicht gegen ein Schnittstellenprofil und nicht gegen eine bestimmte HL7-Version.</li>
<li>Die Feldliste ist eigenhändig geschrieben und <strong>unvollständig</strong>. Unbekannte Felder erscheinen als „Feld n“.</li>
<li>Er sendet und empfängt nichts (kein MLLP über TCP, keine ACKs). Browser können solche Verbindungen nicht öffnen.</li>
<li>Er liest nur das Pipe-Format von HL7 v2, kein FHIR und kein CDA.</li>
<li>Er ist <strong>kein Medizinprodukt</strong> und nicht für Diagnose, Behandlung oder den Produktivbetrieb gedacht.</li>
</ul></div>
</div>
</section>
${anonPanelHtml()}
<section aria-labelledby="schritte-h">
<h2 id="schritte-h">Eine Nachricht von Hand lesen: fünf Schritte</h2>
<ol>
<li><strong>MSH-9</strong> nennen: Das ist der Nachrichtentyp, etwa <code>ORU^R01</code>. Er sagt, welche Segmente zu erwarten sind.</li>
<li><strong>MSH-12</strong> (Version) und <strong>MSH-10</strong> (Kontroll-ID) notieren. Die Kontroll-ID brauchen Sie, um eine Bestätigung zuzuordnen.</li>
<li>Die <strong>Segmentkennung</strong> am Zeilenanfang lesen (PID, PV1, OBR, OBX …). Sie bestimmt, was die Felder bedeuten.</li>
<li>Felder <strong>abzählen</strong>. Bei MSH ist das Trennzeichen selbst Feld 1, das erste Feld nach <code>MSH|</code> ist deshalb MSH-2.</li>
<li>Zusammengesetzte Felder an <code>^</code> teilen und die Teile nach dem Datentyp deuten, zum Beispiel Name, Kennung oder Adresse.</li>
</ol>
<p>Das geht schneller mit dem Viewer, aber es hilft beim Prüfen seiner Anzeige. Mehr dazu auf <a href="${url("hl7-nachricht-aufbau/")}">Aufbau einer HL7-v2-Nachricht</a>.</p>
</section>
<section aria-labelledby="bsp-h">
<h2 id="bsp-h">Beispielnachrichten</h2>
<p>${esc(EXAMPLE_NOTE)} Sie dürfen die Dateien frei verwenden (CC0). „Im Viewer öffnen“ lädt das Beispiel direkt in den Viewer oben.</p>
<div class="grid g3">${exCards}</div>
</section>
<section aria-labelledby="wissen-h">
<h2 id="wissen-h">Nachlesen</h2>
<div class="grid">
<div class="card"><h3><a href="${url("hl7-nachricht-aufbau/")}">Aufbau einer HL7-v2-Nachricht</a></h3><p>Segmente, Felder, Komponenten, Trennzeichen, Escape-Sequenzen und Datentypen mit einer kommentierten Beispielzeile.</p></div>
<div class="card"><h3><a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen im Überblick</a></h3><p>ADT, ORM, ORU und weitere, mit Auslöseereignissen und je einem Beispiel zum Öffnen.</p></div>
<div class="card"><h3><a href="${url("hl7-segmente/")}">Segmente erklärt</a></h3><p>MSH, PID, PV1, OBR und OBX: wichtige Felder und typische Stolperstellen.</p></div>
<div class="card"><h3><a href="${url("hl7-fehler/")}">Häufige Fehler</a></h3><p>Zeilenumbrüche, Datumsformate, Dezimalkomma, Zeichensatz: Symptom, Ursache, Lösung.</p></div>
</div>
</section>
<section aria-labelledby="faq-h">
<h2 id="faq-h">Häufige Fragen</h2>
${faqHtml(faq)}
</section>
${tools()}`,
};
