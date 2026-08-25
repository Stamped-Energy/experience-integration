"use client";

import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { usePlant } from "@/lib/plant-context";

export default function AssignmentsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();

  return (
    <AppShell
      active="assignments"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Assignments"
      contextSummary={[
        "No upstream routing API",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Assignments & notification routing" />
      <SourceIndicator source="unavailable" />
      <EmptyUpstreamState
        title="No assignment / routing data"
        detail="L5 plant_escalation_policy has no customer read API, and L6 has no notify-people table. Fixture AssignmentsBoard removed."
      />
    </AppShell>
  );
}
