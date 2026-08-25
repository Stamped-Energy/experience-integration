/**
 * CI guard — remounted insights surfaces must not import demo fixture modules.
 * Scans app routes + boards remounted in the Insights Live plan.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const SRC = join(fileURLToPath(new URL(".", import.meta.url)), "../src");

const SCAN_ROOTS = [
  join(SRC, "app"),
  join(SRC, "components", "analytics"),
  join(SRC, "components", "equipment"),
  join(SRC, "components", "reports"),
  join(SRC, "components", "ledger"),
  join(SRC, "components", "today", "overview"),
  join(SRC, "components", "live"),
  join(SRC, "lib", "l2-live.ts"),
  join(SRC, "lib", "live-telemetry.ts"),
  join(SRC, "lib", "ledger-from-prescriptions.ts"),
  join(SRC, "lib", "overview-machines.ts"),
  join(SRC, "lib", "plant-map-layout.ts"),
];

const BANNED = [
  "@/fixtures/overview-demo",
  "@/fixtures/machine-health",
  "@/fixtures/energy-analytics",
  "@/fixtures/evidence-samples",
  "@/fixtures/plant-sections",
  "@/fixtures/assignments",
  "@/fixtures/prescription-case-details",
  "@/fixtures/plant-flow",
  "@/fixtures/energy-twin",
];

function walk(path, out = []) {
  let st;
  try {
    st = statSync(path);
  } catch {
    return out;
  }
  if (st.isFile()) {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) out.push(path);
    return out;
  }
  if (!st.isDirectory()) return out;
  for (const name of readdirSync(path)) {
    walk(join(path, name), out);
  }
  return out;
}

const files = SCAN_ROOTS.flatMap((r) => walk(r));
const offenders = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const ban of BANNED) {
    if (text.includes(ban)) {
      offenders.push(`${relative(SRC, file)} → ${ban}`);
    }
  }
}

assert.equal(
  offenders.length,
  0,
  `Banned fixture imports in insights remount surfaces:\n${offenders.join("\n")}`,
);
console.log(
  `ok — no banned fixture imports in ${files.length} insights remount files`,
);
