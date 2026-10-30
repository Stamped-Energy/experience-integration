import { HealthMapPageBody, HealthStatusStrip } from "@/components/scan/health-map";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { qualityHealthAreas, statusStrip, worstQualityCells } from "@/lib/demo/healthMap";
import { crumbs } from "@/components/quality/common";

export const metadata = { title: "Health map" };

export default function QualityHealthPage() {
  const strip = statusStrip(qualityHealthAreas);
  return (
    <Workspace crumbs={crumbs({ label: "Health map" })} askContext="Quality health map">
      <PageHeader eyebrow="Quality · Scan" title="Health map" meta="Join coverage and line risk by area. ISA words only." actions={<AskButton context="Quality health map" label="Ask about this map" />} />
      <HealthStatusStrip {...strip} />
      <HealthMapPageBody areas={qualityHealthAreas} worst={worstQualityCells()} title="Coverage and risk" />
    </Workspace>
  );
}
