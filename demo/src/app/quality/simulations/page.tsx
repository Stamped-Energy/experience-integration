import { SimulationsWorkspace } from "@/components/improve/loop-runs";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/quality/common";

export const metadata = { title: "Simulations" };

export default function QualitySimulationsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Simulations" })} askContext="Quality simulations">
      <PageHeader eyebrow="Quality · Improve" title="Simulations" meta="Quality loop and sampling simulations use the same compare pattern as Process." actions={<AskButton context="Quality simulations" label="Ask about simulations" />} />
      <SimulationsWorkspace campaigns={loopCampaigns} kind="simulation" area="quality" />
    </Workspace>
  );
}
