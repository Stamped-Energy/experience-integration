import Link from "next/link";
import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { HealthMapGrid, HealthStatusStrip } from "@/components/scan/health-map";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { DataTable, KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/charts";
import { crumbs } from "@/components/process/common";
import { DEMO_LOOP_CATALOG } from "@/lib/demo/loopRunsExpand";
import { processHealthAreas, statusStrip, worstProcessCells } from "@/lib/demo/healthMap";
import * as D from "@/lib/demo/data";

export const metadata = { title: "Analytics overview" };

const RESULT_STATUS = [
  { status: "Normal", count: 18, tone: "success" as const },
  { status: "Watch", count: 5, tone: "warning" as const },
  { status: "Alarm", count: 2, tone: "critical" as const },
  { status: "Unknown", count: 1, tone: "neutral" as const },
];

const ALARM_DAYS = [2, 1, 0, 3, 1, 0, 2, 4, 1, 0, 1, 2, 3, 1];

export default function ProcessAnalyticsPage() {
  const strip = statusStrip(processHealthAreas);
  const worst = worstProcessCells();
  const monitors = DEMO_LOOP_CATALOG.filter((l) => l.lineId === "line-b" || l.family.includes("Heat")).slice(0, 8);
  const queue = D.proposals.filter((p) => p.state === "Waiting").slice(0, 5);
  return (
    <Workspace crumbs={crumbs({ label: "Analytics" })} askContext="Process analytics overview">
      <PageHeader
        eyebrow="Process · Scan"
        title="Analytics overview"
        meta="Results by status, recent alarms, health map, monitors, and the action queue on demonstration data."
        actions={<AskButton context="Process analytics" label="Ask about analytics" />}
      />
      <ProcessHubTabs />
      <p className="pfd-demo-banner">Demonstration data · analytics widgets mirror the control-room overview layout.</p>
      <HealthStatusStrip {...strip} />
      <div className="grid anal-overview">
        <Section className="span-8" title="Results by status" meta="Loop and result health · demo" flush>
          <div className="anal-status-row">
            {RESULT_STATUS.map((row) => (
              <div key={row.status} className="anal-status-card">
                <Tag tone={row.tone}>{row.status}</Tag>
                <strong className="num">{row.count}</strong>
                <span className="muted">results</span>
              </div>
            ))}
          </div>
        </Section>
        <Section className="span-4" title="Alarms · last 14 days" meta="Demonstration counts" flush>
          <Sparkline values={ALARM_DAYS} width={280} height={56} label="Alarms per day" />
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Total <strong className="num">{ALARM_DAYS.reduce((a, b) => a + b, 0)}</strong> alarm-days in the window.
          </p>
        </Section>
        <Section className="span-8" title="Health map by area" meta="Demonstration cells" flush>
          <HealthMapGrid areas={processHealthAreas} />
        </Section>
        <Section className="span-4" title="Worst results" flush>
          <div className="rows">
            {worst.slice(0, 6).map((c) => (
              <Link key={c.id} className="row" href={c.href}>
                <span>
                  <span className="row-title">{c.label}</span>
                  <span className="row-sub">{c.issue ?? c.area}</span>
                </span>
                <Tag tone={c.state === "alarm" ? "critical" : "warning"}>{c.stateWord}</Tag>
              </Link>
            ))}
          </div>
        </Section>
        <Section className="span-6" title="Monitors" meta="Demonstration loops" flush>
          <DataTable
            caption="Loop monitors"
            rowKey={(r) => r.loopId}
            rows={monitors}
            columns={[
              {
                key: "n",
                label: "Loop",
                render: (r) => (
                  <>
                    <span style={{ fontWeight: 600 }}>{r.short}</span>
                    <span className="cell-sub">{r.family}</span>
                  </>
                ),
              },
              { key: "l", label: "Line", render: (r) => D.byId.line(r.lineId)!.short },
              {
                key: "s",
                label: "Status",
                render: (r) => (
                  <Tag tone={r.loopId.includes("zone2") || r.loopId.includes("hold") ? "warning" : "success"}>
                    {r.loopId.includes("zone2") ? "Watch" : "Normal"}
                  </Tag>
                ),
              },
              {
                key: "o",
                label: "",
                align: "right",
                render: (r) => (
                  <Link className="link" href={`/process/optimisation?loop=${r.loopId}`}>
                    Open
                  </Link>
                ),
              },
            ]}
          />
        </Section>
        <Section className="span-6" title="Queue" meta="Waiting proposals" flush>
          {queue.length ? (
            <div className="rows">
              {queue.map((p) => (
                <Link key={p.id} className="row" href={`/process/proposals/${p.id}`}>
                  <span>
                    <span className="row-title">{p.param}</span>
                    <span className="row-sub">{D.byId.line(p.lineId)?.short ?? p.lineId}</span>
                  </span>
                  <Tag tone="warning">Waiting</Tag>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">Nothing waiting on the queue.</p>
          )}
        </Section>
      </div>
      <KpiRow
        label="Scan summary"
        items={[
          { label: "Open proposals", value: String(D.proposals.filter((p) => p.state === "Waiting").length) },
          { label: "Loops monitored", value: String(DEMO_LOOP_CATALOG.length) },
          { label: "In alarm", value: String(strip.alarm) },
          { label: "On watch", value: String(strip.watch) },
        ]}
      />
    </Workspace>
  );
}
