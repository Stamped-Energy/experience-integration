// Copy rules (spec §14) over src/: no em dashes, no banned words, no client names, no WhatsApp, no Maintenance area.
// Client app routes also ban ADR codes, get_* tool names, SECOM and PlantCraft (Engineering folders allowlisted).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const BAD = [/\u2014/, /\bunlock/i, /superpower/i, /whatsapp/i, /jaipur/i, /digital twin/i, /recommends and your team decides/i, /\bcolor\b(?![-:(])/];
const CLIENT_APP_BAD = [
  /\bD\d{2,3}\b/,
  /\bget_[a-z][a-z0-9_]*/i,
  /\bSECOM\b/,
  /\bPlantCraft\b/,
  /caller-supplied/i,
];

const ENGINEERING_APP_ALLOW = [
  "src/app/process/dashboards/",
  "src/app/process/optimisation/",
  "src/app/process/simulations/",
  "src/app/process/modules/",
  "src/app/process/drift/",
  "src/app/quality/simulations/",
  "src/app/quality/monitor/",
  "src/app/quality/cause-gap/",
  "src/app/quality/causes/",
];

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) && files.push(p);
  }
};
walk("src");

function isEngineeringApp(file) {
  const rel = relative(process.cwd(), file).replace(/\\/g, "/");
  return ENGINEERING_APP_ALLOW.some((p) => rel.startsWith(p) || rel.includes(`/${p}`));
}

function isClientAppRoute(file) {
  const rel = relative(process.cwd(), file).replace(/\\/g, "/");
  return rel.startsWith("src/app/") && !isEngineeringApp(file);
}

let fail = 0;
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (f.endsWith(".css") && /color/.test(line)) return;
    for (const re of BAD) {
      if (re.test(line)) {
        console.error(`${f}:${i + 1} ${re} ${line.trim().slice(0, 100)}`);
        fail++;
      }
    }
    if (isClientAppRoute(f)) {
      for (const re of CLIENT_APP_BAD) {
        if (re.test(line)) {
          console.error(`${f}:${i + 1} ${re} ${line.trim().slice(0, 100)}`);
          fail++;
        }
      }
    }
  });
}
if (fail) {
  console.error(`${fail} copy rule violations`);
  process.exit(1);
}
console.log(`copy check passed (${files.length} files)`);
