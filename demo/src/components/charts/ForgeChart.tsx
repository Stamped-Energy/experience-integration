"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { DataTable, GhostButton, Skeleton } from "@/components/ui/primitives";
import type { Point } from "@/lib/chart-sample";
import { sampleLttb, sampleMinMax } from "@/lib/chart-sample";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

export type ForgeChartProps = {
  title: string;
  seriesName: string;
  points: readonly Point[];
  /** Display budget after sampling (default 720). */
  sampleBudget?: number;
  unit?: string;
  height?: number;
};

function toOption(
  title: string,
  seriesName: string,
  points: readonly Point[],
  unit: string,
): EChartsCoreOption {
  return {
    animation: false,
    progressive: 2000,
    progressiveThreshold: 3000,
    title: { text: title, left: 0, top: 0, textStyle: { fontSize: 14 } },
    grid: { left: 48, right: 16, top: 40, bottom: 32 },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: unknown) => `${Number(v)} ${unit}`,
    },
    xAxis: {
      type: "time",
      axisLabel: { hideOverlap: true },
    },
    yAxis: {
      type: "value",
      name: unit,
      scale: true,
    },
    series: [
      {
        name: seriesName,
        type: "line",
        showSymbol: false,
        large: true,
        largeThreshold: 2000,
        data: points.map((p) => [p.t, p.v]),
      },
    ],
  };
}

export function ForgeChart({
  title,
  seriesName,
  points,
  sampleBudget = 720,
  unit = "kW",
  height = 280,
}: ForgeChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const titleId = useId();
  const [ready, setReady] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampled = useMemo(
    () =>
      sampleLttb(
        sampleMinMax(points, Math.min(sampleBudget * 2, points.length)),
        sampleBudget,
      ),
    [points, sampleBudget],
  );

  const tableRows = useMemo(
    () =>
      sampled.slice(0, 48).map((p) => ({
        id: String(p.t),
        time: new Date(p.t).toISOString(),
        value: p.v.toFixed(1),
      })),
    [sampled],
  );

  useEffect(() => {
    if (showTable) {
      chartRef.current?.dispose();
      chartRef.current = null;
      setReady(false);
      return;
    }

    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current) return;
      try {
        const echarts = await import("echarts/core");
        const { LineChart } = await import("echarts/charts");
        const {
          GridComponent,
          TooltipComponent,
          TitleComponent,
        } = await import("echarts/components");
        const { CanvasRenderer } = await import("echarts/renderers");
        echarts.use([
          LineChart,
          GridComponent,
          TooltipComponent,
          TitleComponent,
          CanvasRenderer,
        ]);
        echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);

        if (disposed || !hostRef.current) return;
        if (!chartRef.current) {
          chartRef.current = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME, {
            renderer: "canvas",
          });
          ro = new ResizeObserver(() => {
            chartRef.current?.resize();
          });
          ro.observe(hostRef.current);
        }
        chartRef.current.setOption(toOption(title, seriesName, sampled, unit), true);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chart failed to load");
      }
    }

    void mount();

    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [title, seriesName, unit, sampled, showTable]);

  return (
    <section aria-labelledby={titleId} style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h2
          id={titleId}
          style={{
            margin: 0,
            fontFamily: "var(--forge-font-display)",
            fontSize: "var(--forge-size-title)",
          }}
        >
          {title}
        </h2>
        <GhostButton onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Show chart" : "Show data table"}
        </GhostButton>
      </div>

      {error ? (
        <p role="alert" style={{ color: "var(--forge-error)" }}>
          {error}
        </p>
      ) : null}

      {showTable ? (
        <DataTable
          caption={`${seriesName} sampled values`}
          columns={[
            { key: "time", header: "Time (UTC)" },
            { key: "value", header: unit, align: "right" },
          ]}
          rows={tableRows}
        />
      ) : (
        <div style={{ position: "relative", minHeight: height }}>
          {!ready ? <Skeleton height={height} label={`Loading ${title} chart`} /> : null}
          <div
            ref={hostRef}
            role="img"
            aria-label={`${title}: ${seriesName} line chart, ${sampled.length} sampled points`}
            style={{
              width: "100%",
              height,
              opacity: ready ? 1 : 0,
              position: ready ? "relative" : "absolute",
              inset: 0,
            }}
          />
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
        Source series {points.length.toLocaleString("en-IN")} points · displayed{" "}
        {sampled.length.toLocaleString("en-IN")} after min-max + LTTB · canvas renderer
      </p>
    </section>
  );
}
