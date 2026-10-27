import { url, esc, openLink } from "../lib/layout.mjs";
import { preLines, segmentFieldTable, SEGMENTS, faqHtml } from "../lib/ann.mjs";
import { getExample } from "../../src/assets/js/core/examples.js";

const base = "hl7-segmente/";
const DETAIL = ["msh", "pid", "pv1", "obr", "obx"];

const hub = {
  path: base,
  title: "HL7-Segmente erklärt: MSH, PID, PV1, OBR, OBX",
  description: "Die wichtigsten HL7-v2-Segmente MSH, PID, PV1, OBR und OBX: Aufgabe, wichtige Felder und typische Stolperstellen, mit Beispiel zum Öffnen im Viewer.",
  h1: "HL7-v2-Segmente erklärt",
  crumb: "Segmente",
  keywords: "HL7 Segmente, HL7 PID Segment Felder, HL7 MSH Segment, HL7 PV1, HL7 OBX, HL7 OBR, HL7 Segment Liste",
  body: `
<p class="lead"><strong>Ein Segment ist eine Zeile einer HL7-v2-Nachricht und beginnt mit einer dreistelligen Kennung wie MSH, PID oder OBX.</strong> Die Kennung bestimmt, welche Bedeutung die Felder der Zeile haben. Fünf Segmente haben eine eigene Seite mit Feldtabelle und Hinweisen; die übrigen sind unten kurz beschrieben.</p>
<div class="grid g3">
${DETAIL.map((d) => { const id = d.toUpperCase(); return `<div class="card"><h3><a href="${url(base + d + "/")}">${id} – ${esc(SEGMENTS[id].name)}</a></h3><p>${esc(SEGMENTS[id].desc)}</p></div>`; }).join("")}
</div>
<h2 id="liste">Segmente, die der Viewer beschreibt</h2>
<p>Die Liste ist eine Auswahl aus den gebräuchlichen Segmenten, in eigenen Worten formuliert. Jedes Segment, das hier fehlt, zeigt der Viewer trotzdem an: Die Felder heißen dann „Feld n“.</p>
<div class="tbl-wrap"><table><thead><tr><th>Kennung</th><th>Name</th><th>Aufgabe</th></tr></thead><tbody>
${Object.entries(SEGMENTS).map(([id, s]) => `<tr><td class="mono">${DETAIL.includes(id.toLowerCase()) ? `<a href="${url(base + id.toLowerCase() + "/")}">${id}</a>` : id}</td><td>${esc(s.name)}</td><td>${esc(s.desc)}</td></tr>`).join("")}
</tbody></table></div>
<p>Segmente mit einem <code>Z</code> am Anfang (ZPI, ZBE …) sind lokale Erweiterungen. Ihre Felder kann nur die Schnittstellenbeschreibung des Absenders erklären.</p>
<p><a href="${url("hl7-nachricht-aufbau/")}">Aufbau einer Nachricht</a> · <a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen</a> · <a href="${url("hl7-fehler/")}">Häufige Fehler</a></p>`,
};

function segPage({ id, exId, title, h1, description, lead, bullets, faq, note = "" }) {
  const ex = getExample(exId);
  return {
    path: base + id.toLowerCase() + "/",
    title, description, h1,
    crumbs: [["Segmente", base]],
    crumb: id,
    keywords: `HL7 ${id} Segment, HL7 ${id} Felder, HL7 ${id} Beispiel, ${SEGMENTS[id].name}`,
    faq,
    body: `
<p class="lead">${lead}</p>
<h2 id="beispiel">Beispielzeile</h2>
${preLines(ex.text, [id])}
<p>${openLink(exId, "Im Viewer öffnen")} <span class="muted small">Beispiel: ${esc(ex.title)}, frei erfunden</span></p>
<h2 id="felder">Felder, die der Viewer beschreibt</h2>
<p>Die Tabelle nennt die Felder dieses Segments aus der Feldliste des Viewers. Sie ist eine eigene Auswahl in eigenen Worten und <strong>nicht vollständig</strong>. Maßgeblich ist die Spezifikation der verwendeten Version und das Profil der beteiligten Systeme. Fett gesetzte Felder sind die, die am häufigsten gebraucht werden.</p>
${segmentFieldTable(id)}
<h2 id="stolpersteine">Stolpersteine</h2>
<ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
${note}
<h2 id="faq-seg">Kurz beantwortet</h2>
${faqHtml(faq)}
<p><a href="${url(base)}">Alle Segmente</a> · <a href="${url("hl7-nachrichtentypen/")}">Nachrichtentypen</a></p>`,
  };
}

