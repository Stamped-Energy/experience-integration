"use client";

import { LiveBoard } from "@/components/live/LiveBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import { usePlant } from "@/lib/plant-context";

export default function LivePage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="live"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Live"
      contextSummary={[
        "Modbus / OPC-UA · 1s poll",
        "115 assets instrumented",
        "Real-time load dials & alert feed",
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Live" />
      <p className="forge-page-lede">
        Real-time plant instrumentation · load dials, health map, demand profile, and anomaly feed ·{" "}
        {activePlant.shift}
      </p>
      <LiveBoard connection={connectionFixture} />
    </AppShell>
  );
}
