"use client";

import { SustainabilityDashboard } from "@/components/analytics/SustainabilityDashboard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
  energyKpisFixture,
} from "@/fixtures/demo";
import { mdHeadroomPct } from "@/lib/analytics";
import { usePlant } from "@/lib/plant-context";

export default function IntensityPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const headroom = mdHeadroomPct(energyKpisFixture.peakMdKva, energyKpisFixture.cmdKva);
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="intensity"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Sustainability"
      contextSummary={[
        `MD headroom ${headroom}%`,
        "SEC · emissions · TOD · renewable mix",
        activePlant.plantName,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Sustainability" title="Intensity, emissions & demand" />
      <SustainabilityDashboard />
    </AppShell>
  );
}
