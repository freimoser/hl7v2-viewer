/**
 * Eigener Parser für HL7-v2-Nachrichten (Pipe-Format). Keine Abhängigkeiten, läuft im Browser, im Worker und in Node.
 * Modell: Nachricht → Segmente → Felder → Wiederholungen → Komponenten → Subkomponenten.
 * Alle Werte in `subs` sind bereits entschlüsselt (Escape-Sequenzen aufgelöst); `raw` enthält immer den Originaltext.
 */

export const DEFAULT_ENC = Object.freeze({ field: "|", comp: "^", rep: "~", esc: "\\", sub: "&" });
const SEG_ID = /^[A-Z][A-Z0-9]{2}$/;
const BATCH = new Set(["FHS", "FTS", "BHS", "BTS"]);

/** Entfernt MLLP-Rahmen, Byte-Order-Mark und vereinheitlicht Zeilenumbrüche. Gibt Zeilen und Hinweise zur Reparatur zurück. */
export function normalizeInput(input) {
  const notes = [];
  let t = String(input ?? "");
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  let mllpStart = (t.match(/\x0b/g) || []).length;
  let mllpEnd = (t.match(/\x1c/g) || []).length;
  // Nur als MLLP-Rahmen behandeln, wenn der Inhalt danach wie HL7-Text beginnt (MSH); Binärdateien enthalten die Bytes zufällig.
  if ((mllpStart || mllpEnd) && !/(^|[\s\]:>\x0b\x1c])MSH[^A-Za-z0-9\s]/m.test(t)) { mllpStart = 0; mllpEnd = 0; }
  if (mllpStart || mllpEnd) {
    t = t.replace(/\x0b/g, "").replace(/\x1c\r?/g, "\r");
    notes.push({ level: "info", code: "mllp", text: `MLLP-Rahmen erkannt und entfernt (${mllpStart} Startzeichen, ${mllpEnd} Endzeichen). Das sind Übertragungszeichen und gehören nicht zur Nachricht.` });
  }
  // Wörtliche „\r“ und „\n“ (Backslash + Buchstabe) zwischen Segmenten, wie sie manche Logs und Mails zeigen
  const literal = (t.match(/\\r(?:\\n)?(?=[A-Z][A-Z0-9]{2}[|])/g) || []).length + (t.match(/\\n(?=[A-Z][A-Z0-9]{2}[|])/g) || []).length;
  if (literal) {
    t = t.replace(/\\r(?:\\n)?(?=[A-Z][A-Z0-9]{2}[|])/g, "\r").replace(/\\n(?=[A-Z][A-Z0-9]{2}[|])/g, "\r");
    notes.push({ level: "warn", code: "literal-breaks", text: `Zwischen Segmenten standen ${literal} wörtliche Zeichenfolgen „\\r“ oder „\\n“ (Text statt Zeilenumbruch). Sie wurden in echte Segmenttrennungen umgewandelt.` });
  }
  const hadCR = /\r(?!\n)/.test(t);
  const hadLF = /\n/.test(t);
  let lines = t.split(/\r\n|\r|\n/);
  if (hadLF && !hadCR && lines.filter((l) => l.trim()).length > 1 && /(^|[\s\]:>])MSH[^A-Za-z0-9\s]/m.test(t)) {
    notes.push({ level: "info", code: "lf-breaks", text: "Die Segmente waren mit Zeilenvorschub (\\n) statt mit Wagenrücklauf (\\r) getrennt, wie es beim Kopieren aus Mails und Logs üblich ist. Der Viewer liest beides; für Systeme, die \\r erwarten, bietet die reparierte Fassung den korrekten Umbruch." });
  }
  // Präfix vor MSH (Log-Zeitstempel)
  lines = lines.map((l, i) => {
    const m = /(^|[\s\]:>])MSH(?=[^A-Za-z0-9\s])/.exec(l);
    if (m && m.index + m[1].length > 0 && !/^[A-Z][A-Z0-9]{2}[^A-Za-z0-9]/.test(l)) {
      const cut = m.index + m[1].length;
      notes.push({ level: "warn", code: "log-prefix", text: `Zeile ${i + 1}: Text vor „MSH“ (${JSON.stringify(l.slice(0, Math.min(cut, 40)))}) wurde ignoriert, vermutlich ein Log-Präfix.` });
      return l.slice(cut);
    }
    return l;
  });
  // Alles in einer Zeile: Segmente durch Leerzeichen getrennt?
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length === 1 && /^\s*MSH[^A-Za-z0-9]/.test(nonEmpty[0])) {
    const one = nonEmpty[0];
    const parts = one.split(/[ \t]+(?=[A-Z][A-Z0-9]{2}[|])/);
    if (parts.length > 1) {
      lines = parts;
      notes.push({ level: "warn", code: "space-breaks", text: `Die Nachricht stand in einer Zeile; ${parts.length} Segmente wurden an Leerzeichen vor einer Segmentkennung getrennt. Das ist eine Vermutung: Steht in einem Textfeld selbst „ABC|“, wäre die Trennung falsch.` });
    }
  }
  return { lines, notes, hadMllp: mllpStart + mllpEnd > 0 };
}

