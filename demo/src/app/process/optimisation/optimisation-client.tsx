"use client";

import { useState } from "react";
import type { LoopCampaign } from "@/lib/demo/loopRuns";
import { LoopCampaignTable, RunTypeFilters } from "@/components/improve/loop-runs";
import { grant } from "@/lib/rbac";
import { demoRole } from "@/lib/role";
import { Section } from "@/components/ui/primitives";

export function OptimisationClient({ rows }: { rows: LoopCampaign[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const role = demoRole();
  const showOwner = grant(role, "see-plant-value") !== "hidden";
  const filtered = rows.filter((c) => typeFilter === "all" || c.runType === typeFilter);
  return (
    <div className="stack">
      <RunTypeFilters value={typeFilter} onChange={setTypeFilter} />
      <Section title="Campaign history" meta="Illustrative plant economics appear only in owner-capable views" flush>
        <LoopCampaignTable rows={filtered} showOwner={showOwner} />
      </Section>
    </div>
  );
}
