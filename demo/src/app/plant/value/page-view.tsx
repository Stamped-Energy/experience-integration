"use client";

import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader } from "@/components/ui/primitives";
import { ValueRoiPanel } from "@/components/plant/ValueRoiPanel";
import { PlantTabs, crumbs } from "@/components/plant/common";
import { DEMO_RATES, DEMO_ROI_ABSTAIN, DEMO_ROI_WITH_COSTS } from "@/lib/value-roi";

export default function ValueRoiPageView() {
  return (
    <Workspace crumbs={crumbs({ label: "Value ROI" })} askContext="Value ROI">
      <PageHeader
        eyebrow="Plant"
        title="Value ROI"
        meta="Rates first · money when unit costs are set"
        actions={<AskButton context="Value ROI" label="Ask about value" />}
      />
      <PlantTabs active="value" />
      <div className="grid">
        <div className="span-6 stack">
          <ValueRoiPanel
            roi={DEMO_ROI_ABSTAIN}
            title="When plant costs are unset"
            meta="Rates only until unit costs are supplied"
            allowSetCosts={false}
          />
        </div>
        <div className="span-6 stack">
          <ValueRoiPanel
            roi={DEMO_ROI_WITH_COSTS}
            title="When plant costs are set"
            meta="Same rates with plant unit costs"
            allowSetCosts={false}
          />
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Window {DEMO_RATES.period.from.slice(0, 10)} to {DEMO_RATES.period.to.slice(0, 10)} · baseline is the equal prior window.
      </p>
    </Workspace>
  );
}
