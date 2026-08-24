"use client";

import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { KpiCard } from "@/components/ui/kpi-card";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { ExportCentre } from "@/components/reports/ExportCentre";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
  demoOpsConfirmedInr,
  ledgerFixture,
  prescriptionsForPlant,
  reportJobsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { sumPotentialInr } from "@/lib/ledger";
import { usePlant } from "@/lib/plant-context";

export default function ReportsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const ops = demoOpsConfirmedInr();
  const potential = sumPotentialInr(ledgerFixture);
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="reports"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={[
        `Confirmed savings MTD ${formatInr(ops)}`,
        "Approval-gated packs",
        activePlant.plantName,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Value" title="Reports & ledger" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="forge-kpi-strip">
          <KpiCard
            eyebrow="Confirmed savings (MTD)"
            value={formatInr(ops)}
            accent="primary"
          />
          <KpiCard
            eyebrow="Addressable potential"
            value={formatInr(potential)}
            footnote={
              <span style={{ color: "var(--forge-on-surface-variant)" }}>
                Open modeled + pending value
              </span>
            }
          />
        </div>
        <ExportCentre
          ledger={ledgerFixture}
          prescriptions={prescriptionsForPlant(activePlant.plantId)}
          initialReports={reportJobsFixture}
        />
        <SavingsLedger rows={ledgerFixture} />
      </div>
    </AppShell>
  );
}
