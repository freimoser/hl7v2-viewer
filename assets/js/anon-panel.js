import { anonymize } from "./core/anonymize.js";

const $ = (id) => document.getElementById(id);

/** Bindet das Anonymisierungs-Panel (Markup siehe layout.mjs: anonPanelHtml). */
export function mountAnonPanel({ getText, onShow, getSource }) {
  const root = $("anon-panel");
  if (!root) return;
  const out = $("anon-out"), report = $("anon-report"), src = $("anon-src");
  let last = "";
  const run = () => {
    const text = src ? src.value : getText();
    if (!text.trim()) { report.textContent = "Keine Nachricht vorhanden. Fügen Sie oben eine HL7-Nachricht ein."; out.value = ""; last = ""; setButtons(false); return; }
    const r = anonymize(text, {
      dates: $("anon-dates").value, freeText: $("anon-free").checked, zSegments: $("anon-z").checked, doctors: $("anon-doc").checked, ids: $("anon-ids").checked,
    });
    last = r.text;
    out.value = r.text.replace(/\r/g, "\n");
    report.textContent = r.messages ? `${r.messages} Nachricht(en) bearbeitet, ${r.maskedFields} Feldinhalte ersetzt. Prüfen Sie das Ergebnis, bevor Sie es weitergeben.` : "Keine MSH-Zeile gefunden, nichts bearbeitet.";
    setButtons(!!r.messages);
  };
  const setButtons = (on) => { for (const id of ["anon-copy", "anon-dl", "anon-show"]) { const b = $(id); if (b) b.disabled = !on; } };
  $("anon-run").addEventListener("click", run);
  $("anon-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(last); report.textContent += " In die Zwischenablage kopiert."; }
    catch { out.focus(); out.select(); report.textContent += " Kopieren nicht erlaubt, Text ist markiert: bitte mit Strg+C kopieren."; }
  });
  $("anon-dl").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([last], { type: "text/plain;charset=utf-8" }));
    a.download = "anonymisiert.hl7"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  const show = $("anon-show");
  if (show && onShow) show.addEventListener("click", () => onShow(last));
  setButtons(false);
  const ex = $("anon-example");
  if (ex && getSource) ex.addEventListener("click", () => { src.value = getSource(); run(); });
}
