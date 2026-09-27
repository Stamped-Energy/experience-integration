"use client";

import { Panel, StatusChip } from "@/components/ui/primitives";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import { TOD_BANDS_RJ } from "@/lib/analytics";
import { formatEmissionFactorRef, formatIndianNum } from "@/lib/format";

export type SustainabilityBoardData = {
  plantName?: string | null;
  tariffLabel?: string | null;
  derivedNotes?: string[];
  secKwhPerUnit: number | null;
  scope2Tco2e: number | null;
  renewablePct: number | null;
  mdHeadroomPct: number | null;
  cmdKva: number | null;
  peakMdKva: number | null;
  gridKwh30d: number | null;
  productionUnits: number | null;
  emissionFactorRef: string;
  secTrend: Array<{ label: string; value: number }> | null;
  emissionsTrend: Array<{ label: string; value: number }> | null;
  topConsumers: Array<{
    label: string;
    sharePct: number;
    health: "calm" | "watch" | "hot";
  }> | null;
  todPeakSharePct: number | null;
};

function MiniBarChart({
  items,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="sust-chart sust-chart--bars" role="img" aria-label="Bar chart">
      {items.map((item) => (
        <div key={item.label} className="sust-chart__bar-row">
          <span className="sust-chart__bar-label">{item.label}</span>
          <div className="sust-chart__bar-track">
            <div
              className="sust-chart__bar-fill"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color ?? "var(--forge-tertiary)",
              }}
            />
          </div>
          <span className="sust-chart__bar-value tabular">
            {formatIndianNum(item.value, 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmissionsSplit({
  gridPct,
  renewablePct,
}: {
  gridPct: number;
  renewablePct: number;
}) {
  return (
    <div className="sust-split" role="img" aria-label="Energy mix">
      <div className="sust-split__track">
        <div className="sust-split__renewable" style={{ width: `${renewablePct}%` }} />
        <div className="sust-split__grid" style={{ width: `${100 - renewablePct}%` }} />
      </div>
      <div className="sust-split__legend">
        <span>
          <i className="sust-split__dot sust-split__dot--renewable" /> Renewable{" "}
          {renewablePct.toFixed(1)}%
        </span>
        <span>
          <i className="sust-split__dot sust-split__dot--grid" /> Grid {gridPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/** Props-only sustainability board — no fixture imports. */
export function SustainabilityDashboard({ data }: { data: SustainabilityBoardData }) {
  const renewablePct = data.renewablePct;
  const headroom = data.mdHeadroomPct;
  const gridKwh = data.gridKwh30d ?? 0;

  return (
    <div className="sust-dash" data-sustainability-dashboard>
      <Panel className="sust-dash__hero">
        <p className="forge-eyebrow">
          {data.plantName ?? "Plant"}
          {data.tariffLabel ? ` · ${data.tariffLabel}` : ""}
        </p>
        <h2 className="sust-dash__hero-title">Sustainability & intensity snapshot</h2>
        <p className="sust-dash__hero-lead">
          SEC, emissions, and demand metrics for this window.
        </p>
        {data.derivedNotes?.length ? (
          <p className="sust-dash__hint">{data.derivedNotes.join(" · ")}</p>
        ) : null}
        <div className="sust-dash__hero-stats">
          <div className="sust-stat">
            <span className="sust-stat__label">SEC</span>
            <span className="sust-stat__value tabular">
              {data.secKwhPerUnit != null
                ? `${formatIndianNum(data.secKwhPerUnit, 2)} kWh/u`
                : "—"}
            </span>
          </div>
          <div className="sust-stat">
            <span className="sust-stat__label">Scope 2</span>
            <span className="sust-stat__value tabular">
              {data.scope2Tco2e != null
                ? `${formatIndianNum(data.scope2Tco2e, 1)} tCO₂e`
                : "—"}
            </span>
          </div>
          <div className="sust-stat">
            <span className="sust-stat__label">Renewable</span>
            <span className="sust-stat__value tabular">
              {renewablePct != null ? `${formatIndianNum(renewablePct, 1)}%` : "—"}
            </span>
          </div>
          <div className="sust-stat">
            <span className="sust-stat__label">MD headroom</span>
            <span
              className="sust-stat__value tabular"
              style={{
                color:
                  headroom != null && headroom < 10
                    ? "var(--forge-warning)"
                    : "var(--forge-good)",
              }}
            >
              {headroom != null ? `${headroom}%` : "—"}
            </span>
          </div>
        </div>
      </Panel>

      <div className="sust-dash__grid">
        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">SEC trend (kWh per unit)</h3>
          {data.secTrend?.length ? (
            <>
              <MiniBarChart
                items={data.secTrend.map((p) => ({
                  ...p,
                  color: "var(--forge-tertiary)",
                }))}
              />
              <p className="sust-dash__hint">
                {data.productionUnits != null
                  ? `${formatIndianNum(data.productionUnits)} production units in window`
                  : "SEC from production window"}
              </p>
            </>
          ) : (
            <EmptyUpstreamState title="SEC trend" detail="No SEC data points yet." />
          )}
        </Panel>

        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">Scope 2 emissions (tCO₂e)</h3>
          {data.emissionsTrend?.length ? (
            <>
              <MiniBarChart
                items={data.emissionsTrend.map((p) => ({
                  ...p,
                  color: "var(--forge-good)",
                }))}
              />
              {formatEmissionFactorRef(data.emissionFactorRef) ? (
                <p className="sust-dash__hint">
                  {formatEmissionFactorRef(data.emissionFactorRef)}
                </p>
              ) : null}
            </>
          ) : (
            <EmptyUpstreamState
              title="Emissions trend"
              detail="Needs incomer energy series to derive Scope 2."
            />
          )}
        </Panel>

        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">Energy mix</h3>
          {renewablePct != null ? (
            <>
              <EmissionsSplit gridPct={100 - renewablePct} renewablePct={renewablePct} />
              <p className="sust-dash__hint tabular">
                {formatIndianNum(gridKwh / 1000, 1)} MWh grid (30d)
              </p>
            </>
          ) : (
            <EmptyUpstreamState
              title="Energy source mix"
              detail="No generation or renewable mix data yet."
            />
          )}
        </Panel>

        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">Top consumers (30d share)</h3>
          {data.topConsumers?.length ? (
            <MiniBarChart
              items={data.topConsumers.map((c) => ({
                label: c.label,
                value: c.sharePct,
                color:
                  c.health === "hot"
                    ? "var(--forge-error)"
                    : c.health === "watch"
                      ? "var(--forge-warning)"
                      : "var(--forge-tertiary)",
              }))}
            />
          ) : (
            <EmptyUpstreamState
              title="Top consumers"
              detail="No feeder/equipment energy series for share."
            />
          )}
        </Panel>

        <Panel className="sust-dash__panel sust-dash__panel--wide">
          <h3 className="sust-dash__block-title">TOD tariff bands (reference)</h3>
          <div className="sust-tod-grid">
            {TOD_BANDS_RJ.map((b) => (
              <div key={b.id} className="sust-tod-card">
                <StatusChip tone={b.label.includes("Peak") ? "warning" : "neutral"}>
                  {b.label}
                </StatusChip>
                <p className="sust-tod-card__time tabular">
                  {String(b.fromHour).padStart(2, "0")}:00 –{" "}
                  {String(b.toHour).padStart(2, "0")}:00
                </p>
                <p className="sust-tod-card__rate tabular">
                  ₹{formatIndianNum(b.rateInrPerKwh, 1)}/kWh
                </p>
              </div>
            ))}
          </div>
          <p className="sust-dash__hint">
            {data.todPeakSharePct != null
              ? `Peak share: ${data.todPeakSharePct}%`
              : "Peak share not computed yet"}
            {data.cmdKva != null
              ? ` · CMD ${formatIndianNum(data.cmdKva)} kVA`
              : ""}
            {data.peakMdKva != null
              ? ` · Peak ${formatIndianNum(Math.round(data.peakMdKva))} kVA`
              : ""}
          </p>
        </Panel>
      </div>
    </div>
  );
}
