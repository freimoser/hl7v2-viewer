import { fieldInfo } from "./dict.js";

function csvCell(v, safe) {
  let s = String(v ?? "");
  if (safe && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Exportiert alle Nachrichten als JSON-Struktur (nur gefüllte Felder). */
export function toJSON(messages) {
  return messages.map((m, mi) => ({
    index: mi + 1,
    type: m.typeLabel || null,
    structure: m.type.structure || null,
    version: m.version || null,
    controlId: m.controlId || null,
    separators: { field: m.enc.field, component: m.enc.comp, repetition: m.enc.rep, escape: m.enc.esc, subcomponent: m.enc.sub },
    segments: m.segments.map((s) => ({
      id: s.id || null,
      line: s.line,
      ...(s.invalid ? { raw: s.raw, invalid: true } : {}),
      fields: s.fields.filter((f) => f && !f.empty).map((f) => {
        const info = fieldInfo(s.id, f.n);
        return {
          n: f.n,
          name: info.known ? info.name : null,
          raw: f.raw,
          ...(f.isNull ? { null: true } : {}),
          repetitions: f.reps.map((r) => r.comps.map((c) => (c.subs.length > 1 ? c.subs : c.subs[0]))),
        };
      }),
    })),
  }));
}

/** Flache Tabelle: eine Zeile je Subkomponente, für Excel und Skripte. */
export function toCSV(messages, { safe = true } = {}) {
  const rows = [["nachricht", "segment_nr", "segment", "feld", "feldname", "wiederholung", "komponente", "subkomponente", "wert"]];
  messages.forEach((m, mi) => m.segments.forEach((s, si) => s.fields.forEach((f) => {
    if (!f || f.empty) return;
    const name = fieldInfo(s.id, f.n).known ? fieldInfo(s.id, f.n).name : "";
    f.reps.forEach((r, ri) => r.comps.forEach((c, ci) => c.subs.forEach((v, vi) => {
      if (v === "" && !(c.subs.length === 1 && r.comps.length === 1)) return;
      rows.push([mi + 1, si + 1, s.id, f.n, name, ri + 1, ci + 1, vi + 1, v]);
    })));
  })));
  return "\ufeff" + rows.map((r) => r.map((c) => csvCell(c, safe)).join(";")).join("\r\n") + "\r\n";
}
