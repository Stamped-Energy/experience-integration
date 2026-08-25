"use client";

import Link from "next/link";
import type { Alarm, Prescription } from "@/lib/types";
import { RouteStateView } from "@/components/states/RouteStateView";
import type { RouteStateModel } from "@/lib/route-state";
import { KpiHeroStrip, type OverviewLiveKpis } from "@/components/today/overview/KpiHeroStrip";
import { PrescriptionsOverviewPanel } from "@/components/today/overview/PrescriptionsOverviewPanel";
import { EnergyTrendPanel, type LiveTrendDay } from "@/components/today/overview/EnergyTrendPanel";
import { TopConsumersTable, type LiveConsumerRow } from "@/components/today/overview/TopConsumersTable";
import { SectionDonut, type LiveSectionRow } from "@/components/today/overview/SectionDonut";
import { SignalCard } from "@/components/today/SignalCard";
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
        ? { value: formatInr(live.confirmedSavingsMtdInr), hint: "From savings ledger" }
        : null,
  },
  {
    id: "closure_rate",
    label: "Closure rate (30d)",
    href: "/prescriptions",
    tone: "good",
    fill: (live) =>
      live?.closureRate30d != null
        ? { value: `${live.closureRate30d}%`, hint: "From prescription workflow" }
        : null,
  },
  {
    id: "critical_alarms",
    label: "Critical alarms",
    href: "/alarms",
    tone: "critical",
    fill: (live) =>
      live?.criticalAlarmCount != null
        ? { value: `${live.criticalAlarmCount} open`, hint: "From alarm console" }
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
                : "From demand telemetry",
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
            hint: "From energy baseline comparison",
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

export function OverviewBoard({
  liveKpis,
  energyTrend30d,
  topConsumers,
  sectionShare,
  energyInrPerKwh,
  prescriptions,
  state = { kind: "default" },
  onRetry,
}: {
  liveKpis?: OverviewLiveKpis | null;
  energyTrend30d?: LiveTrendDay[] | null;
  topConsumers?: LiveConsumerRow[] | null;
  sectionShare?: LiveSectionRow[] | null;
  energyInrPerKwh?: number | null;
  closurePct?: number | null;
  alarms?: Alarm[];
  prescriptions: Prescription[];
  assets?: unknown[];
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
                  hint={filled?.hint ?? "No data yet"}
                  tone={filled ? slot.tone : "neutral"}
                />
              </Link>
            );
          })}
        </div>

        <KpiHeroStrip live={liveKpis} />

        <EnergyTrendPanel rows={energyTrend30d} />

        <div className="forge-grid-38-62">
          <PrescriptionsOverviewPanel prescriptions={prescriptions} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <TopConsumersTable rows={topConsumers} />
            <SectionDonut rows={sectionShare} tariffInrPerKwh={energyInrPerKwh} />
          </div>
        </div>
      </div>
    </RouteStateView>
  );
}
