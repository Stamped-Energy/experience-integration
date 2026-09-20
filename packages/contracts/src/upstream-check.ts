import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type UpstreamLayerDigest = {
  sha256: string;
  path: string;
};

export type UpstreamContractsOk = {
  ok: true;
  layers: Record<string, UpstreamLayerDigest>;
  wroteManifest: boolean;
};

export type UpstreamContractsFail = {
  ok: false;
  message: string;
};

export type UpstreamContractsResult = UpstreamContractsOk | UpstreamContractsFail;

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Hash as CI does (LF). Windows autocrlf must not drift the pin. */
function sha256Normalized(buf: Buffer): string {
  const text = buf.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return sha256(Buffer.from(text, "utf8"));
}

/**
 * Verify contracts/upstream OpenAPI snapshots parse and match manifest checksums.
 * Fixture placeholders are allowed; inventing sibling truth is not.
 */
export function checkUpstreamContracts(
  repoRoot: string,
  options: { write?: boolean } = {},
): UpstreamContractsResult {
  const write = options.write === true;
  const upstream = join(repoRoot, "contracts/upstream");
  const manifestPath = join(upstream, "manifest.json");
  const layers = ["l5", "l4", "l2"] as const;

  let manifest: {
    generated_at?: string;
    layers?: Record<string, { sha256?: string; path?: string }>;
  };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return { ok: false, message: `missing or invalid ${manifestPath}` };
  }

  const outLayers: Record<string, UpstreamLayerDigest> = {};
  let wroteManifest = false;

  for (const layer of layers) {
    const dir = join(upstream, layer);
    const openapiPath = join(dir, "openapi.json");
    const sourcePath = join(dir, "SOURCE.md");
    let openapiRaw: Buffer;
    try {
      openapiRaw = readFileSync(openapiPath);
    } catch {
      return { ok: false, message: `missing ${openapiPath}` };
    }
    try {
      readFileSync(sourcePath, "utf8");
    } catch {
      return { ok: false, message: `missing ${sourcePath}` };
    }

    let doc: { openapi?: string; paths?: unknown };
    try {
      doc = JSON.parse(openapiRaw.toString("utf8"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `${layer}/openapi.json is not valid JSON: ${msg}` };
    }
    if (typeof doc.openapi !== "string" || !doc.openapi.startsWith("3.")) {
      return { ok: false, message: `${layer}/openapi.json must declare openapi 3.x` };
    }
    if (!doc.paths || typeof doc.paths !== "object") {
      return { ok: false, message: `${layer}/openapi.json missing paths` };
    }

    const digest = sha256Normalized(openapiRaw);
    const entry = manifest.layers?.[layer];
    if (!entry) {
      return { ok: false, message: `manifest missing layers.${layer}` };
    }

    if (write || entry.sha256 === "PLACEHOLDER") {
      entry.sha256 = digest;
      entry.path = `${layer}/openapi.json`;
      wroteManifest = true;
    } else if (entry.sha256 !== digest) {
      return {
        ok: false,
        message: `${layer} checksum drift: manifest=${entry.sha256} disk=${digest}. Re-pin with --write only after intentional snapshot update.`,
      };
    }

    outLayers[layer] = {
      sha256: entry.sha256 ?? digest,
      path: entry.path ?? `${layer}/openapi.json`,
    };
  }

  if (
    write ||
    Object.values(manifest.layers ?? {}).some((l) => l.sha256 === "PLACEHOLDER")
  ) {
    manifest.generated_at = new Date().toISOString();
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    wroteManifest = true;
  }

  return { ok: true, layers: outLayers, wroteManifest };
}
