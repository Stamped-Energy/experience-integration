import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { HealthMapPageBody, HealthStatusStrip } from "@/components/scan/health-map";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { processHealthAreas, statusStrip, worstProcessCells } from "@/lib/demo/healthMap";
import { crumbs, processEyebrow } from "@/components/process/common";

export const metadata = { title: "Health map" };

export default function ProcessHealthPage() {
  const strip = statusStrip(processHealthAreas);
  return (
    <Workspace crumbs={crumbs({ label: "Health map" })} askContext="Process health map">
      <PageHeader
        eyebrow={processEyebrow("/process/health")}
        title="Health map"
        meta="Cells use ISA alarm colours and words, not bare health percentages."
        actions={<AskButton context="Process health map" label="Ask about this map" />}
      />
      <ProcessHubTabs />
      <HealthStatusStrip {...strip} />
      <KpiRow
        label="Scan summary"
        items={[
          { label: "Machines and loops", value: String(processHealthAreas.flatMap((a) => a.cells).length) },
          { label: "In alarm", value: String(strip.alarm) },
          { label: "On watch", value: String(strip.watch) },
          { label: "Normal", value: String(strip.ok) },
        ]}
      />
      <HealthMapPageBody areas={processHealthAreas} worst={worstProcessCells()} title="By line and area" />
    </Workspace>
  );
}