/** Liest die Trennzeichen aus der MSH-Zeile (MSH-1 und MSH-2). */
export function readEncoding(mshLine) {
  const field = mshLine[3];
  const enc = { ...DEFAULT_ENC };
  const issues = [];
  if (!field) return { enc, issues: [{ level: "error", code: "no-sep", text: "Hinter „MSH“ fehlt das Feldtrennzeichen (MSH-1)." }] };
  enc.field = field;
  const end = mshLine.indexOf(field, 4);
  const encStr = end < 0 ? mshLine.slice(4) : mshLine.slice(4, end);
  if (encStr.length >= 4) {
    enc.comp = encStr[0]; enc.rep = encStr[1]; enc.esc = encStr[2]; enc.sub = encStr[3];
    if (encStr.length > 4) enc.trunc = encStr[4];
  } else {
    issues.push({ level: "error", code: "short-enc", text: `MSH-2 enthält nur ${encStr.length} statt mindestens 4 Kodierzeichen („${encStr}“). Es werden die Standardzeichen ^ ~ \\ & verwendet, damit die Nachricht trotzdem lesbar bleibt.` });
  }
  const chars = [enc.field, enc.comp, enc.rep, enc.esc, enc.sub];
  if (new Set(chars).size !== chars.length) issues.push({ level: "error", code: "dup-sep", text: "Zwei Trennzeichen in MSH-1/MSH-2 sind identisch. Eindeutiges Lesen ist dann nicht möglich." });
  const std = enc.field === "|" && enc.comp === "^" && enc.rep === "~" && enc.esc === "\\" && enc.sub === "&";
  if (!std && !issues.length) issues.push({ level: "info", code: "nonstd-sep", text: `Ungewöhnliche Trennzeichen: Feld „${enc.field}“, Komponente „${enc.comp}“, Wiederholung „${enc.rep}“, Escape „${enc.esc}“, Subkomponente „${enc.sub}“. Üblich sind | ^ ~ \\ &.` });
  return { enc, issues, std };
}

function hexToText(hex) {
  const bytes = [];
  for (let i = 0; i + 1 < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  if (bytes.some(Number.isNaN)) return null;
  try { return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)); }
  catch { return String.fromCharCode(...bytes); }
}

/** Löst HL7-Escape-Sequenzen auf. Nicht unterstützte Sequenzen (\C…\, \M…\, \Z…\) bleiben sichtbar stehen. */
export function unescapeText(s, enc = DEFAULT_ENC) {
  if (!s || !s.includes(enc.esc)) return s;
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c !== enc.esc) { out += c; i++; continue; }
    const j = s.indexOf(enc.esc, i + 1);
    if (j < 0) { out += s.slice(i); break; }
    const tok = s.slice(i + 1, j);
    let rep = null;
    if (tok === "F") rep = enc.field;
    else if (tok === "S") rep = enc.comp;
    else if (tok === "T") rep = enc.sub;
    else if (tok === "R") rep = enc.rep;
    else if (tok === "E") rep = enc.esc;
    else if (tok === "H" || tok === "N") rep = "";
    else if (/^\.br$/i.test(tok)) rep = "\n";
    else if (/^\.sp(\d*)$/i.test(tok)) rep = "\n";
    else if (/^\.(fi|nf|in|ti|sk|ce)/i.test(tok)) rep = "";
    else if (/^X([0-9A-Fa-f]{2})+$/.test(tok)) rep = hexToText(tok.slice(1));
    if (rep === null) { out += s.slice(i, j + 1); i = j + 1; } // unbekannt: unverändert
    else { out += rep; i = j + 1; }
  }
  return out;
}

function parseField(raw, enc, n, isEncChars) {
  if (raw === "") return { n, raw, empty: true, reps: [] };
  if (isEncChars) return { n, raw, reps: [{ raw, comps: [{ raw, subs: [raw] }] }] };
  const isNull = raw === '""';
  const reps = raw.split(enc.rep).map((r) => ({
    raw: r,
    comps: r.split(enc.comp).map((c) => ({ raw: c, subs: c.split(enc.sub).map((x) => unescapeText(x, enc)) })),
  }));
  return { n, raw, reps, isNull };
}

export function parseSegment(line, enc, lineNo = 0) {
  const id = line.slice(0, 3);
  const valid = SEG_ID.test(id) && (line.length === 3 || line[3] === enc.field);
  if (!valid) return { id: "", raw: line, line: lineNo, fields: [], invalid: true };
  const parts = line.split(enc.field);
  const fields = [];
  if (id === "MSH") {
    fields[1] = { n: 1, raw: enc.field, reps: [{ raw: enc.field, comps: [{ raw: enc.field, subs: [enc.field] }] }] };
    for (let k = 1; k < parts.length; k++) fields[k + 1] = parseField(parts[k], enc, k + 1, k === 1);
  } else {
    for (let k = 1; k < parts.length; k++) fields[k] = parseField(parts[k], enc, k, false);
  }
  return { id, raw: line, line: lineNo, fields };
}

