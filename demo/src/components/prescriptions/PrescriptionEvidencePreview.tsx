"use client";

import { LoadDial } from "@/components/charts/LoadDial";
import { EvidenceMiniChart } from "@/components/evidence/EvidenceMiniChart";
import { ForgeButton, StatusChip } from "@/components/ui/primitives";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import type { EvidencePack } from "@/lib/evidence";
import { formatBaselineLabel, formatIstDateRange } from "@/lib/format";

const chartAccent = {
  critical: "critical",
  good: "good",
  warning: "warning",
  info: "critical",
} as const;

const categoryTone = {
  critical: "critical",
  good: "good",
  warning: "warning",
  info: "info",
} as const;

function fallbackChartFromPack(pack: EvidencePack) {
  const entries = Object.entries(pack.loadDialPct);
  return {
    kind: "bar" as const,
    yAxisLabel: "Load %",
    bars: entries.map(([id, pct]) => ({
      label: id.replaceAll("_", " ").slice(0, 8),
      value: pct,
      highlight: pct >= 90,
    })),
    annotation: pack.anomaly.summary.slice(0, 24),
  };
}

function dialsFromPack(pack: EvidencePack) {
  return Object.entries(pack.loadDialPct)
    .slice(0, 3)
    .map(([id, pct]) => ({
      label: id.replaceAll("_", " "),
      needle: pct,
      needleMax: 120,
      display: String(Math.round(pct)),
      unit: "%",
    }));
}

export function PrescriptionEvidencePreview({
  sample,
  pack,
  evidenceHref,
  compact,
}: {
  sample?: EvidenceSample;
  pack: EvidencePack;
  evidenceHref?: string;
  compact?: boolean;
}) {
  const chart = sample?.chart ?? fallbackChartFromPack(pack);
  const accent = sample ? chartAccent[sample.categoryBadge.tone] : "warning";
  const dials = (sample?.dials?.length ? sample.dials : dialsFromPack(pack)).slice(0, 3);
  const tagRows = sample?.tagRows?.length
    ? sample.tagRows.slice(0, compact ? 3 : 6)
    : Object.entries(pack.loadDialPct)
        .slice(0, compact ? 3 : 4)
        .map(([id, pct]) => ({
          tag: id.replaceAll("_", ".").toUpperCase(),
          value: `${Math.round(pct)}%`,
          window: "now",
        }));
  const dialSize = compact ? 108 : 122;
  const contextRows = [
    { label: "Metric", value: pack.scope.metric.replaceAll("_", " ") },
    { label: "Baseline", value: formatBaselineLabel(pack.scope.baselineId) },
    {
      label: "Scope",
      value: formatIstDateRange(pack.scope.from, pack.scope.to),
    },
    ...(pack.lineage.ruleLabel
      ? [{ label: "Rule", value: pack.lineage.ruleLabel }]
      : []),
  ];

  return (
    <div className={`rx-full-case__evidence-preview${compact ? " rx-full-case__evidence-preview--compact" : ""}`}>
      <div className="rx-full-case__evidence-head">
        <div>
          <p className="forge-eyebrow">Signal proof</p>
          <p className="rx-full-case__evidence-title">
            {sample?.chartTitle ?? "Load snapshot · anomaly window"}
          </p>
          <p className="rx-full-case__evidence-asset">
            {sample?.assetLabel ?? pack.scope.assetLabel}
          </p>
        </div>
        {sample ? (
          <StatusChip tone={categoryTone[sample.categoryBadge.tone]}>
            {sample.categoryBadge.label}
          </StatusChip>
        ) : null}
      </div>

      <div className="rx-full-case__evidence-chart">
        <EvidenceMiniChart chart={chart} accent={accent} />
      </div>

      {dials.length > 0 ? (
        <div className="rx-full-case__evidence-dials">
          {dials.map((d) => (
            <LoadDial
              key={d.label}
              label={d.label}
              value={d.needle}
              max={d.needleMax ?? 120}
              displayText={d.display}
              unit={d.unit ?? ""}
              size={dialSize}
            />
          ))}
        </div>
      ) : null}

      {tagRows.length ? (
        <dl className="rx-full-case__evidence-tags">
          {tagRows.map((row) => (
            <div key={row.tag} className="rx-full-case__evidence-tag">
              <dt>{row.tag}</dt>
              <dd className="rx-full-case__evidence-tag-body">
                <span className="rx-full-case__evidence-tag-value">{row.value}</span>
                <span className="rx-full-case__evidence-tag-window">{row.window}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <dl className="rx-full-case__evidence-context">
        {contextRows.map((row) => (
          <div key={row.label} className="rx-full-case__evidence-context-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {sample?.metadata && !compact ? (
        <p className="rx-full-case__evidence-note">{sample.metadata}</p>
      ) : null}

      {evidenceHref ? (
        <ForgeButton variant="secondary" href={evidenceHref} fullWidth>
          Open full evidence
        </ForgeButton>
      ) : null}

      {/* Absorbs leftover column height so the chart keeps a fixed size */}
      <div className="rx-full-case__evidence-spacer" aria-hidden />
    </div>
  );
}
