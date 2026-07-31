"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { formatIndianNum, formatInr } from "@/lib/format";
import {
  ANALYTICS_KPIS,
  COST_BREAKDOWN,
  CUMULATIVE_SAVINGS,
  FEEDER_WISE,
  LOAD_HEATMAP,
  MONTHLY_COMPARISON,
  POWER_FACTOR_TREND,
  SEC_TREND,
  SOURCE_MIX,
  WEEKDAY_PROFILE,
} from "@/fixtures/energy-analytics";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

/** Module-level options - stable refs so charts don't remount every render. */
const MONTHLY_OPTION: EChartsCoreOption = {
  tooltip: { trigger: "axis" },
  legend: { data: ["Baseline", "Actual", "Cost"] },
  grid: { left: 48, right: 48, top: 40, bottom: 28 },
  xAxis: { type: "category", data: MONTHLY_COMPARISON.map((d) => d.m) },
  yAxis: [
    { type: "value", name: "k kWh" },
    { type: "value", name: "₹L", splitLine: { show: false } },
  ],
  series: [
    {
      name: "Baseline",
      type: "bar",
      data: MONTHLY_COMPARISON.map((d) => d.baseline),
      itemStyle: { color: "rgba(143,112,107,0.35)" },
    },
    {
      name: "Actual",
      type: "bar",
      data: MONTHLY_COMPARISON.map((d) => d.actual),
      itemStyle: { color: "#f75440" },
    },
    {
      name: "Cost",
      type: "line",
      yAxisIndex: 1,
      data: MONTHLY_COMPARISON.map((d) => d.cost),
      itemStyle: { color: "#00666b" },
    },
  ],
};

const CUMULATIVE_OPTION: EChartsCoreOption = {
  tooltip: { trigger: "axis" },
  grid: { left: 56, right: 16, top: 24, bottom: 28 },
  xAxis: { type: "category", data: CUMULATIVE_SAVINGS.map((d) => d.m) },
  yAxis: { type: "value" },
  series: [
    {
      type: "line",
      data: CUMULATIVE_SAVINGS.map((d) => d.cum),
      areaStyle: { color: "rgba(0,102,107,0.18)" },
      itemStyle: { color: "#00666b" },
      smooth: true,
    },
  ],
};

const PF_OPTION: EChartsCoreOption = {
  tooltip: { trigger: "axis" },
  grid: { left: 40, right: 16, top: 24, bottom: 28 },
  xAxis: { type: "category", data: POWER_FACTOR_TREND.map((d) => d.day) },
  yAxis: { type: "value", min: 0.7, max: 1 },
  series: [
    {
      type: "line",
      data: POWER_FACTOR_TREND.map((d) => d.pf),
      itemStyle: { color: "#f75440" },
      markLine: {
        data: [{ yAxis: 0.95, name: "Target" }],
        lineStyle: { color: "#00666b", type: "dashed" },
      },
    },
  ],
};

const SEC_OPTION: EChartsCoreOption = {
  tooltip: { trigger: "axis" },
  grid: { left: 40, right: 16, top: 24, bottom: 28 },
  xAxis: { type: "category", data: SEC_TREND.map((d) => d.m) },
  yAxis: { type: "value", min: 68, max: 78 },
  series: [
    {
      type: "line",
      data: SEC_TREND.map((d) => d.sec),
      itemStyle: { color: "#00666b" },
      markLine: {
        data: [{ yAxis: 72, name: "Benchmark" }],
        lineStyle: { type: "dashed" },
      },
    },
  ],
};

const WEEKDAY_OPTION: EChartsCoreOption = {
  tooltip: { trigger: "axis" },
  grid: { left: 48, right: 16, top: 24, bottom: 28 },
  xAxis: { type: "category", data: WEEKDAY_PROFILE.map((d) => d.d) },
  yAxis: { type: "value" },
  series: [
    {
      type: "bar",
      data: WEEKDAY_PROFILE.map((d) => d.kwh),
      itemStyle: { color: "#f75440", borderRadius: [4, 4, 0, 0] },
    },
  ],
};

