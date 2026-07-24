"use client";

import Link from "next/link";
import { LoadDial } from "@/components/charts/LoadDial";
import { EvidenceTrend } from "@/components/charts/EvidenceTrend";
import { EvidenceMiniChart } from "@/components/evidence/EvidenceMiniChart";
import { DataTable, Panel, StatusChip } from "@/components/ui/primitives";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import "./evidence.css";

const categoryTone = {
  critical: "critical",
  good: "good",
  warning: "warning",
  info: "info",
} as const;

const chartAccent = {
  critical: "critical",
  good: "good",
  warning: "warning",
  info: "critical",
} as const;

function backLabel(sample: EvidenceSample): string {
  if (sample.alarmId) return "Back to alarm";
  if (sample.rxId) return "Back to prescription";
  return "Back to evidence index";
}

function backHref(sample: EvidenceSample): string {
  if (sample.alarmId) return `/alarms/${sample.alarmId}`;
  if (sample.rxId) return `/prescriptions/${sample.rxId}`;
  return "/evidence";
}

export function EvidenceDetail({
  sample,
  showBaselineBand = false,
}: {
  sample: EvidenceSample;
  showBaselineBand?: boolean;
}) {
  const accent = chartAccent[sample.categoryBadge.tone];

  return (
    <div className="evidence-detail" data-evidence-detail>
      <Panel className="evidence-card">
        <div className="evidence-card__header">
          <StatusChip tone="neutral">Evidence · Proof pack</StatusChip>
          <StatusChip tone={categoryTone[sample.categoryBadge.tone]}>
            {sample.categoryBadge.label}
          </StatusChip>
        </div>

        <h2 className="evidence-card__title">{sample.chartTitle}</h2>
        <p className="evidence-card__asset">
          {sample.assetLabel} · {sample.id}
        </p>

        <EvidenceMiniChart chart={sample.chart} accent={accent} />

        {sample.dials.length ? (
          <div className="evidence-dial-grid">
            {sample.dials.map((d) => (
              <div key={d.label} className="evidence-dial-cell">
                <LoadDial
                  label={d.label}
                  value={d.needle}
                  max={d.needleMax ?? 120}
                  displayText={d.display}
                  unit={d.unit ?? ""}
                  size={132}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="evidence-table-wrap">
          <DataTable
            caption="Evidence tags"
            columns={[
              { key: "tag", header: "Tag" },
              { key: "value", header: "Value" },
              { key: "window", header: "Window" },
            ]}
            rows={sample.tagRows.map((row, i) => ({
              id: `tag-${i}`,
              tag: row.tag,
              value: row.value,
              window: row.window,
            }))}
          />
        </div>

        <div className="evidence-metadata">{sample.metadata}</div>

        <p className="evidence-mv-footer">{sample.mvFooter}</p>

        <div className="evidence-card__links" data-evidence-parents>
          {sample.alarmId ? (
            <StatusChip tone="critical">
              <Link href={`/alarms/${sample.alarmId}`} style={{ color: "inherit" }}>
                Alarm · {sample.alarmId}
              </Link>
            </StatusChip>
          ) : null}
          {sample.rxId ? (
            <StatusChip tone="info">
              <Link href={`/prescriptions/${sample.rxId}`} style={{ color: "inherit" }}>
                Rx · {sample.rxId}
              </Link>
            </StatusChip>
          ) : null}
          {sample.findingId ? (
            <StatusChip tone="neutral">Finding · {sample.findingId}</StatusChip>
          ) : null}
        </div>

        <Link href={backHref(sample)} className="evidence-back-link">
          ← {backLabel(sample)}
        </Link>
      </Panel>

      <EvidenceTrend assetLabel={sample.assetLabel} showBaselineBand={showBaselineBand} />
    </div>
  );
}
