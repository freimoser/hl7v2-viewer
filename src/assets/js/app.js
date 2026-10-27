import { parseAll, serialize, fileNote } from "./core/parser.js";
import { checkMessage } from "./core/validate.js";
import { fieldInfo, segmentInfo, componentName, codeMeaning, DATATYPES } from "./core/dict.js";
import { describeType } from "./core/messages.js";
import { ALL_EXAMPLES, getExample } from "./core/examples.js";
import { toJSON, toCSV } from "./core/export.js";
import { mountAnonPanel } from "./anon-panel.js";

const $ = (id) => document.getElementById(id);
const isEmpty = (f) => !f.isNull && f.raw === "";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inp = $("hl7-in");
const state = { result: null, mi: 0, view: "tree", showEmpty: false, bytes: null, fileName: "", seq: 0 };
let worker = null, workerFailed = false, pending = new Map();

function getWorker() {
  if (worker || workerFailed) return worker;
  try {
    worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    worker.onmessage = (e) => { const p = pending.get(e.data.id); if (p) { pending.delete(e.data.id); e.data.error ? p.reject(new Error(e.data.error)) : p.resolve(e.data.result); } };
    worker.onerror = () => { workerFailed = true; worker = null; for (const p of pending.values()) p.reject(new Error("worker")); pending.clear(); };
  } catch { workerFailed = true; worker = null; }
  return worker;
}
function parseText(text) {
  const inline = () => { const r = parseAll(text, { limit: 500 }); r.messages.forEach(checkMessage); return r; };
  if (text.length < 60000) return Promise.resolve(inline());
  const w = getWorker();
  if (!w) return Promise.resolve(inline());
  return new Promise((resolve, reject) => { const id = ++state.seq; pending.set(id, { resolve, reject }); w.postMessage({ id, text }); }).catch(() => inline());
}

/* ---------- Darstellung ---------- */
function formatDtm(v) {
  const m = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:\.\d+)?([+-]\d{4})?$/.exec(v);
  if (!m) return "";
  let s = m[3] ? `${m[3]}.${m[2]}.${m[1]}` : m[2] ? `${m[2]}/${m[1]}` : m[1];
  if (m[4]) s += ` ${m[4]}:${m[5] || "00"}${m[6] ? ":" + m[6] : ""}`;
  if (m[7]) s += ` (Zeitzone ${m[7]})`;
  return s;
}
function valueHtml(f, enc) {
  if (f.isNull) return '<span class="cmp nullv" data-r="0" data-c="0">„“ (Nullwert)</span>';
  return f.reps.map((r, ri) => `<span class="rep">${r.comps.map((c, ci) => {
    const t = c.subs.join(enc.sub);
    return `<span class="cmp${t === "" ? " emp" : ""}" data-r="${ri}" data-c="${ci}">${t === "" ? "" : esc(t)}</span>`;
  }).join(`<span class="sep">${esc(enc.comp)}</span>`)}</span>`).join(`<span class="sep rsep">${esc(enc.rep)}</span>`);
}
function rawHtml(line, enc) {
  const map = { [enc.field]: "sf", [enc.comp]: "sc", [enc.rep]: "sr", [enc.sub]: "ss" };
  let out = "";
  for (const ch of line) out += map[ch] ? `<span class="${map[ch]}">${esc(ch)}</span>` : esc(ch);
  return out;
}
function levelLabel(l) { return l === "error" ? "Fehler" : l === "warn" ? "Hinweis" : "Info"; }

