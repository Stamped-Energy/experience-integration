"use client";

import { AppShell } from "@/components/shell/AppShell";
import { AssignmentsBoard } from "@/components/assignments/AssignmentsBoard";
import { PageHead } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth-context";
import { useDataSource } from "@/lib/data-source-context";
import { usePlant } from "@/lib/plant-context";
import { connectionFromProbe, toShellRole } from "@/lib/shell-session";

export default function AssignmentsPage() {
  const { activePlant, plantEpoch } = usePlant();
  const { membershipRole } = useAuth();
  const { probe } = useDataSource();

  return (
    <AppShell
      active="assignments"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      role={toShellRole(membershipRole)}
      connection={connectionFromProbe(probe)}
      screenTitle="Assignments"
      contextSummary={["Notify roster & routes", activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Assignments & notification routing" />
      <AssignmentsBoard key={`${activePlant.plantId}:${plantEpoch}`} />
    </AppShell>
  );
}
