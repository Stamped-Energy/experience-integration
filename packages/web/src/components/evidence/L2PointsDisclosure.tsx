"use client";

import { DataTable } from "@/components/ui/primitives";
import { ForgeDisclosure } from "@/components/ui/ForgeDisclosure";

export type L2SeriesPoint = { ts: string; value: number };

export function L2PointsDisclosure({
  series,
}: {
  series?: {
    assetId: string;
    metric: string;
    from: string;
    to: string;
    granularity: string;
    unit: string;
    points: L2SeriesPoint[];
  } | null;
}) {
  if (!series || series.points.length === 0) {
    return (
      <p style={{ fontSize: 13, opacity: 0.75, margin: "8px 0 0" }}>
        No measurement points for this time window.
      </p>
    );
  }

  const rows = series.points.map((p, i) => ({
    id: String(i),
    ts: p.ts.replace("T", " ").slice(0, 19),
    value: `${p.value.toFixed(3)} ${series.unit}`,
  }));

  return (
    <ForgeDisclosure title={`Chart data points (${series.points.length})`}>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
        {series.assetId}/{series.metric} · {series.granularity} · {series.from.slice(0, 16)} →{" "}
        {series.to.slice(0, 16)} — same series as the chart above.
      </p>
      <DataTable
        caption="Measurement points"
        columns={[
          { key: "ts", header: "Timestamp" },
          { key: "value", header: "Value", align: "right" },
        ]}
        rows={rows}
      />
    </ForgeDisclosure>
  );
}
