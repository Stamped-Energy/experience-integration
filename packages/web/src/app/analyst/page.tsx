"use client";

import { AnalystWorkspace } from "@/components/analyst/AnalystWorkspace";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
  investigationsFixture,
} from "@/fixtures/demo";
import { usePlant } from "@/lib/plant-context";

export default function AnalystPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="analyst"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Ask Analyst"
      contextSummary={[
        `${investigationsFixture.length} saved investigations`,
        "Answers include source citations",
        activePlant.plantName,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Intelligence" title="Ask Analyst" />
      <AnalystWorkspace />
    </AppShell>
  );
}
