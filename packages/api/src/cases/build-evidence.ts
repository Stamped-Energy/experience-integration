/** Build EvidencePack / EvidenceSample / series from L5 + L2. */

import type { L2QueryClient } from "../upstream/l2/client.js";
import type { CaseEnrichment, EvidencePackDto, EvidenceSampleDto, EvidenceSeriesDto } from "./contract.js";
import { parseEvidenceRefs, type MeasurementScope } from "./parse-refs.js";

function metricUnit(metric: string): string {
  if (metric.includes("kva")) return "kVA";
  if (metric.includes("kwh")) return "kWh";
  if (metric.includes("kw")) return "kW";
  if (metric.includes("pf")) return "PF";
  return metric;
}

export function buildEvidencePack(input: {
  plantId: string;
  title: string;
  scope: MeasurementScope;
  why?: string;
  ruleId?: string | null;
  alarmId?: string;
  rxId?: string;
  missing?: string[];
  loadDialPct?: Record<string, number>;
}): EvidencePackDto {
  const { scope } = input;
  return {
    scope: {
      plantId: input.plantId,
      assetId: scope.assetId,
      assetLabel: scope.assetId.replaceAll("_", " "),
      metric: scope.metric,
      from: scope.from,
      to: scope.to,
      baselineId: scope.baselineId,
      ...(input.alarmId ? { alarmId: input.alarmId } : {}),
      ...(input.rxId ? { rxId: input.rxId } : {}),
      title: input.title,
    },
    lineage: {
      ruleId: scope.ruleId ?? input.ruleId ?? "rule/unknown",
      ruleLabel: (scope.ruleId ?? input.ruleId ?? "Detection rule").replaceAll("_", " "),
      tariffId: scope.tariffId ?? "tariff/unknown",
      tariffLabel: (scope.tariffId ?? "Plant tariff").replaceAll("_", " "),
      ...(scope.findingId ? { findingId: scope.findingId } : {}),
      sources: [
        "L5 evidence_refs",
        ...(input.missing?.includes("measurements") ? [] : ["L2 measurements"]),
        ...(input.missing?.includes("baseline") ? [] : scope.baselineId ? ["L2 baseline"] : []),
      ],
    },
    anomaly: {
      from: scope.from,
      to: scope.to,
      summary: input.why?.slice(0, 240) || "Detection window from evidence refs",
    },
    missing: input.missing ?? [],
    loadDialPct: input.loadDialPct ?? {},
  };
}

export function seriesToSample(input: {
  plantId: string;
  sampleId: string;
  issueTitle: string;
  pack: EvidencePackDto;
  series: EvidenceSeriesDto;
  enrichment?: CaseEnrichment | null;
  alarmId?: string;
  rxId?: string;
}): EvidenceSampleDto {
  const points = input.series.points;
  const chartPoints = points.map((p, i) => ({ x: i, y: p.value }));
  const values = points.map((p) => p.value);
  const last = values.at(-1);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const unit = input.series.unit;
  const windowLabel = `${input.series.from.slice(0, 16)} → ${input.series.to.slice(0, 16)}`;
  const labels = input.enrichment?.tag_row_labels ?? [];

  const tagRows = [
    {
      tag: `${input.series.assetId}/${input.series.metric}`,
      value: last != null ? `${last.toFixed(1)} ${unit} (last)` : "—",
      window: windowLabel,
    },
    {
      tag: labels[0] ?? "max",
      value: values.length ? `${max.toFixed(1)} ${unit}` : "—",
      window: windowLabel,
    },
    {
      tag: labels[1] ?? "min",
      value: values.length ? `${min.toFixed(1)} ${unit}` : "—",
      window: windowLabel,
    },
    {
      tag: labels[2] ?? "mean",
      value: values.length ? `${mean.toFixed(1)} ${unit}` : "—",
      window: windowLabel,
    },
  ];

  const badge = input.enrichment?.category_badge ?? {
    label: "Signal window",
    tone: "warning" as const,
  };

  const dialNeedle = last != null && max > 0 ? Math.round((last / max) * 100) : 0;
  const pointMeta =
    points.length > 0
      ? `${points.length} L2 points @ ${input.series.granularity}`
      : "No L2 points in window (honest empty)";

  return {
    id: input.sampleId,
    plantId: input.plantId,
    chartTitle:
      input.enrichment?.chart_title ??
      `SIGNAL WINDOW · ${input.series.assetId} · ${input.series.metric}`,
    categoryBadge: badge,
    chart: {
      kind: "line",
      yAxisLabel: unit,
      points: chartPoints.length > 0 ? chartPoints : [{ x: 0, y: 0 }],
    },
    tagRows,
    metadata: [
      input.pack.lineage.ruleLabel,
      input.pack.lineage.tariffLabel,
      pointMeta,
    ].join(" · "),
    mvFooter:
      input.enrichment?.mv_footer ??
      "Verify on next utility reading / Option C window per mv_plan.",
    dials: [
      {
        label: input.pack.scope.assetLabel,
        needle: dialNeedle,
        needleMax: 120,
        display: last != null ? String(Math.round(last)) : "—",
        unit,
      },
    ],
    ...(input.alarmId ? { alarmId: input.alarmId } : {}),
    ...(input.rxId ? { rxId: input.rxId } : {}),
    ...(input.pack.lineage.findingId ? { findingId: input.pack.lineage.findingId } : {}),
    ...(input.pack.scope.baselineId ? { baselineId: input.pack.scope.baselineId } : {}),
    assetLabel: input.pack.scope.assetLabel,
    assetId: input.pack.scope.assetId,
    issueTitle: input.issueTitle,
  };
}

