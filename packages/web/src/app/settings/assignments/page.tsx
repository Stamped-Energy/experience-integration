"use client";

import { AppShell } from "@/components/shell/AppShell";
import { AssignmentsBoard } from "@/components/assignments/AssignmentsBoard";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/fixtures/demo";
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
        "Alarm WhatsApp routing",
        "Prescription assignee recommendations",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Assignments & notification routing" />
      <AssignmentsBoard />
    </AppShell>
  );
}
