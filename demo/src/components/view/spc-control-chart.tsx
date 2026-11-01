"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, MarkLineComponent, TooltipComponent, CanvasRenderer]);

export type SpcControlChartProps = {
  title: string;
  subtitle?: string;
  chartKind: "xbar_r" | "i_mr";
  primary: { label: string; values: number[]; hits?: number[] };
  secondary?: { label: string; values: number[] };
  cl: number;
  ucl: number;
  lcl: number;
  usl?: number;
  lsl?: number;
  cp?: number;
  cpk?: number;
  height?: number;
};

export function SpcControlChart({
  title,
  subtitle,
  chartKind,
  primary,
  secondary,
  cl,
  ucl,
  lcl,
  usl,
  lsl,
  cp,
  cpk,
  height = 220,
}: SpcControlChartProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return undefined;
    const chart = echarts.init(host.current, undefined, { renderer: "canvas" });
    const hitSet = new Set(primary.hits ?? []);
    const x = primary.values.map((_, i) => String(i + 1));
    const markLine = {
      symbol: "none",
      data: [
        { yAxis: cl, name: "CL", lineStyle: { color: "#64748b", type: "solid" } },
        { yAxis: ucl, name: "UCL", lineStyle: { color: "#C27803", type: "dashed" } },
        { yAxis: lcl, name: "LCL", lineStyle: { color: "#C27803", type: "dashed" } },
        ...(usl != null ? [{ yAxis: usl, name: "USL", lineStyle: { color: "#DC2626", type: "dotted" } }] : []),
        ...(lsl != null ? [{ yAxis: lsl, name: "LSL", lineStyle: { color: "#DC2626", type: "dotted" } }] : []),
      ],
    };
    const series: Array<Record<string, unknown>> = [
      {
        name: primary.label,
        type: "line",
        data: primary.values.map((v, i) => ({
          value: v,
          itemStyle: hitSet.has(i) ? { color: "#DC2626", borderColor: "#DC2626" } : undefined,
          symbolSize: hitSet.has(i) ? 10 : 6,
        })),
        showSymbol: true,
        lineStyle: { color: "#2563eb", width: 2 },
        markLine,
      },
    ];
    if (secondary?.values.length) {
      series.push({
        name: secondary.label,
        type: "line",
        data: secondary.values,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { color: "#0ea5e9", width: 1.5, type: "dashed" },
      });
    }
    chart.setOption({
      aria: { enabled: true, decal: { show: false } },
      grid: { left: 48, right: secondary ? 48 : 24, top: 36, bottom: 32 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: x, boundaryGap: false },
      yAxis: secondary
        ? [
            { type: "value", scale: true, name: primary.label },
            { type: "value", scale: true, name: secondary.label },
          ]
        : { type: "value", scale: true, name: primary.label },
      series: series as echarts.EChartsCoreOption["series"],
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(host.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [primary, secondary, cl, ucl, lcl, usl, lsl, chartKind]);

  return (
    <div className="spc-chart-card">
      <div className="spc-chart-head">
        <div>
          <strong>{title}</strong>
          {subtitle ? <p className="secondary" style={{ margin: "4px 0 0", fontSize: 13 }}>{subtitle}</p> : null}
        </div>
        <div className="spc-cap-strip num">
          {cp != null ? <span>Cp {cp.toFixed(2)}</span> : null}
          {cpk != null ? <span>Cpk {cpk.toFixed(2)}</span> : null}
          <span className="muted">{chartKind === "xbar_r" ? "X̄ / R" : "I / MR"} · demo</span>
        </div>
      </div>
      <div ref={host} style={{ width: "100%", height }} role="img" aria-label={`${title} control chart`} />
    </div>
  );
}
