"use client";

import { AnalystWorkspace } from "@/components/analyst/AnalystWorkspace";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { alarmsForPlant, investigationsFixture } from "@/fixtures/demo";
import { useProductShell } from "@/lib/product-shell";
import { usePlant } from "@/lib/plant-context";

export default function AnalystPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const { role, connection } = useProductShell();
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
      role={role}
      connection={connection}
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
