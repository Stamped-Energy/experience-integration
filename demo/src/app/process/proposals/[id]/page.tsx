import Link from "next/link";
import { nameOf } from "@/lib/names";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DecisionCard } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { RunChart } from "@/components/ui/charts";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { FitChecks } from "@/components/process/FitChecks";
import { ProcessTabs, crumbs, outcome, runLabel, runsOf } from "@/components/process/common";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: nameOf(id) };
}

export default async function ProposalTest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = D.byId.proposal(id);
  if (!p) notFound();
  const role = await currentRole();
  const line = D.byId.line(p.lineId)!;
  const win = D.byId.window(p.lineId, p.param);
  const fit = D.modelFits.find((f) => f.lineId === p.lineId)!;
  const recent = runsOf(line.id).slice(-12);
  const outVals = recent.map((r) => outcome(r, p.predicted.name)?.value).filter((v): v is number => v !== undefined);
  const audit = D.auditEvents.filter((a) => a.objectId === p.id).slice(0, 6);
  const corr = D.corrections.find((c) => c.proposalId === p.id);
  const withheld = p.state === "Withheld";
  return (
    <Workspace crumbs={crumbs({ label: "Proposals", href: "/process/proposals" }, { label: nameOf(p.id) })} askContext={p.id}>
      <PageHeader eyebrow={`Proposal and test · ${line.name}`} title={`${win?.name ?? p.param}: ${withheld ? "no number offered" : `${p.current} to ${p.proposed} ${win?.unit ?? ""}`}`}
        meta={<span >{nameOf(p.id)} · optimiser {p.optimiserVersion} · raised {dayMonth(p.createdAt)} {hhmm(p.createdAt)}</span>}
        actions={<><Link className="btn btn-sm btn-quiet" href="/process/proposals">All proposals</Link><AskButton context={nameOf(p.id)} label="Ask about this proposal" /></>} />
      <ProcessTabs active="proposals" />
      <div className="grid">
        <div className="span-8 stack">
          <DecisionCard p={p} role={role} />
          <Section title="Test on the model of the machine" meta="Before anything is written" flush>
            <div className="split" style={{ padding: "12px 16px" }}>
              <div className="stack-sm">
                <span className="label">Predicted {p.predicted.name.toLowerCase()}</span>
                <Confidence kind="prediction" label={p.weakestLabel} measure={p.predicted.name} unit={p.predicted.unit} low={p.predicted.low} point={p.predicted.point} high={p.predicted.high}
                  spec={p.predicted.spec} drivers={p.drivers} fit={p.fitState} safety={p.safetyFilter} method={`Model ${nameOf(fit.modelId)} ${fit.version}; band is the model's 90% interval; no single score is documented for proposals`} evidenceIds={p.evidenceIds} />
              </div>
              <div className="stack-sm">
                <span className="label">{p.predicted.name}, last {outVals.length} {line.type === "batch" ? "batches" : "shift runs"}</span>
                {outVals.length > 1 ? <RunChart values={outVals} spec={p.predicted.spec} width={460} height={120} label={`Recent ${p.predicted.name}`} /> : <p className="muted" style={{ fontSize: 13 }}>{p.predicted.name} is measured per part; see the run pages.</p>}
              </div>
            </div>
            <table className="table">
              <thead><tr><th>Check</th><th>Result</th><th>Detail</th></tr></thead>
              <tbody>
                <tr><td>Safety filter</td><td><Tag tone={p.safetyFilter.pass ? "success" : "critical"}>{p.safetyFilter.pass ? "Passed" : "Failed"}</Tag></td><td>{p.safetyFilter.rules.join("; ")}</td></tr>
                <tr><td>Model fit</td><td><Tag tone={p.fitState === "accepted" ? "success" : "warning"}>{p.fitState === "accepted" ? "Accepted" : "Not accepted"}</Tag></td><td>{nameOf(fit.modelId)} {fit.version}, coverage {Math.round(fit.coverage * 100)}% on {fit.heldOutN} held-out points</td></tr>
                <tr><td>Weakest input</td><td><EvidenceTag label={p.weakestLabel} /></td><td>A claim is as strong as its weakest load-bearing input</td></tr>
                <tr><td>Inside the window</td><td><Tag tone="success">Yes</Tag></td><td>{win ? `Signed ${win.low} to ${win.high} ${win.unit}${win.narrowedLow !== undefined ? `, narrowed ${win.narrowedLow} to ${win.narrowedHigh}` : ""}` : "No window"}</td></tr>
              </tbody>
            </table>
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <FitChecks fit={fit} compact />
          <Section title="Runs this rests on" flush>
            <DataTable caption="Recent runs" rowKey={(r) => r.id} rows={recent.slice(-6).reverse()} columns={[
              { key: "r", label: "Run", render: (r) => <Link className="link" href={`/process/runs/${r.id}`}>{runLabel(r)}</Link> },
              { key: "s", label: win?.name ?? p.param, align: "right", render: (r) => r.setpoints[p.param] ?? "None" },
              { key: "o", label: p.predicted.name, align: "right", render: (r) => outcome(r, p.predicted.name)?.value ?? "None" },
            ]} />
          </Section>
          {corr ? <Section title="Came from Quality"><div className="stack-sm" style={{ fontSize: 13 }}><span>{corr.reason}</span><span className="muted">{corr.sentBy} · lot <span >{nameOf(corr.lotId)}</span> · {corr.direction} {corr.param}</span><Link className="link" href="/quality/corrections">Corrections to process</Link></div></Section> : null}
          <Section title="History" flush>
            <ul className="tl">
              <li><span className="t">{dayMonth(p.createdAt)} {hhmm(p.createdAt)}</span><span className="k w" /><span>Proposed by optimiser {p.optimiserVersion}</span><span /></li>
              {p.decidedAt ? <li><span className="t">{dayMonth(p.decidedAt)} {hhmm(p.decidedAt)}</span><span className="k" /><span>{p.state === "Declined" ? "Declined" : "Decided"} by {p.decidedBy}</span><span /></li> : null}
              {audit.map((a) => <li key={a.id}><span className="t">{dayMonth(a.at)} {hhmm(a.at)}</span><span className="k" /><span>{a.action}<span className="cell-sub">{D.byId.person(a.personId)!.display}</span></span><span /></li>)}
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
