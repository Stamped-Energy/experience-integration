/**
 * CI guard — app routes must not import heavy demo fixture modules.
 * Plant catalog lives in `@/lib/plant-catalog` (not KPI/alarm fixtures).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "../src/app");

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

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf8");
  for (const ban of BANNED) {
    if (text.includes(ban)) {
      offenders.push(`${relative(ROOT, file)} → ${ban}`);
    }
  }
}

assert.equal(
  offenders.length,
  0,
  `Banned fixture imports in app routes:\n${offenders.join("\n")}`,
);
console.log("ok — no banned fixture imports in app routes");
