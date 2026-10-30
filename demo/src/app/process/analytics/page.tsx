import { NarrativeTrendCard } from "@/components/scan/narrative-trend";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { KpiRow, PageHeader, Section } from "@/components/ui/primitives";
import { crumbs } from "@/components/process/common";
import * as D from "@/lib/demo/data";

export const metadata = { title: "Analytics" };

export default function ProcessAnalyticsPage() {
  const pressRuns = D.runs.filter((r) => r.lineId === "line-b").slice(-24);
  const scrap = pressRuns.map((r) => r.outcomes.find((o) => o.name === "Scrap rate")!.value);
  const cycle = pressRuns.map((r) => r.outcomes.find((o) => o.name === "Cycle time")?.value ?? 33);
  return (
    <Workspace crumbs={crumbs({ label: "Analytics" })} askContext="Process analytics">
      <PageHeader eyebrow="Process · Scan" title="Analytics" meta="Dashboards and self-explaining trends on demonstration data." actions={<AskButton context="Process analytics" label="Ask about trends" />} />
      <KpiRow
        label="Last 24 press runs"
        items={[
          { label: "Scrap rate now", value: scrap.at(-1)?.toFixed(1) ?? "n/a", unit: "%" },
          { label: "Cycle time now", value: String(cycle.at(-1) ?? "n/a"), unit: "s" },
          { label: "Open proposals", value: String(D.proposals.filter((p) => p.state === "Waiting").length) },
        ]}
      />
      <div className="grid">
        <div className="span-6">
          <NarrativeTrendCard
            title="Hold pressure wandered high before the agent proposed a tighter band"
            narrative="The sticky valve pattern shows up as rising hold pressure with stable cavity weight. The bounded search kept inside the signed window."
            series={scrap}
            unit="% scrap"
            bands={[{ label: "Spec", low: 0, high: 4 }]}
          />
        </div>
        <div className="span-6">
          <NarrativeTrendCard
            title="Cycle time stayed flat while scrap improved in simulation"
            narrative="Candidate configurations traded a small cycle increase against scrap reduction. Compare runs on the Simulations screen."
            series={cycle}
            unit="s"
          />
        </div>
      </div>
      <Section title="Monitors" meta="Control loops the pack watches">
        <p className="secondary" style={{ fontSize: 13 }}>Furnace zones, induction billet heat, press barrel temperatures and hold pressure. Optimisation and simulation campaigns run from Improve.</p>
      </Section>
    </Workspace>
  );
}