function MiniChart({
  option,
  height,
  label,
}: {
  option: EChartsCoreOption;
  height: number;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current) return;
      const echarts = await import("echarts/core");
      const { BarChart, LineChart, PieChart } = await import("echarts/charts");
      const {
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
      } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([
        BarChart,
        LineChart,
        PieChart,
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
        CanvasRenderer,
      ]);
      try {
        echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);
      } catch {
        /* already registered */
      }
      if (disposed || !hostRef.current) return;
      const chart = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME);
      chart.setOption(option);
      chartRef.current = chart;
      setReady(true);
      ro = new ResizeObserver(() => chart.resize());
      ro.observe(hostRef.current);
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      style={{ width: "100%", height, opacity: ready ? 1 : 0.4 }}
    />
  );
}

function MiniKpi({
  label,
  value,
  unit,
  delta,
  good,
}: {
  label: string;
  value: string;
  unit: string;
  delta: number;
  good: boolean;
}) {
  const up = delta > 0;
  const color = good ? "var(--forge-tertiary)" : "var(--forge-error)";
  return (
    <Panel style={{ padding: 16, flex: "1 1 150px", minWidth: 150 }}>
      <p className="forge-eyebrow" style={{ fontSize: 10 }}>
        {label}
      </p>
      <p className="forge-num-display" style={{ fontSize: "1.6rem", marginTop: 8 }}>
        {value}
        {unit ? (
          <span style={{ fontSize: "0.85rem", fontWeight: 700, marginLeft: 3 }}>{unit}</span>
        ) : null}
      </p>
      <p style={{ color, fontSize: 12, fontWeight: 600, marginTop: 6 }}>
        {up ? "+" : "−"}
        {Math.abs(delta)}% vs last period
      </p>
    </Panel>
  );
}

