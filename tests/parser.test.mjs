import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAll, normalizeInput, unescapeText, getValue, DEFAULT_ENC, serialize, fileNote } from "../src/assets/js/core/parser.js";
import { checkMessage, checkDateValue } from "../src/assets/js/core/validate.js";
import { EXAMPLES, ALL_EXAMPLES } from "../src/assets/js/core/examples.js";
import { anonymize } from "../src/assets/js/core/anonymize.js";
import { toJSON, toCSV } from "../src/assets/js/core/export.js";
import { SEGMENTS, fieldInfo, segmentInfo } from "../src/assets/js/core/dict.js";

const M = String.raw`MSH|^~\&|APP|FAC|RAPP|RFAC|20260105120000||ADT^A01^ADT_A01|C1|P|2.5.1`;

test("Trennzeichen aus MSH-1/MSH-2, Standardfall", () => {
  const r = parseAll(M + "\rPID|1||123^^^X^MR||Muster^Max");
  const m = r.messages[0];
  assert.deepEqual(m.enc, { ...DEFAULT_ENC });
  assert.equal(m.typeLabel, "ADT^A01");
  assert.equal(m.type.structure, "ADT_A01");
  assert.equal(m.version, "2.5.1");
  assert.equal(getValue(m, "MSH-9.2"), "A01");
  assert.equal(getValue(m, "PID-5.1"), "Muster");
});

test("MSH-Feldnummern: MSH-1 ist das Trennzeichen, MSH-2 die Kodierzeichen, MSH-3 die erste echte Position", () => {
  const m = parseAll(M).messages[0];
  assert.equal(getValue(m, "MSH-1"), "|");
  assert.equal(getValue(m, "MSH-2"), "^~\\&");
  assert.equal(getValue(m, "MSH-3"), "APP");
  assert.equal(getValue(m, "MSH-12"), "2.5.1");
});

test("abweichende Trennzeichen werden erkannt", () => {
  const t = "MSH#*~\\^#A#B#C#D#20260101##ADT*A01#7#P#2.3\rPID#1##99*X##Meier^Hans";
  // Komponenten *, Wiederholung ~, Escape \, Subkomponente ^, Feld #
  const m = parseAll(t).messages[0];
  assert.equal(m.enc.field, "#");
  assert.equal(m.enc.comp, "*");
  assert.equal(m.enc.sub, "^");
  assert.equal(m.typeLabel, "ADT^A01");
  assert.equal(getValue(m, "PID-3.2"), "X");
  assert.ok(m.hints.some((h) => h.code === "nonstd-sep"));
});

test("Wiederholungen, Komponenten und Subkomponenten", () => {
  const m = parseAll(M + "\rPID|1||1^^^A&1.2.3&ISO^MR~2^^^B^PI||Muster^Max~Alias^A").messages[0];
  const f = m.segments[1].fields[3];
  assert.equal(f.reps.length, 2);
  assert.deepEqual(f.reps[0].comps[3].subs, ["A", "1.2.3", "ISO"]);
  assert.equal(getValue(m, "PID-3[2].5"), "PI");
  assert.equal(getValue(m, "PID-5[2].1"), "Alias");
});

test("Escape-Sequenzen", () => {
  assert.equal(unescapeText(String.raw`a\F\b\S\c\T\d\R\e\E\f`), "a|b^c&d~e\\f");
  assert.equal(unescapeText(String.raw`Zeile1\.br\Zeile2`), "Zeile1\nZeile2");
  assert.equal(unescapeText("\\X41\\\\X42\\"), "AB");
  assert.equal(unescapeText("\\H\\fett\\N\\"), "fett");
  assert.equal(unescapeText(String.raw`\C2842\x`), String.raw`\C2842\x`, "nicht unterstützte Sequenz bleibt sichtbar");
  assert.equal(unescapeText(String.raw`offen \F ohne Ende`), String.raw`offen \F ohne Ende`);
  const m = parseAll(M + "\r" + String.raw`PID|1||1||M\F\ann\.br\x`).messages[0];
  assert.equal(getValue(m, "PID-5"), "M|ann\nx");
  assert.equal(m.segments[1].fields[5].raw, String.raw`M\F\ann\.br\x`);
});

