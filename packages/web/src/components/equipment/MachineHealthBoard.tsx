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
import {
  HEALTH_ASSETS,
  HEALTH_DISTRIBUTION,
  HEALTH_KPIS,
  MAINTENANCE_SCHEDULE,
  TEMP_TREND,
  VIBRATION_TREND,
  VIB_SPECTRUM,
  healthColor,
  priorityBarColor,
  type HealthAsset,
} from "@/fixtures/machine-health";
import { formatIndianNum } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { FORGE_ECHARTS_THEME, FORGE_ECHARTS_THEME_NAME } from "@/components/charts/forgeTheme";

function MiniKpi({ label, value, unit, delta, good, icon }: {
  label: string; value: number; unit?: string; delta: number; good: boolean;
  icon: typeof KPI_ICONS.health;
}) {
  const n = useCountUp(value);
  const display = typeof value === "number" && !Number.isInteger(value) ? value : n;
  return (
    <KpiTile icon={icon} label={label} value={display} unit={unit} delta={delta} good={good} />
  );
}

function ChartHost({ option, height = 200 }: { option: EChartsCoreOption; height?: number }) {
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
      const { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);
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
    return () => { dead = true; ro?.disconnect(); chart.current?.dispose(); chart.current = null; };
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height }} role="img" />;
}

