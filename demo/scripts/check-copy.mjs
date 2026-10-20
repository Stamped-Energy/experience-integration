// Copy rules (spec §14) over src/: no em dashes, no banned words, no client names, no WhatsApp, no Maintenance area.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const BAD = [/\u2014/, /\bunlock/i, /superpower/i, /whatsapp/i, /jaipur/i, /digital twin/i, /recommends and your team decides/i, /\bcolor\b(?![-:(])/];
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) && files.push(p); } };
walk("src");
let fail = 0;
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (f.endsWith(".css") && /color/.test(line)) return; // CSS property names are fine
    for (const re of BAD) if (re.test(line)) { console.error(`${f}:${i + 1} ${re} ${line.trim().slice(0, 100)}`); fail++; }
  });
}
if (fail) { console.error(`${fail} copy rule violations`); process.exit(1); }
console.log(`copy check passed (${files.length} files)`);