const msh = segPage({
  id: "MSH", exId: "adt-a01",
  title: "HL7 MSH-Segment: Felder und Beispiel erklärt",
  h1: "MSH – der Nachrichtenkopf: Felder und Stolperstellen",
  description: "Das MSH-Segment steht am Anfang jeder HL7-v2-Nachricht: Trennzeichen, Absender, Nachrichtentyp MSH-9, Kontroll-ID MSH-10, Version MSH-12 und Zeichensatz.",
  lead: "<strong>MSH ist das erste Segment jeder HL7-v2-Nachricht.</strong> Es legt die Trennzeichen fest und nennt Absender, Empfänger, Zeitpunkt, Nachrichtentyp, Kontroll-ID und Version.",
  bullets: [
    "<strong>Zählung:</strong> Das Feldtrennzeichen hinter „MSH“ ist MSH-1, die Kodierzeichen sind MSH-2. Beim Zerlegen an <code>|</code> steht MSH-2 daher an erster Stelle. MSH-9 ist der Nachrichtentyp.",
    "<strong>MSH-9:</strong> Drei Komponenten: Code, Auslöseereignis, Struktur (<code>ADT^A01^ADT_A01</code>). Manche Nachrichten lassen die dritte weg. Der Code muss in Großbuchstaben stehen.",
    "<strong>MSH-10:</strong> Die Kontroll-ID soll eine Nachricht eindeutig kennzeichnen. Die Bestätigung (ACK) nennt sie in MSA-2, so ordnet der Absender sie zu.",
    "<strong>MSH-12:</strong> Die Version sagt, nach welchem Regelwerk die Nachricht aufgebaut sein soll. Der Viewer prüft nicht gegen die Regeln einer Version.",
    "<strong>MSH-7:</strong> Der Zeitstempel darf eine Zeitzone tragen (<code>+0100</code>). Fehlt sie, ist unklar, in welcher Zeit der Absender gerechnet hat.",
    "<strong>MSH-18:</strong> Der Zeichensatz (zum Beispiel <code>UNICODE UTF-8</code> oder <code>8859/1</code>) muss zur tatsächlichen Kodierung der Daten passen. Sonst erscheinen Umlaute als Ersatzzeichen. Der Viewer weist darauf hin und bietet beim Öffnen einer Datei die Wahl des Zeichensatzes.",
    "<strong>MSH-3 bis MSH-6:</strong> Namen von Sender und Empfänger sind frei vergeben. Schnittstellen-Software nutzt sie häufig zum Routen, deshalb müssen sie exakt zur Vereinbarung passen.",
    "<strong>MSH-11:</strong> <code>P</code> Produktion, <code>T</code> Training, <code>D</code> Debugging. Testnachrichten mit <code>P</code> sind ein klassischer Fehler.",
  ],
  faq: [
    ["Was steht im MSH-Segment?", "Trennzeichen (MSH-1, MSH-2), Absender und Empfänger (MSH-3 bis MSH-6), Zeitstempel (MSH-7), Nachrichtentyp (MSH-9), Kontroll-ID (MSH-10), Verarbeitungsart (MSH-11), Version (MSH-12) und Zeichensatz (MSH-18)."],
    ["Warum ist MSH-1 das Trennzeichen?", "Weil das Feldtrennzeichen direkt hinter „MSH“ steht und als erstes Feld zählt. Dadurch kann der Empfänger zuerst das Trennzeichen lesen und mit ihm den Rest zerlegen."],
  ],
});

