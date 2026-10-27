import { fieldText, getValue } from "./parser.js";
import { SEGMENTS, fieldInfo } from "./dict.js";
import { EXPECTED, describeType } from "./messages.js";

/** Pflichtfelder (in der Regel erwartet; Details je Version und Profil in der Spezifikation). */
const REQUIRED = {
  MSH: [7, 9, 10, 11, 12], PID: [3, 5], PV1: [2], OBR: [4], OBX: [2, 3, 11], ORC: [1], MSA: [1, 2], TXA: [2, 12, 17],
};
const DATE_FIELDS = { MSH: [7], EVN: [2, 3, 6], PID: [7, 29, 33], PV1: [44, 45], OBR: [7, 8, 14, 22], OBX: [14, 19], ORC: [9, 15], TXA: [4, 6, 7, 8], DG1: [5] };
const DT_ONLY = { NK1: [8, 9], AL1: [6], IN1: [12, 13] };
const KNOWN_VERSIONS = ["2.1", "2.2", "2.3", "2.3.1", "2.4", "2.5", "2.5.1", "2.6", "2.7", "2.7.1", "2.8", "2.8.1", "2.8.2", "2.9"];

export const DTM_RE = /^\d{4}(\d{2}(\d{2}(\d{2}(\d{2}(\d{2}(\.\d{1,4})?)?)?)?)?)?([+-]\d{4})?$/;

export function checkDateValue(v) {
  if (!v) return null;
  if (!DTM_RE.test(v)) {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return "sieht nach ISO-Format (JJJJ-MM-TT) aus. HL7 v2 erwartet Ziffern ohne Trennzeichen, z. B. 20260105";
    if (/^\d{1,2}\.\d{1,2}\.\d{2,4}/.test(v)) return "sieht nach deutschem Format (TT.MM.JJJJ) aus. HL7 v2 erwartet JJJJMMTT";
    return "ist kein gültiger HL7-Zeitstempel (erwartet JJJJ[MM[TT[hh[mm[ss[.s]]]]]][±hhmm])";
  }
  const d = v.replace(/[+-]\d{4}$/, "");
  const mo = d.length >= 6 ? Number(d.slice(4, 6)) : 1, day = d.length >= 8 ? Number(d.slice(6, 8)) : 1;
  if (mo < 1 || mo > 12) return `enthält den Monat ${d.slice(4, 6)}`;
  if (day < 1 || day > 31) return `enthält den Tag ${d.slice(6, 8)}`;
  if (d.length >= 10 && Number(d.slice(8, 10)) > 23) return "enthält eine Stunde über 23";
  if (d.length >= 12 && Number(d.slice(10, 12)) > 59) return "enthält Minuten über 59";
  return null;
}