function DonutCard({
  eyebrow,
  title,
  data,
  valueLabel,
}: {
  eyebrow: string;
  title: string;
  data: Array<{ name: string; value: number; color: string }>;
  valueLabel: (v: number, pct: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const option = useMemo<EChartsCoreOption>(
    () => ({
      series: [
        {
          type: "pie",
          radius: ["52%", "78%"],
          data: data.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color },
          })),
          label: { show: false },
        },
      ],
      tooltip: { trigger: "item" },
    }),
    [data],
  );

  return (
    <Panel>
      <p className="forge-eyebrow">{eyebrow}</p>
      <h3 className="forge-card-title">{title}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <div style={{ width: 150 }}>
          <MiniChart option={option} height={160} label={title} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {data.map((d) => {
            const pct = (d.value / total) * 100;
            return (
              <div
                key={d.name}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
              >
                <span
                  style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: "var(--forge-on-surface-variant)" }}>
                  {valueLabel(d.value, pct)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Heatmap() {
  const color = (v: number) => {
    if (v >= 85) return "var(--forge-error)";
    if (v >= 70) return "var(--forge-warning)";
    if (v >= 50) return "var(--forge-primary)";
    if (v >= 35) return "rgba(0,102,107,0.55)";
    return "rgba(0,102,107,0.22)";
  };
  return (
    <Panel>
      <p className="forge-eyebrow">Load Intensity</p>
      <h3 className="forge-card-title">Weekly Load Heatmap (24h × 7d)</h3>
      <div style={{ overflowX: "auto", marginTop: 14 }} className="forge-scroll-thin">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "34px repeat(24, 1fr)",
            gap: 3,
            minWidth: 640,
          }}
        >
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span
              key={h}
              style={{
                fontSize: 8.5,
                color: "var(--forge-on-surface-variant)",
                textAlign: "center",
              }}
            >
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {LOAD_HEATMAP.map((row) => (
            <HeatRow key={row[0]!.day} row={row} color={color} />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function HeatRow({
  row,
  color,
}: {
  row: Array<{ day: string; hour: number; v: number }>;
  color: (v: number) => string;
}) {
  return (
    <>
      <span
        style={{
          fontSize: 10,
          color: "var(--forge-on-surface-variant)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {row[0]!.day}
      </span>
      {row.map((cell) => (
        <span
          key={cell.hour}
          title={`${cell.day} ${cell.hour}:00 - ${cell.v}% load`}
          style={{ height: 18, borderRadius: 3, background: color(cell.v) }}
        />
      ))}
    </>
  );
}

/** Dashboard-parity Energy Analytics board (ECharts + Forge cards). */
export function EnergyBoard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} data-energy>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {ANALYTICS_KPIS.map((k) => (
          <MiniKpi key={k.label} {...k} />
        ))}
      </div>

      <Panel>
        <p className="forge-eyebrow">12-Month Trend</p>
        <h3 className="forge-card-title">Consumption vs Baseline & Cost</h3>
        <div style={{ marginTop: 12 }}>
          <MiniChart option={MONTHLY_OPTION} height={280} label="Monthly consumption" />
        </div>
      </Panel>

      <div className="forge-grid-60-40">
        <Panel>
          <p className="forge-eyebrow">Verified M&V</p>
          <h3 className="forge-card-title">Cumulative Savings (FY)</h3>
          <div style={{ marginTop: 12 }}>
            <MiniChart option={CUMULATIVE_OPTION} height={240} label="Cumulative savings" />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Total verified savings FY26:{" "}
            <strong style={{ color: "var(--forge-tertiary)" }}>
              {formatInr(CUMULATIVE_SAVINGS.at(-1)!.cum)}
            </strong>
          </p>
        </Panel>
        <DonutCard
          eyebrow="Where the ₹ go"
          title="Monthly Cost Breakdown"
          data={COST_BREAKDOWN}
          valueLabel={(v, pct) => `${pct.toFixed(0)}% · ${formatInr(v)}`}
        />
      </div>

      <div className="forge-grid-60-40">
        <Panel>
          <p className="forge-eyebrow">Power Quality</p>
          <h3 className="forge-card-title">Power Factor Trend (30d)</h3>
          <div style={{ marginTop: 12 }}>
            <MiniChart option={PF_OPTION} height={220} label="Power factor" />
          </div>
        </Panel>
        <Panel>
          <p className="forge-eyebrow">Efficiency</p>
          <h3 className="forge-card-title">Specific Energy Consumption (kWh/t)</h3>
          <div style={{ marginTop: 12 }}>
            <MiniChart option={SEC_OPTION} height={220} label="SEC trend" />
          </div>
        </Panel>
      </div>

      <div className="forge-grid-60-40">
        <Panel>
          <p className="forge-eyebrow">Pattern</p>
          <h3 className="forge-card-title">Average Consumption by Weekday</h3>
          <div style={{ marginTop: 12 }}>
            <MiniChart option={WEEKDAY_OPTION} height={220} label="Weekday profile" />
          </div>
        </Panel>
        <DonutCard
          eyebrow="Supply"
          title="Energy Source Mix"
          data={SOURCE_MIX}
          valueLabel={(v) => `${v}%`}
        />
      </div>

      <Heatmap />

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 20 }}>
          <p className="forge-eyebrow">Distribution</p>
          <h3 className="forge-card-title">Feeder-wise Consumption</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--forge-surface-container-low)" }}>
              {["Feeder", "Monthly kWh", "Share", "Power Factor", "PF Status"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i > 0 ? "right" : "left",
                    padding: "10px 16px",
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEEDER_WISE.map((f) => {
              const ok = f.pf >= 0.9;
              return (
                <tr key={f.feeder} style={{ borderTop: "1px solid var(--forge-outline-variant)" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 600 }}>{f.feeder}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }} className="tabular">
                    {formatIndianNum(f.kwh)}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }} className="tabular">
                    {f.share}%
                  </td>
                  <td
                    style={{
                      padding: "11px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: ok ? "var(--forge-tertiary)" : "var(--forge-error)",
                    }}
                    className="tabular"
                  >
                    {f.pf.toFixed(2)}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    <StatusChip tone={ok ? "good" : "critical"}>
                      {ok ? "Compliant" : "Penalty"}
                    </StatusChip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