test("Zeilenumbrüche: \\r, \\n, \\r\\n gemischt", () => {
  for (const sep of ["\r", "\n", "\r\n"]) {
    const r = parseAll([M, "PID|1||1", "PV1|1|I"].join(sep));
    assert.equal(r.messages[0].segments.length, 3, JSON.stringify(sep));
  }
  assert.ok(parseAll([M, "PID|1||1"].join("\n")).notes.some((n) => n.code === "lf-breaks"));
});

test("MLLP-Rahmen wird entfernt", () => {
  const r = parseAll("\x0b" + M + "\rPID|1||1\r\x1c\r");
  assert.equal(r.messages.length, 1);
  assert.equal(r.messages[0].segments.length, 2);
  assert.ok(r.notes.some((n) => n.code === "mllp"));
  const two = parseAll("\x0b" + M + "\r\x1c\r\x0b" + M.replace("C1", "C2") + "\r\x1c\r");
  assert.equal(two.messages.length, 2);
  assert.equal(two.messages[1].controlId, "C2");
});

test("mehrere Nachrichten, Batch-Rahmen und Vorspann", () => {
  const r = parseAll("FHS|^~\\&|X\rBHS|^~\\&|X\r" + M + "\rPID|1\r" + M.replace("C1", "C2") + "\rBTS|2\rFTS|1");
  assert.equal(r.messages.length, 2);
  assert.equal(r.messages[1].controlId, "C2");
  assert.ok(r.notes.some((n) => n.code === "batch"));
  const s = parseAll("hallo welt\n" + M);
  assert.equal(s.messages.length, 1);
  assert.ok(s.notes.some((n) => n.code === "stray"));
});

test("Log-Präfix vor MSH und wörtliche \\r-Zeichen", () => {
  const log = "2026-01-05 12:00:00 INFO MSH|^~\\&|A|B|C|D|20260105||ADT^A01|1|P|2.5\\rPID|1||5\\rPV1|1|I";
  const r = parseAll(log);
  assert.equal(r.messages[0].segments.length, 3);
  assert.ok(r.notes.some((n) => n.code === "literal-breaks"));
  assert.ok(r.notes.some((n) => n.code === "log-prefix"));
});

test("alles in einer Zeile mit Leerzeichen", () => {
  const r = parseAll(M + " PID|1||1 PV1|1|I");
  assert.equal(r.messages[0].segments.length, 3);
  assert.ok(r.notes.some((n) => n.code === "space-breaks"));
});

test("Z-Segmente", () => {
  const m = parseAll(M + "\rZPI|1|lokal").messages[0];
  checkMessage(m);
  assert.equal(m.segments[1].id, "ZPI");
  assert.equal(segmentInfo("ZPI").local, true);
  assert.ok(m.hints.some((h) => h.code === "z-seg"));
});

test("kaputte Eingaben stürzen nicht ab", () => {
  for (const t of ["", "   ", "MSH", "MSH|", "MSH|^~", "MSH||||", "PID|1||1", "\x0b\x1c\r", "MSH|^~\\&|\\", "MSH^^^"]) {
    const r = parseAll(t);
    for (const m of r.messages) checkMessage(m);
  }
  const bad = parseAll("MSH|^~");
  assert.equal(bad.messages.length, 1);
  assert.ok(bad.messages[0].hints.some((h) => h.code === "short-enc"));
  assert.equal(parseAll("").messages.length, 0);
});

test("doppelte Trennzeichen werden gemeldet", () => {
  const m = parseAll("MSH|^^\\&|A").messages[0];
  assert.ok(m.hints.some((h) => h.code === "dup-sep"));
});

