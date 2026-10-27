import { url, esc, openLink } from "../lib/layout.mjs";
import { lineHtml, legend, preLines, faqHtml } from "../lib/ann.mjs";
import { getExample } from "../../src/assets/js/core/examples.js";

const a01 = getExample("adt-a01");
const a08 = getExample("adt-a08");
const line = (ex, id) => ex.text.split(/\r/).find((l) => l.startsWith(id + "|"));
const pid = line(a01, "PID");
const pid3 = pid.split("|")[3];

export default {
  path: "hl7-nachricht-aufbau/",
  title: "HL7-Nachricht Aufbau: Segmente, Felder, Trennzeichen",
  description: "So ist eine HL7-v2-Nachricht aufgebaut: Segmente, Felder, Komponenten, Trennzeichen, Escape-Sequenzen und Datentypen mit kommentierter Beispielzeile.",
  h1: "Aufbau einer HL7-v2-Nachricht: Segmente, Felder, Komponenten",
  crumb: "Aufbau",
  keywords: "HL7 Nachricht Aufbau, HL7 v2 Struktur, HL7 Segmente Felder Komponenten, HL7 Trennzeichen, HL7 Escape-Sequenzen, HL7 Datentypen",
  body: `
<p class="lead"><strong>Eine HL7-v2-Nachricht besteht aus Segmenten, jedes Segment aus Feldern, jedes Feld aus Komponenten und diese gegebenenfalls aus Subkomponenten.</strong> Die Ebenen werden durch feste Trennzeichen getrennt, die im ersten Segment, dem MSH, festgelegt sind. Diese Seite erklärt das an echten Beispielzeilen. Die Beispiele sind frei erfunden und lassen sich im <a href="${url("")}">Viewer</a> öffnen.</p>

<h2 id="ebenen">Die vier Ebenen</h2>
<div class="tbl-wrap"><table class="cmpT"><thead><tr><th>Ebene</th><th>Trenner</th><th>Beispiel</th></tr></thead><tbody>
<tr><td>Segment</td><td>Zeilenende (CR)</td><td><code>PID|…</code> ist ein Segment, die Kennung steht am Zeilenanfang</td></tr>
<tr><td>Feld</td><td><code>|</code></td><td>PID-5 ist das fünfte Feld von PID (der Name)</td></tr>
<tr><td>Wiederholung</td><td><code>~</code></td><td>zwei Kennungen in PID-3, durch <code>~</code> getrennt</td></tr>
<tr><td>Komponente</td><td><code>^</code></td><td>Nachname^Vorname in PID-5</td></tr>
<tr><td>Subkomponente</td><td><code>&amp;</code></td><td>Unterteilung einer Komponente, zum Beispiel beim Familiennamen</td></tr>
</tbody></table></div>

<h2 id="zeile">Eine Zeile gelesen</h2>
<p>Das PID-Segment des Aufnahme-Beispiels, mit farbigen Trennzeichen:</p>
${legend()}
<pre class="ex-pre" tabindex="0"><code>${lineHtml(pid)}</code></pre>
<p>Am Zeilenanfang steht die Segmentkennung <code>PID</code>. PID-1 ist <code>1</code>, PID-2 ist leer. In PID-3 stehen zwei Wiederholungen. Die erste lautet <code>${esc(pid3.split("~")[0])}</code> und hat Komponenten:</p>
<div class="tbl-wrap"><table class="cmpT"><thead><tr><th>Teil</th><th>Wert</th><th>Bedeutung</th></tr></thead><tbody>
<tr><td>PID-3[1].1</td><td>TEST-100234</td><td>die Kennung selbst</td></tr>
<tr><td>PID-3[1].4</td><td>KLINIKUM_TEST</td><td>die Stelle, die die Kennung vergeben hat</td></tr>
<tr><td>PID-3[1].5</td><td>MR</td><td>Art der Kennung (hier Patientenakte, „medical record“)</td></tr>
</tbody></table></div>
<p>Die zweite Wiederholung nach dem <code>~</code> hat die Art <code>VN</code>, eine Besuchs- bzw. Fallnummer. Der Viewer schreibt Wiederholungen als <code>[n]</code>, also <code>PID-3[2].1</code>. Andere Werkzeuge schreiben das anders. Welche Komponente was bedeutet, hängt vom Datentyp des Feldes ab (hier CX, eine erweiterte Kennung).</p>
<p>${openLink("adt-a01", "Dieses Beispiel im Viewer öffnen")}</p>

<h2 id="trenner">Trennzeichen kommen aus dem MSH</h2>
<p>Das erste Segment jeder Nachricht ist <code>MSH</code>. Direkt hinter den drei Buchstaben steht das Feldtrennzeichen, danach die vier Kodierzeichen:</p>
<pre class="ex-pre" tabindex="0"><code>${lineHtml("MSH|^~\\&|TESTKIS|KLINIKUM_TEST|TESTLIS|KLINIKUM_TEST|20261027083015||ADT^A01^ADT_A01|MSG-A01-0001|P|2.5.1")}</code></pre>
<div class="tbl-wrap"><table class="cmpT"><thead><tr><th>Zeichen</th><th>Aufgabe</th><th>Wo festgelegt</th></tr></thead><tbody>
<tr><td><code>|</code></td><td>trennt Felder</td><td>MSH-1</td></tr>
<tr><td><code>^</code></td><td>trennt Komponenten</td><td>MSH-2, 1. Zeichen</td></tr>
<tr><td><code>~</code></td><td>trennt Wiederholungen eines Feldes</td><td>MSH-2, 2. Zeichen</td></tr>
<tr><td><code>\\</code></td><td>leitet Escape-Sequenzen ein</td><td>MSH-2, 3. Zeichen</td></tr>
<tr><td><code>&amp;</code></td><td>trennt Subkomponenten</td><td>MSH-2, 4. Zeichen</td></tr>
</tbody></table></div>
<p>Die Zeichen <code>|^~\\&amp;</code> sind der übliche Satz. Ein Empfänger soll sie aus dem MSH lesen und nicht fest voraussetzen. Der Viewer macht das so und weist darauf hin, wenn sie vom Üblichen abweichen.</p>

<h2 id="msh-zaehlung">Die Zählung im MSH weicht ab</h2>
<p>Das Feldtrennzeichen hinter „MSH“ ist selbst MSH-1. Das erste Feld, das Sie nach einem Split an <code>|</code> erhalten, ist deshalb schon MSH-2 (die Kodierzeichen), und MSH-9 ist der Nachrichtentyp. In allen anderen Segmenten ist das erste Feld nach der Kennung Feld 1. Wer MSH wie die anderen Segmente zählt, verschiebt alle Felder um eins.</p>

<h2 id="pfad">Pfadschreibweise</h2>
<p>Ein Wert wird als <code>SEGMENT-Feld.Komponente.Subkomponente</code> angegeben, etwa <code>PID-5.2</code> für den Vornamen oder <code>MSH-9.2</code> für das Auslöseereignis. Bei wiederholten Segmenten (mehrere OBX) unterscheidet die laufende Nummer in Feld 1 die einzelnen Zeilen. Im Viewer zeigt jede Zeile ihren Pfad an.</p>

<h2 id="leer-null">Leer ist nicht gleich „“</h2>
<p>Ein leeres Feld (<code>||</code>) heißt: keine Angabe in dieser Nachricht. Zwei Anführungszeichen (<code>""</code>) sind der <em>Nullwert</em> und bedeuten ausdrücklich, dass ein vorhandener Wert gelöscht werden soll bzw. keiner existiert. Bei Änderungsnachrichten wie ADT^A08 ist das ein Unterschied. Der Viewer zeigt Nullwerte deshalb getrennt an. Überzählige Trennzeichen am Zeilenende (<code>|||</code>) sind erlaubt und verändern nichts.</p>

<h2 id="escape">Escape-Sequenzen</h2>
<p>Kommen Trennzeichen im Text selbst vor, werden sie durch eine Sequenz mit dem Escape-Zeichen ersetzt. Der Buchstabe in der Sequenz steht für das Trennzeichen, das im MSH festgelegt ist.</p>
<div class="tbl-wrap"><table class="cmpT"><thead><tr><th>Sequenz</th><th>Bedeutung</th></tr></thead><tbody>
<tr><td><code>\\F\\</code></td><td>Feldtrennzeichen (üblich <code>|</code>)</td></tr>
<tr><td><code>\\S\\</code></td><td>Komponententrennzeichen (<code>^</code>)</td></tr>
<tr><td><code>\\T\\</code></td><td>Subkomponententrennzeichen (<code>&amp;</code>)</td></tr>
<tr><td><code>\\R\\</code></td><td>Wiederholungstrennzeichen (<code>~</code>)</td></tr>
<tr><td><code>\\E\\</code></td><td>das Escape-Zeichen selbst (<code>\\</code>)</td></tr>
<tr><td><code>\\.br\\</code></td><td>Zeilenumbruch in Freitext</td></tr>
<tr><td><code>\\Xhh…\\</code></td><td>Zeichen als Hexadezimalwert</td></tr>
</tbody></table></div>
<p>Im Änderungs-Beispiel steht die Straße als <code>${esc("Teststraße 12 \\T\\ 14")}</code>. Gemeint ist „Teststraße 12 &amp; 14“. Der Viewer zeigt den entschlüsselten Text und behält den Originaltext im Rohtext bei. Ein unmaskiertes <code>&amp;</code> oder <code>|</code> im Freitext erzeugt dagegen zusätzliche Subkomponenten oder Felder. Das ist eine mögliche Fehlerquelle, siehe <a href="${url("hl7-fehler/")}">Häufige Fehler</a>.</p>

<h2 id="datentypen">Datentypen in Kürze</h2>
<p>Ein Feld hat einen Datentyp, und der legt fest, was die Komponenten bedeuten. Die wichtigsten, mit Beispielen aus den Beispielnachrichten:</p>
<div class="tbl-wrap"><table class="cmpT"><thead><tr><th>Typ</th><th>Bedeutung</th><th>Komponenten, Beispiel</th></tr></thead><tbody>
<tr><td>ST, TX</td><td>Text</td><td>einfacher Text ohne Komponenten</td></tr>
<tr><td>NM</td><td>Zahl</td><td><code>5.9</code>, Dezimalpunkt, kein Komma</td></tr>
<tr><td>DTM / TS</td><td>Zeitpunkt</td><td><code>20261027083015</code> = 27.10.2026 08:30:15</td></tr>
<tr><td>CX</td><td>Kennung</td><td>ID ^ Prüfziffer ^ Verfahren ^ vergebende Stelle ^ Art</td></tr>
<tr><td>XPN</td><td>Personenname</td><td>Nachname ^ Vorname ^ weitere Vornamen ^ Suffix ^ Präfix ^ Titel ^ Namensart</td></tr>
<tr><td>XAD</td><td>Adresse</td><td>Straße ^ Zusatz ^ Ort ^ Bundesland ^ PLZ ^ Land ^ Art</td></tr>
<tr><td>XTN</td><td>Telefon, E-Mail</td><td>Nummer-Komponenten und E-Mail-Komponente, je nach Version</td></tr>
<tr><td>PL</td><td>Aufenthaltsort</td><td>Station ^ Zimmer ^ Bett ^ Einrichtung</td></tr>
<tr><td>CWE / CE</td><td>codierter Wert</td><td>Code ^ Text ^ Codesystem</td></tr>
</tbody></table></div>
<p>Zeitpunkte dürfen gekürzt werden: <code>20261027</code> ist nur das Datum, <code>202610270830</code> hat Minuten. Optional folgt eine Zeitzone, zum Beispiel <code>+0100</code>. Ohne Angabe ist unklar, in welcher Zeitzone der Absender gemeint hat. Die genauen Komponentenlisten je Version stehen in der Spezifikation. Der Viewer beschreibt nur eine Auswahl, unbekannte Stellen erscheinen als „Feld n“.</p>

<h2 id="reihenfolge">Reihenfolge, Gruppen und Z-Segmente</h2>
<p>Welche Segmente in welcher Reihenfolge vorkommen, regelt die Nachrichtenstruktur (MSH-9.3, zum Beispiel <code>ADT_A01</code>). Segmente können optional oder wiederholbar sein und bilden Gruppen: Bei ORU^R01 gehört jedes OBX zum davor stehenden OBR, bis das nächste OBR beginnt. Ein NTE gehört zum Segment direkt davor.</p>
<p>Segmente, deren Name mit <code>Z</code> beginnt (zum Beispiel <code>ZPI</code>), sind lokale Erweiterungen. Ihr Inhalt ist nur durch die Schnittstellenbeschreibung des Absenders erklärbar. Das Änderungs-Beispiel enthält eins:</p>
${preLines(a08.text, ["ZPI"])}

<h2 id="mllp">Zeilenende und MLLP</h2>
<p>Segmente enden mit einem Wagenrücklauf (CR, Hex 0D). Viele Texteditoren, Mails und Logs machen daraus einen Zeilenvorschub (LF) oder CRLF. Der Viewer liest alle drei. Über TCP/IP werden Nachrichten üblicherweise mit dem MLLP-Rahmen übertragen: Ein Startzeichen (Hex 0B) steht vor der Nachricht, danach folgen die Zeichen Hex 1C und 0D. Diese Zeichen gehören nicht zur Nachricht; der Viewer entfernt sie und meldet es. Quelle: <a href="${url("quellen/")}">Quellen</a>.</p>

<h2 id="abgrenzung">Abgrenzung zu FHIR und CDA</h2>
<p>HL7 v2 ist ein Format aus getrennten Zeilen und Feldern. FHIR beschreibt Ressourcen in JSON oder XML, CDA beschreibt klinische Dokumente in XML. Alle drei stammen aus dem Umfeld von HL7 International, sind aber unterschiedliche Formate. Dieser Viewer liest nur das Pipe-Format von v2.</p>

<h2 id="faq-aufbau">Kurz beantwortet</h2>
${faqHtml(faqAufbau())}`,
  faq: faqAufbau(),
};

function faqAufbau() {
  return [
    ["Warum ist MSH-9 der Nachrichtentyp, obwohl er das achte Feld nach MSH ist?",
      "Weil das Feldtrennzeichen hinter „MSH“ als MSH-1 zählt. Das erste Feld nach <code>MSH|</code> ist MSH-2. In allen anderen Segmenten beginnt die Zählung mit dem ersten Feld hinter der Kennung."],
    ["Was ist der Unterschied zwischen ~ und ^?",
      "<code>^</code> trennt Komponenten innerhalb eines Feldwerts (Nachname^Vorname). <code>~</code> trennt mehrere Wiederholungen desselben Feldes, etwa zwei Patientenkennungen in PID-3."],
    ["Wie maskiere ich ein | im Text?",
      "Mit der Escape-Sequenz <code>\\F\\</code>. Entsprechend <code>\\S\\</code> für ^, <code>\\R\\</code> für ~, <code>\\T\\</code> für &amp; und <code>\\E\\</code> für den Backslash. Gemeint sind jeweils die Zeichen, die im MSH festgelegt sind."],
  ];
}
