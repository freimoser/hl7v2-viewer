/**
 * Eigene, frei erfundene Beispielnachrichten. Alle Namen, Nummern und Werte sind fiktiv.
 * Diese Daten stehen unter CC0 (siehe THIRD-PARTY-LICENSES). Die Codes (Werte in OBX-3 usw.) sind lokale Testcodes.
 */
const R = String.raw;
/** Baut ein Segment aus einer Feldnummer-Tabelle; MSH wird mit Feldnummer 2 = Kodierzeichen gebaut. */
function seg(id, fields) {
  const max = Math.max(...Object.keys(fields).map(Number));
  const out = [];
  if (id === "MSH") {
    out.push("MSH", R`^~\&`);
    for (let n = 3; n <= max; n++) out.push(fields[n] ?? "");
  } else {
    out.push(id);
    for (let n = 1; n <= max; n++) out.push(fields[n] ?? "");
  }
  return out.join("|");
}
const msh = (ts, type, id, extra = {}) => seg("MSH", { 3: "TESTKIS", 4: "KLINIKUM_TEST", 5: "TESTLIS", 6: "KLINIKUM_TEST", 7: ts, 9: type, 10: id, 11: "P", 12: "2.5.1", 15: "AL", 16: "NE", 18: "UNICODE UTF-8", ...extra });
const pidBernd = (extra = {}) => seg("PID", {
  1: "1", 3: "TEST-100234^^^KLINIKUM_TEST^MR~TEST-F-7781^^^KLINIKUM_TEST^VN", 5: "Beispielmann^Bernd^Karl^^^^L", 7: "19710305", 8: "M",
  11: "Teststraße 12^^Musterstadt^^99999^DE^H", 13: "^PRN^PH^^49^555^1234567~^NET^Internet^bernd@example.invalid", 18: "TEST-ACC-5001", ...extra,
});
const J = (lines) => lines.join("\r") + "\r";

