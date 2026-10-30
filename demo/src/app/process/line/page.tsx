import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { ForgingLineMap } from "@/components/scan/forging-line-map";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { processHealthAreas, statusStrip } from "@/lib/demo/healthMap";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Process line view" };

export default function ProcessLinePage() {
  const strip = statusStrip(processHealthAreas);
  const sims = loopCampaigns.filter((c) => c.area === "process" && c.kind === "simulation").length;
  const opts = loopCampaigns.filter((c) => c.area === "process" && c.kind === "optimisation").length;
  return (
    <Workspace crumbs={crumbs({ label: "Process line view" })} askContext="Process line view">
      <PageHeader
        eyebrow="Process · Scan"
        title="Process line view"
        meta="PFD-style forging flow with live values and status. All tags are demonstration data."
        actions={<AskButton context="Process line view" label="Ask about this line" />}
      />
      <ProcessHubTabs />
      <KpiRow
        label="Press line B · demo KPIs"
        items={[
          { label: "Cells in alarm", value: String(strip.alarm) },
          { label: "On watch", value: String(strip.watch) },
          { label: "Optimisation loops", value: String(opts) },
          { label: "Simulation campaigns", value: String(sims) },
        ]}
      />
      <ForgingLineMap />
    </Workspace>
  );
}