const pid = segPage({
  id: "PID", exId: "adt-a01",
  title: "HL7 PID-Segment: Felder PID-3, PID-5, PID-7 erklärt",
  h1: "PID – Patientenidentifikation: Felder und Stolperstellen",
  description: "Das PID-Segment trägt die Patientenstammdaten einer HL7-v2-Nachricht: Kennungen PID-3, Name PID-5, Geburtsdatum, Geschlecht, Adresse und Telefon.",
  lead: "<strong>PID enthält die Stammdaten eines Patienten: Kennungen, Name, Geburtsdatum, Geschlecht, Adresse und Kontakt.</strong> Es ist das Segment mit den meisten personenbezogenen Daten. Geben Sie Nachrichten nur anonymisiert weiter, der Viewer bietet dafür eine <a href=\"" + url("") + "#anonymisieren\">Hilfe</a>.",
  bullets: [
    "<strong>PID-3 Kennungen:</strong> Das Feld ist wiederholbar (<code>~</code>) und vom Typ CX: Kennung (.1), vergebende Stelle (.4), Art (.5, zum Beispiel <code>MR</code>). Eine Kennung ohne Stelle ist nicht eindeutig. Ältere Nachrichten nutzen daneben PID-2 und PID-4, prüfen Sie, wo Ihr Absender die Kennung ablegt.",
    "<strong>PID-5 Name:</strong> Typ XPN: Nachname, Vorname, weitere Vornamen, Suffix, Präfix, Titel, Namensart (<code>L</code> Rechtsname, <code>A</code> Alias). Mehrere Namen stehen als Wiederholungen. In neueren Versionen ist die erste Komponente selbst aus Subkomponenten (<code>&amp;</code>) aufgebaut, zum Beispiel bei Namenszusätzen.",
    "<strong>PID-7 Geburtsdatum:</strong> Format <code>JJJJMMTT</code>, also <code>19710305</code>. Das Datum <code>05.03.1971</code> ist kein gültiger HL7-Zeitstempel, der Viewer meldet es.",
    "<strong>PID-8 Geschlecht:</strong> Üblich sind <code>M</code>, <code>F</code>, <code>O</code>, <code>U</code> sowie <code>A</code> und <code>N</code>. Nationale Profile und lokale Tabellen können andere oder zusätzliche Werte vorsehen.",
    "<strong>PID-11 Adresse:</strong> Typ XAD: Straße, Zusatz, Ort, Bundesland, PLZ, Land, Art (<code>H</code> Wohnadresse). Mehrere Adressen sind Wiederholungen.",
    "<strong>PID-13 Telefon:</strong> Typ XTN. Im Beispiel eine Telefonnummer in den Komponenten 5 bis 7 (Land, Vorwahl, Nummer) und eine E-Mail in Komponente 4. Die Belegung der XTN-Komponenten unterscheidet sich zwischen den Versionen, besonders vor 2.5.",
    "<strong>Umgang mit Daten:</strong> PID gehört zu den sensibelsten Segmenten. Der Viewer verarbeitet alles lokal, aber Sie sollten ohnehin keine Echtdaten in Testwerkzeuge kopieren.",
  ],
  faq: [
    ["Welche Felder hat das PID-Segment?", "Die wichtigsten sind PID-3 (Kennungen), PID-5 (Name), PID-7 (Geburtsdatum), PID-8 (Geschlecht), PID-11 (Adresse) und PID-13 (Telefon). Der Viewer listet sie auf dieser Seite mit Datentyp und Erklärung."],
    ["Wie steht eine Patientennummer im PID?", "In PID-3. Die erste Komponente ist die Nummer, die vierte die vergebende Stelle, die fünfte die Art der Kennung, zum Beispiel <code>MR</code> für eine Akten- bzw. Patientennummer."],
  ],
});

