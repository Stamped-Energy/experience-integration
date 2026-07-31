"use client";

import { Panel } from "@/components/ui/primitives";
import { SeverityTag } from "@/components/ui/indicators";
import { OVERVIEW_WASTERS, OVERVIEW_WASTERS_FOOTER, type WasterStatus } from "@/fixtures/overview-demo";
import { formatIndianNum, formatInr, signedPct } from "@/lib/format";

const ROW_BG: Partial<Record<WasterStatus, string>> = {
  "OVER LIMIT": "rgba(186,26,26,0.05)",
  WARNING: "rgba(201,122,0,0.04)",
  OPTIMIZED: "var(--forge-primary-dim)",
};

export function TopConsumersTable() {
  return (
    <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 20 }}>
        <div>
          <p className="forge-eyebrow">Consumption Breakdown</p>
          <h3 className="forge-card-title">Top Energy Consumers - This Month</h3>
        </div>
        <span
          style={{
            fontSize: 12,
            color: "var(--forge-on-surface-variant)",
            border: "1px solid var(--forge-outline-variant)",
            borderRadius: 8,
            padding: "5px 10px",
          }}
        >
          Sort by: Monthly Cost ↓
        </span>
      </div>

      <div style={{ overflowX: "auto" }} className="forge-scroll-thin">
        <table className="forge-table">
          <thead>
            <tr style={{ background: "var(--forge-surface-container-low)", borderBottom: "1px solid var(--forge-outline-variant)" }}>
              <th style={{ width: 36 }}>#</th>
              <th>Machine</th>
              <th>Section</th>
              <th style={{ textAlign: "right" }}>Avg Load</th>
              <th style={{ textAlign: "right" }}>Monthly kWh</th>
              <th style={{ textAlign: "right" }}>Monthly ₹ Cost</th>
              <th style={{ textAlign: "right" }}>vs Benchmark</th>
              <th>Stamped Status</th>
            </tr>
          </thead>
          <tbody>
            {OVERVIEW_WASTERS.map((r, i) => {
              const bg = ROW_BG[r.status] ?? (i % 2 ? "var(--forge-surface-container-low)" : "transparent");
              const benchUp = r.bench > 0;
              const strong = Math.abs(r.bench) > 10;
              return (
                <tr
                  key={r.rank}
                  style={{ background: bg, borderBottom: "1px solid var(--forge-outline-variant)" }}
                >
                  <td style={{ color: "var(--forge-on-surface-variant)", fontWeight: 700 }}>{r.rank}</td>
                  <td style={{ fontWeight: 600 }}>{r.machine}</td>
                  <td style={{ color: "var(--forge-on-surface-variant)" }}>{r.section}</td>
                  <td
                    className="tabular"
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: r.load > 100 ? "var(--forge-error)" : "var(--forge-on-surface)",
                    }}
                  >
                    {r.load}%
                  </td>
                  <td className="tabular" style={{ textAlign: "right" }}>
                    {formatIndianNum(r.kwh)}
                  </td>
                  <td className="tabular" style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--forge-font-display)" }}>
                    {formatInr(r.cost)}
                  </td>
                  <td
                    className="tabular"
                    style={{
                      textAlign: "right",
                      fontWeight: strong ? 700 : 500,
                      color: benchUp ? "var(--forge-error)" : "var(--forge-tertiary)",
                    }}
                  >
                    {benchUp ? "↑ " : "✓ "}
                    {signedPct(r.bench)}
                  </td>
                  <td>
                    <SeverityTag
                      status={r.status === "OVER LIMIT" ? "CRITICAL" : r.status === "NORMAL" ? "GOOD" : r.status}
                      label={r.status === "OVER LIMIT" ? "Over limit" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--forge-outline-variant)",
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          Showing {OVERVIEW_WASTERS_FOOTER.shown} of {OVERVIEW_WASTERS_FOOTER.total} assets · Total:{" "}
          {formatIndianNum(OVERVIEW_WASTERS_FOOTER.totalKwh)} kWh · {formatInr(OVERVIEW_WASTERS_FOOTER.totalCost)} this month
        </span>
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid var(--forge-primary)",
            color: "var(--forge-primary)",
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          Download Report (PDF)
        </button>
      </div>
    </Panel>
  );
}
