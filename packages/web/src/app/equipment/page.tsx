"use client";

import { MachineHealthBoard } from "@/components/equipment/MachineHealthBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import { usePlant } from "@/lib/plant-context";

export default function EquipmentPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="equipment"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Machine Health"
      contextSummary={[
        "115 assets monitored",
        "Predictive condition monitoring",
        activePlant.plantName,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Machine Health" />
      <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)" }}>
        Predictive condition monitoring · 115 assets · live load dials · vibration & thermal trends
      </p>
      <MachineHealthBoard />
    </AppShell>
  );
}
