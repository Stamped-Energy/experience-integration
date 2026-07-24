"use client";

import { useMemo } from "react";
import { ForgeChart } from "@/components/charts/ForgeChart";
import { buildMinuteSeries } from "@/lib/chart-sample";
import { Panel } from "@/components/ui/primitives";

/** Evidence route chart island — ECharts loads only here, not on Today. */
export function EvidenceTrend({
  assetLabel = "Kiln 1",
  showBaselineBand = false,
}: {
  assetLabel?: string;
  /** When false, chart stays telemetry-only (honest partial — no invented band). */
  showBaselineBand?: boolean;
}) {
  const points = useMemo(() => buildMinuteSeries(43_200), []);
  return (
    <Panel>
      <ForgeChart
        title={`${assetLabel} demand (30-day minute)`}
        seriesName="Demand"
        points={points}
        unit="kW"
        sampleBudget={720}
      />
      <p
        style={{
          margin: "12px 0 0",
          fontSize: 12,
          color: "var(--forge-on-surface-variant)",
        }}
      >
        {showBaselineBand
          ? "Baseline band from meter history."
          : "Baseline comparison not available yet; live readings still shown."}
      </p>
    </Panel>
  );
}
