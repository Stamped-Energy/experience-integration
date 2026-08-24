"use client";

import { AppShell } from "@/components/shell/AppShell";
import { PlantSectionMap } from "@/components/equipment/PlantSectionMap";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import { usePlant } from "@/lib/plant-context";

export default function PlantMapPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="plant_map"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Plant Map"
      contextSummary={["Section drill-down map", activePlant.plantName]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow={`${activePlant.plantName} · live twin`} title="Plant Map" />
      <PlantSectionMap />
    </AppShell>
  );
}
