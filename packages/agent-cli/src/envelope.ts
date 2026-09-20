export type AgentMeta = {
  layer: "l6";
  verb: string;
  duration_ms: number;
  binary?: string;
};

export type EnvelopeSuccess = {
  ok: true;
  data: Record<string, unknown>;
  citations: unknown[];
  meta: AgentMeta;
};

export type EnvelopeFailure = {
  ok: false;
  error: { code: string; message: string };
  meta: AgentMeta;
};

export type Envelope = EnvelopeSuccess | EnvelopeFailure;

const BINARY = "stamped-l6";

export function successEnvelope(
  verb: string,
  data: Record<string, unknown>,
  durationMs: number,
  citations: unknown[] = [],
): EnvelopeSuccess {
  return {
    ok: true,
    data,
    citations,
    meta: { layer: "l6", verb, duration_ms: durationMs, binary: BINARY },
  };
}

export function failureEnvelope(
  verb: string,
  code: string,
  message: string,
  durationMs: number,
): EnvelopeFailure {
  return {
    ok: false,
    error: { code, message },
    meta: { layer: "l6", verb, duration_ms: durationMs, binary: BINARY },
  };
}

export function printEnvelope(envelope: Envelope): void {
  process.stdout.write(`${JSON.stringify(envelope)}\n`);
}

import { exitProcess } from "./runtime.js";

export function exitForEnvelope(envelope: Envelope): never {
  printEnvelope(envelope);
  exitProcess(envelope.ok ? 0 : 1);
}
