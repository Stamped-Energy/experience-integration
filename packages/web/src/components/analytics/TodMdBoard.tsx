"use client";

import { Panel, StatusChip } from "@/components/ui/primitives";
import { DEMO_PLANT, energyKpisFixture } from "@/fixtures/demo";
import { TOD_BANDS_RJ, mdHeadroomPct } from "@/lib/analytics";
import { formatIndianNum } from "@/lib/format";

export function TodMdBoard() {
  const cmd = energyKpisFixture.cmdKva;
  const peak = energyKpisFixture.peakMdKva;
  const headroom = mdHeadroomPct(peak, cmd);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-tod-md>
      <Panel style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Contract demand (CMD)
          </p>
          <p
            className="tabular"
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            {formatIndianNum(cmd)} kVA
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
            {DEMO_PLANT.tariff}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Peak MD (billing window)
          </p>
          <p
            className="tabular"
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            {formatIndianNum(peak)} kVA
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Headroom
          </p>
          <p
            className="tabular"
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontWeight: 800,
              fontSize: 28,
              color: headroom < 10 ? "var(--forge-warning)" : "var(--forge-good)",
            }}
          >
            {headroom}%
          </p>
        </div>
      </Panel>

      <Panel>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--forge-font-display)",
            fontSize: 16,
          }}
        >
          TOD tariff bands
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {TOD_BANDS_RJ.map((b) => (
            <li
              key={b.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                padding: "10px 0",
                borderBottom: "1px solid var(--forge-outline-variant)",
              }}
            >
              <div>
                <StatusChip tone={b.label === "Peak" ? "warning" : "neutral"}>{b.label}</StatusChip>
                <p
                  className="tabular"
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  {String(b.fromHour).padStart(2, "0")}:00 → {String(b.toHour).padStart(2, "0")}:00
                </p>
              </div>
              <p className="tabular" style={{ margin: 0, fontWeight: 700 }}>
                ₹{formatIndianNum(b.rateInrPerKwh, 1)}/kWh
              </p>
            </li>
          ))}
        </ul>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          CMD line is contractual - coincidence risk surfaces on alarms when peak MD approaches CMD.
        </p>
      </Panel>
    </div>
  );
}
