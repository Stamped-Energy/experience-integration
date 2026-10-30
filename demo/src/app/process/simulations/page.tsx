import { Suspense } from "react";
import { SimulationsWorkspace } from "@/components/improve/loop-runs";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/process/common";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Simulations" };

function Body() {
  const rows = loopCampaigns.filter((c) => c.area === "process" && c.kind === "simulation");
  return (
    <>
      <KpiRow
        label="Process simulations (demo)"
        items={[
          { label: "Campaigns", value: String(rows.length) },
          { label: "Running", value: String(rows.filter((c) => c.status === "running").length) },
          { label: "With chosen run", value: String(rows.filter((c) => c.status === "chosen").length) },
          { label: "Compare limit", value: "4 runs" },
        ]}
      />
      <p className="pfd-demo-banner">Demonstration data · accept only through DecisionCard on a chosen run.</p>
      <SimulationsWorkspace campaigns={loopCampaigns} kind="simulation" area="process" />
    </>
  );
}

export default function ProcessSimulationsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Simulations" })} askContext="Process simulations">
      <PageHeader
        eyebrow="Process · Improve"
        title="Simulations"
        meta="Agents try many loop configurations in simulation. Compare up to four runs; approval only on the DecisionCard."
        actions={<AskButton context="Process simulations" label="Ask about simulations" />}
      />
      <Suspense fallback={<StaticPageFallback><p className="muted">Loading campaigns…</p></StaticPageFallback>}>
        <Body />
      </Suspense>
    </Workspace>
  );
}