export const EXAMPLES = [
  {
    id: "adt-a01", file: "adt-a01-aufnahme.hl7", label: "ADT^A01 Aufnahme", title: "Stationäre Aufnahme (ADT^A01)",
    note: "Zwei Kennungen in PID-3 (Wiederholung mit ~), Name mit Komponenten, Adresse, Telefon und E-Mail, dazu Angehöriger, Diagnose, Allergie und Versicherung.",
    text: J([
      msh("20261027083015", "ADT^A01^ADT_A01", "MSG-A01-0001"),
      seg("EVN", { 2: "20261027083012", 5: "SCHMIDT^Anna", 6: "20261027080000" }),
      pidBernd(),
      seg("NK1", { 1: "1", 2: "Beispielfrau^Berta", 3: "SPO^Ehepartnerin^LOKAL", 4: "Teststraße 12^^Musterstadt^^99999^DE", 5: "^PRN^PH^^49^555^7654321" }),
      seg("PV1", { 1: "1", 2: "I", 3: "CHI^201^2^KLINIKUM_TEST", 4: "R", 7: "1001^Musterarzt^Martin^^^Dr.", 8: "1002^Beispielärztin^Eva^^^Dr.", 10: "CHI", 17: "1001^Musterarzt^Martin^^^Dr.", 19: "TEST-F-7781", 44: "20261027080000" }),
      seg("DG1", { 1: "1", 3: "^Aufnahmediagnose (Testtext)^LOKAL", 6: "A" }),
      seg("AL1", { 1: "1", 2: "DA", 3: "^Testallergen^LOKAL", 4: "MO", 5: "Hautausschlag" }),
      seg("IN1", { 1: "1", 2: "TARIF-A^Testtarif A", 3: "KASSE-01", 4: "Testkasse Musterstadt", 12: "20260101", 13: "20261231", 36: "TEST-V-0001" }),
    ]),
  },
  {
    id: "adt-a04", file: "adt-a04-registrierung.hl7", label: "ADT^A04 Registrierung", title: "Ambulante Registrierung (ADT^A04)",
    note: "Gleiche Struktur wie A01, aber Patientenklasse O (ambulant), keine Station und kein Entlassungsbezug.",
    text: J([
      msh("20261027091500", "ADT^A04^ADT_A01", "MSG-A04-0002"),
      seg("EVN", { 2: "20261027091458", 6: "20261027091400" }),
      seg("PID", { 1: "1", 3: "TEST-100877^^^KLINIKUM_TEST^MR", 5: "Testfrau^Tina^Maria^^^^L", 7: "19880914", 8: "F", 11: "Probeweg 3^^Musterstadt^^99998^DE^H", 13: "^PRN^PH^^49^555^2223344" }),
      seg("PV1", { 1: "1", 2: "O", 3: "AMB^^^KLINIKUM_TEST", 7: "1003^Probemann^Paul^^^Dr.", 10: "ORT", 19: "TEST-F-7802", 44: "20261027091400" }),
    ]),
  },
  {
    id: "adt-a08", file: "adt-a08-aenderung.hl7", label: "ADT^A08 Änderung", title: "Änderung von Patientendaten (ADT^A08)",
    note: "Mehrere Namen (Rufname und Alias), Escape-Sequenz \\T\\ in der Straße, Ereignisgrund in EVN-4 und ein Z-Segment (ZPI) als lokale Erweiterung.",
    text: J([
      msh("20261028101010", "ADT^A08^ADT_A01", "MSG-A08-0003"),
      seg("EVN", { 2: "20261028101005", 4: "ADRCHG", 6: "20261028101000" }),
      pidBernd({ 5: "Beispielmann^Bernd^Karl^^^^L~Beispiel-Mann^B.^^^^^A", 11: R`Teststraße 12 \T\ 14^Hinterhaus^Musterstadt^^99999^DE^H` }),
      seg("PV1", { 1: "1", 2: "I", 3: "CHI^201^2^KLINIKUM_TEST", 7: "1001^Musterarzt^Martin^^^Dr.", 19: "TEST-F-7781", 44: "20261027080000" }),
      seg("ZPI", { 1: "1", 2: "KARTE-0815", 3: "Zusatzinfo nur lokal gültig" }),
    ]),
  },
  {
    id: "oru-r01", file: "oru-r01-labor.hl7", label: "ORU^R01 Laborbefund", title: "Laborbefund (ORU^R01)",
    note: "OBR als Kopf, vier OBX-Zeilen mit Zahlenwert, Einheit, Referenzbereich und Abnormal-Kennzeichen; Kommentar in NTE mit Zeilenumbruch (\\.br\\).",
    text: J([
      seg("MSH", { 3: "TESTLIS", 4: "KLINIKUM_TEST", 5: "TESTKIS", 6: "KLINIKUM_TEST", 7: "20261027113045", 9: "ORU^R01^ORU_R01", 10: "MSG-R01-0004", 11: "P", 12: "2.5.1", 18: "UNICODE UTF-8" }),
      seg("PID", { 1: "1", 3: "TEST-100234^^^KLINIKUM_TEST^MR", 5: "Beispielmann^Bernd^Karl", 7: "19710305", 8: "M" }),
      seg("PV1", { 1: "1", 2: "I", 3: "CHI^201^2^KLINIKUM_TEST", 19: "TEST-F-7781" }),
      seg("ORC", { 1: "RE", 2: "PL-5501^TESTKIS", 3: "FL-9901^TESTLIS", 5: "CM", 9: "20261027113000" }),
      seg("OBR", { 1: "1", 2: "PL-5501^TESTKIS", 3: "FL-9901^TESTLIS", 4: "ELYT^Elektrolyte (Testpanel)^LOKAL", 7: "20261027090000", 22: "20261027113000", 25: "F" }),
      seg("OBX", { 1: "1", 2: "NM", 3: "NA^Natrium^LOKAL", 5: "139", 6: "mmol/L", 7: "135-145", 8: "N", 11: "F", 14: "20261027090000" }),
      seg("OBX", { 1: "2", 2: "NM", 3: "K^Kalium^LOKAL", 5: "5.9", 6: "mmol/L", 7: "3.5-5.1", 8: "H", 11: "F", 14: "20261027090000" }),
      seg("OBX", { 1: "3", 2: "NM", 3: "CL^Chlorid^LOKAL", 5: "101", 6: "mmol/L", 7: "98-107", 8: "N", 11: "F", 14: "20261027090000" }),
      seg("OBX", { 1: "4", 2: "ST", 3: "HEM^Hämolyse^LOKAL", 5: "nicht erkennbar", 11: "F" }),
      seg("NTE", { 1: "1", 2: "L", 3: R`Kaliumwert auffällig.\.br\Kontrolle mit neuer Probe empfohlen (Testdaten).` }),
    ]),
  },
  {
    id: "orm-o01", file: "orm-o01-auftrag.hl7", label: "ORM^O01 Auftrag", title: "Laborauftrag (ORM^O01)",
    note: "Zwei Aufträge in einer Nachricht: je ein ORC (Steuerung NW) mit zugehörigem OBR. Die Placer-Nummer vergibt das anfordernde System.",
    text: J([
      msh("20261027084000", "ORM^O01^ORM_O01", "MSG-O01-0005"),
      seg("PID", { 1: "1", 3: "TEST-100234^^^KLINIKUM_TEST^MR", 5: "Beispielmann^Bernd^Karl", 7: "19710305", 8: "M" }),
      seg("PV1", { 1: "1", 2: "I", 3: "CHI^201^2^KLINIKUM_TEST", 19: "TEST-F-7781" }),
      seg("ORC", { 1: "NW", 2: "PL-5501^TESTKIS", 9: "20261027083900", 12: "1001^Musterarzt^Martin^^^Dr." }),
      seg("OBR", { 1: "1", 2: "PL-5501^TESTKIS", 4: "ELYT^Elektrolyte (Testpanel)^LOKAL", 7: "20261027090000", 16: "1001^Musterarzt^Martin^^^Dr." }),
      seg("ORC", { 1: "NW", 2: "PL-5502^TESTKIS", 9: "20261027083900", 12: "1001^Musterarzt^Martin^^^Dr." }),
      seg("OBR", { 1: "2", 2: "PL-5502^TESTKIS", 4: "BB^Blutbild (Testpanel)^LOKAL", 7: "20261027090000", 16: "1001^Musterarzt^Martin^^^Dr." }),
      seg("NTE", { 1: "1", 2: "P", 3: "Nüchtern abgenommen (Testkommentar)" }),
    ]),
  },
  {
    id: "mdm-t02", file: "mdm-t02-dokument.hl7", label: "MDM^T02 Dokument", title: "Dokument mit Inhalt (MDM^T02)",
    note: "TXA beschreibt das Dokument, der Text steht in OBX-Segmenten vom Typ TX; Zeilenumbrüche im Text sind als \\.br\\ kodiert.",
    text: J([
      msh("20261027140500", "MDM^T02^MDM_T02", "MSG-T02-0006"),
      seg("EVN", { 2: "20261027140450" }),
      seg("PID", { 1: "1", 3: "TEST-100877^^^KLINIKUM_TEST^MR", 5: "Testfrau^Tina^Maria", 7: "19880914", 8: "F" }),
      seg("PV1", { 1: "1", 2: "O", 19: "TEST-F-7802" }),
      seg("TXA", { 1: "1", 2: "BRIEF^Arztbrief (Testdokument)^LOKAL", 3: "TX", 4: "20261027133000", 6: "20261027140000", 9: "1003^Probemann^Paul^^^Dr.", 12: "DOK-7001^TESTKIS", 17: "AU", 19: "AV" }),
      seg("OBX", { 1: "1", 2: "TX", 3: "DOC^Dokumenttext^LOKAL", 5: R`Testbrief zur Ansicht.\.br\Dieser Text ist frei erfunden.`, 11: "F" }),
      seg("OBX", { 1: "2", 2: "TX", 3: "DOC^Dokumenttext^LOKAL", 5: R`Zweite Zeile mit Sonderzeichen: 5 \F\ 7, a \S\ b.`, 11: "F" }),
    ]),
  },
  {
    id: "siu-s12", file: "siu-s12-termin.hl7", label: "SIU^S12 Termin", title: "Neuer Termin (SIU^S12)",
    note: "SCH beschreibt den Termin, RGS und AIS die gebuchte Leistung mit Startzeit und Dauer. SCH-11 enthält Start- und Endzeit.",
    text: J([
      msh("20261029120000", "SIU^S12^SIU_S12", "MSG-S12-0007", { 3: "TESTTERMIN" }),
      seg("SCH", { 1: "TP-3301^TESTKIS", 2: "TB-4402^TESTTERMIN", 5: "AMB1^Ambulanz 1^LOKAL", 7: "KONTROLLE^Kontrolltermin^LOKAL", 8: "NORMAL^Normaltermin^LOKAL", 9: "30", 10: "min^Minuten^LOKAL", 11: "^^^20261110093000^20261110100000", 25: "BOOKED^Gebucht^LOKAL" }),
      seg("PID", { 1: "1", 3: "TEST-100877^^^KLINIKUM_TEST^MR", 5: "Testfrau^Tina^Maria", 7: "19880914", 8: "F", 13: "^PRN^PH^^49^555^2223344" }),
      seg("RGS", { 1: "1", 2: "A" }),
      seg("AIS", { 1: "1", 2: "A", 3: "SONO^Ultraschall (Test)^LOKAL", 4: "20261110093000", 7: "30", 8: "min^Minuten^LOKAL" }),
    ]),
  },
  {
    id: "ack-fehler", file: "ack-fehler.hl7", label: "ACK mit Fehler", title: "Bestätigung mit Fehlercode (ACK)",
    note: "Der Empfänger meldet AE (Fehler) zur Nachricht MSG-A01-0001. ERR nennt Ort und Grund: Das Geburtsdatum in PID-7 ließ sich nicht lesen.",
    text: J([
      seg("MSH", { 3: "TESTLIS", 4: "KLINIKUM_TEST", 5: "TESTKIS", 6: "KLINIKUM_TEST", 7: "20261027083016", 9: "ACK^A01^ACK", 10: "ACK-0001", 11: "P", 12: "2.5.1", 18: "UNICODE UTF-8" }),
      seg("MSA", { 1: "AE", 2: "MSG-A01-0001" }),
      seg("ERR", { 2: "PID^1^7", 3: "102^Data type error^HL70357", 4: "E", 8: "Geburtsdatum nicht lesbar (Testfall)" }),
    ]),
  },
];

/** Zusatzbeispiel für die Fehlererkennung: bewusst fehlerhaft, mit LF statt CR. */
export const BROKEN_EXAMPLE = {
  id: "fehlerhaft", file: "fehlerhaft.hl7", label: "Testfall mit Fehlern", title: "Absichtlich fehlerhafte Nachricht",
  note: "Enthält typische Fehler: Zeilenvorschub statt Wagenrücklauf, Geburtsdatum im deutschen Format, ISO-Datum, leere Pflichtfelder, Nullwert und Dezimalkomma.",
  text: [
    msh("20261027", "ADT^A08", "MSG-X-0008"),
    seg("PID", { 1: "1", 3: "", 5: "Beispielmann^Bernd", 7: "05.03.1971", 8: "M", 29: '""' }),
    seg("PV1", { 1: "1", 3: "CHI^201^2", 44: "2026-10-27" }),
    seg("OBX", { 1: "1", 2: "NM", 3: "K^Kalium^LOKAL", 5: "5,9", 6: "mmol/L" }),
  ].join("\n"),
};

export const ALL_EXAMPLES = [...EXAMPLES, BROKEN_EXAMPLE];
export function getExample(id) { return ALL_EXAMPLES.find((e) => e.id === id) || null; }
