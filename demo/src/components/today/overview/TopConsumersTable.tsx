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
    <Panel className="forge-overview-consumers" style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div className="forge-overview-consumers__header">
        <div>
          <p className="forge-eyebrow">Consumption Breakdown</p>
          <h3 className="forge-card-title">Largest energy loads</h3>
          <p className="forge-overview-consumers__subtitle">
            The equipment contributing most to the current period.
          </p>
        </div>
        <span className="forge-overview__section-meta">
          {data ? `${data.length} shown` : "Awaiting data"}
        </span>
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
                <th style={{ textAlign: "right" }}>vs benchmark</th>
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
                    {r.vsBenchmarkPct == null
                      ? "—"
                      : `${r.vsBenchmarkPct > 0 ? "+" : ""}${r.vsBenchmarkPct}%`}
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