const pv1 = segPage({
  id: "PV1", exId: "adt-a01",
  title: "HL7 PV1-Segment: Patientenbesuch, PV1-2, PV1-3, PV1-19",
  h1: "PV1 – Patientenbesuch: Felder und Stolperstellen",
  description: "Das PV1-Segment beschreibt den Aufenthalt in HL7-v2-Nachrichten: Patientenklasse PV1-2, Aufenthaltsort PV1-3, Besuchsnummer PV1-19 und Zeiten.",
  lead: "<strong>PV1 beschreibt den Aufenthalt oder Besuch eines Patienten: Patientenklasse, Aufenthaltsort, behandelnde Ärzte, Besuchsnummer und Zeitpunkte.</strong> Es steht in ADT-Nachrichten üblicherweise direkt hinter PID.",
  bullets: [
    "<strong>PV1-2 Patientenklasse:</strong> <code>I</code> stationär, <code>O</code> ambulant, <code>E</code> Notfall, <code>P</code> Voranmeldung. Weitere Codes und lokale Werte sind möglich.",
    "<strong>PV1-3 Aufenthaltsort:</strong> Typ PL: Station ^ Zimmer ^ Bett ^ Einrichtung. Was in den Komponenten steht, ist lokal vereinbart.",
    "<strong>Ärzte:</strong> PV1-7 behandelnder, PV1-8 überweisender, PV1-9 beratender, PV1-17 aufnehmender Arzt. Typ XCN: Kennung, Nachname, Vorname, weitere Vornamen, Suffix, Titel (zum Beispiel <code>Dr.</code> in .6).",
    "<strong>PV1-19 Besuchsnummer:</strong> Die Fall- oder Besuchsnummer. Sie verbindet Nachrichten desselben Aufenthalts. Prüfen Sie, welche Kennung Ihr System als Fallnummer führt.",
    "<strong>Zeiten:</strong> PV1-44 ist der Aufnahmezeitpunkt, PV1-45 der Entlassungszeitpunkt. Bei einer Aufnahme ist PV1-45 leer, bei der Entlassung ist es gefüllt.",
    "<strong>Nicht überall gefüllt:</strong> In ORU- und ORM-Nachrichten steht oft nur eine Teilmenge der PV1-Felder (Aufenthaltsort, Besuchsnummer). Welche Felder Ihr System erwartet, steht im Schnittstellenprofil.",
  ],
  faq: [
    ["Was bedeutet PV1-2?", "PV1-2 ist die Patientenklasse: <code>I</code> für stationär, <code>O</code> für ambulant, <code>E</code> für Notfall, <code>P</code> für Voranmeldung. Weitere Werte sind möglich."],
    ["Wo steht die Fallnummer?", "In PV1-19 (Besuchsnummer). Manche Systeme legen sie zusätzlich in PID-3 mit der Kennungsart <code>VN</code> ab."],
  ],
});

const oru = getExample("oru-r01");
const obr = segPage({
  id: "OBR", exId: "oru-r01",
  title: "HL7 OBR-Segment: Untersuchung, OBR-4, OBR-7, OBR-25",
  h1: "OBR – Untersuchung: Felder und Stolperstellen",
  description: "Das OBR-Segment beschreibt in HL7-v2-Aufträgen und -Befunden die Untersuchung: Auftragsnummern, Leistungscode OBR-4, Zeitpunkte und Ergebnisstatus OBR-25.",
  lead: "<strong>OBR beschreibt eine Untersuchung: welche, für welchen Auftrag, wann und mit welchem Status.</strong> In ORM-Nachrichten steht es im Auftrag, in ORU-Nachrichten kündigt es die Ergebnisse (OBX) an, die darauf folgen.",
  bullets: [
    "<strong>OBR-2 und OBR-3:</strong> Auftragsnummer des Anfordernden und des Ausführenden, jeweils Nummer ^ Namensraum. Im Auftrag ist die zweite meist leer, im Befund sind beide gefüllt.",
    "<strong>OBR-4 Leistung:</strong> Code ^ Text ^ Codesystem der angeforderten bzw. durchgeführten Untersuchung. Ein lokaler Code (im Beispiel <code>LOKAL</code>) versteht nur das Absendersystem.",
    "<strong>OBR-7 und OBR-22:</strong> OBR-7 ist der Zeitpunkt der Entnahme bzw. Beobachtung, OBR-22 der Zeitpunkt des Berichts bzw. der letzten Statusänderung. Das sind zwei verschiedene Zeiten.",
    "<strong>OBR-25 Ergebnisstatus:</strong> <code>F</code> endgültig, <code>P</code> vorläufig, <code>C</code> korrigiert. Der Status der einzelnen Werte steht in OBX-11.",
    "<strong>OBR-16 und ORC-12:</strong> Beide können den anfordernden Arzt tragen. Sie sollten übereinstimmen.",
    "<strong>Gruppe:</strong> Alle OBX bis zum nächsten OBR gehören zu diesem OBR.",
  ],
  faq: [
    ["Wofür steht OBR?", "OBR ist das Segment „Observation Request“. Es beschreibt die Untersuchung hinter einem Auftrag oder Befund. Die einzelnen Ergebnisse stehen in folgenden OBX-Segmenten."],
    ["Was ist der Unterschied zwischen OBR-2 und OBR-3?", "OBR-2 trägt die Auftragsnummer des Anfordernden (Placer), OBR-3 die des Ausführenden (Filler), zum Beispiel des Labors."],
  ],
});

