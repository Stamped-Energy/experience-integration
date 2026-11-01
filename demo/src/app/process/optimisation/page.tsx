import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Suspense } from "react";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/process/common";
import { OptimisationClient } from "./optimisation-client";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Optimisation runs" };

export default function ProcessOptimisationPage() {
  const rows = loopCampaigns.filter((c) => c.area === "process" && c.kind === "optimisation");
  return (
    <Workspace crumbs={crumbs({ label: "Optimisation runs" })} askContext="Process optimisation">
      <PageHeader
        eyebrow="Process · Improve"
        title="Optimisation runs"
        meta="PID and regulatory runs on demonstration data (18 configs per loop). MPC and RL labelled coming soon."
        actions={<AskButton context="Process optimisation" label="Ask about optimisation" />}
      />
      <ProcessHubTabs />
      <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
        <OptimisationClient rows={rows} />
      </Suspense>
    </Workspace>
  );
}
