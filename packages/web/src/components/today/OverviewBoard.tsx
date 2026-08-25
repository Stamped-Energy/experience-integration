"use client";

import Link from "next/link";
import type { Alarm, Prescription } from "@/lib/types";
import { RouteStateView } from "@/components/states/RouteStateView";
import type { RouteStateModel } from "@/lib/route-state";
import { KpiHeroStrip, type OverviewLiveKpis } from "@/components/today/overview/KpiHeroStrip";
import { PrescriptionsOverviewPanel } from "@/components/today/overview/PrescriptionsOverviewPanel";
import { SignalCard } from "@/components/today/SignalCard";
import { Panel } from "@/components/ui/primitives";
import { formatInr } from "@/lib/format";

/** Always show the decision-strip cards; fill from live KPIs or leave blank. */
const SIGNAL_SLOTS: Array<{
  id: string;
  label: string;
  href: string;
  tone: "good" | "warning" | "critical" | "neutral";
  fill: (live: OverviewLiveKpis | null | undefined) => { value: string; hint: string } | null;
}> = [
  {
    id: "confirmed_savings",
    label: "Confirmed savings (MTD)",
    href: "/reports",
    tone: "good",
    fill: (live) =>
      live?.confirmedSavingsMtdInr != null
        ? { value: formatInr(live.confirmedSavingsMtdInr), hint: "From L5 realised ledger" }
        : null,
  },
  {
    id: "closure_rate",
    label: "Closure rate (30d)",
    href: "/prescriptions",
    tone: "good",
    fill: (live) =>
      live?.closureRate30d != null
        ? { value: `${live.closureRate30d}%`, hint: "From L5 prescription statuses" }
        : null,
  },
  {
    id: "critical_alarms",
    label: "Critical alarms",
    href: "/alarms",
    tone: "critical",
    fill: (live) =>
      live?.criticalAlarmCount != null
        ? { value: `${live.criticalAlarmCount} open`, hint: "From L5" }
        : null,
  },
  {
    id: "needs_review",
    label: "Needs review",
    href: "/prescriptions",
    tone: "warning",
    fill: (live) =>
      live?.needsReviewInr != null
        ? {
            value: formatInr(live.needsReviewInr),
            hint: `${live.needsReviewCount ?? 0} prescriptions`,
          }
        : null,
  },
  {
    id: "md_headroom",
    label: "MD headroom",
    href: "/live",
    tone: "warning",
    fill: (live) =>
      live?.mdHeadroomPct != null
        ? {
            value: `${live.mdHeadroomPct}%`,
            hint:
              live.mdPeakKva != null && live.mdCmdKva != null
                ? `Peak ${Math.round(live.mdPeakKva)} / CMD ${Math.round(live.mdCmdKva)} kVA`
                : "From L2 tariff + telemetry",
          }
        : null,
  },
  {
    id: "vs_baseline",
    label: "Vs baseline (7d)",
    href: "/energy",
    tone: "neutral",
    fill: (live) =>
      live?.vsBaseline7dPct != null
        ? {
            value: `${live.vsBaseline7dPct > 0 ? "+" : ""}${live.vsBaseline7dPct}%`,
            hint: "From L2 baselines",
          }
        : null,
  },
  {
    id: "telemetry",
    label: "Telemetry",
    href: "/live",
    tone: "neutral",
    fill: (live) =>
      live?.telemetryFreshnessSec != null
        ? {
            value: live.telemetryFreshnessSec < 120 ? "Fresh" : "Stale",
            hint: `Last sample ${live.telemetryFreshnessSec}s ago`,
          }
        : null,
  },
];

function EmptyPanel({
  eyebrow,
  title,
  minHeight = 180,
  children,
}: {
  eyebrow: string;
  title: string;
  minHeight?: number;
  children?: React.ReactNode;
}) {
  return (
    <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <p className="forge-eyebrow">{eyebrow}</p>
        <h3 className="forge-card-title">{title}</h3>
      </div>
      <div
        style={{
          minHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 20px 24px",
          color: "var(--forge-on-surface-variant)",
          fontSize: 13,
        }}
      >
        {children ?? "—"}
      </div>
    </Panel>
  );
}

export function OverviewBoard({
  liveKpis,
  alarms: _alarms,
  prescriptions,
  assets: _assets,
  state = { kind: "default" },
  onRetry,
}: {
  liveKpis?: OverviewLiveKpis | null;
  closurePct?: number | null;
  alarms: Alarm[];
  prescriptions: Prescription[];
  assets: unknown[];
  state?: RouteStateModel;
  onRetry?: () => void;
}) {
  return (
    <RouteStateView state={state} onRetry={onRetry}>
      <div
        data-today-board
        data-overview-board
        data-signal-count={SIGNAL_SLOTS.length}
        className="forge-page-stack"
      >
        <div className="forge-signal-strip" role="list" aria-label="Decision signals">
          {SIGNAL_SLOTS.map((slot) => {
            const filled = slot.fill(liveKpis);
            return (
              <Link
                key={slot.id}
                href={slot.href}
                role="listitem"
                data-signal-id={slot.id}
                className="forge-signal-card-link"
              >
                <SignalCard
                  label={slot.label}
                  value={filled?.value ?? "—"}
                  hint={filled?.hint ?? "No upstream data"}
                  tone={filled ? slot.tone : "neutral"}
                />
              </Link>
            );
          })}
        </div>

        <KpiHeroStrip live={liveKpis} />

        <EmptyPanel eyebrow="Energy trend" title="30-day consumption" minHeight={280}>
          Chart empty until L2 measurements are available
        </EmptyPanel>

        <div className="forge-grid-38-62">
          <PrescriptionsOverviewPanel prescriptions={prescriptions} liveMode />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <EmptyPanel eyebrow="Consumption breakdown" title="Top energy consumers" minHeight={200}>
              No consumer ranking from L2 yet
            </EmptyPanel>
            <EmptyPanel eyebrow="Section share" title="Energy by section" minHeight={200}>
              No section breakdown from L2 yet
            </EmptyPanel>
          </div>
        </div>
      </div>
    </RouteStateView>
  );
}
