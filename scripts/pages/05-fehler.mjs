import { url, esc, openLink, tools, SITE } from "../lib/layout.mjs";
import { faqHtml } from "../lib/ann.mjs";
import { parseAll } from "../../src/assets/js/core/parser.js";
import { checkMessage } from "../../src/assets/js/core/validate.js";
import { BROKEN_EXAMPLE } from "../../src/assets/js/core/examples.js";

// Meldungstexte kommen direkt aus Parser und Prüfung, damit die Seite nie vom Viewer abweicht.
const MSH = "MSH|^~\\&|A|B|C|D|20261027083015||ORU^R01|X1|P|2.5.1";
function msg(input, code) {
  const r = parseAll(input);
  r.messages.forEach(checkMessage);
  const all = [...(r.notes || []), ...r.messages.flatMap((m) => m.hints)];
  const hit = all.find((h) => h.code === code);
  if (!hit) throw new Error(`Meldung ${code} nicht erzeugt`);
  return hit.text;
}
const quote = (t) => `<blockquote class="tool">${esc(t)}</blockquote>`;
const B = BROKEN_EXAMPLE.text;

const sections = [
  { id: "zeilenumbrueche", h: "Segmente nicht getrennt oder alles in einer Zeile",
    sym: "Die Nachricht erscheint als eine lange Zeile, oder Zeilenenden sehen anders aus als erwartet.",
    why: "Der Standard trennt Segmente mit einem Wagenrücklauf (CR). Mails, Logs und Editoren machen daraus Zeilenvorschub (LF) oder CRLF, ersetzen den Umbruch durch Leerzeichen oder zeigen ihn als Text <code>\\r</code>.",
    fix: "Der Viewer liest CR, LF und CRLF, erkennt wörtliches <code>\\r</code>/<code>\\n</code> und Leerzeichen vor einer Segmentkennung und sagt, was er angenommen hat. „Zeilenumbrüche reparieren“ liefert die Fassung mit CR. Prüfen Sie bei Leerzeichen-Trennung das Ergebnis: Es ist eine Vermutung.",
    msgs: [msg(B, "lf-breaks"), msg(MSH + " PID|1||X", "space-breaks"), msg("MSH|^~\\&|A|B|C|D|2026||ORU^R01|1|P|2.5\\rPID|1||X1", "literal-breaks")] },
  { id: "log-praefix", h: "Zeitstempel oder Text vor MSH",
    sym: "Die Nachricht stammt aus einem Log und beginnt mit Datum, Uhrzeit oder Stufe („INFO“).",
    why: "Das ist Teil der Logzeile, nicht der Nachricht. Eine Nachricht muss mit MSH beginnen.",
    fix: "Der Viewer ignoriert Text vor „MSH“ und meldet es. Sauberer ist es, die Nachricht ohne Präfix aus dem Log zu kopieren.",
    msgs: [msg("2026-10-27 08:00:01 INFO Received: " + MSH, "log-prefix")] },
  { id: "mllp", h: "Steuerzeichen am Anfang und Ende (MLLP)",
    sym: "Vor „MSH“ und am Ende stehen unsichtbare Zeichen, oder eine Datei beginnt mit einem seltsamen Zeichen.",
    why: "Beim Versand über TCP wird die Nachricht mit den Zeichen Hex 0B (Start) und Hex 1C 0D (Ende) eingerahmt (MLLP). Mitgeschnittene Daten enthalten sie noch.",
    fix: "Der Viewer entfernt den Rahmen und meldet es. Ein Byte-Order-Mark am Dateianfang wird ebenfalls ignoriert.",
    msgs: [msg("\x0b" + MSH + "\rPID|1||X1\r\x1c\r", "mllp")] },
  { id: "datum", h: "Datum im falschen Format",
    sym: "Geburtsdatum oder Zeitstempel sehen aus wie im Alltag: 05.03.1971 oder 2026-10-27.",
    why: "HL7 v2 erwartet Ziffern ohne Trennzeichen: <code>JJJJMMTT</code> oder länger bis <code>JJJJMMTThhmmss</code>, optional mit Zeitzone. Exportfunktionen von Fremdsystemen schreiben oft das lokale oder das ISO-Format.",
    fix: "Der Viewer prüft die bekannten Datumsfelder und nennt das erkannte Format. Korrigiert werden muss im erzeugenden System.",
    msgs: [msg(B, "bad-date")] },
  { id: "dezimal", h: "Dezimalkomma statt Punkt",
    sym: "Ein Messwert wie 5,9 wird vom Empfänger nicht als Zahl gelesen.",
    why: "Bei Werttyp <code>NM</code> in OBX-2 sind nur Ziffern, Vorzeichen und Dezimalpunkt erlaubt. Deutsche Ausgabeformate setzen oft das Komma.",
    fix: "Der Viewer warnt, wenn OBX-5 nicht zu <code>NM</code> passt. Ändern Sie das Format im Absender oder den Werttyp auf <code>ST</code>, falls Text gemeint ist.",
    msgs: [msg(B, "obx-nm")] },
  { id: "pflicht", h: "Leere Pflichtfelder und Nullwert",
    sym: "Ein Empfänger lehnt die Nachricht ab oder löscht Daten, obwohl nichts gelöscht werden sollte.",
    why: "Leer (<code>||</code>) heißt „keine Angabe“, zwei Anführungszeichen (<code>\"\"</code>) heißen „Wert löschen“. Das wird gern verwechselt. Dazu kommen Felder, die das Profil verlangt, aber leer sind.",
    fix: "Der Viewer meldet leere Felder, die üblicherweise gefüllt sind, und kennzeichnet Nullwerte. Ob ein Feld in Ihrem Fall Pflicht ist, entscheidet das Schnittstellenprofil.",
    msgs: [msg(B, "empty-required"), msg(B, "null-field")] },
  { id: "umlaute", h: "Kaputte Umlaute",
    sym: "Aus „ä“ wird „Ã¤“ oder ein Ersatzzeichen (�).",
    why: "Die Bytes wurden mit einem anderen Zeichensatz gelesen, als sie geschrieben wurden, typischerweise UTF-8 als ISO-8859-1 oder umgekehrt. MSH-18 nennt den Zeichensatz, die tatsächliche Kodierung muss dazu passen.",
    fix: "Beim Öffnen einer Datei können Sie im Viewer den Zeichensatz wählen. Er meldet die typischen Muster.",
    msgs: [msg(MSH + "\rPID|1||X1||Müller^Jörg".replace("Müller^Jörg", "MÃ¼ller^JÃ¶rg"), "mojibake")] },
  { id: "unmaskiert", h: "Trennzeichen im Freitext",
    sym: "Nach einem Textfeld sind Felder verschoben, oder ein Name taucht in Subkomponenten auf.",
    why: "Ein <code>|</code>, <code>^</code> oder <code>&amp;</code> im Text wird als Trennzeichen gelesen, wenn es nicht maskiert ist: <code>\\F\\</code>, <code>\\S\\</code>, <code>\\T\\</code>.",
    fix: "Maskieren im erzeugenden System. Der Viewer erkennt dieses Problem nicht von selbst, weil unmaskierte Zeichen gültige Syntax sind. Prüfen Sie im Viewer, ob Felder an unerwarteten Stellen enden.",
    msgs: [] },
  { id: "msh-zaehlung", h: "Falsche Zählung bei MSH",
    sym: "Der Nachrichtentyp oder die Version „stimmen nicht“, wenn Felder per Skript abgezählt werden.",
    why: "MSH-1 ist das Trennzeichen selbst. Beim Zerlegen an <code>|</code> steht MSH-2 an erster Stelle, alles ist um eins verschoben.",
    fix: "Zählen Sie bei MSH anders als bei anderen Segmenten oder verwenden Sie eine Bibliothek, die das kennt. Der Viewer zählt korrekt.",
    msgs: [] },
  { id: "segmente-fehlen", h: "Erwartete Segmente fehlen",
    sym: "Eine ORU-Nachricht ohne OBX oder eine ADT ohne EVN.",
    why: "Der Nachrichtentyp in MSH-9 legt fest, welche Segmente üblich oder erforderlich sind. Ein Export kann sie weglassen.",
    fix: "Der Viewer weist auf fehlende, üblicherweise erwartete Segmente hin. Er prüft aber nicht die genaue Reihenfolge und nicht die Spezifikation einer Version.",
    msgs: [msg(B, "missing-seg")] },
  { id: "trennzeichen", h: "Ungewöhnliche Trennzeichen",
    sym: "Die Felder werden von einem Semikolon oder Tabulator getrennt.",
    why: "Die Trennzeichen stehen in MSH-1 und MSH-2 und dürfen vom Üblichen abweichen. Ein Empfänger, der <code>|</code> fest voraussetzt, scheitert.",
    fix: "Der Viewer liest die Zeichen aus dem MSH und nennt sie.",
    msgs: [msg("MSH;^~\\&;A;B;C;D;20260101;;ADT^A01;X1;P;2.5\rPID;1;;123;;Muster^Max", "nonstd-sep")] },
];

