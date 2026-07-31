"use client";

import { LoadDial } from "@/components/charts/LoadDial";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { assetsFixture } from "@/fixtures/demo";
import { formatIndianNum } from "@/lib/format";

/** Calm health map - colour + label; not a noisy heatmap. */
export function EquipmentMap() {
  const dials = [...assetsFixture].sort((a, b) => b.loadPct - a.loadPct).slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-equipment>
      <Panel style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {dials.map((a) => (
          <LoadDial key={a.id} loadPct={a.loadPct} label={a.label} />
        ))}
      </Panel>

      <Panel>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--forge-font-display)",
            fontSize: 16,
          }}
        >
          Asset health
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {assetsFixture.map((a) => (
            <div
              key={a.id}
              style={{
                padding: 14,
                borderRadius: "var(--forge-radius-md)",
                background:
                  a.health === "hot"
                    ? "rgba(186, 26, 26, 0.08)"
                    : a.health === "watch"
                      ? "rgba(201, 122, 0, 0.08)"
                      : "rgba(27, 107, 58, 0.08)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>{a.label}</p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "var(--forge-on-surface-variant)",
                }}
              >
                {a.area}
              </p>
              <p
                className="tabular"
                style={{ margin: "6px 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}
              >
                Load {a.loadPct}% · {formatIndianNum(a.kwhMtd)} kWh MTD
                {a.pf != null ? ` · PF ${formatIndianNum(a.pf, 2)}` : ""}
              </p>
              {a.mdContributionKva != null ? (
                <p
                  className="tabular"
                  style={{
                    margin: "0 0 8px",
                    fontSize: 12,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  MD contrib {formatIndianNum(a.mdContributionKva)} kVA
                </p>
              ) : null}
              <StatusChip
                tone={a.health === "hot" ? "critical" : a.health === "watch" ? "warning" : "good"}
              >
                {a.health === "calm" ? "Calm" : a.health === "watch" ? "Watch" : "Hot"}
              </StatusChip>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
