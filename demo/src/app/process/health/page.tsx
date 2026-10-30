import { HealthMapPageBody, HealthStatusStrip } from "@/components/scan/health-map";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { processHealthAreas, statusStrip, worstProcessCells } from "@/lib/demo/healthMap";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Health map" };

export default function ProcessHealthPage() {
  const strip = statusStrip(processHealthAreas);
  return (
    <Workspace crumbs={crumbs({ label: "Health map" })} askContext="Process health map">
      <PageHeader
        eyebrow="Process · Scan"
        title="Health map"
        meta="Cells use ISA alarm colours and words. No bare health percentage."
        actions={<AskButton context="Process health map" label="Ask about this map" />}
      />
      <HealthStatusStrip {...strip} />
      <HealthMapPageBody areas={processHealthAreas} worst={worstProcessCells()} title="By line and area" />
    </Workspace>
  );
}
