"use client";

import { Panel } from "@/components/ui/primitives";
import { intensityDemoInput } from "@/fixtures/demo";
import { intensitySnapshot } from "@/lib/analytics";
import { formatEmissionFactorRef, formatIndianNum } from "@/lib/format";

export function IntensityBoard() {
  const snap = intensitySnapshot(intensityDemoInput);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-intensity>
      <Panel style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Metric
          label="SEC"
          value={
            snap.secKwhPerUnit != null
              ? `${formatIndianNum(snap.secKwhPerUnit, 2)} kWh/unit`
              : "-"
          }
          hint={
            intensityDemoInput.productionUnits != null
              ? `${formatIndianNum(intensityDemoInput.productionUnits)} units MTD`
              : undefined
          }
        />
        <Metric
          label="Renewable share"
          value={
            snap.renewablePct != null ? `${formatIndianNum(snap.renewablePct, 1)}%` : "-"
          }
        />
        <Metric
          label="Scope 2"
          value={
            snap.scope2Tco2e != null
              ? `${formatIndianNum(snap.scope2Tco2e, 1)} tCO₂e`
              : "-"
          }
          hint={formatEmissionFactorRef(snap.emissionFactorRef ?? undefined)}
        />
      </Panel>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div style={{ minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>{label}</p>
      <p
        className="tabular"
        style={{
          margin: "4px 0 0",
          fontFamily: "var(--forge-font-display)",
          fontWeight: 800,
          fontSize: 24,
        }}
      >
        {value}
      </p>
      {hint ? (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
