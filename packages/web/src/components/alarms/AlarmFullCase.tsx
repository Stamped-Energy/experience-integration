import type { ReactNode } from "react";
import {
  DataTable,
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";
import { PrescriptionEvidencePreview } from "@/components/prescriptions/PrescriptionEvidencePreview";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import type { EvidencePack } from "@/lib/evidence";
import {
  formatAlarmState,
  formatIndianNum,
  formatIstDate,
  formatIstDateTime,
  formatIstTime,
} from "@/lib/format";
import type { Alarm } from "@/lib/types";
import type { DemoAsset } from "@/fixtures/demo";

const severityTone = {
  critical: "critical",
  warning: "warning",
  info: "info",
} as const;

function CompactSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["alm-full-case__block", className].filter(Boolean).join(" ")}>
      <h3 className="alm-full-case__block-title">{title}</h3>
      {children}
    </section>
  );
}

function CompactMeta({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <dl className="alm-full-case__compact-meta">
      {rows.map((row) => (
        <div key={row.label} className="alm-full-case__compact-meta-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AlarmFullCase({
  alarm,
  asset,
  pack,
  evidenceSample,
  evidenceHref,
  prescriptionHref,
  actions,
  onAction,
}: {
  alarm: Alarm;
  asset?: DemoAsset;
  pack: EvidencePack;
  evidenceSample?: EvidenceSample;
  evidenceHref?: string;
  prescriptionHref?: string;
  actions?: Array<{ id: string; label: string; variant: "primary" | "secondary" | "ghost" }>;
  onAction?: (id: string) => void;
}) {
  const signalRows = [
    {
      id: "load",
      metric: "Load",
      value: asset ? `${asset.loadPct}%` : "—",
      note: asset?.area ?? "Asset telemetry",
    },
    {
      id: "kwh",
      metric: "MTD energy",
      value: asset ? `${formatIndianNum(Math.round(asset.kwhMtd / 1000))} MWh` : "—",
      note: pack.lineage.sources.slice(0, 2).join(", "),
    },
    {
      id: "pf",
      metric: "Power factor",
      value: asset?.pf != null ? formatIndianNum(asset.pf, 2) : "—",
      note: asset?.mdContributionKva ? `${asset.mdContributionKva} kVA MD share` : "—",
    },
    {
      id: "raised",
      metric: "Raised",
      value: formatIstTime(alarm.raisedAt),
      note: formatIstDate(alarm.raisedAt),
    },
  ];

  const workflowRows = [
    { label: "Asset", value: alarm.assetLabel },
    { label: "Asset ID", value: alarm.assetId },
    { label: "Area", value: asset?.area ?? "—" },
    {
      label: "Owner",
      value: alarm.ownerRole ? alarm.ownerRole.replaceAll("_", " ") : "Unassigned",
    },
    { label: "Finding", value: alarm.findingId ?? "—" },
    { label: "Rule", value: pack.lineage.ruleId.replaceAll("_", " ") },
  ];

  return (
    <div className="alm-full-case" data-alarm-full-case>
      <Panel
        className={[
          "alm-full-case__hero",
          `alm-full-case__hero--${alarm.severity}`,
        ].join(" ")}
      >
        <div className="alm-full-case__hero-grid">
          <div className="alm-full-case__hero-main">
            <div className="alm-full-case__chips">
              <StatusChip tone={severityTone[alarm.severity]}>{alarm.severity}</StatusChip>
              <StatusChip tone="neutral">{formatAlarmState(alarm.state)}</StatusChip>
              <StatusChip tone="neutral">{alarm.assetLabel}</StatusChip>
              {alarm.findingId ? (
                <StatusChip tone="info">Finding · {alarm.findingId}</StatusChip>
              ) : null}
            </div>
            <p className="alm-full-case__prose alm-full-case__prose--lead">{alarm.summary}</p>
            <p className="alm-full-case__raised">Raised {formatIstDateTime(alarm.raisedAt)}</p>
          </div>
        </div>
      </Panel>

      <div className="alm-full-case__body">
        <div className="alm-full-case__main">
          <div className="alm-full-case__main-grid">
            <Panel className="alm-full-case__panel alm-full-case__panel--signal alm-full-case__panel--wide">
              <CompactSection title="Signal snapshot">
                <DataTable
                  caption="Alarm signal metrics"
                  columns={[
                    { key: "metric", header: "Metric" },
                    { key: "value", header: "Value" },
                    { key: "note", header: "Context" },
                  ]}
                  rows={signalRows}
                />
                <p className="alm-full-case__prose" style={{ marginTop: 10 }}>
                  <strong>Window:</strong> {formatIstDateTime(pack.anomaly.from)} →{" "}
                  {formatIstDateTime(pack.anomaly.to)}
                  {" · "}
                  {pack.anomaly.summary}
                </p>
                <p className="alm-full-case__prose" style={{ marginTop: 6, opacity: 0.85 }}>
                  Rule {pack.lineage.ruleId}
                  {pack.scope.baselineId ? ` · Baseline ${pack.scope.baselineId}` : ""}
                </p>
                {pack.missing.length > 0 ? (
                  <p className="alm-full-case__prose" style={{ marginTop: 8, color: "var(--forge-warning)" }}>
                    Missing: {pack.missing.join(", ")}
                  </p>
                ) : null}
              </CompactSection>
            </Panel>

            <Panel className="alm-full-case__panel alm-full-case__panel--wide alm-full-case__panel--workflow">
              <CompactSection title="Workflow">
                <CompactMeta rows={workflowRows.slice(0, 4)} />
              </CompactSection>

              <div className="alm-full-case__actions-bar">
                <ForgeButtonGroup
                  aria-label="Alarm links"
                  toolbar
                  className="alm-full-case__actions-group alm-full-case__actions-group--links"
                >
                  {evidenceHref ? (
                    <ForgeButton variant="secondary" href={evidenceHref}>
                      Evidence
                    </ForgeButton>
                  ) : null}
                  {prescriptionHref ? (
                    <ForgeButton variant="ghost" href={prescriptionHref}>
                      Prescription
                    </ForgeButton>
                  ) : null}
                  <ForgeButton variant="ghost" href="/alarms">
                    Console
                  </ForgeButton>
                </ForgeButtonGroup>

                {actions && actions.length > 0 ? (
                  <ForgeButtonGroup
                    aria-label="Alarm actions"
                    toolbar
                    className="alm-full-case__actions-group alm-full-case__actions-group--ops"
                  >
                    {actions.map((action) => (
                      <ForgeButton
                        key={action.id}
                        variant={action.variant}
                        onClick={() => onAction?.(action.id)}
                      >
                        {action.label}
                      </ForgeButton>
                    ))}
                  </ForgeButtonGroup>
                ) : null}
              </div>
            </Panel>
          </div>
        </div>

        <aside className="alm-full-case__aside">
          <Panel className="alm-full-case__panel alm-full-case__panel--sticky alm-full-case__panel--evidence">
            {evidenceSample ? (
              <PrescriptionEvidencePreview
                sample={evidenceSample}
                pack={pack}
                evidenceHref={evidenceHref}
                compact
              />
            ) : null}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
