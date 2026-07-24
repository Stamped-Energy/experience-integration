import { SustainabilityDashboard } from "@/components/analytics/SustainabilityDashboard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  energyKpisFixture,
} from "@/fixtures/demo";
import { mdHeadroomPct } from "@/lib/analytics";

export default function IntensityPage() {
  const headroom = mdHeadroomPct(energyKpisFixture.peakMdKva, energyKpisFixture.cmdKva);

  return (
    <AppShell
      active="intensity"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Sustainability"
      contextSummary={[
        `MD headroom ${headroom}%`,
        "SEC · emissions · TOD · renewable mix",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Sustainability" title="Intensity, emissions & demand" />
      <SustainabilityDashboard />
    </AppShell>
  );
}
