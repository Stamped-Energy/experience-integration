"use client";

import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader, Tag } from "@/components/ui/primitives";
import { ValueRoiPanel } from "@/components/plant/ValueRoiPanel";
import { PlantTabs, crumbs } from "@/components/plant/common";
import { DEMO_RATES, DEMO_ROI_ABSTAIN, DEMO_ROI_WITH_COSTS } from "@/lib/value-roi";

export default function ValueRoiPageView() {
  return (
    <Workspace crumbs={crumbs({ label: "Value ROI" })} askContext="Value ROI">
      <PageHeader
        eyebrow="Plant"
        title="Value ROI"
        meta={
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            Rejection rate and scrap rate first. Money savings only when the plant has set unit costs in config. Stamped never invents them (D157).
            <Tag tone="warning">Example data</Tag>
          </span>
        }
        actions={<AskButton context="Value ROI" label="Ask about value" />}
      />
      <PlantTabs active="value" />
      <div className="grid">
        <div className="span-6 stack">
          <ValueRoiPanel
            roi={DEMO_ROI_ABSTAIN}
            title="When plant costs are unset"
            meta="Default until the plant supplies cost_per_rejection, cost_per_scrap and units_in_period"
            allowSetCosts={false}
          />
        </div>
        <div className="span-6 stack">
          <ValueRoiPanel
            roi={DEMO_ROI_WITH_COSTS}
            title="When plant costs are set"
            meta="Illustrative only: same rates with example INR unit costs from the costs fixture"
            illustrative
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
