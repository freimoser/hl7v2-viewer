import { url, esc, openLink, tools } from "../lib/layout.mjs";
import { preLines, filledFieldsTable, faqHtml } from "../lib/ann.mjs";
import { getExample } from "../../src/assets/js/core/examples.js";
import { TYPE_GROUPS, TRIGGERS } from "../../src/assets/js/core/messages.js";

const base = "hl7-nachrichtentypen/";
const EX = { "ADT^A01": "adt-a01", "ADT^A04": "adt-a04", "ADT^A08": "adt-a08", "ORU^R01": "oru-r01", "ORM^O01": "orm-o01", "MDM^T02": "mdm-t02", "SIU^S12": "siu-s12" };
const DETAIL = { "ADT^A01": "adt-a01/", "ADT^A08": "adt-a08/", "ORU^R01": "oru-r01/", "ORM^O01": "orm-o01/" };
const ORM_NOTE = `<p>Zur Einordnung: Neuere Versionen nutzen für Aufträge üblicherweise die spezialisierten Nachrichten <code>OML</code> (Laborauftrag) und <code>OMG</code> (allgemeiner klinischer Auftrag). ORM^O01 ist in älteren Schnittstellen üblich und weit verbreitet. Welche Variante gilt, steht in der Schnittstellenbeschreibung.</p>`;
const GROUP_ORDER = ["ADT", "ORM", "ORR", "OML", "OMG", "ORU", "MDM", "SIU", "DFT", "BAR", "VXU", "ACK"];

