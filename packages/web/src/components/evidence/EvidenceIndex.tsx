import Link from "next/link";
import { EvidenceMiniChart } from "@/components/evidence/EvidenceMiniChart";
import { ForgeButton, ForgeButtonGroup, Panel, StatusChip } from "@/components/ui/primitives";
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

export function EvidenceIndex({ samples }: { samples: readonly EvidenceSample[] }) {
  return (
    <div className="evidence-detail" data-evidence-index>
      <Panel className="evd-full__index-hero">
        <StatusChip tone="neutral">Evidence · Proof packs</StatusChip>
        <h2 className="evd-full__issue" style={{ marginTop: 10 }}>
          Metered proof for every action
        </h2>
        <p className="evd-full__index-lead">
          Every prescription and alarm links to scoped SCADA tags, charts, and M&amp;V lineage.
          Click a pack to see exactly what the signal looked like — and what is still pending bill
          verification.
        </p>
      </Panel>

      <div className="evidence-index-grid">
        {samples.map((sample) => (
          <Panel key={sample.id} className="evidence-index-card">
            <Link
              href={`/evidence/${sample.id}`}
              className="evidence-index-card__hit"
              aria-label={`Open evidence: ${sample.issueTitle}`}
            >
              <div className="evidence-card__header">
                <StatusChip tone="neutral">Proof pack</StatusChip>
                <StatusChip tone={categoryTone[sample.categoryBadge.tone]}>
                  {sample.categoryBadge.label}
                </StatusChip>
              </div>
              <h3 className="evidence-index-card__issue">{sample.issueTitle}</h3>
              <p className="evidence-card__asset">
                {sample.assetLabel} · {sample.chartTitle}
              </p>
              <EvidenceMiniChart
                chart={sample.chart}
                accent={chartAccent[sample.categoryBadge.tone]}
                compact
              />
              <p className="evidence-index-card__footer">{sample.mvFooter}</p>
            </Link>

            {(sample.alarmId || sample.rxId) ? (
              <ForgeButtonGroup
                aria-label={`Related links for ${sample.issueTitle}`}
                toolbar
                className="evidence-index-card__actions"
              >
                {sample.alarmId ? (
                  <ForgeButton variant="ghost" href={`/alarms/${sample.alarmId}`}>
                    Alarm
                  </ForgeButton>
                ) : null}
                {sample.rxId ? (
                  <ForgeButton variant="ghost" href={`/prescriptions/${sample.rxId}`}>
                    Prescriptions
                  </ForgeButton>
                ) : null}
              </ForgeButtonGroup>
            ) : null}
          </Panel>
        ))}
      </div>
    </div>
  );
}
