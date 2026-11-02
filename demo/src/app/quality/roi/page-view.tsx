"use client";

import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { useSearchParams } from "next/navigation";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader } from "@/components/ui/primitives";
import { D157RoiReportPanel } from "@/components/quality/D157RoiReportPanel";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import { DEMO_D157_NO_COSTS, DEMO_D157_WITH_COSTS } from "@/lib/d157-roi-report";

export default function RoiPageView() {
  const sp = useSearchParams();
  const withCostsDemo = sp.get("costs") === "1";
  const report = withCostsDemo ? { ...DEMO_D157_NO_COSTS, money: DEMO_D157_WITH_COSTS.money } : DEMO_D157_NO_COSTS;
  const title = withCostsDemo ? "Report with illustrative unit costs" : "Value this period";

  return (
    <Workspace crumbs={crumbs({ label: "Value" })} askContext="Value report">
      <PageHeader
        eyebrow={qualityEyebrow("/quality/roi")}
        title="Value"
        meta="Rejection and scrap deltas first · money after unit costs"
        actions={<AskButton context="Value report" label="Ask about value" />}
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