const groupTable = (code) => {
  const rows = Object.entries(TRIGGERS).filter(([k]) => k.startsWith(code + "^")).map(([k, [n, d]]) => {
    const det = DETAIL[k] ? `<a href="${url(base + DETAIL[k])}">${esc(k)}</a>` : `<code>${esc(k)}</code>`;
    const ex = EX[k] ? `<a href="${url("")}#beispiel=${EX[k]}">Beispiel</a>` : "";
    return `<tr><td class="mono">${det}</td><td>${esc(n)}</td><td>${esc(d)}</td><td>${ex}</td></tr>`;
  });
  if (!rows.length) return "";
  return `<div class="tbl-wrap"><table><thead><tr><th>MSH-9</th><th>Ereignis</th><th>Bedeutung</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
};

const faqTypen = [
  ["Was steht in MSH-9?", "Der Nachrichtentyp in drei Komponenten: Nachrichtencode (zum Beispiel ADT), Auslöseereignis (A01) und Nachrichtenstruktur (ADT_A01). Mehrere Auslöseereignisse teilen sich häufig eine Struktur: Im Beispiel dieser Seite hat auch die ambulante Registrierung ADT^A04 die Struktur ADT_A01. Ältere Nachrichten lassen die dritte Komponente oft weg."],
  ["Wie unterscheiden sich ADT^A01 und ADT^A04?", `A01 meldet eine stationäre Aufnahme, A04 die Registrierung zu einem Besuch, etwa ambulant. Der Aufbau ist ähnlich. Unterschiede zeigen sich vor allem in PV1-2 (Patientenklasse: <code>I</code> stationär, <code>O</code> ambulant). Beide Beispiele finden Sie im <a href="${url("")}#beispiel=adt-a04">Viewer</a>.`],
  ["Wofür steht ORU^R01?", "Für die Übermittlung von Beobachtungsergebnissen ohne vorherige Abfrage, in der Praxis meist Laborbefunde. OBR beschreibt die Untersuchung, jedes OBX liefert einen Einzelwert."],
];

const overview = {
  path: base,
  title: "HL7-Nachrichtentypen: ADT, ORM, ORU, MDM im Überblick",
  description: "HL7-v2-Nachrichtentypen im Überblick: ADT, ORM, ORU, MDM, SIU, DFT und ACK mit Auslöseereignissen wie A01, A08, R01 und O01, je mit Beispiel.",
  h1: "HL7-Nachrichtentypen im Überblick",
  crumb: "Nachrichtentypen",
  keywords: "HL7 Nachrichtentypen, HL7 ADT A01, HL7 ORU R01, HL7 ORM O01, HL7 message types, MSH-9, HL7 Trigger Events",
  faq: faqTypen,
  body: `
<p class="lead"><strong>Der Nachrichtentyp einer HL7-v2-Nachricht steht in MSH-9, zum Beispiel <code>ADT^A01^ADT_A01</code>.</strong> Er besteht aus dem Nachrichtencode (ADT), dem Auslöseereignis (A01) und der Nachrichtenstruktur (ADT_A01). Der Code sagt, um welche Art von Information es geht, das Ereignis, was passiert ist.</p>
<p>Die Tabellen zeigen eine Auswahl häufiger Typen. Sie sind nicht vollständig, und welche davon ein System nutzt, legt die jeweilige Schnittstellenbeschreibung fest. Vier Typen haben eine eigene Seite mit Beispiel, Feldtabelle und Hinweisen: <a href="${url(base + "adt-a01/")}">ADT^A01</a>, <a href="${url(base + "adt-a08/")}">ADT^A08</a>, <a href="${url(base + "oru-r01/")}">ORU^R01</a> und <a href="${url(base + "orm-o01/")}">ORM^O01</a>.</p>
<p>Der Viewer zeigt für jede Nachricht den erkannten Typ mit einer Kurzerklärung an und weist auf Segmente hin, die bei diesem Typ üblicherweise vorkommen. Das ist ein Hinweis und keine Prüfung gegen die Spezifikation.</p>
${GROUP_ORDER.map((g) => `<h2 id="${g.toLowerCase()}">${g} – ${esc(TYPE_GROUPS[g].name)}</h2><p>${esc(TYPE_GROUPS[g].desc)}</p>${g === "ACK" ? ackText() : groupTable(g)}${g === "ORM" ? ORM_NOTE : ""}`).join("\n")}
<h2 id="struktur">Mehrere Ereignisse, eine Struktur</h2>
<p>Die dritte Komponente von MSH-9 benennt die Segmentstruktur. Viele Ereignisse einer Gruppe teilen sie: A01 und A04 sind im Beispiel beide <code>ADT_A01</code>. Daher sehen sich Nachrichten verschiedener Ereignisse oft ähnlich, und die Bedeutung steckt im Ereigniscode, im Inhalt von PV1 und im Kontext. Verlassen Sie sich nicht auf die Struktur allein.</p>
<h2 id="faq-typen">Kurz beantwortet</h2>
${faqHtml(faqTypen)}
${tools()}`,
};

function ackText() {
  return `<p>Eine ACK-Nachricht enthält ein MSA-Segment. MSA-1 trägt den Bestätigungscode (<code>AA</code> angenommen, <code>AE</code> Fehler, <code>AR</code> abgelehnt), MSA-2 die Kontroll-ID (MSH-10) der Nachricht, auf die sich die Antwort bezieht. Bei Fehlern erklärt ein ERR-Segment, was nicht stimmte. <a href="${url("")}#beispiel=ack-fehler">Beispiel mit Fehlercode im Viewer öffnen</a>.</p>`;
}

function typePage({ id, key, title, h1, description, lead, rows, bullets, extra = "", faq, also }) {
  const ex = getExample(id);
  return {
    path: base + id.replace("-", "-") + "/",
    title, description, h1,
    crumbs: [["Nachrichtentypen", base]],
    crumb: key,
    keywords: `HL7 ${key.replace("^", " ")}, HL7 ${key} Beispiel, HL7 ${key.split("^")[0]} Nachricht, HL7 v2 Beispiel`,
    faq,
    body: `
<p class="lead">${lead}</p>
<p>${openLink(id)} <a class="btn" href="${url("beispiele/" + ex.file)}" download>${esc(ex.file)}</a></p>
<h2 id="beispiel">Beispielnachricht</h2>
<p>${esc(ex.note)} Alle Daten sind frei erfunden.</p>
${preLines(ex.text)}
<h2 id="felder">Feld für Feld</h2>
<p>Alle gefüllten Felder des Beispiels mit den Namen aus der Feldliste des Viewers. Die Liste ist eine Auswahl, unbekannte Felder fehlen oder heißen „Feld n“.</p>
${filledFieldsTable(ex)}
<h2 id="achten">Worauf Sie achten sollten</h2>
<ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
${extra}
<h2 id="mehr">Weiterlesen</h2>
<ul>${also.map(([p, t]) => `<li><a href="${url(p)}">${esc(t)}</a></li>`).join("")}</ul>`,
  };
}

const alsoStd = [[base, "Nachrichtentypen im Überblick"], ["hl7-nachricht-aufbau/", "Aufbau einer HL7-v2-Nachricht"], ["hl7-fehler/", "Häufige Fehler"]];

const a01 = typePage({
  id: "adt-a01", key: "ADT^A01",
  title: "HL7 ADT^A01 Beispiel: Aufnahme-Nachricht erklärt",
  h1: "HL7 ADT^A01: Aufnahme-Nachricht mit Beispiel",
  description: "ADT^A01 meldet eine stationäre Aufnahme. Beispielnachricht mit MSH, EVN, PID, PV1, Feld für Feld erklärt, plus typische Stolperstellen.",
  lead: "<strong>ADT^A01 meldet, dass ein Patient stationär aufgenommen wurde.</strong> Die Nachricht trägt Patientenstammdaten (PID) und Aufenthaltsdaten (PV1) vom aufnehmenden System an Empfänger wie Labor, Radiologie oder Abrechnung. ADT steht für Admission, Discharge, Transfer.",
  bullets: [
    "<strong>Pflichtsegmente:</strong> Bei der Struktur ADT_A01 sind üblicherweise MSH, EVN, PID und PV1 vorgesehen. NK1 (Angehörige), DG1 (Diagnose), AL1 (Allergie) und IN1 (Versicherung) sind optional und wiederholbar. Welche Felder gefüllt sein müssen, bestimmt das Schnittstellenprofil.",
    "<strong>Drei Zeitstempel:</strong> MSH-7 ist der Zeitpunkt der Nachrichtenerstellung, EVN-2 der Zeitpunkt der Erfassung, EVN-6 der Zeitpunkt, zu dem das Ereignis stattgefunden hat, und PV1-44 der Aufnahmezeitpunkt. Sie können unterschiedlich sein, etwa bei Nacherfassung.",
    "<strong>PV1-2 Patientenklasse:</strong> <code>I</code> stationär, <code>O</code> ambulant, <code>E</code> Notfall, <code>P</code> Voranmeldung. Weitere Codes und lokale Erweiterungen sind möglich.",
    "<strong>PV1-3 Aufenthaltsort:</strong> Komponenten Station ^ Zimmer ^ Bett ^ Einrichtung. Im Beispiel <code>CHI^201^2^KLINIKUM_TEST</code>. Was in „Station“ steht (Kürzel, Nummer), ist lokal vereinbart.",
    "<strong>Mehrere Kennungen:</strong> PID-3 enthält zwei Wiederholungen, getrennt durch <code>~</code>: eine Patientenkennung (<code>MR</code>) und eine Fallnummer (<code>VN</code>). Die Kennung allein ist ohne die vergebende Stelle in PID-3.4 nicht eindeutig.",
    "<strong>Fallnummer:</strong> Die Besuchsnummer steht in PV1-19. Im Beispiel taucht sie zusätzlich in PID-3 auf. Das ist eine Eigenheit des Beispiels, kein Standard.",
    "<strong>Unterschied zu A04:</strong> ADT^A04 meldet die Registrierung zu einem Besuch, im Beispiel ambulant (PV1-2 = <code>O</code>). Der Aufbau ist ähnlich, die Struktur im Beispiel ebenfalls <code>ADT_A01</code>. <a href=\"" + url("") + "#beispiel=adt-a04\">A04-Beispiel öffnen</a>.",
  ],
  faq: [
    ["Was bedeutet ADT^A01?", "ADT^A01 ist eine Nachricht der Patientenverwaltung, die eine stationäre Aufnahme meldet. ADT steht für Admission, Discharge, Transfer, A01 ist das Auslöseereignis „Aufnahme“."],
    ["Welche Segmente enthält eine ADT^A01-Nachricht?", "Üblich sind MSH, EVN, PID und PV1, dazu optional unter anderem NK1, DG1, AL1 und IN1. Die genaue Struktur legt die verwendete HL7-Version und das Schnittstellenprofil fest."],
  ],
  also: [...alsoStd, [base + "adt-a08/", "ADT^A08: Änderung von Patientendaten"], ["hl7-segmente/pv1/", "Das PV1-Segment"]],
});

const a08 = typePage({
  id: "adt-a08", key: "ADT^A08",
  title: "HL7 ADT^A08 Beispiel: Patientendaten ändern",
  h1: "HL7 ADT^A08: Änderung von Patientendaten mit Beispiel",
  description: "ADT^A08 meldet geänderte Patienten- oder Aufenthaltsdaten. Beispiel mit zwei Namen, Escape-Sequenz und Z-Segment, Feld für Feld erklärt.",
  lead: "<strong>ADT^A08 meldet, dass sich Patienten- oder Aufenthaltsdaten geändert haben, ohne dass ein anderes Ereignis wie Verlegung oder Entlassung vorliegt.</strong> Typisch sind Adress- oder Kontaktänderungen und Korrekturen. Empfänger gleichen die Daten mit ihrem Bestand ab.",
  bullets: [
    "<strong>Ereignisgrund:</strong> EVN-4 trägt im Beispiel <code>ADRCHG</code>. Das ist ein frei gewählter Code des Beispiels, der den Grund der Änderung nennt. Welche Codes ein System verwendet, steht in dessen Schnittstellenbeschreibung.",
    "<strong>Alles oder nur das Geänderte?</strong> Viele Systeme senden bei A08 den vollständigen aktuellen Stand der Segmente, nicht nur die Änderung. Das ist eine Vereinbarung, der Standard erzwingt es nicht. Nach der Konvention des Standards heißt ein leeres Feld „keine Information“, der Nullwert <code>\"\"</code> dagegen „Wert löschen“. Ob der Empfänger das so umsetzt, muss die Schnittstellenbeschreibung klären.",
    "<strong>Mehrere Namen:</strong> PID-5 hat im Beispiel zwei Wiederholungen: den Rechtsnamen (Namensart <code>L</code>) und eine Schreibvariante als Alias (<code>A</code>). Wer nur die erste Wiederholung liest, übersieht den Alias.",
    "<strong>Escape-Sequenz:</strong> Die Straße steht als <code>Teststraße 12 \\T\\ 14</code>. <code>\\T\\</code> ist die Maskierung des Zeichens <code>&amp;</code>. Würde dort ein nacktes <code>&amp;</code> stehen, entstünden zusätzliche Subkomponenten.",
    "<strong>Z-Segment:</strong> <code>ZPI</code> am Ende ist eine lokale Erweiterung. Der Viewer zeigt es an, kann aber seine Felder nicht benennen.",
    "<strong>Abgrenzung:</strong> ADT^A31 aktualisiert die Daten einer Person im Patientenindex, ohne dass ein Besuch betroffen sein muss. Ob ein System A08 oder A31 sendet, hängt von seiner Rolle ab.",
  ],
  faq: [
    ["Was bedeutet ADT^A08?", "ADT^A08 meldet eine Änderung von Patienten- oder Aufenthaltsdaten. Es ist ein Auslöseereignis der ADT-Gruppe, das für Änderungen ohne eigenes Ereignis (wie Verlegung) verwendet wird."],
    ["Wie unterscheidet sich ein leeres Feld vom Nullwert?", "Ein leeres Feld (<code>||</code>) bedeutet keine Angabe, der Nullwert <code>\"\"</code> bedeutet, dass der vorhandene Wert gelöscht werden soll. Der Viewer zeigt beides getrennt an."],
  ],
  also: [...alsoStd, [base + "adt-a01/", "ADT^A01: Aufnahme"], ["hl7-segmente/pid/", "Das PID-Segment"]],
});

const oru = typePage({
  id: "oru-r01", key: "ORU^R01",
  title: "HL7 ORU^R01 Beispiel: Laborbefund mit OBR und OBX",
  h1: "HL7 ORU^R01: Laborbefund-Nachricht mit Beispiel",
  description: "ORU^R01 überträgt Ergebnisse, meist Laborbefunde. Beispiel mit OBR und OBX, OBX-2, OBX-8 und OBX-11 sowie Kommentar (NTE) Feld für Feld erklärt.",
  lead: "<strong>ORU^R01 überträgt Beobachtungsergebnisse, in der Praxis meist Laborbefunde, vom ausführenden System an den Empfänger, ohne dass dafür eine eigene Abfrage nötig ist.</strong> OBR beschreibt die Untersuchung, jedes OBX liefert einen Einzelwert.",
  bullets: [
    "<strong>Gruppierung:</strong> Jedes OBX gehört zum davor stehenden OBR. Beginnt ein neues OBR, beginnt eine neue Untersuchung. Ein NTE gehört zum Segment direkt davor, im Beispiel zum letzten OBX.",
    "<strong>OBX-2 Werttyp:</strong> Er bestimmt, wie OBX-5 zu lesen ist. Im Beispiel <code>NM</code> (Zahl) und <code>ST</code> (Text). Weitere Typen sind unter anderem <code>TX</code> (Freitext), <code>CWE</code> (codiert) und <code>ED</code> (eingebettetes Dokument).",
    "<strong>OBX-3 Beobachtungskennung:</strong> Code ^ Text ^ Codesystem. Im Beispiel ein lokales System (<code>LOKAL</code>). In der Praxis steht dort oft <code>LN</code> für LOINC. Ein lokaler Code ist nur im Absendersystem verständlich.",
    "<strong>Zahlen:</strong> Bei <code>NM</code> steht ein Dezimalpunkt (<code>5.9</code>), kein Komma. Einheit in OBX-6, Referenzbereich in OBX-7. Der Viewer warnt bei <code>5,9</code>.",
    "<strong>OBX-8 Kennzeichen:</strong> <code>N</code> normal, <code>H</code> hoch, <code>L</code> niedrig, <code>A</code> auffällig. Im Beispiel ist Kalium als <code>H</code> markiert. Der Viewer wertet das nicht medizinisch.",
    "<strong>Status:</strong> OBX-11 und OBR-25 tragen den Ergebnisstatus: <code>F</code> endgültig, <code>P</code> vorläufig, <code>C</code> korrigiert, <code>X</code> nicht durchführbar. Ein Korrekturbefund (<code>C</code>) ersetzt einen früheren Wert.",
    "<strong>Auftragsnummern:</strong> ORC-2/OBR-2 sind die Auftragsnummer des Anfordernden (<code>PL-5501</code>), ORC-3/OBR-3 die des Ausführenden (<code>FL-9901</code>). Damit ordnet der Empfänger den Befund dem Auftrag zu.",
    "<strong>Freitext:</strong> <code>\\.br\\</code> im NTE ist ein Zeilenumbruch. Eingebettete Dokumente (Typ <code>ED</code>) stehen oft als lange Base64-Zeichenkette in OBX-5, der Viewer zeigt sie als Text.",
    "Befunde im deutschen LDT-Format liest der <a href=\"https://freimoser.github.io/ldt-bdt-viewer/\">LDT-/BDT-Viewer</a>.",
  ],
  faq: [
    ["Was bedeutet ORU^R01?", "ORU^R01 ist eine Befund- bzw. Ergebnisnachricht („Observation Result, unsolicited“). Sie überträgt Ergebnisse ohne vorherige Abfrage, typischerweise vom Labor an das anfordernde System."],
    ["Was ist der Unterschied zwischen OBR und OBX?", "OBR ist der Kopf einer Untersuchung (was wurde angefordert, wann, welcher Status), OBX ist ein einzelner Ergebniswert mit Kennung, Wert, Einheit und Kennzeichen. Zu einem OBR gehören meist mehrere OBX."],
  ],
  also: [...alsoStd, [base + "orm-o01/", "ORM^O01: Auftrag"], ["hl7-segmente/obx/", "Das OBX-Segment"], ["hl7-segmente/obr/", "Das OBR-Segment"]],
});

const orm = typePage({
  id: "orm-o01", key: "ORM^O01",
  title: "HL7 ORM^O01 Beispiel: Auftrag mit ORC und OBR",
  h1: "HL7 ORM^O01: Auftragsnachricht mit Beispiel",
  description: "ORM^O01 überträgt einen Auftrag, etwa eine Laboranforderung. Beispiel mit ORC und OBR, Steuercode ORC-1 und Auftragsnummern Feld für Feld erklärt.",
  lead: "<strong>ORM^O01 überträgt einen Auftrag, zum Beispiel eine Laboranforderung, vom anfordernden an das ausführende System.</strong> ORC steuert den Auftrag, OBR beschreibt die angeforderte Untersuchung. Der Typ ist weiterhin verbreitet, auch wenn neuere Versionen mit OML^O21 und OMG^O19 spezialisierte Auftragsnachrichten bieten.",
  bullets: [
    "<strong>ORC-1 Steuercode:</strong> <code>NW</code> neuer Auftrag, <code>CA</code> Stornierung anfordern, <code>DC</code> Auftrag abbrechen, <code>XO</code> Änderung. Er entscheidet, was der Empfänger mit der Nachricht tun soll. Weitere Codes existieren, der Viewer erklärt eine Auswahl.",
    "<strong>Auftragsnummern:</strong> ORC-2 ist die Nummer des Anfordernden (<code>PL-5501</code>), ORC-3 die des Ausführenden. Im Auftrag ist ORC-3 leer, weil das Labor sie erst vergibt. Im späteren ORU sind beide gefüllt.",
    "<strong>Mehrere Aufträge:</strong> Die Beispielnachricht enthält zwei Paare aus ORC und OBR. Jedes Paar ist ein eigener Auftrag mit eigener Nummer.",
    "<strong>Zeiten:</strong> ORC-9 ist der Zeitpunkt der Auftragserfassung, OBR-7 der Entnahme- bzw. Beobachtungszeitpunkt.",
    "<strong>Anfordernder Arzt:</strong> Er steht in ORC-12 und oft zusätzlich in OBR-16. Beide sollten übereinstimmen. Abweichungen klären Sie mit dem Absender.",
    "<strong>Kommentar:</strong> NTE-2 gibt an, wer kommentiert: <code>P</code> der Anfordernde, <code>L</code> das ausführende System. Im Beispiel kommentiert der Anfordernde.",
    "<strong>Antwort:</strong> Der Empfänger bestätigt mit einem ACK oder, je nach Vereinbarung, mit ORR^O02. Das Ergebnis folgt später als <a href=\"" + url(base + "oru-r01/") + "\">ORU^R01</a>.",
  ],
  faq: [
    ["Was bedeutet ORM^O01?", "ORM^O01 ist eine allgemeine Auftragsnachricht („Order Message“). Je nach Steuercode in ORC-1 legt sie einen Auftrag an, ändert oder storniert ihn."],
    ["Was ist der Unterschied zwischen ORC und OBR?", "ORC enthält die allgemeinen Auftragsdaten und die Steuerung (Auftragsnummern, Status, Anfordernder), OBR beschreibt die konkrete Untersuchung. Beide stehen in der Regel als Paar."],
  ],
  also: [...alsoStd, [base + "oru-r01/", "ORU^R01: Befund"], ["hl7-segmente/obr/", "Das OBR-Segment"]],
});

export default [overview, a01, a08, oru, orm];
