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
        meta="Loop health (0–100) and 12-hour PV/SP/OP trends. Demonstration data only."
        actions={<AskButton context="Process dashboards" label="Ask about these loops" />}
      />
      <ProcessHubTabs />
      <p className="pfd-demo-banner">Demonstration data · under 50 critical, under 75 watch, 75+ healthy.</p>
      <section className="dash-gauge-grid" aria-label="Loop health">
        {DEMO_LOOP_HEALTH.map((row) => (
          <LoopHealthGauge key={row.id} label={row.label} value={row.health} tone={row.tone} line={row.line} />
        ))}
      </section>
      <section className="dash-trend-grid" aria-label="Control loop trends">
        {DEMO_PV_TRENDS.map((card) => (
          <PvSpOpTrendCard
            key={card.id}
            title={card.title}
            caption={card.caption}
            series={card.series}
            units={card.units}
            windowLabel="Last 12 hours"
          />
        ))}
      </section>
    </Workspace>
  );
}
