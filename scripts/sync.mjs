/** Kopiert dist/ in die Repo-Wurzel (GitHub Pages liefert von main /). Alte Build-Dateien werden anhand des Manifests entfernt. */
import { readdirSync, readFileSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const mf = join(root, ".build-manifest.json");
if (!existsSync(join(dist, "index.html"))) { console.error("dist/ fehlt: erst npm run build"); process.exit(1); }
const RESERVED = new Set(["src", "scripts", "tests", "node_modules", ".git", "dist", "package.json", "README.md", "LICENSE", "quellen.md", "THIRD-PARTY-LICENSES", ".gitignore", ".build-manifest.json"]);
const old = existsSync(mf) ? JSON.parse(readFileSync(mf, "utf8")) : [];
for (const n of old) rmSync(join(root, n), { recursive: true, force: true });
const now = readdirSync(dist);
for (const n of now) { if (RESERVED.has(n)) throw new Error("Namenskonflikt mit Quellordner: " + n); cpSync(join(dist, n), join(root, n), { recursive: true }); }
writeFileSync(mf, JSON.stringify(now.sort(), null, 1) + "\n");
console.log(`${now.length} Einträge nach ${root} kopiert.`);
