"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { Panel } from "@/components/ui/primitives";
import { ChartLegend, ChartStatRow } from "@/components/charts/ChartLegend";
import { formatInr, formatIndianNum } from "@/lib/format";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

export type LiveTrendDay = {
  day: number;
  date: string;
  actualKwh: number;
  baselineKwh: number;
  savedKwh: number;
  costActualInr: number;
  costBaselineInr: number;
  co2Actual: number;
  co2Baseline: number;
};

type TabId = "kwh" | "cost" | "co2";

const TABS: { id: TabId; label: string }[] = [
  { id: "kwh", label: "kWh" },
  { id: "cost", label: "₹ Cost" },
  { id: "co2", label: "CO₂" },
];

function toOption(tab: TabId, rows: LiveTrendDay[]): EChartsCoreOption {
  const labels = rows.map((d) => d.date.slice(5)); // MM-DD
  const actual =
    tab === "kwh"
      ? rows.map((d) => d.actualKwh)
      : tab === "cost"
        ? rows.map((d) => d.costActualInr)
        : rows.map((d) => d.co2Actual);
  const baseline =
    tab === "kwh"
      ? rows.map((d) => d.baselineKwh)
      : tab === "cost"
        ? rows.map((d) => d.costBaselineInr)
        : rows.map((d) => d.co2Baseline);
  const saved =
    tab === "co2"
      ? rows.map((d) => d.co2Baseline - d.co2Actual)
      : tab === "cost"
        ? rows.map((d) => d.costBaselineInr - d.costActualInr)
        : rows.map((d) => d.savedKwh);

  return {
    animation: true,
    grid: { left: 52, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#000a07",
      borderColor: "transparent",
      textStyle: { color: "#fff", fontSize: 12 },
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        fontSize: 11,
        color: "var(--forge-on-surface-variant)",
        formatter: (_: string, i: number) => (i % 3 === 0 ? labels[i] : ""),
      },
      axisLine: { lineStyle: { color: "var(--forge-outline-variant)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11,
        color: "var(--forge-on-surface-variant)",
        formatter: (v: number) =>
          tab === "cost"
            ? `₹${Math.round(v / 1000)}k`
            : tab === "kwh"
              ? `${Math.round(v / 1000)}k`
              : v.toFixed(1),
      },
      splitLine: { lineStyle: { color: "var(--forge-outline-variant)", opacity: 0.4 } },
    },
    series: [
      {
        name: "Actual",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#f75440", width: 2.4 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(247,84,64,0.18)" },
              { offset: 1, color: "rgba(247,84,64,0.04)" },
            ],
          },
        },
        data: actual,
      },
      {
        name: "Saved",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 0 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0,102,107,0.16)" },
              { offset: 1, color: "rgba(0,102,107,0.05)" },
            ],
          },
        },
        data: saved,
      },
      {
        name: "Baseline",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "var(--forge-outline)", width: 1.6, type: "dashed" },
        data: baseline,
      },
    ],
  };
}

export function EnergyTrendPanel({ rows }: { rows?: LiveTrendDay[] | null }) {
  const [tab, setTab] = useState<TabId>("kwh");
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const data = rows && rows.length > 0 ? rows : null;
  const option = useMemo(
    () => (data ? toOption(tab, data) : null),
    [tab, data],
  );

  useEffect(() => {
    if (!option) return;
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current || !option) return;
      const echarts = await import("echarts/core");
      const { LineChart } = await import("echarts/charts");
      const { GridComponent, TooltipComponent } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
      echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);

      if (disposed || !hostRef.current) return;
      if (!chartRef.current) {
        chartRef.current = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME, {
          renderer: "canvas",
        });
        ro = new ResizeObserver(() => chartRef.current?.resize());
        ro.observe(hostRef.current);
      }
      chartRef.current.setOption(option, true);
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);

  const avgSaving =
    data && data.length > 0
      ? formatInr(
          Math.round(data.reduce((s, d) => s + (d.costBaselineInr - d.costActualInr), 0) / data.length),
        )
      : "—";

  return (
    <Panel style={{ padding: 20, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p className="forge-eyebrow">30-Day Trend</p>
          <h3 className="forge-card-title">Energy Consumption vs Stamped Baseline</h3>
        </div>
        {data ? (
          <div className="forge-tabs" role="tablist" aria-label="Trend metric">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                className="forge-tabs__btn"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!data ? (
        <div
          style={{
            minHeight: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--forge-on-surface-variant)",
            fontSize: 13,
          }}
        >
          Chart empty until L2 measurements are available
        </div>
      ) : (
        <>
          <ChartLegend
            items={[
              { label: "Without Stamped Baseline", variant: "dashed", color: "var(--forge-outline)" },
              { label: "Actual Consumption", variant: "line", color: "var(--forge-primary)" },
              { label: "Savings Zone", variant: "area", color: "rgba(0,102,107,0.18)" },
            ]}
          />
          <div
            ref={hostRef}
            role="img"
            aria-label="Area chart comparing actual energy consumption against Stamped baseline"
            style={{ height: 300, marginTop: 12, width: "100%" }}
          />
          <ChartStatRow
            items={[
              { label: "Avg daily saving", value: avgSaving },
              {
                label: "Days",
                value: String(data.length),
              },
              {
                label: "Latest day",
                value: `${formatIndianNum(data[data.length - 1]!.actualKwh)} kWh`,
              },
            ]}
          />
        </>
      )}
    </Panel>
  );
}
