"use client";

import { AppShell } from "@/components/shell/AppShell";
import { OverviewBoard } from "@/components/today/OverviewBoard";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  assetsFixture,
  connectionFixture,
  prescriptionsForPlant,
  todaySignalsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";
import { selectTodaySignals } from "@/lib/today-signals";

const ROLE = "plant_head" as const;

export default function OverviewPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const signals = selectTodaySignals(ROLE, todaySignalsFixture);
  const alarms = alarmsForPlant(activePlant.plantId);
  const prescriptions = prescriptionsForPlant(activePlant.plantId);
  const critical = alarms.filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;
  const needsReview = prescriptions.filter((p) => p.lane === "needs_review");
  const needsReviewInr = needsReview.reduce((s, p) => s + p.impactInrPerMonth, 0);
  const closed = prescriptions.filter((p) => p.lane === "closed").length;
  const closurePct =
    prescriptions.length === 0 ? 0 : Math.round((closed / prescriptions.length) * 100);

  return (
    <AppShell
      active="today"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Overview"
      contextSummary={[
        `${critical} critical alarms`,
        `${formatInr(needsReviewInr)} open prescriptions`,
        activePlant.shift,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow={activePlant.plantName} title="Overview" />
      <p className="forge-page-lede">
        {activePlant.contractDemandNote} · As of {activePlant.demoAsOf} · {activePlant.tariff}
      </p>
      <OverviewBoard
        signals={signals}
        closurePct={closurePct}
        alarms={alarms}
        prescriptions={prescriptions}
        assets={assetsFixture}
      />
    </AppShell>
  );
}
