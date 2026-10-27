// Hilfen für Seiteninhalte, die aus Parser und Feldliste erzeugt werden (damit Beispiele und Tabellen nie vom Viewer abweichen).
import { parseAll } from "../../src/assets/js/core/parser.js";
import { SEGMENTS, fieldInfo, codeMeaning, DATATYPES } from "../../src/assets/js/core/dict.js";
import { esc } from "./layout.mjs";

export { SEGMENTS, fieldInfo, DATATYPES };

/** Eine Zeile mit farbig hervorgehobenen Trennzeichen. */
export function lineHtml(raw, enc = { field: "|", comp: "^", rep: "~", sub: "&" }) {
  const map = { [enc.field]: "sf", [enc.comp]: "sc", [enc.rep]: "sr", [enc.sub]: "ss" };
  let out = "";
  for (const ch of raw) out += map[ch] ? `<span class="${map[ch]}">${esc(ch)}</span>` : esc(ch);
  return out;
}

export function legend() {
  return `<p class="legend"><span><span class="sf">|</span> Feld</span><span><span class="sc">^</span> Komponente</span><span><span class="sr">~</span> Wiederholung</span><span><span class="ss">&amp;</span> Subkomponente</span></p>`;
}

/** Beispielzeilen als <pre>; `only` = Liste von Segment-IDs, sonst alle. */
export function preLines(text, only) {
  const lines = text.split(/\r|\n/).filter(Boolean).filter((l) => !only || only.includes(l.slice(0, 3)));
  return `<pre class="ex-pre" tabindex="0"><code>${lines.map((l) => lineHtml(l)).join("\n")}</code></pre>`;
}

/** Tabelle aller gefüllten Felder einer Beispielnachricht: Pfad, Feldname, Wert (mit Code-Bedeutung, wo bekannt). */
export function filledFieldsTable(example, only) {
  const { messages } = parseAll(example.text);
  const rows = [];
  for (const s of messages[0].segments) {
    if (only && !only.includes(s.id)) continue;
    s.fields.forEach((f, n) => {
      if (!f || f.raw === "" || (s.id === "MSH" && n < 3)) return;
      const fi = fieldInfo(s.id, n);
      const first = !f.reps || f.reps.length === 1 ? f.reps?.[0]?.comps?.[0]?.subs?.[0] : null;
      const cm = first && f.reps[0].comps.length === 1 ? codeMeaning(s.id, n, first) : "";
      rows.push(`<tr><td class="mono">${s.id}-${n}</td><td>${esc(fi.name)}</td><td><code>${esc(f.raw.length > 90 ? f.raw.slice(0, 90) + "…" : f.raw)}</code>${cm ? ` <span class="muted">${esc(cm)}</span>` : ""}</td></tr>`);
    });
  }
  return `<div class="tbl-wrap"><table><thead><tr><th>Pfad</th><th>Feld</th><th>Wert im Beispiel</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

/** Feldtabelle eines Segments aus der Feldliste (nur die im Viewer beschriebenen Felder). */
export function segmentFieldTable(id) {
  const fields = SEGMENTS[id].fields;
  const rows = Object.entries(fields).map(([n, f]) => `<tr><td class="mono">${id}-${n}</td><td>${f[3]?.key ? "<strong>" + esc(f[0]) + "</strong>" : esc(f[0])}</td><td class="mono">${esc(f[1])}</td><td>${esc(f[2])}</td></tr>`);
  return `<div class="tbl-wrap"><table><thead><tr><th>Feld</th><th>Name</th><th>Typ</th><th>Erklärung</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

export const faqHtml = (faq) => faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n");
