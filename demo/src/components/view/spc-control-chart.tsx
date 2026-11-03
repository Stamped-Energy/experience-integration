"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, MarkAreaComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { cssVar } from "@/lib/css-vars";

echarts.use([LineChart, GridComponent, MarkAreaComponent, MarkLineComponent, TooltipComponent, CanvasRenderer]);

function specBandFill(): string {
  if (typeof document === "undefined") return "rgba(47, 158, 106, 0.2)";
  const dark = document.documentElement.dataset.theme === "dark";
  const success = cssVar("--success", "#2F9E6A");
  return `color-mix(in srgb, ${success} ${dark ? "38%" : "20%"}, transparent)`;
}

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
  targetY?: number;
  unit?: string;
  cp?: number;
  cpk?: number;
  height?: number;
  /** Fixed y-axis for spec charts (shows LSL band and headroom). */
  yMin?: number;
  yMax?: number;
  /** When set, only these spec lines are drawn (no CL/UCL/LCL). */
  specLinesOnly?: boolean;
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
  targetY,
  unit,
  cp,
  cpk,
  height = 220,
  yMin,
  yMax,
  specLinesOnly = false,
}: SpcControlChartProps) {
  const host = useRef<HTMLDivElement>(null);
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((n) => n + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!host.current) return undefined;
    const chart = echarts.init(host.current, undefined, { renderer: "canvas" });
    const labelColor = cssVar("--text-secondary", "#64748b");
    const accent = cssVar("--accent-500", "#F75440");
    const seriesBlue = cssVar("--cat-2", "#2563eb");
    const hitSet = new Set(primary.hits ?? []);
    const lastIdx = primary.values.length - 1;
    const x = primary.values.map((_, i) => String(i + 1));
    const yName = unit ? `${primary.label} (${unit})` : primary.label;
    const markArea =
      lsl != null && usl != null
        ? {
            silent: true,
            itemStyle: { color: specBandFill() },
            data: [[{ yAxis: lsl }, { yAxis: usl }]],
          }
        : undefined;
    const lineEnd = { position: "end" as const, formatter: "{b}", color: labelColor, fontSize: 11 };
    const markLine = {
      symbol: "none",
      label: lineEnd,
      data: specLinesOnly
        ? [
            ...(lsl != null
              ? [{ yAxis: lsl, name: `LSL ${lsl}`, lineStyle: { color: "#DC2626", type: "solid", width: 2 } }]
              : []),
            ...(usl != null
              ? [{ yAxis: usl, name: `USL ${usl}`, lineStyle: { color: "#DC2626", type: "solid", width: 2 } }]
              : []),
            ...(targetY != null
              ? [{ yAxis: targetY, name: `Target ${targetY}`, lineStyle: { color: "#64748b", type: "dashed", width: 2 } }]
              : []),
          ]
        : [
            { yAxis: cl, name: "CL", lineStyle: { color: "#64748b", type: "solid" } },
            { yAxis: ucl, name: "UCL", lineStyle: { color: "#C27803", type: "dashed" } },
            { yAxis: lcl, name: "LCL", lineStyle: { color: "#C27803", type: "dashed" } },
            ...(usl != null ? [{ yAxis: usl, name: "USL", lineStyle: { color: "#DC2626", type: "solid", width: 1.5 } }] : []),
            ...(lsl != null ? [{ yAxis: lsl, name: "LSL", lineStyle: { color: "#DC2626", type: "solid", width: 1.5 } }] : []),
            ...(targetY != null ? [{ yAxis: targetY, name: "Target", lineStyle: { color: "#64748b", type: "dashed" } }] : []),
          ],
    };
    const series: Array<Record<string, unknown>> = [
      {
        name: primary.label,
        type: "line",
        data: primary.values.map((v, i) => ({
          value: v,
          itemStyle: hitSet.has(i) || i === lastIdx ? { color: accent, borderColor: accent } : undefined,
          symbolSize: hitSet.has(i) || i === lastIdx ? 10 : 6,
        })),
        showSymbol: true,
        lineStyle: { color: seriesBlue, width: 2 },
        markLine,
        markArea,
        markPoint:
          lastIdx >= 0
            ? {
                symbol: "pin",
                symbolSize: 42,
                data: [{ name: "Now", coord: [lastIdx, primary.values[lastIdx]], value: primary.values[lastIdx] }],
                label: { formatter: "{c}", fontSize: 11, color: cssVar("--text-primary", "#0f172a") },
              }
            : undefined,
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
      grid: { left: 48, right: secondary ? 48 : 72, top: 36, bottom: 32 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: x, boundaryGap: false },
      yAxis: secondary
        ? [
            { type: "value", scale: yMin == null && yMax == null, min: yMin, max: yMax, name: yName },
            { type: "value", scale: true, name: secondary.label },
          ]
        : { type: "value", scale: yMin == null && yMax == null, min: yMin, max: yMax, name: yName },
      series: series as echarts.EChartsCoreOption["series"],
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(host.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [primary, secondary, cl, ucl, lcl, usl, lsl, targetY, unit, chartKind, yMin, yMax, specLinesOnly, themeTick]);

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
