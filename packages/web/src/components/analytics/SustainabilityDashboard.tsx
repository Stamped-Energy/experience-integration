"use client";

import { Panel, StatusChip } from "@/components/ui/primitives";
import { TodMdBoard } from "@/components/analytics/TodMdBoard";
import { IntensityBoard } from "@/components/analytics/IntensityBoard";
import {
  DEMO_PLANT,
  energyKpisFixture,
  intensityDemoInput,
} from "@/fixtures/demo";
import {
  intensitySnapshot,
  mdHeadroomPct,
  topConsumersFixture,
  TOD_BANDS_RJ,
} from "@/lib/analytics";
import {
  formatEmissionFactorRef,
  formatIndianNum,
} from "@/lib/format";

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
          <span className="sust-chart__bar-value tabular">{formatIndianNum(item.value, 1)}</span>
        </div>
      ))}
    </div>
  );
}

function EmissionsSplit({ gridPct, renewablePct }: { gridPct: number; renewablePct: number }) {
  return (
    <div className="sust-split" role="img" aria-label="Energy mix">
      <div className="sust-split__track">
        <div className="sust-split__renewable" style={{ width: `${renewablePct}%` }} />
        <div className="sust-split__grid" style={{ width: `${100 - renewablePct}%` }} />
      </div>
      <div className="sust-split__legend">
        <span><i className="sust-split__dot sust-split__dot--renewable" /> Renewable {renewablePct.toFixed(1)}%</span>
        <span><i className="sust-split__dot sust-split__dot--grid" /> Grid {gridPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function SustainabilityDashboard() {
  const snap = intensitySnapshot(intensityDemoInput);
  const headroom = mdHeadroomPct(energyKpisFixture.peakMdKva, energyKpisFixture.cmdKva);
  const consumers = topConsumersFixture().slice(0, 5);
  const totalKwh = (intensityDemoInput.gridKwh ?? 0) + (intensityDemoInput.renewableKwh ?? 0);
  const renewablePct = snap.renewablePct ?? 0;
  const gridPct = 100 - renewablePct;

  const secTrend = [
    { label: "Apr", value: 98.2 },
    { label: "May", value: 96.8 },
    { label: "Jun", value: 95.1 },
    { label: "Jul MTD", value: snap.secKwhPerUnit ?? 94.3 },
  ];

  const emissionsTrend = [
    { label: "Apr", value: 4120 },
    { label: "May", value: 3980 },
    { label: "Jun", value: 3810 },
    { label: "Jul MTD", value: snap.scope2Tco2e ?? 3650 },
  ];

  return (
    <div className="sust-dash" data-sustainability-dashboard>
      <Panel className="sust-dash__hero">
        <p className="forge-eyebrow">Jaipur Works · {DEMO_PLANT.tariff}</p>
        <h2 className="sust-dash__hero-title">Sustainability & intensity snapshot</h2>
        <p className="sust-dash__hero-lead">
          SEC, emissions, renewable mix, and demand metrics — with explicit disclosure when data is
          missing. Nothing is invented for Scope 1 or unmeasured activity.
        </p>
        <div className="sust-dash__hero-stats">
          <div className="sust-stat">
            <span className="sust-stat__label">SEC</span>
            <span className="sust-stat__value tabular">
              {snap.secKwhPerUnit != null ? `${formatIndianNum(snap.secKwhPerUnit, 2)} kWh/u` : "—"}
            </span>
          </div>
          <div className="sust-stat">
            <span className="sust-stat__label">Scope 2</span>
            <span className="sust-stat__value tabular">
              {snap.scope2Tco2e != null ? `${formatIndianNum(snap.scope2Tco2e, 1)} tCO₂e` : "—"}
            </span>
          </div>
          <div className="sust-stat">
            <span className="sust-stat__label">Renewable</span>
            <span className="sust-stat__value tabular">{formatIndianNum(renewablePct, 1)}%</span>
          </div>
          <div className="sust-stat">
            <span className="sust-stat__label">MD headroom</span>
            <span className="sust-stat__value tabular" style={{ color: headroom < 10 ? "var(--forge-warning)" : "var(--forge-good)" }}>
              {headroom}%
            </span>
          </div>
        </div>
      </Panel>

      <div className="sust-dash__grid">
        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">SEC trend (kWh per unit)</h3>
          <MiniBarChart items={secTrend.map((p) => ({ ...p, color: "var(--forge-tertiary)" }))} />
          <p className="sust-dash__hint">
            {intensityDemoInput.productionUnits != null
              ? `${formatIndianNum(intensityDemoInput.productionUnits)} production units MTD`
              : "Production units required for SEC"}
          </p>
        </Panel>

        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">Scope 2 emissions trend (tCO₂e)</h3>
          <MiniBarChart items={emissionsTrend.map((p) => ({ ...p, color: "var(--forge-good)" }))} />
          <p className="sust-dash__hint">{formatEmissionFactorRef(snap.emissionFactorRef ?? undefined)}</p>
        </Panel>

        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">Energy mix</h3>
          <EmissionsSplit gridPct={gridPct} renewablePct={renewablePct} />
          <p className="sust-dash__hint tabular">
            {formatIndianNum(totalKwh / 1000, 1)} MWh total · Grid{" "}
            {formatIndianNum((intensityDemoInput.gridKwh ?? 0) / 1000, 1)} MWh
          </p>
        </Panel>

        <Panel className="sust-dash__panel">
          <h3 className="sust-dash__block-title">Top consumers (MTD share)</h3>
          <MiniBarChart
            items={consumers.map((c) => ({
              label: c.label,
              value: c.sharePct,
              color: c.health === "hot" ? "var(--forge-error)" : c.health === "watch" ? "var(--forge-warning)" : "var(--forge-tertiary)",
            }))}
          />
        </Panel>

        <Panel className="sust-dash__panel sust-dash__panel--wide">
          <h3 className="sust-dash__block-title">TOD exposure</h3>
          <div className="sust-tod-grid">
            {TOD_BANDS_RJ.map((b) => (
              <div key={b.id} className="sust-tod-card">
                <StatusChip tone={b.label.includes("Peak") ? "warning" : "neutral"}>{b.label}</StatusChip>
                <p className="sust-tod-card__time tabular">
                  {String(b.fromHour).padStart(2, "0")}:00 – {String(b.toHour).padStart(2, "0")}:00
                </p>
                <p className="sust-tod-card__rate tabular">₹{formatIndianNum(b.rateInrPerKwh, 1)}/kWh</p>
              </div>
            ))}
          </div>
          <p className="sust-dash__hint">
            Peak share MTD: {energyKpisFixture.todPeakSharePct}% · CMD{" "}
            {formatIndianNum(energyKpisFixture.cmdKva)} kVA
          </p>
        </Panel>

        <Panel className="sust-dash__panel sust-dash__panel--disclosure">
          <h3 className="sust-dash__block-title">Honest disclosure</h3>
          <ul className="sust-disclosure-list">
            <li>Scope 1 (onsite fuel) — <strong>not measured</strong> by Stamped in this demo plant.</li>
            <li>Scope 2 uses {formatEmissionFactorRef(snap.emissionFactorRef ?? undefined)} — bill-verified where available.</li>
            {snap.missing.map((m) => (
              <li key={m}>{m.replaceAll("_", " ")}</li>
            ))}
          </ul>
          <StatusChip tone="warning">Never invent missing activity data</StatusChip>
        </Panel>
      </div>

      <TodMdBoard />
      <IntensityBoard />
    </div>
  );
}
