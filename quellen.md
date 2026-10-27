# Quellen

Abrufdatum aller Quellen: **27.10.2026**. Es sind nur Seiten aufgeführt, die tatsächlich geöffnet wurden. Die Webseite zeigt dieselbe Liste unter https://freimoser.github.io/hl7v2-viewer/quellen/.

## Dokumente

| Thema | Dokument | Herausgeber | Link | Genutzt für |
|---|---|---|---|---|
| Marken und Lizenz | FHIR-Spezifikation: Lizenzseite (License) | HL7 International | https://hl7.org/fhir/license.html | Die Seite nennt HL7®, HEALTH LEVEL SEVEN® und FHIR® als Marken von Health Level Seven International. Grundlage für den Marken-Hinweis und die ausschließlich beschreibende Verwendung der Namen. |
| Aufbau | „HL7“ (englische Wikipedia) | Wikipedia-Autoren (CC BY-SA) | https://en.wikipedia.org/wiki/Health_Level_7 | Version 2 (auch „Pipehat“) unterstützt Verwaltung, Aufträge und Ergebnisse im Krankenhaus; Segmente werden per Pipe in Felder, Felder in Komponenten geteilt; OBR ist in ORM- und ORU-Nachrichten ein erforderliches Segment. |
| Praxis | „HL7“ (deutsche Wikipedia) | Wikipedia-Autoren (CC BY-SA) | https://de.wikipedia.org/wiki/Health_Level_7 | Version 2 ist textbasiert, nicht „Plug and Play“: Transportschichten wie MLLP und Parser sind verfügbar, die Verarbeitung von Nachrichten, Segmenten und Feldern ist applikationsspezifisch. |
| Transport | „Minimal Lower Layer Protocol“ (englische Wikipedia) | Wikipedia-Autoren (CC BY-SA) | https://en.wikipedia.org/wiki/Minimal_Lower_Layer_Protocol | MLLP überträgt Nachrichten über TCP, ergänzt Anfangs- und Endzeichen, weil TCP ein Bytestrom ist, und bringt keine eigene Verschlüsselung mit. |
| Organisation | HL7 Deutschland: Startseite | HL7 Deutschland e. V. | https://www.hl7.de/ | Beleg, dass HL7 v2.x, CDA, V3 und FHIR zur HL7-Standardfamilie gehören (Verweis auf die deutsche Nutzerorganisation). |

## Eigene Arbeit

- Feldlisten, Segmentnamen, Beispielnachrichten, Prüfhinweise und Erklärtexte sind eigene Arbeit des Autors auf Grundlage seiner Erfahrung mit HL7-v2-Nachrichten. Sie sind kein Auszug aus einer HL7-Spezifikation.
- Alle Beispielnachrichten sind frei erfunden. Namen, Nummern, Orte und Zeitpunkte sind Platzhalter.

## Lücken (nicht verfügbar, nicht geraten)

- Der Volltext der HL7-v2-Spezifikation (hl7.org) war beim Abruf nicht erreichbar und ist daher nicht belegt. Segmentaufbau, „üblich erwartete“ Segmente je Nachrichtentyp und Codetabellen sind deshalb als „üblich“ formuliert und nicht als Zitat der Spezifikation. Die Feldlisten gelten unabhängig von der Version nur als Orientierung.
- Die Steuerzeichen des MLLP-Rahmens (Hex 0B als Start, Hex 1C und 0D als Ende) sind in den geöffneten Quellen nicht ausdrücklich genannt. Sie beruhen auf Fachwissen des Autors.
- Die deutsche Wikipedia hat keinen eigenen Artikel zu MLLP; die englische Seite wird als Beleg genutzt.
- Es gibt keine offizielle Prüfsuite für diese Werkzeuge. Der Viewer ist nicht gegen eine Referenzimplementierung getestet, nur gegen eigene Tests und eigene Beispiele.
- Es gibt keine belegten Aussagen zu Marktanteilen, zur Verbreitung bestimmter Versionen oder zu anderen Anbietern. Solche Aussagen stehen deshalb nirgends auf der Seite.