const sectionHtml = (s) => `<section aria-labelledby="${s.id}">
<h2 id="${s.id}">${s.h}</h2>
<dl class="fx"><dt>Symptom</dt><dd>${s.sym}</dd><dt>Ursache</dt><dd>${s.why}</dd><dt>Lösung</dt><dd>${s.fix}</dd></dl>
${s.msgs.length ? `<p class="small muted">Meldung des Viewers:</p>${s.msgs.map(quote).join("")}` : ""}
</section>`;

const faq = [
  ["Warum meldet der Viewer eine Warnung, obwohl meine Nachricht funktioniert?", "Die Hinweise vergleichen mit üblicher Praxis, nicht mit Ihrem Schnittstellenprofil. Ein Feld, das im Standard oft gefüllt ist, kann bei Ihnen leer bleiben dürfen. Die Warnung ist ein Hinweis zum Nachsehen, kein Urteil."],
  ["Prüft der Viewer, ob eine Nachricht HL7-konform ist?", "Nein. Er liest und zeigt an und weist auf auffällige Stellen hin. Er prüft nicht gegen die Spezifikation einer Version und nicht gegen ein Profil. Eine bestandene Ansicht ist keine Konformitätsaussage."],
  ["Wie finde ich einen Fehler in einer Nachricht?", `Laden Sie sie in den Viewer und lesen Sie zuerst die Hinweise. Danach prüfen Sie MSH-9 und MSH-12, die Zeitstempel und die Felder, die zum Segment passen. Das <a href="${url("")}#beispiel=fehlerhaft">Testbeispiel mit Fehlern</a> zeigt die Meldungen im Viewer.`],
];

