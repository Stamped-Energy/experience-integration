import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Suspense } from "react";
import { SimulationsWorkspace } from "@/components/improve/loop-runs";
import { AskButton } from "@/components/shell/ShellClient";
import { EngineeringGuard } from "@/components/shell/EngineeringGuard";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs, processEyebrow } from "@/components/process/common";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Simulation campaigns" };

function Body() {
  const rows = loopCampaigns.filter((c) => c.area === "process" && c.kind === "simulation");
  return (
    <>
      <KpiRow
        label="Process simulations"
        items={[
          { label: "Campaigns", value: String(rows.length) },
          { label: "Running", value: String(rows.filter((c) => c.status === "running").length) },
          { label: "With chosen run", value: String(rows.filter((c) => c.status === "chosen").length) },
          { label: "Compare limit", value: "4 runs" },
        ]}
      />
      <SimulationsWorkspace campaigns={loopCampaigns} kind="simulation" area="process" />
    </>
  );
}

export default function ProcessSimulationsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Simulation campaigns" })} askContext="Process simulations">
      <PageHeader
        eyebrow={processEyebrow("/process/simulations")}
        title="Simulation campaigns"
        meta="Compare up to four runs · accept on a chosen run"
        actions={<AskButton context="Process simulations" label="Ask about simulations" />}
      />
      <ProcessHubTabs />
      <EngineeringGuard backHref="/process/proposals" backLabel="Back to Process actions">
        <Suspense fallback={<StaticPageFallback><p className="muted">Loading campaigns…</p></StaticPageFallback>}>
          <Body />
        </Suspense>
      </EngineeringGuard>
    </Workspace>
  );
}
