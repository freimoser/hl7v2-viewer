import { normalizeInput, splitMessages, readEncoding } from "./parser.js";

/**
 * Hilfe zum Maskieren identifizierender Felder. Arbeitet auf dem Rohtext der Felder (Escapes bleiben erhalten).
 * Das ist ein Werkzeug zum Schwärzen für Tests und Fehlersuche, keine Anonymisierungsgarantie.
 */
const RULES = {
  PID: { 3: "id", 4: "id", 2: "id", 5: "name", 6: "name", 9: "name", 7: "date", 11: "addr", 13: "phone", 14: "phone", 18: "id", 19: "clear", 20: "clear", 21: "id", 23: "clear", 29: "date" },
  PD1: { 3: "clear", 4: "person" },
  NK1: { 2: "name", 4: "addr", 5: "phone", 6: "phone", 12: "id", 13: "clear", 32: "id", 33: "id" },
  PV1: { 7: "person", 8: "person", 9: "person", 17: "person", 52: "person", 19: "id", 5: "id" },
  PV2: {},
  EVN: { 5: "person" },
  IN1: { 3: "id", 16: "name", 18: "date", 19: "addr", 36: "id", 49: "id" },
  ORC: { 10: "person", 11: "person", 12: "person", 14: "phone", 19: "person" },
  OBR: { 10: "person", 16: "person", 17: "phone", 28: "person", 32: "person" },
  OBX: { 16: "person" },
  TXA: { 5: "person", 9: "person", 10: "person", 11: "person" },
  SCH: { 12: "person", 16: "person", 20: "person" },
  AL1: {},
};

export const DEFAULT_OPTIONS = { dates: "year", freeText: true, zSegments: true, doctors: true, ids: true, keepIdTypes: true };

function makeMapper(prefix) {
  const map = new Map();
  return (key) => {
    if (!map.has(key)) map.set(key, map.size + 1);
    return `${prefix}${map.get(key)}`;
  };
}

export function anonymize(input, options = {}) {
  const o = { ...DEFAULT_OPTIONS, ...options };
  const { lines, notes } = normalizeInput(input);
  const { messages } = splitMessages(lines);
  const idMap = makeMapper("ANON-ID-");
  const famMap = makeMapper("Nachname");
  const givMap = makeMapper("Vorname");
  const docMap = makeMapper("Arzt");
  const stats = {};
  const bump = (k) => { stats[k] = (stats[k] || 0) + 1; };
  const out = [];

  for (const m of messages) {
    const { enc } = readEncoding(m.lines[0].raw);
    const mapField = (raw, kind, seg, n) => {
      if (raw === "" || raw === '""') return raw;
      const reps = raw.split(enc.rep);
      const trim = (arr) => { while (arr.length > 1 && arr[arr.length - 1] === "") arr.pop(); return arr.join(enc.comp); };
      const res = reps.map((rep) => {
        const c = rep.split(enc.comp);
        switch (kind) {
          case "id": if (!o.ids) return rep; c[0] = idMap(c[0]); if (c.length > 1) c[1] = ""; return c.join(enc.comp);
          case "name": { const fam = c[0] || "", giv = c[1] || ""; const key = `${fam}${giv}`; const out2 = [famMap(fam), givMap(giv || key)]; for (let i = 2; i < c.length; i++) out2[i] = i === 6 ? c[i] : ""; return trim(out2); }
          case "person": { if (!o.doctors) return rep; const id = c[0] || ""; const key = id + (c[1] || "") + (c[2] || ""); const out2 = [id ? idMap(id) : "", docMap(key), ""]; for (let i = 3; i < c.length; i++) out2[i] = ""; return trim(out2); }
          case "addr": { const out2 = [...c]; out2[0] = "Anonymweg 1"; if (c.length > 1) out2[1] = ""; if (c.length > 2) out2[2] = "Musterstadt"; if (c.length > 4) out2[4] = "00000"; if (c.length > 3) out2[3] = ""; return out2.join(enc.comp); }
          case "phone": { const o2 = [...c]; if (o2.length > 0) o2[0] = ""; if (o2[3]) o2[3] = "anonym@example.invalid"; for (const i of [4, 5, 7]) if (i < o2.length) o2[i] = ""; if (o2[6]) o2[6] = "0000000"; return o2.join(enc.comp); }
          case "date": {
            if (o.dates === "keep") return rep;
            if (o.dates === "remove") return "";
            const d = rep.split(enc.comp)[0];
            return /^\d{4}/.test(d) ? d.slice(0, 4) + "0101" : "";
          }
          case "clear": return "";
          default: return rep;
        }
      });
      bump(`${seg}-${n}`);
      return res.join(enc.rep);
    };
    const segs = m.lines.map((l) => {
      const id = l.raw.slice(0, 3);
      const parts = l.raw.split(enc.field);
      const isMsh = id === "MSH";
      const idx = (n) => (isMsh ? n - 1 : n);
      const rules = RULES[id] || {};
      for (const [nStr, kind] of Object.entries(rules)) {
        const i = idx(Number(nStr));
        if (i < parts.length && i >= 1) parts[i] = mapField(parts[i], kind, id, nStr);
      }
      if (o.freeText) {
        if (id === "NTE" && parts[3]) { parts[3] = "[Freitext entfernt]"; bump("NTE-3"); }
        if (id === "OBX" && parts[5] && /^(TX|FT|ST|ED|RP)$/.test(parts[2] || "") && (parts[2] !== "ST" || parts[5].length > 40)) { parts[5] = parts[2] === "ED" || parts[2] === "RP" ? "" : "[Freitext entfernt]"; bump("OBX-5"); }
        if (id === "DG1" && parts[4]) { parts[4] = ""; bump("DG1-4"); }
        if (id === "AL1" && parts[5]) { parts[5] = "[Freitext entfernt]"; bump("AL1-5"); }
        if (id === "OBR" && parts[13]) { parts[13] = "[Freitext entfernt]"; bump("OBR-13"); }
      }
      if (o.zSegments && /^Z[A-Z0-9]{2}$/.test(id)) {
        for (let i = 1; i < parts.length; i++) if (parts[i]) { parts[i] = "[entfernt]"; bump(`${id}-${i}`); }
      }
      return parts.join(enc.field);
    });
    out.push(segs.join("\r"));
  }
  const text = out.join("\r") + (out.length ? "\r" : "");
  const maskedFields = Object.values(stats).reduce((a, b) => a + b, 0);
  return { text, stats, maskedFields, messages: messages.length, notes };
}
