import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import Link from "next/link";
import { NarrativeTrendCard } from "@/components/scan/narrative-trend";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { DataTable, KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/charts";
import { crumbs } from "@/components/quality/common";
import * as D from "@/lib/demo/data";
import { belowThreshold } from "@/components/quality/common";

export const metadata = { title: "Analytics" };

export default function QualityAnalyticsPage() {
  const atRisk = D.lots.filter((l) => l.riskWord === "At risk").length;
  const hardness = D.lots.map((l) => prop(l)).filter(Boolean);
  function prop(l: (typeof D.lots)[0]) {
    return D.lotProperties.find((p) => p.lotId === l.id)?.predicted.point;
  }
  const series = hardness.slice(0, 12).map((v) => v ?? 0);
  const lowLinks = belowThreshold();
  return (
    <Workspace crumbs={crumbs({ label: "Analytics" })} askContext="Quality analytics">
      <PageHeader eyebrow="Quality · Scan" title="Analytics" meta="Drift, yield and lab lag on demonstration data." actions={<AskButton context="Quality analytics" label="Ask about quality trends" />}
      />
      <QualityHubTabs />
      <KpiRow
        label="This week (demo)"
        items={[
          { label: "Lots at risk", value: String(atRisk) },
          { label: "Open investigations", value: String(D.investigations.filter((i) => i.status === "open").length) },
          { label: "Links below threshold", value: String(lowLinks.length) },
          { label: "Open CAPA", value: String(D.corrections.filter((c) => c.status === "sent").length) },
        ]}
      />
      <div className="grid">
        <div className="span-8 stack">
          <NarrativeTrendCard
            title="Hardness bands widened before the lab anchored lot 3307"
            narrative="Estimated bands moved before a lab result arrived. Sampling simulations explore tighter plans without releasing holds here."
            series={series.length > 1 ? series : [420, 418, 415, 412, 410, 408]}
            unit="HB"
          />
          <Section title="Lots at risk" meta="Demonstration" flush>
            <DataTable
              caption="Lots at risk"
              rowKey={(l) => l.id}
              rows={D.lots.filter((l) => l.riskWord === "At risk")}
              columns={[
                { key: "l", label: "Lot", render: (l) => <Link className="link" href={`/quality/lots/${l.id}`}>{l.id.replace("lot-", "").toUpperCase()}</Link> },
                { key: "line", label: "Line", render: (l) => D.byId.line(l.lineIds[0])!.short },
                { key: "t", label: "Trend", render: () => <Sparkline values={[48, 47, 46, 45, 44, 43]} width={100} height={24} label="Hardness demo" /> },
                { key: "s", label: "Status", render: () => <Tag tone="warning">At risk</Tag> },
              ]}
            />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Agent simulations" flush>
            <div className="rows">
              <Link className="row" href="/quality/simulations?campaign=camp-q-sim-1"><span><span className="row-title">Sampling plan</span><span className="row-sub">Lot 3307 hardness</span></span><Tag tone="neutral">Complete</Tag></Link>
              <Link className="row" href="/quality/simulations?campaign=camp-q-sim-spc"><span><span className="row-title">Weight SPC</span><span className="row-sub">Press line B</span></span><Tag tone="neutral">Complete</Tag></Link>
            </div>
          </Section>
          <Section title="Links needing review" flush>
            <div className="rows">
              {lowLinks.slice(0, 4).map((link) => (
                <Link key={link.id} className="row" href="/quality/links">
                  <span><span className="row-title">{D.byId.lot(link.lotId)!.id}</span><span className="row-sub">Confidence {Math.round(link.link_confidence * 100)}%</span></span>
                  <span className="link">Review</span>
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
