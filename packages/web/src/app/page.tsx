import { AppShell } from "@/components/shell/AppShell";
import { OverviewBoard } from "@/components/today/OverviewBoard";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  alarmsFixture,
  assetsFixture,
  connectionFixture,
  demoClosurePct,
  demoCriticalAlarmCount,
  demoNeedsReviewInr,
  prescriptionsFixture,
  todaySignalsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { selectTodaySignals } from "@/lib/today-signals";

const ROLE = "plant_head" as const;

export default function OverviewPage() {
  const signals = selectTodaySignals(ROLE, todaySignalsFixture);
  const critical = demoCriticalAlarmCount();

  return (
    <AppShell
      active="today"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Overview"
      contextSummary={[
        `${critical} critical alarms`,
        `${formatInr(demoNeedsReviewInr())} open prescriptions`,
        DEMO_PLANT.shift,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow={DEMO_PLANT.plantName} title="Overview" />
      <p className="forge-page-lede">
        {DEMO_PLANT.contractDemandNote} · As of {DEMO_PLANT.demoAsOf} · {DEMO_PLANT.tariff}
      </p>
      <OverviewBoard
        signals={signals}
        closurePct={demoClosurePct()}
        alarms={alarmsFixture}
        prescriptions={prescriptionsFixture}
        assets={assetsFixture}
      />
    </AppShell>
  );
}