const flexSentence = SITE.flexchange.enabled
  ? `<p>Wer Verwaltungssysteme (PVS, AIS, KIS) mit E-Health-Plattformen verbinden will, kann sich Anbieter solcher Schnittstellenplattformen ansehen, etwa die <a href="${SITE.flexchange.url}">FLX Suite</a> von FleXChange-Medical. Dieser Viewer ersetzt keine Schnittstelle.</p>`
  : "";

export default {
  path: "hl7-fehler/",
  title: "Häufige HL7-Fehler: Zeilenumbrüche, Datum, Zeichensatz",
  description: "Häufige Fehler in HL7-v2-Nachrichten finden: Zeilenumbrüche, MLLP-Zeichen, Datumsformat, Dezimalkomma, Umlaute und MSH-Zählung, mit Viewer-Meldungen.",
  h1: "Häufige Fehler in HL7-v2-Nachrichten",
  crumb: "Häufige Fehler",
  keywords: "HL7 Fehler, HL7 Nachricht Fehler finden, HL7 Datumsformat, HL7 MLLP, HL7 Zeichensatz Umlaute, HL7 Zeilenumbruch",
  faq,
  body: `
<p class="lead"><strong>Die meisten Probleme mit HL7-v2-Nachrichten sind Formatfehler: falsche Zeilenenden, Datumsformate, Dezimalkomma, Zeichensatz oder unmaskierte Trennzeichen.</strong> Diese Seite nennt zu jedem Fehler Symptom, Ursache und Lösung. Die Meldungen sind die Originaltexte, die der Viewer ausgibt.</p>
<p>${openLink("fehlerhaft", "Testfall mit Fehlern im Viewer öffnen")}</p>
${sections.map(sectionHtml).join("\n")}
<h2 id="grenzen">Was der Viewer nicht findet</h2>
<ul class="limits">
<li>Inhaltliche Fehler, zum Beispiel ein falscher Code oder ein falscher Patient. Er kennt Ihre Daten nicht.</li>
<li>Verstöße gegen ein Schnittstellenprofil oder gegen die Regeln einer HL7-Version.</li>
<li>Unmaskierte Trennzeichen im Freitext, weil sie gültige Syntax sind.</li>
<li>Fehler in Z-Segmenten und in Feldern, die die eigene Feldliste nicht kennt.</li>
</ul>
${flexSentence}
<h2 id="faq-fehler">Kurz beantwortet</h2>
${faqHtml(faq)}
<p><a href="${url("hl7-nachricht-aufbau/")}">Aufbau einer Nachricht</a> · <a href="${url("hl7-segmente/")}">Segmente</a> · <a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen</a></p>
${tools()}`,
};
