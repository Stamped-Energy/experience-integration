"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { formatIndianNum, formatInr } from "@/lib/format";
import { Gauge } from "@/components/charts/Gauge";
import { Panel } from "@/components/ui/primitives";
import { IconBadge, KPI_ICONS } from "@/components/ui/indicators";
import { Sparkles, TrendingDown, TrendingUp } from "@/components/ui/icons";

export type OverviewLiveKpis = {
  stampedSavingsMonthInr: number | null;
  totalEnergyKwhMtd: number | null;
  aiScore: number | null;
  co2Tco2e: number | null;
  confirmedSavingsMtdInr: number | null;
  closureRate30d: number | null;
  mdHeadroomPct: number | null;
  mdPeakKva: number | null;
  mdCmdKva: number | null;
  vsBaseline7dPct: number | null;
  telemetryFreshnessSec: number | null;
  needsReviewCount: number | null;
  needsReviewInr: number | null;
  criticalAlarmCount: number | null;
};

function HeroCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Panel className="forge-kpi-hero-card" style={style}>
      {children}
    </Panel>
  );
}

function EmDash() {
  return (
    <div
      className="forge-num-display tabular"
      style={{
        fontSize: "clamp(1.5rem, 2.2vw, 2.2rem)",
        marginTop: 8,
        color: "var(--forge-on-surface-variant)",
      }}
    >
      —
    </div>
  );
}

export function KpiHeroStrip({ live }: { live?: OverviewLiveKpis | null }) {
  const savingsVal = live?.stampedSavingsMonthInr ?? 0;
  const energyVal = live?.totalEnergyKwhMtd ?? 0;
  const scoreVal = live?.aiScore ?? 0;
  const carbonVal = live?.co2Tco2e ?? 0;

  const savings = useCountUp(savingsVal);
  const energy = useCountUp(energyVal);
  const score = useCountUp(scoreVal);
  const carbon = useCountUp(carbonVal);

  return (
    <div className="forge-kpi-hero-strip" role="list" aria-label="Plant KPIs">
      <HeroCard>
        <IconBadge icon={KPI_ICONS.savings} tone="primary" size={34} iconSize={17} />
        <p className="forge-eyebrow" style={{ color: "var(--forge-primary)", marginTop: 0 }}>
          Stamped Savings This Month
        </p>
        {live?.stampedSavingsMonthInr == null ? (
          <EmDash />
        ) : (
          <>
            <div
              className="forge-num-display tabular"
              style={{ fontSize: "clamp(1.5rem, 2.2vw, 2.4rem)", marginTop: 6, whiteSpace: "nowrap" }}
            >
              {formatInr(savings)}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                color: "var(--forge-tertiary)",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              <TrendingUp size={13} strokeWidth={2.5} />
              From savings ledger
            </div>
          </>
        )}
      </HeroCard>

      <HeroCard>
        <IconBadge icon={KPI_ICONS.energy} tone="warning" size={34} iconSize={17} />
        <p className="forge-eyebrow">Total Energy Consumed</p>
        {live?.totalEnergyKwhMtd == null ? (
          <EmDash />
        ) : (
          <div
            className="forge-num-display tabular"
            style={{ fontSize: "clamp(1.3rem, 1.8vw, 1.85rem)", marginTop: 8, whiteSpace: "nowrap" }}
          >
            {formatIndianNum(energy)}{" "}
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>kWh</span>
          </div>
        )}
      </HeroCard>

      <HeroCard>
        <div className="forge-kpi-hero-card__row">
          <IconBadge icon={KPI_ICONS.score} tone="good" size={34} iconSize={17} />
          {live?.aiScore != null ? (
            <Gauge label="AI score" value={score} valueText={String(Math.round(score))} size={44} />
          ) : null}
        </div>
        <p className="forge-eyebrow">Stamped AI Score</p>
        {live?.aiScore == null ? (
          <EmDash />
        ) : (
          <>
            <div
              className="forge-num-display tabular"
              style={{ fontSize: "1.85rem", color: "var(--forge-primary)", marginTop: 4 }}
            >
              {Math.round(score)}
              <span style={{ fontSize: "0.85rem", color: "var(--forge-on-surface-variant)" }}>
                {" "}
                / 100
              </span>
            </div>
            <span title="Live score" style={{ display: "inline-flex", marginTop: 8 }}>
              <IconBadge icon={Sparkles} tone="primary" size={26} iconSize={13} />
            </span>
          </>
        )}
      </HeroCard>

      <HeroCard>
        <IconBadge icon={KPI_ICONS.carbon} tone="good" size={34} iconSize={17} />
        <p className="forge-eyebrow">CO₂ Equivalent</p>
        {live?.co2Tco2e == null ? (
          <EmDash />
        ) : (
          <>
            <div
              className="forge-num-display tabular"
              style={{
                fontSize: "clamp(1.3rem, 1.8vw, 1.85rem)",
                marginTop: 8,
                whiteSpace: "nowrap",
              }}
            >
              {Math.round(carbon)}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>tCO₂e</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                color: "var(--forge-tertiary)",
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              <TrendingDown size={12} strokeWidth={2.5} />
              From plant data
            </div>
          </>
        )}
      </HeroCard>
    </div>
  );
}
