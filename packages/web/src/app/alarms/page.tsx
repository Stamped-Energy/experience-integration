import { AlarmConsole } from "@/components/alarms/AlarmConsole";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  alarmsFixture,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";
export default function AlarmsPage() {
  const critical = demoCriticalAlarmCount();
  const open = alarmsFixture.filter((a) => a.state !== "cleared").length;

  return (
    <AppShell
      active="alarms"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Alarm console"
      contextSummary={[
        `${open} open · ${critical} critical`,
        DEMO_PLANT.shift,
        "Severity-first triage",
      ]}
      focusEntity={{ type: "alarm", id: alarmsFixture[0]!.id }}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Alarm console" />
      <AlarmConsole initial={alarmsFixture} />
    </AppShell>
  );
}
