import { denyReason } from "./deny.js";
import {
  exitForEnvelope,
  failureEnvelope,
  successEnvelope,
} from "./envelope.js";
import { handleAuthzMatrix } from "./handlers/authz-matrix.js";
import {
  handleContractsUpstreamCheck,
  UpstreamContractsError,
} from "./handlers/contracts-upstream-check.js";
import { handleHealth } from "./handlers/health.js";
import { handleOpenapiPublicDump } from "./handlers/openapi-public-dump.js";
import { handleUpstreamsProbe } from "./handlers/upstreams-probe.js";
import { parseCommand } from "./parse-args.js";

export async function runAgentCli(argv: string[]): Promise<void> {
  const deny = denyReason(argv);
  if (deny) {
    exitForEnvelope(
      failureEnvelope("cli", "denied", deny, 0),
    );
  }

  const parsed = parseCommand(argv);
  if ("code" in parsed) {
    exitForEnvelope(
      failureEnvelope("cli", parsed.code, parsed.message, 0),
    );
  }

  const started = performance.now();
  const verb = parsed.verb;

  try {
    let data: Record<string, unknown>;
    switch (verb) {
      case "health":
        data = handleHealth();
        break;
      case "contracts.upstream-check":
        data = handleContractsUpstreamCheck();
        break;
      case "authz.matrix":
        data = handleAuthzMatrix();
        break;
      case "openapi.public-dump":
        data = handleOpenapiPublicDump();
        break;
      case "upstreams.probe":
        data = await handleUpstreamsProbe(parsed.flags);
        break;
      default: {
        const _exhaustive: never = verb;
        throw new Error(`Unhandled verb ${_exhaustive}`);
      }
    }
    const durationMs = Math.round(performance.now() - started);
    exitForEnvelope(successEnvelope(verb, data, durationMs));
  } catch (err) {
    const durationMs = Math.round(performance.now() - started);
    if (err instanceof UpstreamContractsError) {
      exitForEnvelope(
        failureEnvelope(verb, err.code, err.message, durationMs),
      );
    }
    const message =
      err instanceof Error ? err.message : "Unexpected handler failure";
    exitForEnvelope(failureEnvelope(verb, "internal", message, durationMs));
  }
}
