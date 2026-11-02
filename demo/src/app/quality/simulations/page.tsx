import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Suspense } from "react";
import { SimulationsWorkspace } from "@/components/improve/loop-runs";
import { AskButton } from "@/components/shell/ShellClient";
import { EngineeringGuard } from "@/components/shell/EngineeringGuard";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Simulation campaigns" };

function Body() {
  const rows = loopCampaigns.filter((c) => c.area === "quality" && c.kind === "simulation");
  return (
    <>
      <KpiRow
        label="Quality simulations"
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
    <Workspace crumbs={crumbs({ label: "Simulation campaigns" })} askContext="Quality simulations">
      <PageHeader eyebrow={qualityEyebrow("/quality/simulations")} title="Simulation campaigns" meta="Quality sampling loops" actions={<AskButton context="Quality simulations" label="Ask about simulations" />}
      />
      <QualityHubTabs />
      <EngineeringGuard backHref="/quality/actions" backLabel="Back to Quality actions">
        <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
          <Body />
        </Suspense>
      </EngineeringGuard>
    </Workspace>
  );
}
