import { MachineHealthBoard } from "@/components/equipment/MachineHealthBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";

export default function EquipmentPage() {
  return (
    <AppShell
      active="equipment"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Machine Health"
      contextSummary={["115 assets monitored", "Predictive condition monitoring", "Live plant data feeds"]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead
        eyebrow="Operations"
        title="Machine Health"
      />
      <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)" }}>
        Predictive condition monitoring · 115 assets · live load dials · vibration & thermal trends
      </p>
      <MachineHealthBoard />
    </AppShell>
  );
}
