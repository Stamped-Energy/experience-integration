"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { LoopCampaign } from "@/lib/demo/loopRuns";
import { LoopCampaignTable, RunTypeFilters } from "@/components/improve/loop-runs";
import { grant } from "@/lib/rbac";
import { demoRole } from "@/lib/role";
import { DataTable, KpiRow, Section, Tag } from "@/components/ui/primitives";
import Link from "next/link";

export function OptimisationClient({ rows }: { rows: LoopCampaign[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const sp = useSearchParams();
  const loopFilter = sp.get("loop");
  const role = demoRole();
  const showOwner = grant(role, "see-plant-value") !== "hidden";
  const filtered = useMemo(
    () => rows.filter((c) => (typeFilter === "all" || c.runType === typeFilter) && (!loopFilter || c.loopId === loopFilter)),
    [rows, typeFilter, loopFilter],
  );
  const running = filtered.filter((c) => c.status === "running").length;
  return (
    <div className="stack">
      <KpiRow
        label="Optimisation campaigns (demo)"
        items={[
          { label: "Campaigns shown", value: String(filtered.length) },
          { label: "Running", value: String(running) },
          { label: "Configs per loop", value: "18" },
          { label: "Type filter", value: typeFilter === "all" ? "All" : typeFilter.toUpperCase() },
        ]}
      />
      {loopFilter ? <p className="pfd-demo-banner">Filtered to loop <strong>{loopFilter}</strong> · <Link className="link" href="/process/optimisation">Show all</Link></p> : null}
      <RunTypeFilters value={typeFilter} onChange={setTypeFilter} />
      <div className="grid">
        <div className="span-8">
          <Section title="Campaign history" meta="Illustrative plant economics appear only in owner-capable views" flush>
            <LoopCampaignTable rows={filtered} showOwner={showOwner} />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Loop families" meta="Demonstration" flush>
            <DataTable
              caption="Loop families"
              rowKey={(r) => r.loopId}
              rows={filtered.slice(0, 8)}
              columns={[
                { key: "f", label: "Family", render: (r) => r.loopFamily },
                { key: "s", label: "Status", render: (r) => <Tag tone={r.status === "running" ? "warning" : "neutral"}>{r.status}</Tag> },
              ]}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
