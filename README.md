# HL7-v2-Viewer

Viewer und Parser für HL7-v2-Nachrichten (Pipe-Format) im Browser. Alles läuft lokal: kein Upload, keine Cookies, keine externen Ressourcen, `connect-src 'none'` per Content-Security-Policy.

Live: https://freimoser.github.io/hl7v2-viewer/

## Funktionen

- Nachricht einfügen oder Datei öffnen, auch mehrere Nachrichten, MLLP-Rahmen und Log-Präfix
- Baum- und Tabellenansicht, Tooltips mit Feldbeschreibung, Z-Segmente
- Erkennung des Nachrichtentyps, Hinweise auf Formatfehler, Reparatur von Zeilenumbrüchen
- Export als JSON und CSV, Anonymisierung
- Erklärseiten zu Aufbau, Nachrichtentypen, Segmenten und häufigen Fehlern

Der Viewer liest und zeigt an. Er ist kein Konformitätsprüfer, kein Schnittstellentest und kein Medizinprodukt.

## Entwicklung

Node.js ab Version 20, keine Abhängigkeiten.

```
npm test           # Tests für Parser, Prüfung, Anonymisierung
npm run build      # erzeugt dist/ und quellen.md, prüft Links, Title, Description
npm run serve      # lokal unter http://localhost:8766/hl7v2-viewer/
npm run sync       # kopiert dist/ in die Repo-Wurzel (GitHub Pages liefert aus main /)
npm run check      # Prüfung des Build-Ergebnisses
```

Das Build-Ergebnis liegt im Repo, weil GitHub Pages direkt aus `main` (Wurzel) ausliefert. Quellcode: `src/`, Seiten: `scripts/pages/`, Tests: `tests/`.

## Quellen und Lizenz

Siehe [quellen.md](quellen.md) und [THIRD-PARTY-LICENSES](THIRD-PARTY-LICENSES). Code: MIT, siehe [LICENSE](LICENSE).

Entwickelt von Thomas Freimoser, München / Remote.

HL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Projekt ist unabhängig und wird von HL7 International weder bereitgestellt noch empfohlen.
