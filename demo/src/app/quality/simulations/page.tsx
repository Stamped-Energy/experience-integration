import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Suspense } from "react";
import { SimulationsWorkspace } from "@/components/improve/loop-runs";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/quality/common";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Simulations" };

function Body() {
  const rows = loopCampaigns.filter((c) => c.area === "quality" && c.kind === "simulation");
  return (
    <>
      <KpiRow
        label="Quality simulations (demo)"
        items={[
          { label: "Campaigns", value: String(rows.length) },
          { label: "Sampling loops", value: "2" },
          { label: "Compare limit", value: "4 runs" },
        ]}
      />
      <SimulationsWorkspace campaigns={loopCampaigns} kind="simulation" area="quality" />
    </>
  );
}

export default function QualitySimulationsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Simulations" })} askContext="Quality simulations">
      <PageHeader eyebrow="Quality · Improve" title="Simulations" meta="Quality loop and sampling simulations use the same compare pattern as Process. Demonstration data." actions={<AskButton context="Quality simulations" label="Ask about simulations" />}
      />
      <QualityHubTabs />
      <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
        <Body />
      </Suspense>
    </Workspace>
  );
}
