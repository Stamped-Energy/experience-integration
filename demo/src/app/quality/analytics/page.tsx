import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import Link from "next/link";
import { NarrativeTrendCard } from "@/components/scan/narrative-trend";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { belowThreshold, crumbs, lotNo, qualityEyebrow } from "@/components/quality/common";
import * as D from "@/lib/demo/data";

export default function QualityAnalyticsPage() {
  const atRisk = D.lots.filter((l) => l.riskWord === "At risk").length;
  const hardness = D.lots.map((l) => D.lotProperties.find((p) => p.lotId === l.id)?.predicted.point).filter((v): v is number => v != null);
  const series = hardness.slice(0, 12);
  const lowLinks = belowThreshold();
  return (
    <Workspace crumbs={crumbs({ label: "Analytics" })} askContext="Quality analytics">
      <PageHeader
        eyebrow={qualityEyebrow("/quality/analytics")}
        title="Analytics"
        meta="Drift and yield trends. Lot lists live under Lots."
        actions={<AskButton context="Quality analytics" label="Ask about quality trends" />}
      />
      <QualityHubTabs />
      <KpiRow
        label="This week (demo)"
        items={[
          { label: "Lots at risk", value: String(atRisk), href: "/quality" },
          { label: "Open investigations", value: String(D.investigations.filter((i) => i.status === "open").length), href: "/quality/investigations" },
          { label: "Links below threshold", value: String(lowLinks.length), href: "/quality/links" },
          { label: "Open corrections", value: String(D.corrections.filter((c) => c.status === "sent").length), href: "/quality/corrections" },
        ]}
      />
      <p className="spc-summary">
        <Link className="link" href="/quality">Open lots at risk</Link>
        {" · "}full lot table and risk words
      </p>
      <div className="grid">
        <div className="span-8 stack">
          <NarrativeTrendCard
            title="Hardness bands widened before the lab anchored lot 3307"
            narrative="Estimated bands moved before a lab result arrived. Sampling on the model explores tighter plans without releasing holds here."
            series={series.length > 1 ? series : [420, 418, 415, 412, 410, 408]}
            unit="HB"
          />
        </div>
        <div className="span-4 stack ctx">
          <Section title="Links needing review" flush>
            <div className="rows">
              {lowLinks.slice(0, 4).map((link) => (
                <Link key={link.id} className="row" href="/quality/links">
                  <span>
                    <span className="row-title">Lot {lotNo(link.lotId)}</span>
                    <span className="row-sub">Confidence {Math.round(link.link_confidence * 100)}%</span>
                  </span>
                  <span className="link">Review</span>
                </Link>
              ))}
            </div>
          </Section>
          <Section title="Related" flush>
            <div className="rows">
              <Link className="row" href="/quality/roi">
                <span>
                  <span className="row-title">Value</span>
                  <span className="row-sub">Rejection and scrap deltas</span>
                </span>
                <Tag>Open</Tag>
              </Link>
              <Link className="row" href="/quality/suppliers">
                <span>
                  <span className="row-title">Suppliers</span>
                  <span className="row-sub">PPM vs target</span>
                </span>
                <Tag>Open</Tag>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
