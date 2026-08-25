/** Parse L4/L5 evidence_refs into an L2 measurement scope. */

export type ParsedEvidenceRef =
  | { kind: "tag"; assetId: string; metric: string; from?: string; to?: string; raw: string }
  | { kind: "baseline"; baselineId: string; raw: string }
  | { kind: "tariff"; tariffId: string; raw: string }
  | { kind: "finding"; findingId: string; raw: string }
  | { kind: "bill_line"; billLine: string; raw: string }
  | { kind: "rule"; ruleId: string; raw: string }
  | { kind: "unknown"; raw: string };

export type MeasurementScope = {
  assetId: string;
  metric: string;
  from: string;
  to: string;
  baselineId: string | null;
  findingId: string | null;
  tariffId: string | null;
  ruleId: string | null;
  refs: ParsedEvidenceRef[];
};

const TAG_RE =
  /^tag:([^/]+)\/([^?]+)(?:\?window=([^/]+)\/(.+))?$/i;

function parseOne(raw: string): ParsedEvidenceRef {
  const s = raw.trim();
  const tag = s.match(TAG_RE);
  if (tag) {
    return {
      kind: "tag",
      assetId: tag[1]!,
      metric: tag[2]!,
      ...(tag[3] && tag[4] ? { from: tag[3], to: tag[4] } : {}),
      raw: s,
    };
  }
  if (s.startsWith("baseline:")) {
    return { kind: "baseline", baselineId: s.slice("baseline:".length), raw: s };
  }
  if (s.startsWith("tariff:")) {
    return { kind: "tariff", tariffId: s.slice("tariff:".length), raw: s };
  }
  if (s.startsWith("finding:")) {
    return { kind: "finding", findingId: s.slice("finding:".length), raw: s };
  }
  if (s.startsWith("bill_line:")) {
    return { kind: "bill_line", billLine: s.slice("bill_line:".length), raw: s };
  }
  if (s.startsWith("rule:")) {
    return { kind: "rule", ruleId: s.slice("rule:".length), raw: s };
  }
  return { kind: "unknown", raw: s };
}

/** Default window: last `hours` ending now (UTC ISO). */
export function defaultWindow(hours = 6): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - hours * 3600_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Build measurement scope from evidence_refs.
 * Window priority: tag ?window → findingWindow → last 6h.
 */
export function parseEvidenceRefs(
  refs: readonly string[],
  opts: { findingWindow?: string | null; nowHoursFallback?: number } = {},
): MeasurementScope {
  const parsed = refs.map(parseOne);
  const tag = parsed.find((r): r is Extract<ParsedEvidenceRef, { kind: "tag" }> => r.kind === "tag");
  const baseline = parsed.find((r) => r.kind === "baseline");
  const tariff = parsed.find((r) => r.kind === "tariff");
  const finding = parsed.find((r) => r.kind === "finding");
  const rule = parsed.find((r) => r.kind === "rule");

  let from: string | undefined = tag?.from;
  let to: string | undefined = tag?.to;
  if ((!from || !to) && opts.findingWindow) {
    const parts = opts.findingWindow.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      from = parts[0];
      to = parts[1];
    }
  }
  if (!from || !to) {
    const w = defaultWindow(opts.nowHoursFallback ?? 6);
    from = w.from;
    to = w.to;
  }

  return {
    assetId: tag?.assetId ?? "incomer_1",
    metric: tag?.metric ?? "active_power_kw",
    from,
    to,
    baselineId: baseline && baseline.kind === "baseline" ? baseline.baselineId : null,
    findingId: finding && finding.kind === "finding" ? finding.findingId : null,
    tariffId: tariff && tariff.kind === "tariff" ? tariff.tariffId : null,
    ruleId: rule && rule.kind === "rule" ? rule.ruleId : null,
    refs: parsed,
  };
}
