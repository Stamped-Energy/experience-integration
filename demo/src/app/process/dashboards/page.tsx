import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { LoopHealthGauge } from "@/components/view/gauge";
import { PvSpOpTrendCard } from "@/components/view/pv-sp-op-chart";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { DEMO_LOOP_HEALTH, DEMO_PV_TRENDS } from "@/lib/demo/dashboards";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Dashboards" };

export default function ProcessDashboardsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Dashboards" })} askContext="Process dashboards">
      <PageHeader
        eyebrow="Process · Scan"
        title="Dashboards"
        meta="Loop-health gauges and self-explaining PV/SP/OP trends on demonstration data."
        actions={<AskButton context="Process dashboards" label="Ask about these loops" />}
      />
      <ProcessHubTabs />
      <p className="pfd-demo-banner">Demonstration data · loop health scores are illustrative only.</p>
      <section className="dash-gauge-grid" aria-label="Loop health">
        {DEMO_LOOP_HEALTH.map((row) => (
          <LoopHealthGauge key={row.id} label={row.label} value={row.health} tone={row.tone} />
        ))}
      </section>
      <section className="dash-trend-grid" aria-label="Control loop trends">
        {DEMO_PV_TRENDS.map((card) => (
          <PvSpOpTrendCard key={card.id} title={card.title} caption={card.caption} series={card.series} units={card.units} />
        ))}
      </section>
    </Workspace>
  );
}