/** Fügt msg.hints hinzu. Hinweise sind Lesehilfen, kein Konformitätstest. */
export function checkMessage(msg) {
  const h = msg.hints;
  const add = (level, code, text, extra = {}) => h.push({ level, code, text, ...extra });
  const msh = msg.segments[0];
  const ids = msg.segments.map((s) => s.id);

  msg.segments.forEach((s) => {
    if (s.invalid) add("warn", "bad-line", `Zeile ${s.line} beginnt nicht mit einer Segmentkennung (drei Großbuchstaben/Ziffern, dann „${msg.enc.field}“): ${JSON.stringify(s.raw.slice(0, 40))}`, { line: s.line });
  });

  if (!msg.type.code) add("error", "no-type", "MSH-9 (Nachrichtentyp) ist leer. Ohne Typ ist unklar, welche Segmente zu erwarten sind.", { seg: "MSH", field: 9 });
  else if (!msg.type.trigger) add("warn", "no-trigger", `MSH-9 enthält nur „${msg.type.code}“ ohne Auslöseereignis (z. B. ${msg.type.code}^A01).`, { seg: "MSH", field: 9 });
  if (msg.type.code && /^[A-Za-z]/.test(msg.type.code) && msg.type.code !== msg.type.code.toUpperCase()) add("warn", "case-type", "Der Nachrichtentyp in MSH-9 ist nicht in Großbuchstaben. HL7 unterscheidet Groß- und Kleinschreibung.", { seg: "MSH", field: 9 });

  const t = EXPECTED[msg.type.code];
  if (t) {
    for (const r of t.required) if (!ids.includes(r)) add("warn", "missing-seg", `Segment ${r} fehlt. Bei ${msg.type.code}-Nachrichten wird es üblicherweise erwartet.`, { seg: r });
    for (const u of t.usual) if (!ids.includes(u)) add("info", "usual-seg", `Segment ${u} fehlt. Bei ${msg.type.code}-Nachrichten ist es oft vorhanden, aber nicht immer.`, { seg: u });
  }
  if (msg.type.code === "ACK" && !ids.includes("MSA")) add("error", "no-msa", "Eine ACK-Nachricht ohne MSA-Segment lässt sich nicht auswerten.", { seg: "MSA" });
  if (!ids.includes("PID") && !["ACK", "MFN", "QRY"].includes(msg.type.code) && msg.type.code) add("info", "no-pid", "Es gibt kein PID-Segment. Das ist bei Nachrichten ohne Patientenbezug in Ordnung, bei klinischen Nachrichten meist ein Fehler.", { seg: "PID" });

  // Pflichtfelder
  for (const s of msg.segments) {
    for (const n of REQUIRED[s.id] || []) {
      const f = s.fields[n];
      if (!f || f.empty) {
        // OBX-2 wird nur gefordert, wenn OBX-5 gefüllt ist
        if (s.id === "OBX" && n === 2 && !(s.fields[5] && !s.fields[5].empty)) continue;
        add("warn", "empty-required", `${s.id}-${n} (${fieldInfo(s.id, n).name}) ist leer. Dieses Feld ist normalerweise ein Pflichtfeld.`, { seg: s.id, field: n, line: s.line });
      }
    }
  }
  // Nullwerte
  for (const s of msg.segments) for (const f of s.fields) if (f?.isNull) add("info", "null-field", `${s.id}-${f.n} enthält den Nullwert "" (zwei Anführungszeichen). Das bedeutet „Wert löschen“ und ist etwas anderes als ein leeres Feld.`, { seg: s.id, field: f.n, line: s.line });

  // Datumsformate
  for (const [id, list] of [...Object.entries(DATE_FIELDS), ...Object.entries(DT_ONLY)]) {
    for (const s of msg.segments.filter((x) => x.id === id)) for (const n of list) {
      const v = fieldText(s.fields[n]);
      if (s.fields[n]?.isNull) continue;
      const problem = checkDateValue(v);
      if (problem) add("warn", "bad-date", `${id}-${n} (${fieldInfo(id, n).name}) „${v}“ ${problem}.`, { seg: id, field: n, line: s.line });
    }
  }

  // Version
  if (msg.version && !KNOWN_VERSIONS.includes(msg.version)) add("info", "version", `Version „${msg.version}“ in MSH-12 ist im Viewer nicht bekannt. Bekannt sind 2.1 bis 2.9.`, { seg: "MSH", field: 12 });

  // OBX-Werttyp
  for (const s of msg.segments.filter((x) => x.id === "OBX")) {
    const vt = fieldText(s.fields[2]); const val = fieldText(s.fields[5]);
    if (vt === "NM" && val && !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(val)) add("warn", "obx-nm", `OBX-5 „${val}“ ist als Zahl (NM) gekennzeichnet, aber keine reine Zahl. Ein Dezimalkomma statt Punkt ist die häufigste Ursache.`, { seg: "OBX", field: 5, line: s.line });
    if (vt === "DT" || vt === "TS") { const p = checkDateValue(val); if (p) add("warn", "obx-date", `OBX-5 „${val}“ ${p}.`, { seg: "OBX", field: 5, line: s.line }); }
  }

  // Zeichensatz
  const all = msg.segments.map((s) => s.raw).join("");
  if (all.includes("\ufffd")) add("warn", "charset", `Die Nachricht enthält Ersatzzeichen (�). Umlaute wurden vermutlich mit dem falschen Zeichensatz gelesen${msg.charset ? ` (MSH-18: ${msg.charset})` : ""}. Laden Sie die Datei mit einem anderen Zeichensatz neu.`);
  else if (/Ã[\u0080-\u00bf]/.test(all)) add("warn", "mojibake", "Zeichenfolgen wie „Ã¤“ deuten darauf hin, dass UTF-8-Text als ISO-8859-1/Windows-1252 gelesen wurde. Prüfen Sie den Zeichensatz.");
  if (msg.charset && msg.charset !== "UNICODE UTF-8" && /[^\x00-\x7f]/.test(all) && /UTF-?8/i.test(msg.charset) === false) add("info", "charset-decl", `MSH-18 nennt „${msg.charset}“. Der Viewer liest den Text so, wie Sie ihn eingefügt oder geladen haben.`, { seg: "MSH", field: 18 });

  // Segmentzähler in Wiederholungen (SI)
  for (const s of msg.segments) {
    if (["OBX", "NK1", "AL1", "DG1", "IN1"].includes(s.id)) {
      const si = fieldText(s.fields[1]);
      if (si && !/^\d+$/.test(si)) add("warn", "set-id", `${s.id}-1 „${si}“ ist keine ganze Zahl.`, { seg: s.id, field: 1, line: s.line });
    }
  }
  // Z-Segmente
  const z = [...new Set(ids.filter((i) => /^Z[A-Z0-9]{2}$/.test(i)))];
  if (z.length) add("info", "z-seg", `Z-Segment(e) ${z.join(", ")}: lokale Erweiterungen, deren Inhalt nur die Schnittstellenbeschreibung des Absenders erklärt.`);

  // Ausreißer: Zeilen, die kein Segment sind
  const order = { error: 0, warn: 1, info: 2 };
  h.sort((a, b) => order[a.level] - order[b.level]);
  return h;
}