export function MachineHealthBoard({
  mode = "preview",
  liveAssets,
}: {
  /** `live` when backed by L2 assets; `preview` when fixture (must be labelled). */
  mode?: "live" | "preview";
  liveAssets?: HealthAsset[];
}) {
  const assets = liveAssets?.length ? liveAssets : HEALTH_ASSETS;
  const [sel, setSel] = useState(assets[0]!.name);
  const asset = assets.find((a) => a.name === sel) ?? assets[0]!;
  const isPreview = mode === "preview";

  return (
    <div data-machine-health data-mode={mode} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {isPreview ? (
        <div
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid color-mix(in srgb, var(--forge-warning) 45%, transparent)",
            background: "color-mix(in srgb, var(--forge-warning) 12%, transparent)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--forge-warning)",
          }}
        >
          Preview · fixture condition monitoring — not your plant&apos;s live CNC data
        </div>
      ) : (
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
          Live from L2 · asset graph overlay (vibration / thermal trends remain illustrative until CNC series are wired)
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MiniKpi label="Fleet Health Index" value={HEALTH_KPIS.fleetHealth} unit="/100" delta={HEALTH_KPIS.fleetHealthDelta} good icon={KPI_ICONS.health} />
        <MiniKpi label="Assets At Risk" value={isPreview ? HEALTH_KPIS.atRisk : assets.filter((a) => a.status === "CRITICAL" || a.status === "WARNING").length} delta={HEALTH_KPIS.atRiskDelta} good icon={KPI_ICONS.risk} />
        <MiniKpi label="Predictive Alerts" value={HEALTH_KPIS.predictiveAlerts} delta={HEALTH_KPIS.predictiveDelta} good={false} icon={KPI_ICONS.alerts} />
        <MiniKpi label="Avg MTBF" value={HEALTH_KPIS.avgMtbf} unit="d" delta={HEALTH_KPIS.mtbfDelta} good icon={KPI_ICONS.mtbf} />
        <MiniKpi label="Maint. Compliance" value={HEALTH_KPIS.maintCompliance} unit="%" delta={HEALTH_KPIS.maintDelta} good icon={KPI_ICONS.compliance} />
        <MiniKpi label="Unplanned Downtime" value={HEALTH_KPIS.unplannedDowntime} unit="%" delta={HEALTH_KPIS.downtimeDelta} good icon={KPI_ICONS.downtime} />
      </div>

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p className="forge-eyebrow">Live Instrumentation</p>
            <h3 className="forge-card-title">
              {isPreview ? "Asset Load Dials - Full Fleet (preview)" : "Asset Load Dials - L2 fleet"}
            </h3>
          </div>
          <span style={{ fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
            {isPreview ? "Preview · fixture" : "L2 asset graph"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginTop: 14 }}>
          {assets.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => setSel(a.name)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: 8, borderRadius: 10,
                border: a.name === sel ? "1px solid rgba(247,84,64,0.35)" : "1px solid transparent",
                background: a.name === sel ? "var(--forge-primary-dim)" : "transparent", cursor: "pointer",
              }}
            >
              <LoadDial value={a.load} label="Load" />
              <div style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "var(--forge-font-display)", marginTop: 4 }}>{a.name}</div>
              <div style={{ fontSize: 9.5, color: "var(--forge-on-surface-variant)" }}>Health {a.health}</div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="forge-grid-38-62">
        <AssetDetail asset={asset} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Panel>
            <p className="forge-eyebrow">Predictive · 24h</p>
            <h3 className="forge-card-title">Vibration Trend (mm/s)</h3>
            <ChartHost height={200} option={{
              grid: { left: 44, right: 12, top: 24, bottom: 28 },
              tooltip: { trigger: "axis" },
              legend: { top: 0, textStyle: { fontSize: 11 } },
              xAxis: { type: "category", data: VIBRATION_TREND.map((d) => d.t), axisLabel: { interval: 3, fontSize: 10 } },
              yAxis: { type: "value", axisLabel: { fontSize: 10 } },
              series: [
                { name: "Kiln 1", type: "line", smooth: true, showSymbol: false, data: VIBRATION_TREND.map((d) => d.k1), lineStyle: { color: "#f75440", width: 2.2 } },
                { name: "Cement Mill 1", type: "line", smooth: true, showSymbol: false, data: VIBRATION_TREND.map((d) => d.cm1), lineStyle: { color: "#c97a00", width: 2.2 } },
              ],
              markLine: { silent: true, data: [{ yAxis: 3.5, lineStyle: { color: "#ba1a1a", type: "dashed" }, label: { formatter: "Alarm 3.5", fontSize: 10 } }] },
            }} />
          </Panel>
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div><p className="forge-eyebrow">Spectral</p><h3 className="forge-card-title">Vibration FFT - Cement Mill 1</h3></div>
              <span style={{ fontSize: 10.5, color: "var(--forge-error)", fontWeight: 600 }}>Bearing defect freq detected</span>
            </div>
            <ChartHost height={180} option={{
              grid: { left: 44, right: 12, top: 16, bottom: 28 },
              tooltip: { trigger: "axis" },
              xAxis: { type: "category", data: VIB_SPECTRUM.map((d) => d.freq), axisLabel: { interval: 3, fontSize: 8.5 } },
              yAxis: { type: "value", axisLabel: { fontSize: 10 } },
              series: [{
                type: "bar", data: VIB_SPECTRUM.map((d) => ({
                  value: d.amp,
                  itemStyle: { color: d.amp > 3 ? "#ba1a1a" : d.amp > 1.8 ? "#c97a00" : "#f75440", borderRadius: [3, 3, 0, 0] },
                })),
              }],
            }} />
          </Panel>
        </div>
      </div>

      <div className="forge-grid-60-40">
        <Panel>
          <p className="forge-eyebrow">Thermal · 24h</p>
          <h3 className="forge-card-title">Temperature Trend</h3>
          <ChartHost height={220} option={{
            grid: { left: 44, right: 44, top: 24, bottom: 28 },
            tooltip: { trigger: "axis" },
            legend: { top: 0, textStyle: { fontSize: 11 } },
            xAxis: { type: "category", data: TEMP_TREND.map((d) => d.t), axisLabel: { interval: 3, fontSize: 10 } },
            yAxis: [
              { type: "value", axisLabel: { fontSize: 10 } },
              { type: "value", axisLabel: { fontSize: 10 } },
            ],
            series: [
              { name: "Kiln shell °C", type: "line", smooth: true, showSymbol: false, data: TEMP_TREND.map((d) => d.kiln), lineStyle: { color: "#f75440", width: 2.2 } },
              { name: "Bearing °C", type: "line", yAxisIndex: 1, smooth: true, showSymbol: false, data: TEMP_TREND.map((d) => d.bearing), lineStyle: { color: "#00666b", width: 2.2 } },
            ],
          }} />
        </Panel>
        <Panel>
          <p className="forge-eyebrow">Fleet</p>
          <h3 className="forge-card-title">Health Distribution</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <ChartHost height={160} option={{
              series: [{
                type: "pie", radius: ["46%", "70%"], padAngle: 2, label: { show: false },
                data: HEALTH_DISTRIBUTION.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
              }],
            }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {HEALTH_DISTRIBUTION.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color }} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <strong className="tabular">{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 20 }}><p className="forge-eyebrow">Condition Register</p><h3 className="forge-card-title">Asset Health Register</h3></div>
        <div className="forge-scroll-thin" style={{ overflowX: "auto" }}>
          <table className="forge-table">
            <thead>
              <tr style={{ background: "var(--forge-surface-container-low)", borderBottom: "1px solid var(--forge-outline-variant)" }}>
                {["Asset", "Type", "Section", "Health", "Load", "Vib", "Temp", "Runtime", "Next Service", "Status"].map((h, i) => (
                  <th key={h} style={{ textAlign: i >= 3 && i <= 7 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEALTH_ASSETS.map((a) => (
                <tr key={a.name} style={{ borderBottom: "1px solid var(--forge-outline-variant)", cursor: "pointer", background: a.name === sel ? "var(--forge-primary-dim)" : undefined }} onClick={() => setSel(a.name)}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td style={{ color: "var(--forge-on-surface-variant)" }}>{a.type}</td>
                  <td style={{ color: "var(--forge-on-surface-variant)" }}>{a.section}</td>
                  <td className="tabular" style={{ textAlign: "right", fontWeight: 700, color: healthColor(a.health) }}>{a.health}</td>
                  <td className="tabular" style={{ textAlign: "right", color: a.load > 100 ? "var(--forge-error)" : undefined }}>{a.load}%</td>
                  <td className="tabular" style={{ textAlign: "right", color: a.vib > 3.5 ? "var(--forge-error)" : undefined }}>{a.vib}</td>
                  <td className="tabular" style={{ textAlign: "right" }}>{a.temp}°</td>
                  <td className="tabular" style={{ textAlign: "right" }}>{(a.runtime / 1000).toFixed(1)}k h</td>
                  <td style={{ color: a.next.includes("Overdue") ? "var(--forge-error)" : undefined }}>{a.next}</td>
                  <td><StatusBadgeByStatus status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <p className="forge-eyebrow">Work Orders</p>
        <h3 className="forge-card-title">Upcoming Maintenance Schedule</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {MAINTENANCE_SCHEDULE.map((m) => (
            <div key={m.date + m.machine} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 8, background: "var(--forge-surface-container-low)" }}>
              <div style={{ width: 52, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--forge-font-display)", fontWeight: 700, fontSize: 13 }}>{m.date.split(" ")[0]}</div>
                <div style={{ fontSize: 10, color: "var(--forge-on-surface-variant)" }}>{m.date.split(" ")[1]}</div>
              </div>
              <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: priorityBarColor(m.priority) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.machine} - {m.task}</div>
                <div style={{ fontSize: 11.5, color: "var(--forge-on-surface-variant)" }}>Team {m.team} · {m.duration}</div>
              </div>
              <StatusBadgeByStatus status={m.priority} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AssetDetail({ asset }: { asset: HealthAsset }) {
  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div><p className="forge-eyebrow">Asset Detail</p><h3 className="forge-card-title">{asset.name}</h3></div>
        <StatusBadgeByStatus status={asset.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <Gauge label="Health score" value={asset.health} valueText={String(asset.health)} size={96} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}>{asset.type} · {asset.section}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Next service: <strong style={{ color: asset.next.includes("Overdue") ? "var(--forge-error)" : undefined }}>{asset.next}</strong></div>
          <div style={{ fontSize: 12, marginTop: 2 }}>Runtime: <strong>{formatIndianNum(asset.runtime)} h</strong> · MTBF {asset.mtbf}d</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <MetricInline icon={Zap} label="Load" value={`${asset.load}%`} bad={asset.load > 100} tone="primary" />
        <MetricInline icon={Activity} label="Vibration" value={`${asset.vib} mm/s`} bad={asset.vib > 3.5} />
        <MetricInline icon={KPI_ICONS.temp} label="Temperature" value={`${asset.temp}°C`} />
        <MetricInline icon={Zap} label="Current" value={`${asset.current} A`} tone="primary" />
      </div>
    </Panel>
  );
}
