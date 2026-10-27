/** Eigene Kurzerklärungen zu Nachrichtentypen und Auslöseereignissen. */
export const TYPE_GROUPS = {
  ADT: { name: "Patientenverwaltung (Admission, Discharge, Transfer)", desc: "Meldet Ereignisse rund um Patientenstammdaten und Aufenthalt: Aufnahme, Verlegung, Entlassung, Änderung von Daten." },
  ORM: { name: "Auftrag (Order Message)", desc: "Überträgt einen Auftrag, zum Beispiel eine Labor- oder Röntgenanforderung." },
  ORU: { name: "Befund (Observation Result, unsolicited)", desc: "Überträgt Ergebnisse oder Befunde, ohne dass dafür eine eigene Abfrage nötig ist." },
  ORR: { name: "Auftragsantwort", desc: "Antwort auf eine Auftragsnachricht (ORM)." },
  OML: { name: "Laborauftrag", desc: "Spezialisierte Auftragsnachricht für Laboraufträge in neueren Versionen." },
  OMG: { name: "Allgemeiner klinischer Auftrag", desc: "Spezialisierte Auftragsnachricht für allgemeine klinische Aufträge in neueren Versionen." },
  MDM: { name: "Dokumentenmanagement (Medical Document Management)", desc: "Meldet Dokumente und deren Status, optional mit dem Inhalt." },
  SIU: { name: "Terminverwaltung (Scheduling Information, unsolicited)", desc: "Meldet Termine: neu, geändert, abgesagt." },
  ACK: { name: "Bestätigung (Acknowledgment)", desc: "Antwort des Empfängers: Nachricht angenommen, mit Fehler oder abgelehnt." },
  DFT: { name: "Leistungserfassung (Detailed Financial Transaction)", desc: "Überträgt erbrachte Leistungen zur Abrechnung." },
  BAR: { name: "Abrechnungskonto (Billing Account Record)", desc: "Legt Abrechnungskonten an oder ändert sie." },
  VXU: { name: "Impfdaten", desc: "Meldet Impfinformationen eines Patienten." },
};

export const TRIGGERS = {
  "ADT^A01": ["Aufnahme (stationär)", "Ein Patient wird stationär aufgenommen. Typisch mit EVN, PID und PV1."],
  "ADT^A02": ["Verlegung", "Ein Patient wechselt Station oder Zimmer."],
  "ADT^A03": ["Entlassung", "Der Aufenthalt endet. PV1-45 trägt meist den Entlassungszeitpunkt."],
  "ADT^A04": ["Registrierung (ambulant / Besuch)", "Ein Patient wird für einen Besuch registriert, ohne stationär aufgenommen zu werden."],
  "ADT^A05": ["Voranmeldung", "Ein Patient wird für einen geplanten Aufenthalt angekündigt."],
  "ADT^A06": ["Wechsel ambulant → stationär", "Ein ambulanter Patient wird stationär aufgenommen."],
  "ADT^A07": ["Wechsel stationär → ambulant", "Ein stationärer Patient wird ambulant weiterbehandelt."],
  "ADT^A08": ["Änderung Patienten- oder Aufenthaltsdaten", "Daten haben sich geändert, ohne dass ein anderes Ereignis vorliegt, etwa Adresse oder Kontakt."],
  "ADT^A11": ["Aufnahme stornieren", "Eine zuvor gemeldete Aufnahme wird zurückgenommen."],
  "ADT^A12": ["Verlegung stornieren", "Eine zuvor gemeldete Verlegung wird zurückgenommen."],
  "ADT^A13": ["Entlassung stornieren", "Eine zuvor gemeldete Entlassung wird zurückgenommen."],
  "ADT^A28": ["Person anlegen", "Eine Person wird im Patientenindex angelegt."],
  "ADT^A31": ["Person aktualisieren", "Die Daten einer Person im Patientenindex ändern sich."],
  "ADT^A40": ["Patientenzusammenführung", "Zwei Patientenkennungen werden zu einer zusammengeführt."],
  "ORM^O01": ["Auftrag (allgemein)", "Ein Auftrag wird neu angelegt, geändert oder storniert, gesteuert über ORC-1."],
  "ORR^O02": ["Antwort auf einen Auftrag", "Der Empfänger bestätigt oder beantwortet einen ORM."],
  "OML^O21": ["Laborauftrag", "Auftragsnachricht für das Labor in neueren Versionen."],
  "OMG^O19": ["Allgemeiner klinischer Auftrag", "Auftragsnachricht für allgemeine Aufträge in neueren Versionen."],
  "ORU^R01": ["Befund / Ergebnisübermittlung", "Das ausführende System meldet Ergebnisse: OBR beschreibt die Untersuchung, OBX liefert die Einzelwerte."],
  "MDM^T01": ["Dokument melden (ohne Inhalt)", "Meldet, dass ein Dokument existiert."],
  "MDM^T02": ["Dokument melden (mit Inhalt)", "Meldet ein Dokument und liefert den Inhalt in OBX-Segmenten mit."],
  "MDM^T03": ["Dokumentstatus ändern (ohne Inhalt)", "Meldet eine Statusänderung."],
  "MDM^T04": ["Dokumentstatus ändern (mit Inhalt)", "Meldet eine Statusänderung samt Inhalt."],
  "SIU^S12": ["Neuer Termin", "Ein Termin wird im Terminbuch angelegt."],
  "SIU^S13": ["Termin verschoben", "Ein Termin wird auf einen neuen Zeitpunkt gelegt."],
  "SIU^S14": ["Termin geändert", "Termindaten ändern sich, ohne dass er verschoben wird."],
  "SIU^S15": ["Termin abgesagt", "Ein Termin wird storniert."],
  "SIU^S26": ["Patient nicht erschienen", "Der Patient ist nicht zum Termin erschienen."],
  "DFT^P03": ["Leistung erfassen", "Eine erbrachte Leistung wird zur Abrechnung gemeldet."],
  "BAR^P01": ["Abrechnungskonto anlegen", "Ein Konto für die Abrechnung wird angelegt."],
  "VXU^V04": ["Impfmeldung", "Eine Impfung wird unaufgefordert gemeldet."],
};

/** Übliche Segmentfolge je Nachricht (nur Hinweisgeber, kein Konformitätstest). */
export const EXPECTED = {
  ADT: { required: ["EVN", "PID"], usual: ["PV1"] },
  ORM: { required: ["ORC"], usual: ["PID", "OBR"] },
  ORU: { required: ["OBR", "OBX"], usual: ["PID"] },
  MDM: { required: ["EVN", "PID", "TXA"], usual: ["PV1"] },
  SIU: { required: ["SCH"], usual: ["PID", "RGS"] },
  ACK: { required: ["MSA"], usual: [] },
};

export function describeType(msg) {
  const key = `${msg.type.code}^${msg.type.trigger}`;
  const g = TYPE_GROUPS[msg.type.code];
  const t = TRIGGERS[key];
  return { key, group: g || null, trigger: t ? { name: t[0], desc: t[1] } : null };
}
