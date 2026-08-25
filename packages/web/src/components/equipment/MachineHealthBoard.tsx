"use client";

import { useEffect, useRef, useState } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { LoadDial } from "@/components/charts/LoadDial";
import { Gauge } from "@/components/charts/Gauge";
import { Panel } from "@/components/ui/primitives";
import { Activity, Zap } from "@/components/ui/icons";
import {
  KpiTile,
  KPI_ICONS,
  MetricInline,
  StatusBadgeByStatus,
} from "@/components/ui/indicators";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import { formatIndianNum } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

export type HealthAssetStatus =
  | "CRITICAL"
  | "WARNING"
  | "GOOD"
  | "OPTIMIZED"
  | "OFFLINE"
  | "INFO";

export type HealthAsset = {
  name: string;
  type: string;
  section: string;
  health: number | null;
  load: number | null;
  kwh30d: number | null;
  vib: number | null;
  temp: number | null;
  rpm: number | null;
  current: number | null;
  runtime: number | null;
  mtbf: number | null;
  status: HealthAssetStatus;
  next: string | null;
};

export type MachineHealthBoardData = {
  assets: HealthAsset[];
  kpis: {
    fleetHealth: number | null;
    fleetHealthDelta: number | null;
    atRisk: number | null;
    atRiskDelta: number | null;
    predictiveAlerts: number | null;
    predictiveDelta: number | null;
    avgMtbf: number | null;
    mtbfDelta: number | null;
    maintCompliance: number | null;
    maintDelta: number | null;
    unplannedDowntime: number | null;
    downtimeDelta: number | null;
  };
  healthDistribution: Array<{ name: string; value: number; color: string }> | null;
  derivedNotes?: string[];
};

function healthColor(h: number): string {
  if (h >= 80) return "var(--forge-tertiary)";
  if (h >= 60) return "var(--forge-warning)";
  return "var(--forge-error)";
}

function MiniKpi({
  label,
  value,
  unit,
  delta,
  good,
  icon,
}: {
  label: string;
  value: number;
  unit?: string;
  delta: number | null;
  good: boolean;
  icon: typeof KPI_ICONS.health;
}) {
  const n = useCountUp(value);
  const display =
    typeof value === "number" && !Number.isInteger(value) ? value : n;
  return (
    <KpiTile
      icon={icon}
      label={label}
      value={display}
      unit={unit}
      delta={delta ?? undefined}
      good={good}
    />
  );
}

