import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { PlantDiagramViewer } from "@/components/scan/forging-plant-viewer";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { processHealthAreas, statusStrip } from "@/lib/demo/healthMap";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Process plant" };

export default function ProcessLinePage() {
  const strip = statusStrip(processHealthAreas);
  const sims = loopCampaigns.filter((c) => c.area === "process" && c.kind === "simulation").length;
  const opts = loopCampaigns.filter((c) => c.area === "process" && c.kind === "optimisation").length;
  return (
    <Workspace crumbs={crumbs({ label: "Process plant" })} askContext="Process plant diagram">
      <PageHeader
        className="pfd-page-head-compact"
        eyebrow="Process · Scan"
        title="Process plant"
        meta="Forging and heat-treatment flow with area tabs, replay, zoom, and full screen. Demonstration data."
        actions={<AskButton context="Process plant" label="Ask about this plant" />}
      />
      <ProcessHubTabs />
      <KpiRow
        className="pfd-kpi-compact"
        label="Press line B · demo KPIs"
        items={[
          { label: "Cells in alarm", value: String(strip.alarm) },
          { label: "On watch", value: String(strip.watch) },
          { label: "Optimisation loops", value: String(opts) },
          { label: "Simulation campaigns", value: String(sims) },
        ]}
      />
      <PlantDiagramViewer />
    </Workspace>
  );
}