/** Teilt Zeilen in Nachrichten (jede MSH-Zeile beginnt eine neue) und trennt Batch-Segmente ab. */
export function splitMessages(lines) {
  const messages = [];
  const batch = [];
  const stray = [];
  let cur = null;
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const line = raw.trimStart();
    if (/^MSH[^A-Za-z0-9]/.test(line)) { cur = { lines: [{ raw: line, no: i + 1 }] }; messages.push(cur); return; }
    if (BATCH.has(line.slice(0, 3)) && /^[A-Z]{3}[^A-Za-z0-9]/.test(line)) { batch.push({ raw: line, no: i + 1 }); return; }
    if (!cur) { stray.push({ raw: line, no: i + 1 }); return; }
    cur.lines.push({ raw: line, no: i + 1 });
  });
  return { messages, batch, stray };
}

export function fieldText(f, rep = 0, comp = 1, sub = 1) {
  const r = f?.reps?.[rep]; const c = r?.comps?.[comp - 1]; return c?.subs?.[sub - 1] ?? "";
}
/** Wert eines Feldpfads wie "PID-5.2" (erste Wiederholung) aus einer geparsten Nachricht. */
export function getValue(msg, path) {
  const m = /^([A-Z][A-Z0-9]{2})(?:\[(\d+)\])?-(\d+)(?:\[(\d+)\])?(?:\.(\d+))?(?:\.(\d+))?$/.exec(path);
  if (!m) return "";
  const seg = msg.segments.filter((s) => s.id === m[1])[Number(m[2] || 1) - 1];
  if (!seg) return "";
  return fieldText(seg.fields[Number(m[3])], Number(m[4] || 1) - 1, Number(m[5] || 1), Number(m[6] || 1));
}

export function parseMessage(chunk, lineOffset = 0) {
  const first = chunk.lines[0].raw;
  const { enc, issues, std } = readEncoding(first);
  const segments = chunk.lines.map((l) => parseSegment(l.raw, enc, l.no));
  const msg = { enc, std, segments, hints: [...issues], lineStart: chunk.lines[0].no, lineEnd: chunk.lines[chunk.lines.length - 1].no };
  const msh = segments[0];
  const mt = msh.fields[9];
  msg.type = { code: fieldText(mt, 0, 1), trigger: fieldText(mt, 0, 2), structure: fieldText(mt, 0, 3) };
  msg.typeLabel = msg.type.code ? msg.type.code + (msg.type.trigger ? "^" + msg.type.trigger : "") : "";
  msg.version = fieldText(msh.fields[12], 0, 1);
  msg.controlId = fieldText(msh.fields[10]);
  msg.timestamp = fieldText(msh.fields[7]);
  msg.sender = [fieldText(msh.fields[3]), fieldText(msh.fields[4])].filter(Boolean).join(" / ");
  msg.receiver = [fieldText(msh.fields[5]), fieldText(msh.fields[6])].filter(Boolean).join(" / ");
  msg.charset = fieldText(msh.fields[18], 0, 1);
  msg.processing = fieldText(msh.fields[11], 0, 1);
  return msg;
}

/** Komplett: Text → { messages, notes, batch, stray } (ohne Prüfhinweise; die liefert validate.js). */
export function parseAll(input, { limit = Infinity } = {}) {
  const { lines, notes } = normalizeInput(input);
  const { messages, batch, stray } = splitMessages(lines);
  const out = [];
  for (const c of messages) { if (out.length >= limit) break; out.push(parseMessage(c)); }
  if (batch.length) notes.push({ level: "info", code: "batch", text: `Batch-Rahmen (${[...new Set(batch.map((b) => b.raw.slice(0, 3)))].join(", ")}) erkannt. Die Nachrichten darin werden einzeln angezeigt.` });
  if (stray.length) notes.push({ level: "warn", code: "stray", text: `${stray.length} Zeile(n) vor der ersten MSH-Zeile wurden ignoriert (erste: ${JSON.stringify(stray[0].raw.slice(0, 50))}).` });
  return { messages: out, total: messages.length, notes, batch, stray };
}

/** Baut die Nachricht als Text mit \r zwischen den Segmenten (optional mit MLLP-Rahmen). */
export function serialize(msg, { mllp = false } = {}) {
  const body = msg.segments.map((s) => s.raw).join("\r") + "\r";
  return mllp ? "\x0b" + body + "\x1c\r" : body;
}

/** Text unter der Dateiauswahl: Name und Größe, bei 0 Byte ein klarer Hinweis. */
export function fileNote(name, byteLength, note = "") {
  if (!byteLength) return `${name}: Die Datei ist leer.`;
  return `${name} (${(byteLength / 1024).toFixed(1)} KB)${note ? ". " + note : ""}`;
}
