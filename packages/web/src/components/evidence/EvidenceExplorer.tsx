"use client";

import Link from "next/link";
import { LoadDial } from "@/components/charts/LoadDial";
import { EvidenceTrend } from "@/components/charts/EvidenceTrend";
import { RouteStateView } from "@/components/states/RouteStateView";
import {
  DataTable,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";
import type { EvidencePack } from "@/lib/evidence";
import { evidenceRouteState } from "@/lib/evidence";
import { DEMO_PLANT } from "@/fixtures/demo";
import { formatBaselineLabel } from "@/lib/format";

export function EvidenceExplorer({ pack }: { pack: EvidencePack }) {
  const state = evidenceRouteState(pack);
  const { scope, lineage, anomaly } = pack;

  return (
    <RouteStateView state={state}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-evidence>
        <Panel>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--forge-on-surface-variant)",
            }}
          >
            Pre-scoped proof
          </p>
          <h2
            style={{
              margin: "6px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontSize: 22,
            }}
          >
            {scope.assetLabel} · {scope.metric.replaceAll("_", " ")}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Window {scope.from.slice(0, 10)} → {scope.to.slice(0, 10)} · {DEMO_PLANT.plantName}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {scope.alarmId ? (
              <StatusChip tone="critical">
                <Link href={`/alarms/${scope.alarmId}`} style={{ color: "inherit" }}>
                  Alarm · {scope.assetLabel}
                </Link>
              </StatusChip>
            ) : null}
            {scope.rxId ? (
              <StatusChip tone="info">
                <Link href={`/prescriptions/${scope.rxId}`} style={{ color: "inherit" }}>
                  Prescription
                </Link>
              </StatusChip>
            ) : null}
            {pack.missing.includes("baseline") ? (
              <StatusChip tone="warning">Baseline unavailable</StatusChip>
            ) : (
              <StatusChip tone="good">Baseline band</StatusChip>
            )}
          </div>
        </Panel>

        <Panel style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <LoadDial loadPct={pack.loadDialPct.kiln_1 ?? 0} label="Kiln 1" />
          <LoadDial loadPct={pack.loadDialPct.mill_1 ?? 0} label="Mill 1" />
          <LoadDial loadPct={pack.loadDialPct.comp_2 ?? 0} label="Compressor 2" />
          <div style={{ flex: "1 1 220px" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Anomaly window</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>{anomaly.summary}</p>
            <p
              className="tabular"
              style={{ margin: "8px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}
            >
              {anomaly.from} → {anomaly.to}
            </p>
          </div>
        </Panel>

        <EvidenceTrend
          assetLabel={scope.assetLabel}
          showBaselineBand={!pack.missing.includes("baseline")}
        />

        <Panel>
          <h3
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--forge-font-display)",
              fontSize: 16,
            }}
          >
            Detection rule & tariff
          </h3>
          <DataTable
            caption="Evidence details"
            columns={[
              { key: "field", header: "Field" },
              { key: "value", header: "Value" },
            ]}
            rows={[
              { id: "rule", field: "Rule", value: lineage.ruleLabel },
              {
                id: "tariff",
                field: "Tariff",
                value: lineage.tariffLabel,
              },
              {
                id: "sources",
                field: "Sources",
                value: lineage.sources.join(" · "),
              },
              {
                id: "baseline",
                field: "Baseline",
                value: scope.baselineId
                  ? pack.missing.includes("baseline")
                    ? `${formatBaselineLabel(scope.baselineId)} (unavailable)`
                    : formatBaselineLabel(scope.baselineId)
                  : "-",
              },
            ]}
          />
        </Panel>
      </div>
    </RouteStateView>
  );
}
