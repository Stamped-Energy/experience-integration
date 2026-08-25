"use client";

import { useEffect, useRef } from "react";
import type { ECharts } from "echarts/core";
import { Panel } from "@/components/ui/primitives";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

export type DemandPoint = {
  hour: string;
  mw: number;
  tod: "peak" | "shoulder" | "off";
};

const TOD_COLOR: Record<string, string> = {
  off: "#00666b",
  shoulder: "#c97a00",
  peak: "#ba1a1a",
};

export function DemandProfilePanel({
  profile,
  plantMw,
  peakMw,
  peakHour,
}: {
  profile: DemandPoint[];
  plantMw?: number | null;
  peakMw?: number | null;
  peakHour?: string | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!profile.length) return;
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current) return;
      const echarts = await import("echarts/core");
      const { BarChart } = await import("echarts/charts");
      const { GridComponent, TooltipComponent, MarkAreaComponent } =
        await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([
        BarChart,
        GridComponent,
        TooltipComponent,
        MarkAreaComponent,
        CanvasRenderer,
      ]);
      echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);

      if (disposed || !hostRef.current) return;
      if (!chartRef.current) {
        chartRef.current = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME, {
          renderer: "canvas",
        });
        ro = new ResizeObserver(() => chartRef.current?.resize());
        ro.observe(hostRef.current);
      }

      chartRef.current.setOption(
        {
          grid: { left: 36, right: 8, top: 8, bottom: 24 },
          tooltip: {
            trigger: "axis",
            backgroundColor: "#000a07",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
            formatter: (params: unknown) => {
              const row = Array.isArray(params) ? params[0] : params;
              const idx = (row as { dataIndex?: number })?.dataIndex ?? 0;
              const d = profile[idx];
              if (!d) return "";
              return [`<strong>${d.hour}</strong>`, `Demand: ${d.mw} MW`, `TOD slot: ${d.tod}`].join(
                "<br/>",
              );
            },
          },
          xAxis: {
            type: "category",
            data: profile.map((d) => d.hour),
            axisLabel: {
              fontSize: 9.5,
              color: "var(--forge-on-surface-variant)",
              interval: 3,
            },
            axisLine: { lineStyle: { color: "var(--forge-outline-variant)" } },
            axisTick: { show: false },
          },
          yAxis: {
            type: "value",
            axisLabel: { fontSize: 10, color: "var(--forge-on-surface-variant)" },
            splitLine: {
              lineStyle: { color: "var(--forge-outline-variant)", opacity: 0.4 },
            },
          },
          series: [
            {
              type: "bar",
              data: profile.map((d) => ({
                value: d.mw,
                itemStyle: {
                  color: TOD_COLOR[d.tod],
                  opacity: 0.85,
                  borderRadius: [3, 3, 0, 0],
                },
              })),
            },
          ],
          markArea: {
            silent: true,
            itemStyle: { color: "rgba(186,26,26,0.05)" },
            data: [[{ xAxis: "18:00" }, { xAxis: "22:00" }]],
          },
        },
        true,
      );
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [profile]);

  if (!profile.length) {
    return (
      <EmptyUpstreamState
        title="No demand profile"
        detail="Need incomer active_power_kw samples to build the 24h TOD chart."
      />
    );
  }

  return (
    <Panel style={{ padding: 20, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p className="forge-eyebrow">TOD Tariff Exposure</p>
          <h3 className="forge-card-title">24-Hour Demand Profile</h3>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 10.5,
            color: "var(--forge-on-surface-variant)",
          }}
        >
          {(
            [
              ["Off-peak", "var(--forge-tertiary)"],
              ["Shoulder", "var(--forge-warning)"],
              ["Peak", "var(--forge-error)"],
            ] as const
          ).map(([l, c]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} /> {l}
            </span>
          ))}
        </div>
      </div>

      <div
        ref={hostRef}
        role="img"
        aria-label="Bar chart of 24-hour plant power demand colored by time-of-day tariff slot"
        style={{ height: 180, marginTop: 12, width: "100%" }}
      />

      <div style={{ marginTop: 8, fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
        {plantMw != null ? (
          <>
            Current demand{" "}
            <strong style={{ color: "var(--forge-primary)" }}>{plantMw.toFixed(1)} MW</strong>
            {" · "}
          </>
        ) : null}
        {peakMw != null && peakHour ? (
          <>
            Peak <strong style={{ color: "var(--forge-error)" }}>{peakMw} MW</strong> at{" "}
            {peakHour}
            {" · "}
          </>
        ) : null}
        TOD window 18:00–22:00
      </div>
    </Panel>
  );
}
