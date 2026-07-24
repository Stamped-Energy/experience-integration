import { AnalystWorkspace } from "@/components/analyst/AnalystWorkspace";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  investigationsFixture,
} from "@/fixtures/demo";
export default function AnalystPage() {
  return (
    <AppShell
      active="analyst"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Ask Analyst"
      contextSummary={[
        `${investigationsFixture.length} saved investigations`,
        "Answers include source citations",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Intelligence" title="Ask Analyst" />
      <AnalystWorkspace />
    </AppShell>
  );
}