function renderSummary(m, total) {
  const d = describeType(m);
  const rows = [];
  rows.push(["Nachrichtentyp", m.typeLabel ? `<strong>${esc(m.typeLabel)}</strong>${m.type.structure ? ` <span class="muted">(Struktur ${esc(m.type.structure)})</span>` : ""}` : "unbekannt"]);
  if (d.trigger) rows.push(["Bedeutung", `${esc(d.trigger.name)}: ${esc(d.trigger.desc)}`]);
  else if (d.group) rows.push(["Gruppe", `${esc(d.group.name)}. ${esc(d.group.desc)}`]);
  if (d.trigger && d.group) rows.push(["Gruppe", esc(d.group.name)]);
  rows.push(["Version", esc(m.version || "nicht angegeben")]);
  rows.push(["Kontroll-ID", esc(m.controlId || "—")]);
  rows.push(["Absender → Empfänger", `${esc(m.sender || "—")} → ${esc(m.receiver || "—")}`]);
  rows.push(["Erstellt", `${esc(m.timestamp || "—")}${formatDtm(m.timestamp) ? ` <span class="muted">(${esc(formatDtm(m.timestamp))})</span>` : ""}`]);
  rows.push(["Segmente", `${m.segments.length}: ${esc([...new Set(m.segments.map((s) => s.id || "?"))].join(" "))}`]);
  rows.push(["Trennzeichen", `Feld <code>${esc(m.enc.field)}</code> Komponente <code>${esc(m.enc.comp)}</code> Wiederholung <code>${esc(m.enc.rep)}</code> Escape <code>${esc(m.enc.esc)}</code> Subkomponente <code>${esc(m.enc.sub)}</code>`]);
  return `<dl class="sum">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}
function renderHints(m, notes) {
  const all = [...notes.map((n) => ({ ...n, src: "input" })), ...m.hints];
  if (!all.length) return '<p class="ok-note">Keine Auffälligkeiten gefunden. Das ist keine Konformitätsprüfung.</p>';
  const cnt = { error: 0, warn: 0, info: 0 }; all.forEach((h) => cnt[h.level]++);
  return `<details class="hints" ${cnt.error + cnt.warn ? "open" : ""}><summary>Hinweise: ${cnt.error} Fehler, ${cnt.warn} Auffälligkeiten, ${cnt.info} Infos</summary><ul>${all.map((h) => `<li class="h-${h.level}"><span class="lv">${levelLabel(h.level)}</span> ${esc(h.text)}${h.line ? ` <a href="#seg-${state.mi}-${h.line}" class="jump">Zeile ${h.line}</a>` : ""}</li>`).join("")}</ul></details>`;
}
function segMeta(s) { return s.invalid ? { name: "Keine gültige Segmentzeile", known: false } : segmentInfo(s.id); }

function renderTree(m, limit) {
  const parts = [];
  m.segments.slice(0, limit).forEach((s, si) => {
    const info = segMeta(s);
    const rows = [];
    if (s.invalid) rows.push(`<div class="fld raw-line" tabindex="0">${esc(s.raw)}</div>`);
    else s.fields.forEach((f, n) => {
      if (!f) return;
      if (isEmpty(f) && !state.showEmpty) return;
      const fi = fieldInfo(s.id, n);
      rows.push(`<div class="fld${fi.key ? " keyf" : ""}${isEmpty(f) ? " is-empty" : ""}" tabindex="0" data-s="${si}" data-f="${n}"><span class="fno">${s.id}-${n}</span><span class="fnm">${esc(fi.name)}</span><span class="fval">${isEmpty(f) ? '<span class="muted">leer</span>' : valueHtml(f, m.enc)}</span></div>`);
    });
    parts.push(`<details class="seg" open id="seg-${state.mi}-${s.line}"><summary data-s="${si}"><span class="sid">${esc(s.id || "?")}</span> <span class="snm">${esc(info.name)}</span> <span class="ln">Zeile ${s.line}</span></summary><div class="flds">${rows.join("") || '<p class="muted pad">Keine gefüllten Felder.</p>'}</div></details>`);
  });
  if (m.segments.length > limit) parts.push(`<button type="button" class="btn ghost" id="more-seg">Alle ${m.segments.length} Segmente anzeigen</button>`);
  return parts.join("");
}
function renderTable(m, limit) {
  const rows = [];
  m.segments.slice(0, limit).forEach((s, si) => {
    if (s.invalid) { rows.push(`<tr id="seg-${state.mi}-${s.line}"><td>?</td><td colspan="4">${esc(s.raw)}</td></tr>`); return; }
    let first = true;
    s.fields.forEach((f, n) => {
      if (!f || (isEmpty(f) && !state.showEmpty)) return;
      const fi = fieldInfo(s.id, n);
      rows.push(`<tr class="fld${fi.key ? " keyf" : ""}" data-s="${si}" data-f="${n}" tabindex="0"${first ? ` id="seg-${state.mi}-${s.line}"` : ""}><td class="t-seg">${s.id}</td><td class="t-no">${n}</td><td class="t-nm">${esc(fi.name)}</td><td class="t-ty">${esc(fi.type)}</td><td class="t-val">${isEmpty(f) ? '<span class="muted">leer</span>' : valueHtml(f, m.enc)}</td></tr>`);
      first = false;
    });
  });
  const more = m.segments.length > limit ? `<button type="button" class="btn ghost" id="more-seg">Alle ${m.segments.length} Segmente anzeigen</button>` : "";
  return `<div class="tbl-wrap"><table class="ft"><thead><tr><th>Segment</th><th>Feld</th><th>Name</th><th>Typ</th><th>Wert</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>${more}`;
}
function renderRaw(m, limit) {
  return `<pre class="rawv" tabindex="0">${m.segments.slice(0, limit).map((s) => `<span class="rl" id="seg-${state.mi}-${s.line}"><span class="rln">${s.line}</span>${rawHtml(s.raw, m.enc)}</span>`).join("\n")}</pre>`;
}

let segLimit = 200;
function render() {
  const out = $("result");
  const r = state.result;
  if (!r || !r.messages.length) {
    const txt = inp.value.trim();
    out.hidden = !txt;
    if (txt) out.innerHTML = `<div class="warnbox"><strong>Keine HL7-Nachricht erkannt.</strong> Eine v2-Nachricht beginnt mit „MSH“ gefolgt vom Feldtrenner, meist <code>MSH|^~\\&amp;|…</code>. ${r?.notes?.length ? esc(r.notes.map((n) => n.text).join(" ")) : ""} Prüfen Sie, ob der Anfang beim Kopieren abgeschnitten wurde, oder laden Sie ein Beispiel.</div>`;
    $("exports").hidden = true;
    return;
  }
  const m = r.messages[state.mi];
  const sel = r.messages.length > 1 ? `<label class="msel">Nachricht <select id="msg-sel">${r.messages.map((x, i) => `<option value="${i}"${i === state.mi ? " selected" : ""}>${i + 1}: ${esc(x.typeLabel || "?")} ${esc(x.controlId || "")}</option>`).join("")}</select> <span class="muted">von ${r.total}${r.total > r.messages.length ? ` (angezeigt: erste ${r.messages.length})` : ""}</span></label>` : "";
  const body = state.view === "tree" ? renderTree(m, segLimit) : state.view === "table" ? renderTable(m, segLimit) : renderRaw(m, segLimit);
  out.hidden = false;
  out.innerHTML = `${sel}${renderSummary(m, r.total)}${renderHints(m, state.mi === 0 ? r.notes : [])}
  <div class="vbar" role="group" aria-label="Ansicht">
    ${[["tree", "Baum"], ["table", "Tabelle"], ["raw", "Rohtext"]].map(([k, l]) => `<button type="button" class="tab${state.view === k ? " on" : ""}" data-view="${k}" aria-pressed="${state.view === k}">${l}</button>`).join("")}
    <label class="chk"><input type="checkbox" id="show-empty"${state.showEmpty ? " checked" : ""}> leere Felder</label>
  </div>
  <p class="tiphint">Tippen oder mit der Maus über ein Feld fahren, um Name, Datentyp und Bedeutung zu sehen.</p>
  <div class="view view-${state.view}">${body}</div>`;
  $("exports").hidden = false;
}

/* ---------- Tooltip ---------- */
const tip = $("tip");
let tipTarget = null, curCmp = null;
function describe(el) {
  const r = state.result; if (!r) return null;
  const m = r.messages[state.mi]; const seg = m?.segments[Number(el.dataset.s)];
  if (!seg) return null;
  if (!el.dataset.f) { const i = segMeta(seg); return { title: `${seg.id || "?"} · ${i.name}`, body: i.desc || "", value: "" }; }
  const n = Number(el.dataset.f); const f = seg.fields[n]; const fi = fieldInfo(seg.id, n);
  const c = curCmp && el.contains(curCmp) ? curCmp : null;
  const label = `${seg.id}-${n} · ${fi.name}`;
  const typeName = fi.type ? `${fi.type}${DATATYPES[fi.type] ? ` (${DATATYPES[fi.type]})` : ""}` : "";
  let body = fi.known ? fi.desc : `Dieses Feld ist im Viewer nicht beschrieben${/^Z/.test(seg.id) ? " (lokale Erweiterung)" : ""}. Maßgeblich ist die Schnittstellenbeschreibung.`;
  let title = label, value = "", extra = "";
  if (c) {
    const ri = Number(c.dataset.r), ci = Number(c.dataset.c);
    title = `${seg.id}-${n}${f.reps.length > 1 ? `[${ri + 1}]` : ""}.${ci + 1} · ${fi.type && fi.type !== "var" ? componentName(fi.type, ci + 1) : `Komponente ${ci + 1}`}`;
    const v = f.reps[ri]?.comps[ci]?.subs.join(m.enc.sub) ?? "";
    value = v;
    const cm = codeMeaning(seg.id, n, v); if (cm && ci === 0) extra = `Bedeutung des Codes: ${cm}`;
    if (/^(DTM|TS|DT)$/.test(fi.type) && ci === 0 && formatDtm(v)) extra = `Als Datum: ${formatDtm(v)}`;
    body = `Teil von ${label}${typeName ? ` (${typeName})` : ""}. ${fi.known ? fi.desc : ""}`;
  } else {
    const v = f.reps?.[0]?.comps?.length === 1 && f.reps.length === 1 ? f.reps[0].comps[0].subs.join(m.enc.sub) : "";
    if (v) { const cm = codeMeaning(seg.id, n, v); if (cm) extra = `Bedeutung des Codes: ${cm}`; if (/^(DTM|TS|DT)$/.test(fi.type) && formatDtm(v)) extra = `Als Datum: ${formatDtm(v)}`; }
    if (typeName) body = `${typeName}. ${body}`;
  }
  return { title, body, value, extra };
}
function showTip(el, pinned) {
  const d = describe(el); if (!d) return hideTip();
  tip.innerHTML = `<div class="tt">${esc(d.title)}</div><div class="tb">${esc(d.body)}</div>${d.value ? `<div class="tv"><span>Wert</span> <code>${esc(d.value.length > 200 ? d.value.slice(0, 200) + "…" : d.value)}</code></div>` : ""}${d.extra ? `<div class="te">${esc(d.extra)}</div>` : ""}${pinned ? '<button type="button" class="tx" aria-label="Schließen">×</button>' : ""}`;
  tip.hidden = false; tipTarget = el; tip.dataset.pinned = pinned ? "1" : "";
  place(el);
}
function place(el) {
  const small = matchMedia("(max-width: 760px)").matches || !matchMedia("(hover: hover)").matches;
  tip.classList.toggle("sheet", small);
  if (small) { tip.style.left = ""; tip.style.top = ""; return; }
  const r = el.getBoundingClientRect(); const tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = Math.min(Math.max(8, r.left), innerWidth - tw - 8);
  let y = r.bottom + 6; if (y + th > innerHeight - 8) y = Math.max(8, r.top - th - 6);
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
function hideTip() { tip.hidden = true; tipTarget = null; tip.dataset.pinned = ""; }
const targetOf = (t) => t.closest?.(".fld, summary[data-s]");
const root = $("result");
root.addEventListener("pointerover", (e) => { if (e.pointerType === "touch" || tip.dataset.pinned) return; const t = targetOf(e.target); if (t && t.dataset.s !== undefined) { const c = e.target.closest(".cmp"); if (t !== tipTarget || c !== curCmp) { curCmp = c; showTip(t, false); } } else if (!tip.dataset.pinned) hideTip(); });
root.addEventListener("pointerleave", () => { if (!tip.dataset.pinned) hideTip(); });
root.addEventListener("click", (e) => {
  const t = targetOf(e.target);
  const v = e.target.closest("[data-view]"); if (v) { state.view = v.dataset.view; render(); return; }
  if (e.target.id === "more-seg") { segLimit = Infinity; render(); return; }
  if (e.target.closest("a.jump")) return;
  if (t && t.dataset.s !== undefined && !(t.tagName === "SUMMARY" && !matchMedia("(hover: none)").matches)) { if (t.tagName === "SUMMARY") return; curCmp = e.target.closest(".cmp"); showTip(t, true); e.stopPropagation(); }
});
root.addEventListener("keydown", (e) => { const t = e.target; if ((e.key === "Enter" || e.key === " ") && t.classList?.contains("fld") && t.dataset.s !== undefined) { e.preventDefault(); curCmp = null; showTip(t, true); } });
root.addEventListener("focusin", (e) => { const t = e.target; if (t.classList?.contains("fld") && t.dataset.s !== undefined && !tip.dataset.pinned) { curCmp = null; showTip(t, false); } });
root.addEventListener("change", (e) => {
  if (e.target.id === "show-empty") { state.showEmpty = e.target.checked; render(); }
  if (e.target.id === "msg-sel") { state.mi = Number(e.target.value); segLimit = 200; render(); }
});
document.addEventListener("click", (e) => { if (tip.dataset.pinned && !tip.contains(e.target) && !targetOf(e.target)) hideTip(); if (e.target.closest?.(".tx")) hideTip(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });
addEventListener("scroll", () => { if (tipTarget && !tip.dataset.pinned) hideTip(); }, { passive: true });

/* ---------- Eingabe ---------- */
let timer = null;
async function update() {
  const text = inp.value;
  state.mi = 0; segLimit = 200; hideTip();
  if (!text.trim()) { state.result = null; render(); $("status").textContent = ""; return; }
  $("status").textContent = "Wird gelesen …";
  try {
    state.result = await parseText(text);
    const n = state.result.messages.length;
    $("status").textContent = n ? `${state.result.total} Nachricht(en) gelesen, lokal im Browser.` : "";
  } catch (err) { state.result = null; $("status").textContent = "Fehler beim Lesen: " + err.message; }
  render();
}
inp.addEventListener("input", () => { state.bytes = null; clearTimeout(timer); timer = setTimeout(update, 250); });
function setText(t, hash) { inp.value = t.replace(/\r\n|\r/g, "\n"); state.bytes = null; update(); if (hash) $("viewer").scrollIntoView({ block: "start" }); }
function loadExample(id, scroll = true) {
  const e = getExample(id); if (!e) return;
  setText(e.text, false); $("ex-note").textContent = `${e.title}: ${e.note}`;
  document.querySelectorAll(".ex-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ex === id)));
  if (scroll) $("viewer").scrollIntoView({ block: "start" });
}
$("examples").innerHTML = ALL_EXAMPLES.map((e) => `<button type="button" class="chip ex-btn" data-ex="${e.id}" aria-pressed="false">${esc(e.label)}</button>`).join("");
$("examples").addEventListener("click", (e) => { const b = e.target.closest(".ex-btn"); if (b) loadExample(b.dataset.ex, false); });
$("clear").addEventListener("click", () => { inp.value = ""; $("ex-note").textContent = ""; document.querySelectorAll(".ex-btn").forEach((b) => b.setAttribute("aria-pressed", "false")); update(); inp.focus(); });

function decode(bytes, label) {
  if (label === "auto") {
    try { return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), note: "" }; }
    catch { return { text: new TextDecoder("windows-1252").decode(bytes), note: "Die Datei ist kein gültiges UTF-8 und wurde als Windows-1252 gelesen. Falls Umlaute falsch aussehen, wählen Sie einen anderen Zeichensatz." }; }
  }
  return { text: new TextDecoder(label).decode(bytes), note: "" };
}
async function loadFile(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) { $("status").textContent = "Datei ist größer als 25 MB. Bitte kleiner aufteilen."; return; }
  state.bytes = new Uint8Array(await file.arrayBuffer()); state.fileName = file.name;
  applyBytes();
}
function applyBytes() {
  if (!state.bytes) return;
  const { text, note } = decode(state.bytes, $("charset").value);
  inp.value = text.replace(/\r\n|\r/g, "\n").replace(/\x0b|\x1c/g, (c) => c);
  const keep = state.bytes;
  update().then(() => { state.bytes = keep; $("file-note").textContent = fileNote(state.fileName, keep.length, note); if (!keep.length) $("status").textContent = "Die Datei ist leer."; });
}
$("file").addEventListener("change", (e) => loadFile(e.target.files[0]));
$("charset").addEventListener("change", applyBytes);
inp.addEventListener("dragover", (e) => { e.preventDefault(); inp.classList.add("drag"); });
inp.addEventListener("dragleave", () => inp.classList.remove("drag"));
inp.addEventListener("drop", (e) => { e.preventDefault(); inp.classList.remove("drag"); loadFile(e.dataTransfer.files[0]); });

/* ---------- Export, Reparatur ---------- */
function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const msgs = () => state.result?.messages || [];
$("ex-json").addEventListener("click", () => download("hl7-nachricht.json", JSON.stringify(toJSON(msgs()), null, 2), "application/json"));
$("ex-csv").addEventListener("click", () => download("hl7-nachricht.csv", toCSV(msgs(), { safe: $("csv-safe").checked }), "text/csv;charset=utf-8"));
function repaired() { const mllp = $("fix-mllp").checked; return msgs().map((m) => serialize(m, { mllp })).join(""); }
$("fix-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(repaired()); $("fix-note").textContent = "Kopiert: Segmente mit \\r getrennt."; }
  catch { $("fix-note").textContent = "Kopieren nicht erlaubt. Nutzen Sie „Als Datei speichern“."; }
});
$("fix-dl").addEventListener("click", () => { download("nachricht-repariert.hl7", repaired(), "application/octet-stream"); $("fix-note").textContent = "Datei gespeichert, Segmente mit \\r getrennt."; });

/* ---------- Anonymisieren ---------- */
mountAnonPanel({ getText: () => inp.value, onShow: (t) => { setText(t, true); $("ex-note").textContent = "Anonymisierte Fassung (nur zur Ansicht, bitte prüfen)."; } });

/* ---------- Start ---------- */
function fromHash() {
  const m = /beispiel=([a-z0-9-]+)/.exec(location.hash);
  if (m) loadExample(m[1], true);
}
addEventListener("hashchange", fromHash);
fromHash();