function ChartHost({
  option,
  height = 200,
}: {
  option: EChartsCoreOption;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts | null>(null);

  useEffect(() => {
    const chartOption: EChartsCoreOption = option;
    let ro: ResizeObserver | null = null;
    let dead = false;
    async function go() {
      if (!ref.current) return;
      const echarts = await import("echarts/core");
      const { LineChart, BarChart, PieChart } = await import("echarts/charts");
      const {
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
      } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([
        LineChart,
        BarChart,
        PieChart,
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
        CanvasRenderer,
      ]);
      echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);
      if (dead || !ref.current) return;
      if (!chart.current) {
        chart.current = echarts.init(ref.current, FORGE_ECHARTS_THEME_NAME);
        ro = new ResizeObserver(() => chart.current?.resize());
        ro.observe(ref.current);
      }
      chart.current.setOption(chartOption, true);
    }
    void go();
    return () => {
      dead = true;
      ro?.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height }} role="img" />;
}

export function MachineHealthBoard({ data }: { data: MachineHealthBoardData }) {
  const assets = data.assets;
  const [sel, setSel] = useState(assets[0]?.name ?? "");
  const asset = assets.find((a) => a.name === sel) ?? assets[0];
  const { kpis } = data;

  if (!assets.length || !asset) {
    return (
      <EmptyUpstreamState
        title="No equipment assets"
        detail="L2 returned an empty fleet for this plant."
      />
    );
  }

  return (
    <div data-machine-health data-mode="live" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        role="status"
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid color-mix(in srgb, var(--forge-tertiary) 45%, transparent)",
          background: "color-mix(in srgb, var(--forge-tertiary) 10%, transparent)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--forge-tertiary)",
        }}
      >
        Live from L2 · energy-derived load &amp; health
        {data.derivedNotes?.length
          ? ` · ${data.derivedNotes[0]}`
          : " · vibration / thermal remain empty without L1 sensing"}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {kpis.fleetHealth != null ? (
          <MiniKpi
            label="Fleet Health Index"
            value={kpis.fleetHealth}
            unit="/100"
            delta={kpis.fleetHealthDelta}
            good
            icon={KPI_ICONS.health}
          />
        ) : null}
        {kpis.atRisk != null ? (
          <MiniKpi
            label="Assets At Risk"
            value={kpis.atRisk}
            delta={kpis.atRiskDelta}
            good
            icon={KPI_ICONS.risk}
          />
        ) : null}
      </div>
      {kpis.predictiveAlerts == null &&
      kpis.avgMtbf == null &&
      kpis.maintCompliance == null ? (
        <EmptyUpstreamState
          title="CM KPIs unavailable"
          detail="Predictive alerts, MTBF, maintenance compliance, and unplanned downtime need condition-monitoring upstream — not invented from kW."
        />
      ) : null}

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p className="forge-eyebrow">Live Instrumentation</p>
            <h3 className="forge-card-title">Asset Load Dials — L2 fleet</h3>
          </div>
          <span style={{ fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
            Energy-derived load %
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
            marginTop: 14,
          }}
        >
          {assets.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => setSel(a.name)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: 8,
                borderRadius: 10,
                border:
                  a.name === sel
                    ? "1px solid rgba(247,84,64,0.35)"
                    : "1px solid transparent",
                background:
                  a.name === sel ? "var(--forge-primary-dim)" : "transparent",
                cursor: "pointer",
              }}
            >
              <LoadDial value={a.load ?? 0} label="Load" />
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: "var(--forge-font-display)",
                  marginTop: 4,
                }}
              >
                {a.name}
              </div>
              <div style={{ fontSize: 9.5, color: "var(--forge-on-surface-variant)" }}>
                Health {a.health ?? "—"}
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="forge-grid-38-62">
        <AssetDetail asset={asset} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <EmptyUpstreamState
            title="Vibration trend"
            detail="No mm/s series on Vinayak L2 — Class D empty."
          />
          <EmptyUpstreamState
            title="Vibration FFT"
            detail="Bearing defect spectrum needs L1 sensing."
          />
        </div>
      </div>

      <div className="forge-grid-60-40">
        <EmptyUpstreamState
          title="Temperature trend"
          detail="Shell / bearing °C not published for this plant."
        />
        <Panel>
          <p className="forge-eyebrow">Fleet</p>
          <h3 className="forge-card-title">Health Distribution</h3>
          {data.healthDistribution?.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <ChartHost
                height={160}
                option={{
                  series: [
                    {
                      type: "pie",
                      radius: ["46%", "70%"],
                      padAngle: 2,
                      label: { show: false },
                      data: data.healthDistribution.map((d) => ({
                        name: d.name,
                        value: d.value,
                        itemStyle: { color: d.color },
                      })),
                    },
                  ],
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                {data.healthDistribution.map((d) => (
                  <div
                    key={d.name}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
                  >
                    <span
                      style={{ width: 9, height: 9, borderRadius: 2, background: d.color }}
                    />
                    <span style={{ flex: 1 }}>{d.name}</span>
                    <strong className="tabular">{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyUpstreamState
              title="No scored assets"
              detail="Health distribution needs energy-derived scores."
            />
          )}
        </Panel>
      </div>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 20 }}>
          <p className="forge-eyebrow">Condition Register</p>
          <h3 className="forge-card-title">Asset Health Register</h3>
        </div>
        <div className="forge-scroll-thin" style={{ overflowX: "auto" }}>
          <table className="forge-table">
            <thead>
              <tr
                style={{
                  background: "var(--forge-surface-container-low)",
                  borderBottom: "1px solid var(--forge-outline-variant)",
                }}
              >
                {["Asset", "Type", "Section", "Health", "Load", "kWh 30d", "Status"].map(
                  (h, i) => (
                    <th key={h} style={{ textAlign: i >= 3 && i <= 5 ? "right" : "left" }}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr
                  key={a.name}
                  style={{
                    borderBottom: "1px solid var(--forge-outline-variant)",
                    cursor: "pointer",
                    background: a.name === sel ? "var(--forge-primary-dim)" : undefined,
                  }}
                  onClick={() => setSel(a.name)}
                >
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td style={{ color: "var(--forge-on-surface-variant)" }}>{a.type}</td>
                  <td style={{ color: "var(--forge-on-surface-variant)" }}>{a.section}</td>
                  <td
                    className="tabular"
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: a.health != null ? healthColor(a.health) : undefined,
                    }}
                  >
                    {a.health ?? "—"}
                  </td>
                  <td
                    className="tabular"
                    style={{
                      textAlign: "right",
                      color:
                        a.load != null && a.load > 100 ? "var(--forge-error)" : undefined,
                    }}
                  >
                    {a.load != null ? `${a.load}%` : "—"}
                  </td>
                  <td className="tabular" style={{ textAlign: "right" }}>
                    {a.kwh30d != null ? formatIndianNum(a.kwh30d) : "—"}
                  </td>
                  <td>
                    <StatusBadgeByStatus status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <EmptyUpstreamState
        title="Maintenance schedule"
        detail="No CM / work-order upstream — schedule not invented."
      />
    </div>
  );
}

function AssetDetail({ asset }: { asset: HealthAsset }) {
  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <p className="forge-eyebrow">Asset Detail</p>
          <h3 className="forge-card-title">{asset.name}</h3>
        </div>
        <StatusBadgeByStatus status={asset.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <Gauge
            label="Health score"
            value={asset.health ?? 0}
            valueText={asset.health != null ? String(asset.health) : "—"}
            size={96}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            {asset.type} · {asset.section}
          </div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Next service: <strong>—</strong>
          </div>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            Runtime / MTBF: <strong>—</strong> (Class D)
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 16,
        }}
      >
        <MetricInline
          icon={Zap}
          label="Load"
          value={asset.load != null ? `${asset.load}%` : "—"}
          bad={asset.load != null && asset.load > 100}
          tone="primary"
        />
        <MetricInline icon={Activity} label="Vibration" value="—" />
        <MetricInline icon={KPI_ICONS.temp} label="Temperature" value="—" />
        <MetricInline icon={Zap} label="Current" value="—" tone="primary" />
      </div>
    </Panel>
  );
}