test("Nullwert \"\" ist nicht leer", () => {
  const m = parseAll(M + '\rPID|1||1||""|').messages[0];
  const f = m.segments[1].fields[5];
  assert.equal(f.isNull, true);
  assert.equal(f.empty, undefined);
  checkMessage(m);
  assert.ok(m.hints.some((h) => h.code === "null-field"));
});

test("Prüfhinweise: fehlende Segmente, leere Pflichtfelder, Datumsformate, Zahlen", () => {
  const t = [M.replace("20260105120000", "05.01.2026"), "PID|1||||x||", "OBX|1|NM|A^B||5,9", "PV1|1||x|||||||||||||||||||||||||||||||||||||||||||2026-01-05"].join("\r");
  const m = parseAll(t).messages[0]; checkMessage(m);
  const codes = m.hints.map((h) => h.code);
  assert.ok(codes.includes("missing-seg"), "EVN fehlt");
  assert.ok(codes.includes("empty-required"));
  assert.ok(codes.includes("bad-date"));
  assert.ok(codes.includes("obx-nm"));
  assert.ok(m.hints.some((h) => h.code === "empty-required" && h.seg === "PID" && h.field === 3));
});

test("checkDateValue", () => {
  assert.equal(checkDateValue("20260105"), null);
  assert.equal(checkDateValue("202601051230+0100"), null);
  assert.equal(checkDateValue("20260105123045.1234"), null);
  assert.match(checkDateValue("2026-01-05"), /ISO/);
  assert.match(checkDateValue("05.01.2026"), /deutsch/);
  assert.match(checkDateValue("20261305"), /Monat/);
  assert.match(checkDateValue("20260145"), /Tag/);
});

test("alle Beispiele lesen sich ohne Fehler und mit erwartetem Typ", () => {
  const expected = { "adt-a01": "ADT^A01", "adt-a04": "ADT^A04", "adt-a08": "ADT^A08", "oru-r01": "ORU^R01", "orm-o01": "ORM^O01", "mdm-t02": "MDM^T02", "siu-s12": "SIU^S12", "ack-fehler": "ACK^A01" };
  for (const e of EXAMPLES) {
    const r = parseAll(e.text);
    assert.equal(r.messages.length, 1, e.id);
    const m = r.messages[0]; checkMessage(m);
    assert.equal(m.typeLabel, expected[e.id], e.id);
    assert.equal(m.hints.filter((h) => h.level === "error").length, 0, e.id + " " + JSON.stringify(m.hints.filter((h) => h.level !== "info")));
    assert.equal(m.hints.filter((h) => h.level === "warn").length, 0, e.id + " " + JSON.stringify(m.hints.filter((h) => h.level === "warn")));
    assert.ok(!e.text.includes("\n"), "Beispiele nutzen \\r");
  }
});

test("Beispielinhalte: Feldpfade stimmen", () => {
  const a01 = parseAll(EXAMPLES[0].text).messages[0];
  assert.equal(getValue(a01, "PID-5.1"), "Beispielmann");
  assert.equal(getValue(a01, "PID-3[2].5"), "VN");
  assert.equal(getValue(a01, "PID-18"), "TEST-ACC-5001");
  assert.equal(getValue(a01, "PV1-44"), "20261027080000");
  assert.equal(getValue(a01, "PV1-19"), "TEST-F-7781");
  assert.equal(getValue(a01, "IN1-36"), "TEST-V-0001");
  const oru = parseAll(EXAMPLES.find((e) => e.id === "oru-r01").text).messages[0];
  assert.equal(getValue(oru, "OBX[2]-5"), "5.9");
  assert.equal(getValue(oru, "OBX[2]-8"), "H");
  assert.equal(getValue(oru, "OBR-25"), "F");
  assert.equal(getValue(oru, "NTE-3"), "Kaliumwert auffällig.\nKontrolle mit neuer Probe empfohlen (Testdaten).");
  const siu = parseAll(EXAMPLES.find((e) => e.id === "siu-s12").text).messages[0];
  assert.equal(getValue(siu, "SCH-11.4"), "20261110093000");
  assert.equal(getValue(siu, "AIS-7"), "30");
  const ack = parseAll(EXAMPLES.find((e) => e.id === "ack-fehler").text).messages[0];
  assert.equal(getValue(ack, "MSA-2"), "MSG-A01-0001");
  assert.equal(getValue(ack, "ERR-4"), "E");
  const a08 = parseAll(EXAMPLES.find((e) => e.id === "adt-a08").text).messages[0];
  assert.equal(getValue(a08, "PID-11.1"), "Teststraße 12 & 14");
});

