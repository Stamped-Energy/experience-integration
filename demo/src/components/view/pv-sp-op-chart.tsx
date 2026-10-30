/**
 * PV / SP / OP trend card.
 * Card chrome follows shadcn/ui chart block patterns
 * (https://ui.shadcn.com/charts); series rendered with echarts,
 * coloured with Stamped tokens (coral PV, muted SP, teal OP).
 */
"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent, MarkLineComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

export interface PvSpOpSeries {
  t: number[];
  pv: number[];
  sp: number[];
  op: number[];
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function formatHour(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function PvSpOpTrendCard({
  title,
  caption,
  series,
  units = { pv: "", sp: "", op: "%" },
  windowLabel = "Last 12 hours",
}: {
  title: string;
  caption: string;
  series: PvSpOpSeries;
  units?: { pv: string; sp: string; op: string };
  windowLabel?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType | null>(null);
  const [expanded, setExpanded] = useState(false);
  const uid = useId();
  const last = series.t.length - 1;

  useEffect(() => {
    if (!host.current) return undefined;
    const instance = echarts.init(host.current, undefined, { renderer: "canvas" });
    chart.current = instance;

    const accent = cssVar("--accent-500", "#F75440");
    const muted = cssVar("--text-secondary", "#5F5F5C");
    const success = cssVar("--success", "#2F9E6A");
    const border = cssVar("--border", "#E4E4E2");
    const textMuted = cssVar("--text-muted", "#8A8A86");
    const textPrimary = cssVar("--text-primary", "#202020");

    const categories = series.t.map((t) => formatHour(t));
    instance.setOption({
      animation: false,
      color: [accent, muted, success],
      grid: { left: 48, right: 16, top: 28, bottom: 36, containLabel: false },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 14,
        itemHeight: 3,
        icon: "rect",
        textStyle: { color: textMuted, fontSize: 11, fontFamily: "var(--font-geist), system-ui, sans-serif" },
        data: [
          { name: `PV · ${units.pv || "process"}` },
          { name: `SP · ${units.sp || "setpoint"}` },
          { name: `OP · ${units.op || "%"}` },
        ],
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: cssVar("--surface", "#FFFFFF"),
        borderColor: border,
        textStyle: { color: textPrimary, fontSize: 12 },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: categories,
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: {
          color: textMuted,
          fontSize: 10,
          interval: Math.max(0, Math.floor(categories.length / 6) - 1),
        },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: "value",
          scale: true,
          name: units.pv,
          nameTextStyle: { color: textMuted, fontSize: 10, padding: [0, 0, 0, 8] },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: textMuted, fontSize: 10 },
          splitLine: { lineStyle: { color: border, type: "dashed" } },
        },
        {
          type: "value",
          scale: true,
          min: 0,
          max: 100,
          name: "OP %",
          nameTextStyle: { color: textMuted, fontSize: 10 },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: textMuted, fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: `PV · ${units.pv || "process"}`,
          type: "line",
          showSymbol: false,
          smooth: false,
          sampling: "lttb",
          lineStyle: { width: 1.8, color: accent },
          data: series.pv,
          yAxisIndex: 0,
        },
        {
          name: `SP · ${units.sp || "setpoint"}`,
          type: "line",
          showSymbol: false,
          smooth: false,
          lineStyle: { width: 1.4, color: muted, type: [6, 4] },
          data: series.sp,
          yAxisIndex: 0,
        },
        {
          name: `OP · ${units.op || "%"}`,
          type: "line",
          showSymbol: false,
          smooth: false,
          lineStyle: { width: 1.4, color: success, opacity: 0.9 },
          data: series.op,
          yAxisIndex: 1,
        },
      ],
    });

    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    if (host.current) ro?.observe(host.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      instance.dispose();
      chart.current = null;
    };
  }, [series, units.op, units.pv, units.sp, expanded]);

  const downloadCsv = () => {
    const rows = ["t,pv,sp,op", ...series.t.map((t, i) => `${new Date(t).toISOString()},${series.pv[i]},${series.sp[i]},${series.op[i]}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trend-${uid.replace(/:/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className={`pv-chart${expanded ? " pv-chart-expanded" : ""}`}>
      <header className="pv-chart-head">
        <div className="pv-chart-titles">
          <h3>{title}</h3>
          <p>{caption}</p>
          <span className="pv-chart-window">{windowLabel} · demonstration</span>
        </div>
        <div className="pv-chart-actions">
          <button type="button" className="btn-ghost btn-sm" onClick={downloadCsv} aria-label="Download CSV">
            Download
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setExpanded((v) => !v)}
            aria-pressed={expanded}
            aria-label={expanded ? "Leave full screen" : "Full screen"}
          >
            {expanded ? "Close" : "Full screen"}
          </button>
        </div>
      </header>
      <div ref={host} className="pv-chart-plot" role="img" aria-label={title} />
      <footer className="pv-chart-legend">
        <span>
          <i className="pv" /> PV <strong className="num">{series.pv[last]?.toFixed(1)}</strong> {units.pv}
        </span>
        <span>
          <i className="sp" /> SP <strong className="num">{series.sp[last]?.toFixed(1)}</strong> {units.sp}
        </span>
        <span>
          <i className="op" /> OP <strong className="num">{series.op[last]?.toFixed(1)}</strong> {units.op}
        </span>
      </footer>
    </article>
  );
}
