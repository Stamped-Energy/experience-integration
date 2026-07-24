import { PrescriptionQueue } from "@/components/prescriptions/PrescriptionQueue";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  demoNeedsReviewCount,
  demoNeedsReviewInr,
  prescriptionsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";

export default function PrescriptionsPage() {
  return (
    <AppShell
      active="prescriptions"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Prescription queue"
      contextSummary={[
        `${demoNeedsReviewCount()} need review · ${formatInr(demoNeedsReviewInr())}/mo`,
        "Ops-confirmed badges",
      ]}
      focusEntity={{ type: "prescription", id: prescriptionsFixture[0]!.id }}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Closure" title="Prescriptions" />
      <PrescriptionQueue initial={prescriptionsFixture} />
    </AppShell>
  );
}