/** EvidenceSample from pack scope when L2 series is missing or empty. */
export function packToSample(input: {
  plantId: string;
  sampleId: string;
  issueTitle: string;
  pack: EvidencePackDto;
  enrichment?: CaseEnrichment | null;
  alarmId?: string;
  rxId?: string;
}): EvidenceSampleDto {
  const scope = input.pack.scope;
  const emptySeries: EvidenceSeriesDto = {
    assetId: scope.assetId,
    metric: scope.metric,
    from: scope.from,
    to: scope.to,
    granularity: "15min",
    unit: metricUnit(scope.metric),
    points: [],
  };
  return seriesToSample({ ...input, series: emptySeries });
}

export function buildCaseDetail(input: {
  title: string;
  why: string;
  plantName?: string;
  category?: string;
  priority?: string;
  lane?: string;
  owner?: string;
  billLine?: string;
  effort?: string;
  dueLabel?: string;
  confidence?: number;
  impactInr?: number;
  pack: EvidencePackDto;
  enrichment?: CaseEnrichment | null;
  series?: EvidenceSeriesDto;
}): Record<string, unknown> {
  const en = input.enrichment;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const seriesRows =
    input.series?.points.slice(0, 8).map((p, i) => ({
      id: String(i),
      ts: p.ts.slice(0, 19),
      value: `${p.value.toFixed(2)} ${input.series!.unit}`,
      note: i === (input.series!.points.length > 8 ? 7 : input.series!.points.length - 1) ? "sample" : "",
    })) ?? [];

  return {
    description: input.why,
    savingsRange:
      input.impactInr != null
        ? `${fmt(input.impactInr)} / mo modeled`
        : undefined,
    rootCause: en?.root_cause?.length ? en.root_cause : [input.why],
    managerTakeaway: en?.manager_takeaway ?? undefined,
    commissioning: en?.commissioning?.length ? en.commissioning : undefined,
    metadata: [
      { label: "Case", value: input.title },
      ...(input.plantName ? [{ label: "Plant", value: input.plantName }] : []),
      { label: "Category", value: input.category ?? "—" },
      { label: "Priority", value: input.priority ?? "—" },
      { label: "Status", value: (input.lane ?? "—").replaceAll("_", " ") },
      { label: "Owner", value: (input.owner ?? "—").replaceAll("_", " ") },
      { label: "Bill line", value: input.billLine ?? "—" },
      { label: "Effort", value: input.effort ?? "—" },
      { label: "Due", value: input.dueLabel ?? "—" },
      ...(input.confidence != null
        ? [{ label: "Confidence", value: `${Math.round(input.confidence * 100)}%` }]
        : []),
    ],
    lineage: [
      { label: "Rule", value: input.pack.lineage.ruleLabel },
      { label: "Tariff", value: input.pack.lineage.tariffLabel },
      { label: "Asset", value: input.pack.scope.assetLabel },
      { label: "Metric", value: input.pack.scope.metric },
      {
        label: "Baseline",
        value: input.pack.scope.baselineId ?? "—",
      },
      {
        label: "Scope window",
        value: `${input.pack.scope.from.slice(0, 10)} → ${input.pack.scope.to.slice(0, 10)}`,
      },
      { label: "Sources", value: input.pack.lineage.sources.join(" · ") },
    ],
    eventSnapshot: {
      timestamp: input.pack.anomaly.from.slice(0, 19),
      caption: "L2 detection window (sample rows)",
      columns: [
        { key: "ts", header: "Timestamp" },
        { key: "value", header: "Value", align: "right" as const },
        { key: "note", header: "Note" },
      ],
      rows: seriesRows.length
        ? seriesRows
        : [{ id: "0", ts: "—", value: "No L2 points", note: "missing" }],
      interpretation: input.pack.anomaly.summary,
      sanityCheck: "Confirm values against L2 points disclosure on this page.",
    },
    costBenefit: {
      wasteIdentified:
        input.impactInr != null
          ? `Modeled addressable: ${fmt(input.impactInr)}/mo.`
          : "See impact on prescription.",
      capexNote: input.effort,
    },
  };
}

export async function fetchL2Series(input: {
  l2: L2QueryClient;
  plantId: string;
  scope: MeasurementScope;
}): Promise<{ series?: EvidenceSeriesDto; missing: string[]; loadDialPct: Record<string, number> }> {
  const missing: string[] = [];
  try {
    const meas = await input.l2.listMeasurements({
      plantId: input.plantId,
      assetId: input.scope.assetId,
      metric: input.scope.metric,
      from: input.scope.from,
      to: input.scope.to,
      granularity: "15min",
    });
    const points = (meas.points ?? []).map((p) => ({ ts: p.ts, value: p.value }));
    if (points.length === 0) missing.push("measurements");
    const last = points.at(-1)?.value;
    const loadDialPct: Record<string, number> = {};
    if (last != null) {
      const max = Math.max(...points.map((p) => p.value), last);
      loadDialPct[input.scope.assetId] = max > 0 ? Math.round((last / max) * 100) : 0;
    }
    return {
      series:
        points.length > 0
          ? {
              assetId: input.scope.assetId,
              metric: input.scope.metric,
              from: input.scope.from,
              to: input.scope.to,
              granularity: meas.granularity ?? "15min",
              unit: metricUnit(input.scope.metric),
              points,
            }
          : undefined,
      missing,
      loadDialPct,
    };
  } catch {
    missing.push("measurements");
    return { missing, loadDialPct: {} };
  }
}

export function scopeFromRaw(
  refs: string[],
  findingWindow?: string | null,
): MeasurementScope {
  return parseEvidenceRefs(refs, { findingWindow });
}
