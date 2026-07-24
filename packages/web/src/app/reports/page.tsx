import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { KpiCard } from "@/components/ui/kpi-card";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { ExportCentre } from "@/components/reports/ExportCentre";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  demoOpsConfirmedInr,
  ledgerFixture,
  prescriptionsFixture,
  reportJobsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { sumPotentialInr } from "@/lib/ledger";

export default function ReportsPage() {
  const ops = demoOpsConfirmedInr();
  const potential = sumPotentialInr(ledgerFixture);

  return (
    <AppShell
      active="reports"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={[
        `Confirmed savings MTD ${formatInr(ops)}`,
        "Approval-gated packs",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Value" title="Reports & ledger" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="forge-kpi-strip">
          <KpiCard
            eyebrow="Confirmed savings (MTD)"
            value={formatInr(ops)}
            accent="primary"
            footnote={<span style={{ color: "var(--forge-warning)" }}>Pending utility bill verification</span>}
          />
          <KpiCard
            eyebrow="Addressable potential"
            value={formatInr(potential)}
            footnote={
              <span style={{ color: "var(--forge-on-surface-variant)" }}>Open modeled + pending value</span>
            }
          />
        </div>
        <ExportCentre
          ledger={ledgerFixture}
          prescriptions={prescriptionsFixture}
          initialReports={reportJobsFixture}
        />
        <SavingsLedger rows={ledgerFixture} />
      </div>
    </AppShell>
  );
}
