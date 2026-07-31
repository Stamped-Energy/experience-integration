"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LoadDial } from "@/components/charts/LoadDial";
import { EvidenceTrend } from "@/components/charts/EvidenceTrend";
import { EvidenceMiniChart } from "@/components/evidence/EvidenceMiniChart";
import { emphasizeNumbers } from "@/components/prescriptions/prescription-formatting";
import { ForgeDisclosure } from "@/components/ui/ForgeDisclosure";
import {
  DataTable,
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import { formatBaselineLabel, formatRuleLabel } from "@/lib/format";
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

function CompactMeta({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <dl className="evd-full__meta">
      {rows.map((row) => (
        <div key={row.label} className="evd-full__meta-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AsideSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["evd-full__aside-block", className].filter(Boolean).join(" ")}>
      {title ? <h3 className="evd-full__block-title">{title}</h3> : null}
      {children}
    </section>
  );
}

export function EvidenceDetail({
  sample,
  showBaselineBand = false,
}: {
  sample: EvidenceSample;
  showBaselineBand?: boolean;
}) {
  const accent = chartAccent[sample.categoryBadge.tone];

  const contextRows = [
    { label: "Asset", value: sample.assetLabel },
    { label: "Finding", value: sample.findingId ?? "-" },
    { label: "Baseline", value: formatBaselineLabel(sample.baselineId) },
    { label: "Rule", value: formatRuleLabel(sample.findingId) },
  ];

  const renderChart = () => (
    <Panel className="evd-full__panel evd-full__panel--chart">
      <h3 className="evd-full__block-title">What the chart shows</h3>
      <p className="evd-full__chart-caption">{sample.chartTitle}</p>
      <EvidenceMiniChart chart={sample.chart} accent={accent} />

      {sample.chart.kind === "line" && sample.chart.highlight ? (
        <div className="evd-full__callout evd-full__callout--key">
          <span className="evd-full__callout-label">Highlighted window</span>
          <p className="evd-full__prose">
            {sample.chart.highlight.label}. Highlighted interval linked to this alarm or
            prescription.
          </p>
        </div>
      ) : null}

      {sample.chart.kind === "bar" && sample.chart.annotation ? (
        <div className="evd-full__callout evd-full__callout--key">
          <span className="evd-full__callout-label">Bar chart note</span>
          <p className="evd-full__prose">{sample.chart.annotation}</p>
        </div>
      ) : null}
    </Panel>
  );

  const renderNav = () => (
    <div className="evd-full__mobile-nav">
      <div className="evd-full__links" data-evidence-parents>
        {sample.alarmId ? (
          <StatusChip tone="critical">
            <Link href={`/alarms/${sample.alarmId}`} style={{ color: "inherit" }}>
              Alarm · {sample.assetLabel}
            </Link>
          </StatusChip>
        ) : null}
        {sample.rxId ? (
          <StatusChip tone="info">
            <Link href={`/prescriptions/${sample.rxId}`} style={{ color: "inherit" }}>
              Prescriptions
            </Link>
          </StatusChip>
        ) : null}
      </div>
      <ForgeButtonGroup aria-label="Evidence navigation" toolbar className="evd-full__actions">
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
        <ForgeButton variant="secondary" href={backHref(sample)}>
          {backLabel(sample)}
        </ForgeButton>
      </ForgeButtonGroup>
    </div>
  );

  const renderContext = () => (
    <>
      <AsideSection title="Case context">
        <CompactMeta rows={contextRows} />
      </AsideSection>
      <AsideSection>
        <div className="evd-full__callout evd-full__callout--mv evd-full__callout--flush">
          <span className="evd-full__callout-label">M&amp;V status</span>
          <p className="evd-full__prose">{sample.mvFooter}</p>
        </div>
      </AsideSection>
    </>
  );

  const renderMoreDetail = () => (
    <>
      {sample.dials.length ? (
        <AsideSection title="Live dials at anomaly">
          <div className="evd-full__aside-dials">
            {sample.dials.map((d) => (
              <LoadDial
                key={d.label}
                label={d.label}
                value={d.needle}
                max={d.needleMax ?? 120}
                displayText={d.display}
                unit={d.unit ?? ""}
                size={108}
              />
            ))}
          </div>
        </AsideSection>
      ) : null}

      <AsideSection title="Tag readings">
        <p className="evd-full__prose evd-full__prose--muted evd-full__aside-note">
          Meter tags sampled inside the anomaly window.
        </p>
        <div className="evidence-table-wrap evd-full__aside-table">
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
      </AsideSection>

      <AsideSection title="Lineage">
        <pre className="evd-full__metadata">{sample.metadata}</pre>
      </AsideSection>
    </>
  );

  return (
    <div className="evd-full" data-evidence-detail>
      <Panel className="evd-full__hero">
        <div className="evd-full__hero-grid">
          <div>
            <div className="evd-full__chips">
              <StatusChip tone="neutral">Evidence · Proof pack</StatusChip>
              <StatusChip tone={categoryTone[sample.categoryBadge.tone]}>
                {sample.categoryBadge.label}
              </StatusChip>
            </div>
            <h2 className="evd-full__issue">{sample.issueTitle}</h2>
            <p className="evd-full__lead evd-full__lead--mobile-clamp">
              {emphasizeNumbers(sample.mvFooter)}
            </p>
          </div>
          <div className="evd-full__stat-box">
            <p className="forge-eyebrow">Signal window</p>
            <p className="evd-full__stat-value">{sample.chartTitle.replace("SIGNAL WINDOW · ", "")}</p>
            <p className="evd-full__stat-sub">{sample.assetLabel}</p>
          </div>
        </div>
      </Panel>

      {/* Desktop: chart + trend | sticky aside */}
      <div className="evd-full__body forge-desktop-stack">
        <div className="evd-full__main">
          {renderChart()}
          <EvidenceTrend assetLabel={sample.assetLabel} showBaselineBand={showBaselineBand} />
        </div>

        <aside className="evd-full__aside">
          <Panel className="evd-full__panel evd-full__panel--sticky">
            {renderContext()}
            <AsideSection>{renderNav()}</AsideSection>
            <ForgeDisclosure title="More detail">{renderMoreDetail()}</ForgeDisclosure>
          </Panel>
        </aside>
      </div>

      {/* Mobile essentials */}
      <div className="forge-mobile-always" data-testid="evd-mobile-always">
        {renderChart()}
        <Panel className="evd-full__panel">{renderNav()}</Panel>
      </div>

      <div className="forge-disclosure-stack" data-testid="evd-mobile-disclosures">
        <ForgeDisclosure title="Trend">
          <EvidenceTrend assetLabel={sample.assetLabel} showBaselineBand={showBaselineBand} />
        </ForgeDisclosure>
        <ForgeDisclosure title="Case context">
          <Panel className="evd-full__panel">{renderContext()}</Panel>
        </ForgeDisclosure>
        <ForgeDisclosure title="More detail">
          <Panel className="evd-full__panel">{renderMoreDetail()}</Panel>
        </ForgeDisclosure>
      </div>
    </div>
  );
}