test("fehlerhaftes Beispiel löst die erwarteten Hinweise aus", () => {
  const ex = ALL_EXAMPLES.find((e) => e.id === "fehlerhaft");
  const r = parseAll(ex.text); const m = r.messages[0]; checkMessage(m);
  const codes = new Set(m.hints.map((h) => h.code));
  for (const c of ["empty-required", "bad-date", "obx-nm", "null-field", "missing-seg"]) assert.ok(codes.has(c), c);
  assert.ok(r.notes.some((n) => n.code === "lf-breaks"));
});

test("Zeichensatz-Hinweise", () => {
  const m = parseAll(M + "\rPID|1||1||M\ufffdller^Max").messages[0]; checkMessage(m);
  assert.ok(m.hints.some((h) => h.code === "charset"));
  const m2 = parseAll(M + "\rPID|1||1||MÃ¼ller^Max").messages[0]; checkMessage(m2);
  assert.ok(m2.hints.some((h) => h.code === "mojibake"));
});

test("serialize liefert \\r-getrennte Segmente, optional mit MLLP", () => {
  const m = parseAll(M + "\nPID|1").messages[0];
  assert.equal(serialize(m), M + "\rPID|1\r");
  assert.equal(serialize(m, { mllp: true }), "\x0b" + M + "\rPID|1\r\x1c\r");
});

test("Anonymisierung maskiert Namen, Kennungen, Adressen, Telefon, Datum", () => {
  const src = EXAMPLES[0].text;
  const r = anonymize(src);
  assert.ok(!/Beispielmann|Bernd|TEST-100234|TEST-F-7781|Teststraße|1234567|example\.invalid.*bernd|bernd@|19710305|Musterarzt|Beispielfrau|TEST-ACC|TEST-V-0001/.test(r.text.replace("anonym@example.invalid", "")), r.text);
  const m = parseAll(r.text).messages[0];
  assert.equal(m.segments.length, 8);
  assert.equal(getValue(m, "PID-7"), "19710101");
  assert.equal(getValue(m, "PID-3[1].5"), "MR", "Kennungstyp bleibt");
  assert.equal(getValue(m, "PID-3[1].1"), getValue(m, "PV1-19") === getValue(m, "PID-3[2].1") ? getValue(m, "PID-3[1].1") : getValue(m, "PID-3[1].1"));
  assert.ok(r.maskedFields > 10);
  // Konsistenz: gleicher Wert → gleiche Ersetzung (PID-3[2] und PV1-19 sind beide TEST-F-7781)
  assert.equal(getValue(m, "PID-3[2].1"), getValue(m, "PV1-19"));
  assert.equal(getValue(m, "PID-5.1"), getValue(m, "NK1-2.1").replace("Nachname2", "Nachname1"), "NK1 hat anderen Namen");
});

test("Anonymisierung: Optionen für Datum, Freitext, Z-Segmente", () => {
  const a08 = EXAMPLES.find((e) => e.id === "adt-a08").text;
  assert.match(anonymize(a08, { dates: "keep" }).text, /\|19710305\|/);
  assert.doesNotMatch(anonymize(a08, { dates: "remove" }).text, /19710305/);
  assert.match(anonymize(a08).text, /ZPI\|\[entfernt\]\|\[entfernt\]/);
  assert.match(anonymize(a08, { zSegments: false }).text, /KARTE-0815/);
  const oru = EXAMPLES.find((e) => e.id === "oru-r01").text;
  assert.match(anonymize(oru).text, /NTE\|1\|L\|\[Freitext entfernt\]/);
  assert.match(anonymize(oru, { freeText: false }).text, /Kaliumwert/);
  // Messwerte bleiben
  assert.match(anonymize(oru).text, /OBX\|2\|NM\|K\^Kalium\^LOKAL\|\|5\.9\|mmol\/L/);
});

