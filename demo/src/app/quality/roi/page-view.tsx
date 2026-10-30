"use client";

import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { useSearchParams } from "next/navigation";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader, Tag } from "@/components/ui/primitives";
import { D157RoiReportPanel } from "@/components/quality/D157RoiReportPanel";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { DEMO_D157_NO_COSTS, DEMO_D157_WITH_COSTS } from "@/lib/d157-roi-report";

export default function RoiPageView() {
  const sp = useSearchParams();
  const withCostsDemo = sp.get("costs") === "1";
  const report = withCostsDemo ? { ...DEMO_D157_NO_COSTS, money: DEMO_D157_WITH_COSTS.money } : DEMO_D157_NO_COSTS;
  const title = withCostsDemo ? "Report with illustrative unit costs" : "D157 ROI report";

  return (
    <Workspace crumbs={crumbs({ label: "D157 ROI report" })} askContext="D157 ROI report">
      <PageHeader
        eyebrow="Quality"
        title="D157 ROI report"
        meta={
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            Rejection and scrap rate deltas first. Money only after Set unit costs.
            <Tag tone="warning">Example data</Tag>
            <Tag>quality.get_d157_roi_report</Tag>
          </span>
        }
        actions={<AskButton context="D157 ROI report" label="Ask about ROI" />}
      />
      <QualityHubTabs />
      <div className="grid">
        <div className="span-12 stack">
          <D157RoiReportPanel
            report={report}
            title={title}
            illustrative
            allowSetCosts={!(withCostsDemo)}
          />
        </div>
      </div>
    </Workspace>
  );
}
