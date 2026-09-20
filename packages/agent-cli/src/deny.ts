/** Universal deny — mutating flags and verbs (agent-cli DENY_LIST). */

const FORBIDDEN_FLAG = new Set(["--write", "--apply", "--seed"]);

const FORBIDDEN_TOKENS = new Set([
  "act",
  "ack",
  "whatsapp",
  "seed",
  "migrate",
  "publish",
  "ingest",
  "terraform",
]);

export function denyReason(argv: readonly string[]): string | null {
  for (const arg of argv) {
    const base = arg.split("=")[0]?.toLowerCase();
    if (base && FORBIDDEN_FLAG.has(base)) {
      return `Flag ${base} is denied for read-only agent CLI`;
    }
  }
  for (const arg of argv) {
    const token = arg.toLowerCase();
    if (FORBIDDEN_TOKENS.has(token)) {
      return `Verb or path "${arg}" is denied (mutating / out of scope)`;
    }
  }
  return null;
}
