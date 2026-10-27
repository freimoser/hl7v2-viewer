// Einzige Quelle für die Seite quellen/ und die Datei quellen.md. Nur Seiten, die tatsächlich geöffnet wurden.
export const RETRIEVED = "27.10.2026";
export const SOURCES = [
  { topic: "Marken und Lizenz", doc: "FHIR-Spezifikation: Lizenzseite (License)", publisher: "HL7 International", url: "https://hl7.org/fhir/license.html",
    used: "Die Seite nennt HL7®, HEALTH LEVEL SEVEN® und FHIR® als Marken von Health Level Seven International. Grundlage für den Marken-Hinweis und die ausschließlich beschreibende Verwendung der Namen." },
  { topic: "Aufbau", doc: "„HL7“ (englische Wikipedia)", publisher: "Wikipedia-Autoren (CC BY-SA)", url: "https://en.wikipedia.org/wiki/Health_Level_7",
    used: "Version 2 (auch „Pipehat“) unterstützt Verwaltung, Aufträge und Ergebnisse im Krankenhaus; Segmente werden per Pipe in Felder, Felder in Komponenten geteilt; OBR ist in ORM- und ORU-Nachrichten ein erforderliches Segment." },
  { topic: "Praxis", doc: "„HL7“ (deutsche Wikipedia)", publisher: "Wikipedia-Autoren (CC BY-SA)", url: "https://de.wikipedia.org/wiki/Health_Level_7",
    used: "Version 2 ist textbasiert, nicht „Plug and Play“: Transportschichten wie MLLP und Parser sind verfügbar, die Verarbeitung von Nachrichten, Segmenten und Feldern ist applikationsspezifisch." },
  { topic: "Transport", doc: "„Minimal Lower Layer Protocol“ (englische Wikipedia)", publisher: "Wikipedia-Autoren (CC BY-SA)", url: "https://en.wikipedia.org/wiki/Minimal_Lower_Layer_Protocol",
    used: "MLLP überträgt Nachrichten über TCP, ergänzt Anfangs- und Endzeichen, weil TCP ein Bytestrom ist, und bringt keine eigene Verschlüsselung mit." },
  { topic: "Organisation", doc: "HL7 Deutschland: Startseite", publisher: "HL7 Deutschland e. V.", url: "https://www.hl7.de/",
    used: "Beleg, dass HL7 v2.x, CDA, V3 und FHIR zur HL7-Standardfamilie gehören (Verweis auf die deutsche Nutzerorganisation)." },
];
export const OWN = [
  "Feldlisten, Segmentnamen, Prüfhinweise und Erklärtexte sind eigene Formulierungen und kein Auszug aus einer HL7-Spezifikation. Soweit sie nicht auf den oben genannten Quellen beruhen, gilt: Aus der Praxis bekannt, nicht aus einer geöffneten Quelle belegt.",
  "Alle Beispielnachrichten sind frei erfunden. Namen, Nummern, Orte und Zeitpunkte sind Platzhalter.",
];
export const GAPS = [
  "Der Volltext der HL7-v2-Spezifikation (hl7.org) war beim Abruf nicht erreichbar und ist daher nicht belegt. Segmentaufbau, „üblich erwartete“ Segmente je Nachrichtentyp und Codetabellen sind deshalb als „üblich“ formuliert und nicht als Zitat der Spezifikation. Die Feldlisten gelten unabhängig von der Version nur als Orientierung.",
  "Die Steuerzeichen des MLLP-Rahmens (Hex 0B als Start, Hex 1C und 0D als Ende) sind in den geöffneten Quellen nicht ausdrücklich genannt. Aus der Praxis bekannt, nicht aus einer geöffneten Quelle belegt.",
  "Die deutsche Wikipedia hat keinen eigenen Artikel zu MLLP; die englische Seite wird als Beleg genutzt.",
  "Es gibt keine offizielle Prüfsuite für diese Werkzeuge. Der Viewer ist nicht gegen eine Referenzimplementierung getestet, nur gegen eigene Tests und eigene Beispiele.",
  "Es gibt keine belegten Aussagen zu Marktanteilen, zur Verbreitung bestimmter Versionen oder zu anderen Anbietern. Solche Aussagen stehen deshalb nirgends auf der Seite.",
];
export function quellenMd(base) {
  const rows = SOURCES.map((s) => `| ${s.topic} | ${s.doc} | ${s.publisher} | ${s.url} | ${s.used} |`).join("\n");
  return `# Quellen

Abrufdatum aller Quellen: **${RETRIEVED}**. Es sind nur Seiten aufgeführt, die tatsächlich geöffnet wurden. Die Webseite zeigt dieselbe Liste unter ${base}quellen/.

## Dokumente

| Thema | Dokument | Herausgeber | Link | Genutzt für |
|---|---|---|---|---|
${rows}

## Eigene Arbeit

${OWN.map((x) => `- ${x}`).join("\n")}

## Lücken (nicht verfügbar, nicht geraten)

${GAPS.map((x) => `- ${x}`).join("\n")}
`;
}
