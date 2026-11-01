import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { RunChart } from "@/components/ui/charts";
import { DataTable, EvidenceIds, EvidenceTag, Illustrative, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { runLabel } from "@/components/process/common";
import { JoinTag, QualityTabs, RiskTag, crumbs, gradeOf, linksOf, lotNo, propOf, specOf, threshold, weakestJoin, belowThreshold } from "@/components/quality/common";

export const metadata = { title: "Drift" };
const series = (lineId: string, prop: string) => D.runs.filter((r) => r.lineId === lineId).sort((a, b) => a.end.localeCompare(b.end)).map((r) => r.outcomes.find((o) => o.name === prop)?.value).filter((v): v is number => v !== undefined).slice(-24);

export default async function Drift() {
  const role = demoRole();
  const b = D.alarmBudget;
  return (
    <Workspace crumbs={crumbs({ label: "Drift" })} askContext="Quality drift">
      <PageHeader eyebrow="Quality" title="Drift" meta="Slow movement in a property, caught before a lot leaves spec. Each signal is a pattern across runs, not a single alarm." actions={<AskButton context="Quality drift" label="Ask about drift" />} />
      <QualityHubTabs />
      <div className="grid">
        <div className="span-8 stack">
          {D.driftSignals.map((d) => {
            const line = D.byId.line(d.lineId)!;
            const v = series(d.lineId, d.property);
            const lots = D.lots.filter((l) => l.lineIds.includes(d.lineId) && l.riskWord !== "On track");
            const g = lots[0] ? specOf(lots[0]) : undefined;
            return (
              <Section key={d.id} title={`${d.property} drifting ${d.direction} on ${line.name}`} meta={<>{d.magnitude} · since {dayMonth(d.startedAt)} <EvidenceTag label={d.label} /></>} flush
                actions={<Link className="link" href={`/process/lines/${d.lineId}`}>Line in Process</Link>}>
                <div className="split" style={{ padding: 16 }}>
                  <div><RunChart values={v.length ? v : [0]} spec={g && g.property === d.property ? [g.lsl, g.usl] : undefined} width={520} height={150} label={`${d.property} by run`} highlightFrom={Math.max(0, v.length - 9)} />
                    <div className="chart-legend"><span>Last {v.length} runs</span><span>Shaded: since drift began</span></div></div>
                  <div className="stack-sm">
                    <span className="label">Lots exposed</span>
                    <div className="rows">{lots.slice(0, 5).map((l) => <Link key={l.id} className="row" href={`/quality/lots/${l.id}`} style={{ gridTemplateColumns: "auto minmax(0,1fr) auto" }}><span className="mono">{lotNo(l.id)}</span><span className="row-sub">{propOf(l).predicted.point} {propOf(l).unit}</span><RiskTag risk={l.riskWord} /></Link>)}</div>
                    <CardActions actions={[
                      { id: "c", label: "Send correction to process", primary: true, allowed: can(role, "send-correction"), reason: deniedReason("send-correction", "send corrections"), done: "Correction sent as a recommendation." },
                      { id: "i", label: "Open investigation", allowed: true, done: "Investigation draft opened." },
                    ]} />
                  </div>
                </div>
              </Section>
            );
          })}
        </div>
        <div className="span-4 stack ctx">
          <Section title="Alarm budget" meta={b.period} actions={<Illustrative />}>
            <div className="stat-row"><div className="stat"><div className="label">Raised</div><div className="v">{b.used}</div></div><div className="stat"><div className="label">Budget</div><div className="v">{b.limit}</div></div><div className="stat"><div className="label">Left</div><div className="v">{b.limit - b.used}</div></div></div>
            <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>drift signals count against a weekly budget so quality staff are not flooded. Weaker signals wait in this list rather than alerting.</p>
          </Section>
          <Section title="How a signal is raised">
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>A property moves the same way across several runs.</li>
              <li>The move is larger than normal run-to-run spread.</li>
              <li>Lots linked to those runs are checked against spec.</li>
              <li>The signal names the line and suggests a correction to Process.</li>
            </ol>
          </Section>
          <Section title="Recent lab results" flush>
            <DataTable caption="Lab results" rowKey={(r) => r.id} rows={D.labResults.slice(-8).reverse()} columns={[
              { key: "l", label: "Lot", mono: true, render: (r) => <Link className="link" href={`/quality/lots/${r.lotId}`}>{lotNo(r.lotId)}</Link> },
              { key: "p", label: "Property", render: (r) => r.property },
              { key: "v", label: "Value", align: "right", render: (r) => r.value },
              { key: "t", label: "At", render: (r) => rel(r.at) },
            ]} />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