const obx = segPage({
  id: "OBX", exId: "oru-r01",
  title: "HL7 OBX-Segment: Ergebnis, OBX-2, OBX-5, OBX-8, OBX-11",
  h1: "OBX – Beobachtung und Messwert: Felder und Stolperstellen",
  description: "Das OBX-Segment liefert in HL7-v2-Befunden einen Ergebniswert: Werttyp OBX-2, Kennung OBX-3, Wert OBX-5, Kennzeichen OBX-8 und Status OBX-11.",
  lead: "<strong>OBX liefert einen einzelnen Wert eines Befunds, zum Beispiel ein Laborergebnis, mit Kennung, Wert, Einheit, Referenzbereich, Kennzeichen und Status.</strong> Ein Befund besteht meist aus mehreren OBX-Zeilen unter einem OBR.",
  bullets: [
    "<strong>OBX-2 Werttyp:</strong> Er bestimmt, wie OBX-5 zu lesen ist: <code>NM</code> Zahl, <code>ST</code> Text, <code>TX</code> Freitext, <code>CWE</code> codierter Wert, <code>DT</code>/<code>TS</code> Datum bzw. Zeit, <code>ED</code> eingebettetes Dokument.",
    "<strong>OBX-3 Kennung:</strong> Code ^ Text ^ Codesystem. Ohne Angabe des Codesystems (zum Beispiel <code>LN</code> für LOINC) ist ein Code nur im Absendersystem eindeutig.",
    "<strong>OBX-4:</strong> Die Unter-ID gruppiert zusammengehörige OBX-Zeilen, etwa bei mehrteiligen Ergebnissen.",
    "<strong>OBX-5 Wert:</strong> Bei <code>NM</code> nur Ziffern, Vorzeichen und Dezimalpunkt. Ein Dezimalkomma (<code>5,9</code>) ist ein häufiger Fehler. Das Feld darf mehrere Werte mit <code>~</code> tragen.",
    "<strong>OBX-6 bis OBX-8:</strong> Einheit, Referenzbereich und Kennzeichen (<code>N</code> normal, <code>H</code> hoch, <code>L</code> niedrig, <code>A</code> auffällig).",
    "<strong>OBX-11 Status:</strong> <code>F</code> endgültig, <code>P</code> vorläufig, <code>C</code> korrigiert, <code>X</code> nicht durchführbar. Ein Wert ohne Status ist für Empfänger schwer zu deuten.",
    "<strong>Freitext:</strong> Ein <code>|</code> im Text beendet das Feld, ein <code>&amp;</code> teilt die Komponente. Beides muss maskiert sein (<code>\\F\\</code>, <code>\\T\\</code>).",
    "<strong>NTE:</strong> Ein Kommentar-Segment steht direkt hinter dem OBX, auf das es sich bezieht.",
  ],
  faq: [
    ["Was bedeutet OBX in HL7?", "OBX („Observation/Result“) ist das Segment für einen einzelnen Ergebniswert in Befundnachrichten wie ORU^R01. Es enthält Kennung, Wert, Einheit, Kennzeichen und Status."],
    ["Warum zeigt der Viewer eine Warnung bei OBX-5?", "Wenn OBX-2 den Typ <code>NM</code> nennt, der Wert aber keine reine Zahl ist. Meist ist ein Dezimalkomma statt eines Punkts die Ursache."],
  ],
});

export default [hub, msh, pid, pv1, obr, obx];
