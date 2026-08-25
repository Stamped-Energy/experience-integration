"use client";

import { useEffect, useRef } from "react";
import type { ECharts } from "echarts/core";
import { Panel } from "@/components/ui/primitives";
import { formatIndianNum, formatInr } from "@/lib/format";
import { FORGE_ECHARTS_THEME, FORGE_ECHARTS_THEME_NAME } from "@/components/charts/forgeTheme";

export type LiveSectionRow = {
  name: string;
  kwh: number;
};

export function SectionDonut({
  rows,
  tariffInrPerKwh = 6.32,
}: {
  rows?: LiveSectionRow[] | null;
  tariffInrPerKwh?: number | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const data = rows && rows.length > 0 ? rows : null;
  const rate = tariffInrPerKwh ?? 6.32;

  useEffect(() => {
    if (!data) return;
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current || !data) return;
      const echarts = await import("echarts/core");
      const { PieChart } = await import("echarts/charts");
      const { TooltipComponent } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([PieChart, TooltipComponent, CanvasRenderer]);
      echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);

      if (disposed || !hostRef.current) return;
      if (!chartRef.current) {
        chartRef.current = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME, {
          renderer: "canvas",
        });
        ro = new ResizeObserver(() => chartRef.current?.resize());
        ro.observe(hostRef.current);
      }

      chartRef.current.setOption({
        tooltip: {
          trigger: "item",
          backgroundColor: "#000a07",
          borderColor: "transparent",
          textStyle: { color: "#fff", fontSize: 12 },
          formatter: (p: { name: string; value: number; percent: number }) => {
            const d = data.find((x) => x.name === p.name);
            if (!d) return p.name;
            return [
              `<strong>${d.name}</strong>`,
              `Energy: ${formatIndianNum(d.kwh)} kWh`,
              `Cost: ${formatInr(Math.round(d.kwh * rate))}`,
              `Share: ${p.percent.toFixed(1)}%`,
            ].join("<br/>");
          },
        },
        series: [
          {
            type: "pie",
            radius: ["48%", "72%"],
            padAngle: 2,
            label: { show: false },
            data: data.map((d) => ({ name: d.name, value: d.kwh })),
          },
        ],
      });
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [data, rate]);

  return (
    <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <p className="forge-eyebrow">Section share</p>
        <h3 className="forge-card-title">Energy by section</h3>
      </div>
      {!data ? (
        <div
          style={{
            minHeight: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--forge-on-surface-variant)",
            fontSize: 13,
            padding: 16,
          }}
        >
          No section breakdown from L2 yet
        </div>
      ) : (
        <div ref={hostRef} style={{ height: 220, width: "100%" }} role="img" aria-label="Section energy share" />
      )}
    </Panel>
  );
}
