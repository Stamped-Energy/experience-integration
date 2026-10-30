import { NarrativeTrendCard } from "@/components/scan/narrative-trend";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader } from "@/components/ui/primitives";
import { crumbs } from "@/components/quality/common";
import * as D from "@/lib/demo/data";

export const metadata = { title: "Analytics" };

export default function QualityAnalyticsPage() {
  const atRisk = D.lots.filter((l) => l.riskWord === "At risk").length;
  const hardness = D.lots.map((l) => prop(l)).filter(Boolean);
  function prop(l: (typeof D.lots)[0]) {
    return D.lotProperties.find((p) => p.lotId === l.id)?.predicted.point;
  }
  const series = hardness.slice(0, 12).map((v) => v ?? 0);
  return (
    <Workspace crumbs={crumbs({ label: "Analytics" })} askContext="Quality analytics">
      <PageHeader eyebrow="Quality · Scan" title="Analytics" meta="Drift, yield and lab lag on demonstration data." actions={<AskButton context="Quality analytics" label="Ask about quality trends" />} />
      <KpiRow label="This week" items={[
        { label: "Lots at risk", value: String(atRisk) },
        { label: "Open investigations", value: String(D.investigations.filter((i) => i.status === "open").length) },
        { label: "Links below threshold", value: String(D.lotLinks.filter((l) => l.status === "suggested" && l.link_confidence < 0.8).length) },
      ]} />
      <NarrativeTrendCard
        title="Hardness bands widened before the lab anchored lot 3307"
        narrative="Estimated bands moved before a lab result arrived. Sampling simulations explore tighter plans without releasing holds here."
        series={series.length > 1 ? series : [420, 418, 415, 412, 410, 408]}
        unit="HB"
      />
    </Workspace>
  );
}