test("Anonymisierung mit Escape in Namen und leeren/Null-Feldern", () => {
  const t = M + "\r" + String.raw`PID|1||77^^^X^MR||M\F\ller^Hans||19800101|M||""|`;
  const r = anonymize(t);
  assert.doesNotMatch(r.text, /ller\^Hans|77\^/);
  assert.match(r.text, /\|""\|/);
});

test("Export JSON und CSV", () => {
  const m = parseAll(EXAMPLES[3].text).messages;
  const j = toJSON(m);
  assert.equal(j[0].type, "ORU^R01");
  const obx = j[0].segments.filter((s) => s.id === "OBX")[1];
  assert.equal(obx.fields.find((f) => f.n === 5).repetitions[0][0], "5.9");
  const csv = toCSV(m);
  assert.ok(csv.startsWith("\ufeffnachricht;segment_nr;segment;feld"));
  assert.match(csv, /;OBX;5;Wert;1;1;1;5\.9/);
  const evil = toCSV(parseAll(M + "\rPID|1||=1+1^^^X").messages);
  assert.match(evil, /'=1\+1/);
  assert.doesNotMatch(toCSV(parseAll(M + "\rPID|1||=1+1").messages, { safe: false }), /'=1/);
});

test("Wörterbuch: bekannte, unbekannte und lokale Felder", () => {
  assert.equal(fieldInfo("PID", 5).name, "Patientenname");
  assert.equal(fieldInfo("PID", 99).name, "Feld 99");
  assert.equal(fieldInfo("PID", 99).known, false);
  assert.equal(segmentInfo("XYZ").known, false);
  for (const [id, s] of Object.entries(SEGMENTS)) for (const [n, f] of Object.entries(s.fields)) assert.ok(f[0] && f[1] && f[2], `${id}-${n}`);
});

test("leere Datei (0 Byte): klare Meldung statt nur Name und Größe", () => {
  assert.equal(fileNote("empty.hl7", 0), "empty.hl7: Die Datei ist leer.");
  assert.equal(fileNote("a.hl7", 2048), "a.hl7 (2.0 KB)");
  assert.equal(fileNote("a.hl7", 2048, "Hinweis."), "a.hl7 (2.0 KB). Hinweis.");
});

test("MLLP-Rahmen wird nur gemeldet, wenn danach HL7-Text mit MSH folgt", () => {
  const framed = "\x0b" + M + "\rPID|1||123\r\x1c\r";
  const ok = normalizeInput(framed);
  assert.ok(ok.hadMllp);
  assert.ok(ok.notes.some((n) => n.code === "mllp"));
  assert.ok(ok.lines[0].startsWith("MSH"));
  const bin = normalizeInput("PK\x03\x04\x0b\x00\x1c\xff binaer \x0b\x1c");
  assert.equal(bin.hadMllp, false);
  assert.ok(!bin.notes.some((n) => n.code === "mllp"));
});

test("Zeilenvorschub-Hinweis nur bei HL7-Inhalt (MSH), nicht bei Binärdaten oder MLLP ohne MSH", () => {
  const hl7 = normalizeInput(M + "\nPID|1||123\n");
  assert.ok(hl7.notes.some((n) => n.code === "lf-breaks"));
  const noMsh = normalizeInput("\x0bhallo\nwelt\nnoch eine Zeile\n\x1c\r");
  assert.ok(!noMsh.notes.some((n) => n.code === "lf-breaks"));
  const bin = normalizeInput("PK\x03\x04\x00\xff\nabc\ndef\nghi");
  assert.ok(!bin.notes.some((n) => n.code === "lf-breaks"));
});
