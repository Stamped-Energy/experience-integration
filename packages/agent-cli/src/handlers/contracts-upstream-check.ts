import { checkUpstreamContracts } from "@stamped/l6-contracts/upstream-check";
import { REPO_ROOT } from "../paths.js";

export function handleContractsUpstreamCheck(): Record<string, unknown> {
  const result = checkUpstreamContracts(REPO_ROOT, { write: false });
  if (!result.ok) {
    throw new UpstreamContractsError(result.message);
  }
  return {
    status: "ok",
    layers: result.layers,
    wroteManifest: result.wroteManifest,
  };
}

export class UpstreamContractsError extends Error {
  readonly code = "internal" as const;

  constructor(message: string) {
    super(message);
    this.name = "UpstreamContractsError";
  }
}
