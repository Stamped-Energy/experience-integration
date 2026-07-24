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
      <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)", lineHeight: 1.5 }}>
        Every action has a bill line and an owner. Proof packs are scoped from alarms and
        prescriptions — open the issue, then jump to the linked Alarm or Prescription.
      </p>
      <div className="evidence-index-grid">
        {samples.map((sample) => (
          <Panel key={sample.id} className="evidence-index-card">
            <div className="evidence-card__header">
              <StatusChip tone="neutral">Evidence · Proof pack</StatusChip>
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
            <ForgeButtonGroup
              aria-label={`Links for ${sample.issueTitle}`}
              toolbar
              className="evidence-index-card__actions"
            >
              <ForgeButton variant="secondary" href={`/evidence/${sample.id}`}>
                Evidence
              </ForgeButton>
              {sample.alarmId ? (
                <ForgeButton variant="ghost" href={`/alarms/${sample.alarmId}`}>
                  Alarm
                </ForgeButton>
              ) : null}
              {sample.rxId ? (
                <ForgeButton variant="ghost" href={`/prescriptions/${sample.rxId}`}>
                  Prescription
                </ForgeButton>
              ) : null}
            </ForgeButtonGroup>
          </Panel>
        ))}
      </div>
    </div>
  );
}
