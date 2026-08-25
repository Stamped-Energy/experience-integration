"use client";

import Link from "next/link";
import type { Alarm, Prescription } from "@/lib/types";
import { RouteStateView } from "@/components/states/RouteStateView";
import type { RouteStateModel } from "@/lib/route-state";
import { KpiHeroStrip, type OverviewLiveKpis } from "@/components/today/overview/KpiHeroStrip";
import { PrescriptionsOverviewPanel } from "@/components/today/overview/PrescriptionsOverviewPanel";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import { SignalCard } from "@/components/today/SignalCard";
import { formatInr } from "@/lib/format";

function buildLiveSignals(live: OverviewLiveKpis | null | undefined) {
  if (!live) return [];
  const out: Array<{
    id: string;
    label: string;
    value: string;
    hint: string;
    tone: "good" | "warning" | "critical" | "neutral";
    href: string;
  }> = [];

  if (live.confirmedSavingsMtdInr != null) {
    out.push({
      id: "confirmed_savings",
      label: "Confirmed savings (MTD)",
      value: formatInr(live.confirmedSavingsMtdInr),
      hint: "From L5 realised ledger",
      tone: "good",
      href: "/reports",
    });
  }
  if (live.closureRate30d != null) {
    out.push({
      id: "closure_rate",
      label: "Closure rate (30d)",
      value: `${live.closureRate30d}%`,
      hint: "From L5 prescription statuses",
      tone: live.closureRate30d >= 50 ? "good" : "warning",
      href: "/prescriptions",
    });
  }
  if (live.criticalAlarmCount != null) {
    out.push({
      id: "critical_alarms",
      label: "Critical alarms",
      value: `${live.criticalAlarmCount} open`,
      hint: "From L5",
      tone: live.criticalAlarmCount > 0 ? "critical" : "good",
      href: "/alarms",
    });
  }
  if (live.needsReviewInr != null) {
    out.push({
      id: "needs_review",
      label: "Needs review",
      value: formatInr(live.needsReviewInr),
      hint: `${live.needsReviewCount ?? 0} prescriptions`,
      tone: "warning",
      href: "/prescriptions",
    });
  }
  if (live.mdHeadroomPct != null) {
    out.push({
      id: "md_headroom",
      label: "MD headroom",
      value: `${live.mdHeadroomPct}%`,
      hint:
        live.mdPeakKva != null && live.mdCmdKva != null
          ? `Peak ${Math.round(live.mdPeakKva)} / CMD ${Math.round(live.mdCmdKva)} kVA`
          : "From L2 tariff + telemetry",
      tone: live.mdHeadroomPct < 10 ? "warning" : "good",
      href: "/live",
    });
  }
  if (live.vsBaseline7dPct != null) {
    out.push({
      id: "vs_baseline",
      label: "Vs baseline (7d)",
      value: `${live.vsBaseline7dPct > 0 ? "+" : ""}${live.vsBaseline7dPct}%`,
      hint: "From L2 baselines",
      tone: live.vsBaseline7dPct > 5 ? "warning" : "neutral",
      href: "/energy",
    });
  }
  if (live.telemetryFreshnessSec != null) {
    out.push({
      id: "telemetry",
      label: "Telemetry",
      value: live.telemetryFreshnessSec < 120 ? "Fresh" : "Stale",
      hint: `Last sample ${live.telemetryFreshnessSec}s ago`,
      tone: live.telemetryFreshnessSec < 120 ? "good" : "warning",
      href: "/live",
    });
  }
  return out;
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
  const signals = buildLiveSignals(liveKpis);

  return (
    <RouteStateView state={state} onRetry={onRetry}>
      <div
        data-today-board
        data-overview-board
        data-signal-count={signals.length}
        className="forge-page-stack"
      >
        {signals.length === 0 ? (
          <EmptyUpstreamState
            title="No decision signals yet"
            detail="Signals appear when L2/L5 return non-null KPI fields."
          />
        ) : (
          <div className="forge-signal-strip" role="list" aria-label="Decision signals">
            {signals.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                role="listitem"
                data-signal-id={s.id}
                className="forge-signal-card-link"
              >
                <SignalCard
                  label={s.label}
                  value={s.value}
                  hint={s.hint}
                  tone={s.tone === "good" ? "good" : s.tone}
                />
              </Link>
            ))}
          </div>
        )}

        <KpiHeroStrip live={liveKpis} />

        <EmptyUpstreamState
          title="Energy trend chart"
          detail="30-day trend requires L2 continuous measurements — not shown as fixture."
        />
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
            <EmptyUpstreamState
              title="Top consumers"
              detail="Waster ranking needs multi-asset L2 aggregation — empty until wired."
            />
            <EmptyUpstreamState
              title="Section breakdown"
              detail="Department share needs L2 department-graph + energy rollup."
            />
          </div>
        </div>
      </div>
    </RouteStateView>
  );
}
