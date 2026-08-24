"use client";

import { EnergyBoard } from "@/components/analytics/EnergyBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
  energyKpisFixture,
} from "@/fixtures/demo";
import { formatIndianNum } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";

export default function EnergyPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="energy"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Energy Analytics"
      contextSummary={[
        `MTD ${formatIndianNum(energyKpisFixture.mtdGridKwh)} kWh`,
        `Peak MD ${formatIndianNum(energyKpisFixture.peakMdKva)} kVA`,
        activePlant.plantName,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Analytics" title="Energy Analytics" />
      <EnergyBoard />
    </AppShell>
  );
}
