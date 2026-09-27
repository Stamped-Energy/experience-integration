"use client";

import { Panel } from "@/components/ui/primitives";
import { formatIndianNum, formatInr } from "@/lib/format";

export type LiveConsumerRow = {
  rank: number;
  name: string;
  section: string;
  avgLoadKw: number;
  monthlyKwh: number;
  monthlyCostInr: number;
  vsBenchmarkPct: number | null;
};

export function TopConsumersTable({ rows }: { rows?: LiveConsumerRow[] | null }) {
  const data = rows && rows.length > 0 ? rows : null;

  return (
    <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 20 }}>
        <div>
          <p className="forge-eyebrow">Consumption Breakdown</p>
          <h3 className="forge-card-title">Top Energy Consumers</h3>
        </div>
      </div>

      {!data ? (
        <div
          style={{
            minHeight: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--forge-on-surface-variant)",
            fontSize: 13,
            padding: 16,
          }}
        >
          No consumer ranking yet
        </div>
      ) : (
        <div style={{ overflowX: "auto" }} className="forge-scroll-thin">
          <table className="forge-table">
            <thead>
              <tr
                style={{
                  background: "var(--forge-surface-container-low)",
                  borderBottom: "1px solid var(--forge-outline-variant)",
                }}
              >
                <th style={{ width: 36 }}>#</th>
                <th>Machine</th>
                <th>Section</th>
                <th style={{ textAlign: "right" }}>Avg Load</th>
                <th style={{ textAlign: "right" }}>Period kWh</th>
                <th style={{ textAlign: "right" }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr
                  key={`${r.rank}-${r.name}`}
                  style={{
                    background: i % 2 ? "var(--forge-surface-container-low)" : "transparent",
                    borderBottom: "1px solid var(--forge-outline-variant)",
                  }}
                >
                  <td style={{ color: "var(--forge-on-surface-variant)", fontWeight: 700 }}>{r.rank}</td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.section}</td>
                  <td style={{ textAlign: "right" }} className="tabular">
                    {formatIndianNum(r.avgLoadKw)} kW
                  </td>
                  <td style={{ textAlign: "right" }} className="tabular">
                    {formatIndianNum(r.monthlyKwh)}
                  </td>
                  <td style={{ textAlign: "right" }} className="tabular">
                    {formatInr(r.monthlyCostInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
