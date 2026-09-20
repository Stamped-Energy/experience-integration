#!/usr/bin/env tsx
/**
 * Verify contracts/upstream OpenAPI snapshots parse and match manifest checksums.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkUpstreamContracts } from "@stamped/l6-contracts/upstream-check";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");

const result = checkUpstreamContracts(root, { write });
if (!result.ok) {
  console.error(`contracts:upstream: ${result.message}`);
  process.exit(1);
}

if (result.wroteManifest) {
  console.log("contracts:upstream: wrote manifest checksums");
}

console.log("contracts:upstream: OK");
