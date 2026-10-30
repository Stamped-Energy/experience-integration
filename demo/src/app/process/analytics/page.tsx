import Link from "next/link";
import { NarrativeTrendCard } from "@/components/scan/narrative-trend";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { DataTable, KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/charts";
import { crumbs } from "@/components/process/common";
import { DEMO_LOOP_CATALOG } from "@/lib/demo/loopRunsExpand";
import * as D from "@/lib/demo/data";

export const metadata = { title: "Analytics" };

export default function ProcessAnalyticsPage() {
  const pressRuns = D.runs.filter((r) => r.lineId === "line-b").slice(-24);
  const scrap = pressRuns.map((r) => r.outcomes.find((o) => o.name === "Scrap rate")!.value);
  const cycle = pressRuns.map((r) => r.outcomes.find((o) => o.name === "Cycle time")?.value ?? 33);
  const monitors = DEMO_LOOP_CATALOG.filter((l) => l.lineId === "line-b" || l.family.includes("Heat")).slice(0, 10);
  return (
    <Workspace crumbs={crumbs({ label: "Analytics" })} askContext="Process analytics">
      <PageHeader eyebrow="Process · Scan" title="Analytics" meta="Dashboards and self-explaining trends on demonstration data." actions={<AskButton context="Process analytics" label="Ask about trends" />} />
      <KpiRow
        label="Last 24 press runs (demo)"
        items={[
          { label: "Scrap rate now", value: scrap.at(-1)?.toFixed(1) ?? "n/a", unit: "%" },
          { label: "Cycle time now", value: String(cycle.at(-1) ?? "n/a"), unit: "s" },
          { label: "Open proposals", value: String(D.proposals.filter((p) => p.state === "Waiting").length) },
          { label: "Loops monitored", value: String(DEMO_LOOP_CATALOG.length) },
        ]}
      />
      <div className="grid">
        <div className="span-8 stack">
          <div className="xl-cols-2">
            <NarrativeTrendCard
              title="Hold pressure wandered high before the agent proposed a tighter band"
              narrative="The sticky valve pattern shows up as rising hold pressure with stable cavity weight. The bounded search kept inside the signed window."
              series={scrap}
              unit="% scrap"
              bands={[{ label: "Spec", low: 0, high: 4 }]}
            />
            <NarrativeTrendCard
              title="Cycle time stayed flat while scrap improved in simulation"
              narrative="Candidate configurations traded a small cycle increase against scrap reduction. Compare runs on the Simulations screen."
              series={cycle}
              unit="s"
            />
          </div>
          <Section title="Loop monitors" meta="Demonstration control loops · open Optimisation or Simulations" flush>
            <DataTable
              caption="Loop monitors"
              rowKey={(r) => r.loopId}
              rows={monitors}
              columns={[
                { key: "n", label: "Loop", render: (r) => <><span style={{ fontWeight: 600 }}>{r.short}</span><span className="cell-sub">{r.family}</span></> },
                { key: "l", label: "Line", render: (r) => D.byId.line(r.lineId)!.short },
                { key: "t", label: "Trend", render: () => <Sparkline values={[0.2, 0.4, 0.35, 0.5, 0.48, 0.52, 0.49]} width={100} height={24} label="Demo trend" /> },
                { key: "s", label: "Status", render: (r) => <Tag tone={r.loopId.includes("zone2") || r.loopId.includes("hold") ? "warning" : "success"}>{r.loopId.includes("zone2") ? "Watch" : "Normal"}</Tag> },
                { key: "o", label: "", align: "right", render: (r) => <Link className="link" href={`/process/optimisation?loop=${r.loopId}`}>Optimise</Link> },
              ]}
            />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Recent alarms (demo)" flush>
            <div className="rows">
              <Link className="row" href="/plant/assets/b-press"><span><span className="row-title">Cavity 2 weight high</span><span className="row-sub">Press P3 · 12 min ago</span></span><Tag tone="critical">Alarm</Tag></Link>
              <Link className="row" href="/process/simulations?campaign=camp-p-sim-2"><span><span className="row-title">Soak short flagged</span><span className="row-sub">Furnace zone 2</span></span><Tag tone="warning">Watch</Tag></Link>
            </div>
          </Section>
          <Section title="Utilities" meta="Demo loops" flush>
            <div className="rows">
              <Link className="row" href="/process/optimisation?loop=loop-util-compressed-air"><span className="row-title">Plant air pressure</span><Tag tone="success">Normal</Tag></Link>
              <Link className="row" href="/process/optimisation?loop=loop-util-cooling-water"><span className="row-title">Cooling water ΔT</span><Tag tone="warning">Watch</Tag></Link>
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
