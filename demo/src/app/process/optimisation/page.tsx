import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/process/common";
import { OptimisationClient } from "./optimisation-client";

export const metadata = { title: "Optimisation runs" };

export default function ProcessOptimisationPage() {
  const rows = loopCampaigns.filter((c) => c.area === "process" && c.kind === "optimisation");
  return (
    <Workspace crumbs={crumbs({ label: "Optimisation runs" })} askContext="Process optimisation">
      <PageHeader
        eyebrow="Process · Improve"
        title="Optimisation runs"
        meta="PID and regulatory runs today. Model predictive control and reinforcement learning slots are labelled coming soon."
        actions={<AskButton context="Process optimisation" label="Ask about optimisation" />}
      />
      <OptimisationClient rows={rows} />
    </Workspace>
  );
}
