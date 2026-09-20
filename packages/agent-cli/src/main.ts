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
import { parseCommand, type ParsedCommand } from "./parse-args.js";

function assertNever(value: never): never {
  throw new Error(`Unhandled verb: ${String(value)}`);
}

async function runVerb(parsed: ParsedCommand): Promise<Record<string, unknown>> {
  const verb = parsed.verb;
  switch (verb) {
    case "health":
      return handleHealth();
    case "contracts.upstream-check":
      return handleContractsUpstreamCheck();
    case "authz.matrix":
      return handleAuthzMatrix();
    case "openapi.public-dump":
      return handleOpenapiPublicDump();
    case "upstreams.probe":
      return handleUpstreamsProbe(parsed.flags);
    default:
      return assertNever(verb);
  }
}

export async function runAgentCli(argv: string[]): Promise<void> {
  const deny = denyReason(argv);
  if (deny) {
    exitForEnvelope(failureEnvelope("cli", "denied", deny, 0));
  }

  const parsed = parseCommand(argv);
  if ("code" in parsed) {
    exitForEnvelope(
      failureEnvelope("cli", parsed.code, parsed.message, 0),
    );
  }

  const started = performance.now();
  const verb = parsed.verb;

  let data: Record<string, unknown>;
  try {
    data = await runVerb(parsed);
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

  exitForEnvelope(
    successEnvelope(verb, data, Math.round(performance.now() - started)),
  );
}
