#!/usr/bin/env node
/**
 * Verify contracts/upstream OpenAPI snapshots parse and match manifest checksums.
 * Fixture placeholders are allowed; inventing sibling truth is not.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const upstream = join(root, "contracts/upstream");
const manifestPath = join(upstream, "manifest.json");
const write = process.argv.includes("--write");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/** Hash as CI does (LF). Windows autocrlf must not drift the pin. */
function sha256Normalized(buf) {
  const text = buf.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return sha256(Buffer.from(text, "utf8"));
}

function fail(msg) {
  console.error(`contracts:upstream: ${msg}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const layers = ["l5", "l4", "l2"];

for (const layer of layers) {
  const dir = join(upstream, layer);
  const openapiPath = join(dir, "openapi.json");
  const sourcePath = join(dir, "SOURCE.md");
  let openapiRaw;
  try {
    openapiRaw = readFileSync(openapiPath);
  } catch {
    fail(`missing ${openapiPath}`);
  }
  try {
    readFileSync(sourcePath, "utf8");
  } catch {
    fail(`missing ${sourcePath}`);
  }

  let doc;
  try {
    doc = JSON.parse(openapiRaw.toString("utf8"));
  } catch (err) {
    fail(`${layer}/openapi.json is not valid JSON: ${err.message}`);
  }
  if (typeof doc.openapi !== "string" || !doc.openapi.startsWith("3.")) {
    fail(`${layer}/openapi.json must declare openapi 3.x`);
  }
  if (!doc.paths || typeof doc.paths !== "object") {
    fail(`${layer}/openapi.json missing paths`);
  }

  const digest = sha256Normalized(openapiRaw);
  const entry = manifest.layers?.[layer];
  if (!entry) fail(`manifest missing layers.${layer}`);

  if (write || entry.sha256 === "PLACEHOLDER") {
    entry.sha256 = digest;
    entry.path = `${layer}/openapi.json`;
  } else if (entry.sha256 !== digest) {
    fail(
      `${layer} checksum drift: manifest=${entry.sha256} disk=${digest}. Re-pin with --write only after intentional snapshot update.`,
    );
  }
}

if (write || Object.values(manifest.layers).some((l) => l.sha256 === "PLACEHOLDER")) {
  manifest.generated_at = new Date().toISOString();
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("contracts:upstream: wrote manifest checksums");
}

console.log("contracts:upstream: OK");
