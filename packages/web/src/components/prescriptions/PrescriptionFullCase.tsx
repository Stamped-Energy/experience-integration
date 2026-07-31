import type { ReactNode } from "react";
import {
  DataTable,
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";
import { emphasizeCause, emphasizeLead, emphasizeNumbers } from "@/components/prescriptions/prescription-formatting";
import {
  DiscussPanel,
  TradeoffBlock,
  isManagementRx,
} from "@/components/prescriptions/DiscussPanel";
import { PrescriptionEvidencePreview } from "@/components/prescriptions/PrescriptionEvidencePreview";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import type { EvidencePack } from "@/lib/evidence";
import { claimBadgeLabel, formatBaselineLabel, formatInr, formatIstDate, formatIstDateRange } from "@/lib/format";
import { buildPrescriptionCaseDetail } from "@/lib/prescription-case";
import type { Alarm, LedgerEntry, Prescription } from "@/lib/types";
import type { DemoAsset } from "@/fixtures/demo";
import "./prescription-full-case.css";

const priorityTone = {
  high: "critical",
  med: "warning",
  low: "info",
} as const;

function CompactSection({
  title,
  children,
  className,
  variant,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "accent" | "warn" | "insight";
}) {
  return (
    <section
      className={[
        "rx-full-case__block",
        variant ? `rx-full-case__block--${variant}` : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="rx-full-case__block-title">{title}</h3>
      {children}
    </section>
  );
}

function Prose({ children, lead }: { children: ReactNode; lead?: boolean }) {
  return (
    <p className={`rx-full-case__prose${lead ? " rx-full-case__prose--lead" : ""}`}>
      {typeof children === "string" ? emphasizeNumbers(children) : children}
    </p>
  );
}

function BulletList({ items, emphasize }: { items: string[]; emphasize?: "cause" | "lead" }) {
  return (
    <ul className="rx-full-case__list">
      {items.map((item) => (
        <li key={item}>
          {emphasize === "cause"
            ? emphasizeCause(item)
            : emphasize === "lead"
              ? emphasizeLead(item)
              : emphasizeNumbers(item)}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="rx-full-case__action-list">
      {items.map((item, i) => (
        <li key={item} className="rx-full-case__action-item">
          <span className="rx-full-case__action-num" aria-hidden>
            {i + 1}
          </span>
          <span className="rx-full-case__action-text">{emphasizeLead(item)}</span>
        </li>
      ))}
    </ol>
  );
}

function CompactMeta({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <dl className="rx-full-case__compact-meta">
      {rows.map((row) => (
        <div key={row.label} className="rx-full-case__compact-meta-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PrescriptionFullCase({
  rx,
  pack,
  ledger,
  alarm,
  asset,
  evidenceSample,
  evidenceHref,
  orgId = "org_acme",
}: {
  rx: Prescription;
  pack: EvidencePack;
  ledger?: LedgerEntry;
  alarm?: Alarm;
  asset?: DemoAsset;
  evidenceSample?: EvidenceSample;
  evidenceHref?: string;
  orgId?: string;
}) {
  const detail = buildPrescriptionCaseDetail({ rx, pack, ledger, alarm, asset });
  const badge = claimBadgeLabel(rx.verificationStatus);

  const workflowRows = [
    { label: "Owner", value: rx.ownerRole.replaceAll("_", " ") },
    { label: "Bill line", value: rx.billLine ?? "—" },
    { label: "Effort", value: rx.effort ?? "—" },
    { label: "Due", value: rx.dueLabel ?? formatIstDate(rx.dueAt) },
  ];

  const metaRows = [
    ...(detail.metadata ?? []).slice(0, 8),
    ...(detail.lineage ?? []).slice(0, 6),
  ];

  return (
    <div className="rx-full-case" data-rx-full-case>
      {/* ── Full-width compact hero ── */}
      <Panel className="rx-full-case__hero">
        <div className="rx-full-case__hero-grid">
          <div className="rx-full-case__hero-left">
            <div className="rx-full-case__chips">
              {rx.category ? <StatusChip tone="neutral">{rx.category}</StatusChip> : null}
              {rx.priority ? (
                <StatusChip tone={priorityTone[rx.priority]}>{rx.priority}</StatusChip>
              ) : null}
              <StatusChip tone="info">{Math.round(rx.confidence * 100)}%</StatusChip>
              <StatusChip tone="neutral">{rx.lane.replaceAll("_", " ")}</StatusChip>
              {rx.verificationStatus ? (
                <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
              ) : null}
              {detail.createdAt ? (
                <span className="rx-full-case__created">· {detail.createdAt}</span>
              ) : null}
            </div>
            <Prose lead>{detail.description}</Prose>
          </div>
          <div className="rx-full-case__hero-savings rx-full-case__stat-box">
            <p className="forge-eyebrow">Potential savings</p>
            <p className="rx-full-case__savings-amount tabular">
              {formatInr(rx.impactInrPerMonth)}
            </p>
            <p className="rx-full-case__savings-period">per month</p>
            <p className="rx-full-case__savings-range tabular">
              {formatInr(rx.impactInrPerMonth * 12)} / yr modeled
            </p>
          </div>
        </div>
      </Panel>

      {/* ── Two-column body ── */}
      <div className="rx-full-case__body">
        {/* LEFT — narrative & tables */}
        <div className="rx-full-case__main">
          <div className="rx-full-case__main-grid">
            {detail.rootCause?.length ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--insight">
                <CompactSection title="Root-cause analysis" variant="insight">
                  <BulletList items={detail.rootCause} emphasize="cause" />
                </CompactSection>
              </Panel>
            ) : null}

            <Panel className="rx-full-case__panel rx-full-case__panel--action">
              <CompactSection title="Recommended action" variant="accent">
                <NumberedList
                  items={
                    rx.actions && rx.actions.length > 0
                      ? rx.actions
                      : (detail.commissioning ?? [])
                  }
                />
              </CompactSection>
            </Panel>

            {detail.eventSnapshot ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--wide">
                <CompactSection title={detail.eventSnapshot.caption}>
                  <p className="rx-full-case__timestamp tabular">{detail.eventSnapshot.timestamp}</p>
                  <div className="rx-full-case__table-wrap">
                    <DataTable
                      caption={detail.eventSnapshot.caption}
                      columns={detail.eventSnapshot.columns}
                      rows={detail.eventSnapshot.rows}
                    />
                  </div>
                  <div className="rx-full-case__callout rx-full-case__callout--key">
                    <span className="rx-full-case__callout-label">What this shows</span>
                    <Prose>{detail.eventSnapshot.interpretation}</Prose>
                  </div>
                  {detail.eventSnapshot.sanityCheck ? (
                    <div className="rx-full-case__callout rx-full-case__callout--muted">
                      <span className="rx-full-case__callout-label">Sanity check</span>
                      <Prose>{detail.eventSnapshot.sanityCheck}</Prose>
                    </div>
                  ) : null}
                </CompactSection>
              </Panel>
            ) : null}

            {detail.costBenefit ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--money">
                <CompactSection title="Cost–benefit & ROI">
                  <div className="rx-full-case__stat-inline">
                    <Prose>{detail.costBenefit.wasteIdentified}</Prose>
                  </div>
                  {detail.costBenefit.tariffScenarios ? (
                    <div className="rx-full-case__table-wrap">
                      <DataTable
                        caption="Tariff scenarios"
                        columns={detail.costBenefit.tariffScenarios.columns}
                        rows={detail.costBenefit.tariffScenarios.rows}
                      />
                    </div>
                  ) : null}
                  {detail.costBenefit.capexNote ? <Prose>{detail.costBenefit.capexNote}</Prose> : null}
                  {detail.costBenefit.sideGains?.length ? (
                    <BulletList items={detail.costBenefit.sideGains} />
                  ) : null}
                  {rx.opportunityCost ? (
                    <p className="rx-full-case__opportunity tabular">
                      Opportunity cost {formatInr(rx.opportunityCost.modeledInr)} (
                      {rx.opportunityCost.delayDays}d delay)
                    </p>
                  ) : null}
                  {rx.realisedInr != null ? (
                    <p className="rx-full-case__realised tabular">
                      Realised: {formatInr(rx.realisedInr)}
                    </p>
                  ) : null}
                </CompactSection>
              </Panel>
            ) : null}

            {isManagementRx(rx) && rx.tradeoff ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--money">
                <CompactSection title="Trade-off">
                  <TradeoffBlock tradeoff={rx.tradeoff} />
                </CompactSection>
              </Panel>
            ) : null}

            {isManagementRx(rx) ? (
              <DiscussPanel rx={rx} orgId={orgId} plantId={rx.plantId} />
            ) : null}

            {detail.risksTable ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--warn">
                <CompactSection title="Risks & mitigations" variant="warn">
                  <div className="rx-full-case__table-wrap">
                    <DataTable
                      caption="Risks and mitigations"
                      columns={detail.risksTable.columns}
                      rows={detail.risksTable.rows}
                    />
                  </div>
                </CompactSection>
              </Panel>
            ) : rx.risks?.length ? (
              <Panel className="rx-full-case__panel">
                <CompactSection title="Risks & mitigations">
                  <BulletList items={rx.risks} />
                </CompactSection>
              </Panel>
            ) : null}

            {detail.kpis ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--kpi">
                <CompactSection title="KPIs & alerts">
                  <div className="rx-full-case__table-wrap">
                    <DataTable
                      caption="KPI targets and alerts"
                      columns={detail.kpis.columns}
                      rows={detail.kpis.rows}
                    />
                  </div>
                </CompactSection>
              </Panel>
            ) : null}

            {detail.commissioning?.length ? (
              <Panel className="rx-full-case__panel">
                <CompactSection title="Commissioning & verification">
                  <NumberedList items={detail.commissioning} />
                </CompactSection>
              </Panel>
            ) : null}

            {ledger ? (
              <Panel className="rx-full-case__panel">
                <CompactSection title="Ledger entry">
                  <CompactMeta
                    rows={[
                      { label: "Savings verification", value: ledger.mvMethod },
                      { label: "Baseline", value: formatBaselineLabel(ledger.baselineId) },
                      {
                        label: "Period",
                        value: formatIstDateRange(ledger.periodStart, ledger.periodEnd),
                      },
                      { label: "Potential", value: formatInr(ledger.potentialInr) },
                      { label: "Realised", value: formatInr(ledger.realisedInr) },
                      {
                        label: "Status",
                        value: claimBadgeLabel(ledger.verificationStatus).label,
                      },
                    ]}
                  />
                </CompactSection>
              </Panel>
            ) : null}

            {detail.managerTakeaway ? (
              <Panel className="rx-full-case__panel rx-full-case__panel--wide rx-full-case__panel--takeaway">
                <CompactSection title="Manager takeaway">
                  <Prose lead>{detail.managerTakeaway}</Prose>
                </CompactSection>
              </Panel>
            ) : null}
          </div>
        </div>

        {/* RIGHT — evidence visual + compact context */}
        <aside className="rx-full-case__aside">
          <Panel className="rx-full-case__panel rx-full-case__panel--sticky">
            <PrescriptionEvidencePreview
              sample={evidenceSample}
              pack={pack}
              evidenceHref={evidenceHref}
            />

            <CompactSection title="Anomaly window">
              <CompactMeta
                rows={[
                  {
                    label: "From",
                    value: pack.anomaly.from.replace("T", " ").slice(0, 16),
                  },
                  {
                    label: "To",
                    value: pack.anomaly.to.replace("T", " ").slice(0, 16),
                  },
                  { label: "Summary", value: pack.anomaly.summary },
                ]}
              />
              {pack.missing.length > 0 ? (
                <p className="rx-full-case__missing">Missing: {pack.missing.join(", ")}</p>
              ) : null}
            </CompactSection>

            {metaRows.length ? (
              <CompactSection title="Case details">
                <CompactMeta rows={metaRows} />
              </CompactSection>
            ) : null}

            <CompactSection title="Workflow">
              <CompactMeta rows={workflowRows} />
              <div className="rx-full-case__aside-actions">
                <ForgeButtonGroup>
                  {rx.relatedAlarmId ? (
                    <ForgeButton variant="ghost" href={`/alarms/${rx.relatedAlarmId}`}>
                      Alarm
                    </ForgeButton>
                  ) : null}
                  {evidenceHref ? (
                    <ForgeButton variant="ghost" href={evidenceHref}>
                      Evidence
                    </ForgeButton>
                  ) : null}
                  <ForgeButton variant="ghost" href="/settings/assignments">
                    Assignments
                  </ForgeButton>
                </ForgeButtonGroup>
              </div>
            </CompactSection>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
