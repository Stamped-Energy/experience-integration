import { HealthMapPageBody, HealthStatusStrip } from "@/components/scan/health-map";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { qualityHealthAreas, statusStrip, worstQualityCells } from "@/lib/demo/healthMap";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { crumbs } from "@/components/quality/common";

export const metadata = { title: "Health map" };

export default function QualityHealthPage() {
  const strip = statusStrip(qualityHealthAreas);
  const qSims = loopCampaigns.filter((c) => c.area === "quality" && c.kind === "simulation").length;
  return (
    <Workspace crumbs={crumbs({ label: "Health map" })} askContext="Quality health map">
      <PageHeader eyebrow="Quality · Scan" title="Health map" meta="Join coverage and line risk by area. ISA words only. Demonstration data." actions={<AskButton context="Quality health map" label="Ask about this map" />} />
      <HealthStatusStrip {...strip} />
      <KpiRow
        label="Quality scan (demo)"
        items={[
          { label: "Cells", value: String(qualityHealthAreas.flatMap((a) => a.cells).length) },
          { label: "In alarm", value: String(strip.alarm) },
          { label: "On watch", value: String(strip.watch) },
          { label: "Sim campaigns", value: String(qSims) },
        ]}
      />
      <HealthMapPageBody areas={qualityHealthAreas} worst={worstQualityCells()} title="Coverage and risk" />
    </Workspace>
  );
}
