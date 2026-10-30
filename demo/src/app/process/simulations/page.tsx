import { SimulationsWorkspace } from "@/components/improve/loop-runs";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Simulations" };

export default function ProcessSimulationsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Simulations" })} askContext="Process simulations">
      <PageHeader
        eyebrow="Process · Improve"
        title="Simulations"
        meta="Agents try many loop configurations in simulation. Compare up to four runs; approval only on the DecisionCard."
        actions={<AskButton context="Process simulations" label="Ask about simulations" />}
      />
      <SimulationsWorkspace campaigns={loopCampaigns} kind="simulation" area="process" />
    </Workspace>
  );
}
