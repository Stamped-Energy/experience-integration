import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { DataTable, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { JoinTag, NoReleaseLine, QualityTabs, RiskTag, crumbs, gradeOf, labOf, linksOf, lotNo, proofForLot, propOf, specOf, threshold, weakestJoin } from "@/components/quality/common";

export const metadata = { title: "Quality" };
const RANK = { "At risk": 0, Watch: 1, "On track": 2 } as const;

export default async function LotsAtRisk({ searchParams }: { searchParams: Promise<{ lot?: string; evidence?: string; all?: string }> }) {
  const sp = await searchParams;
  const role = await currentRole();
  const sorted = D.lots.slice().sort((a, b) => RANK[a.riskWord] - RANK[b.riskWord] || b.startedAt.localeCompare(a.startedAt));
  const rows = sp.all ? sorted : sorted.filter((l) => l.riskWord !== "On track" || l.status !== "complete").slice(0, 20);
  const sel = D.byId.lot(sp.lot ?? "") ?? sorted[0];
  const prop = propOf(sel), spec = specOf(sel), lab = labOf(sel), links = linksOf(sel);
  const proof = proofForLot(sel);
  const atRisk = D.lots.filter((l) => l.riskWord === "At risk");
  return (
    <Workspace crumbs={crumbs({ label: "Lots at risk" })} askContext="Lots at risk">
      <PageHeader eyebrow="Quality" title="Lots at risk" meta="Whether each lot will meet spec, how sure, and what it rests on. Stamped works inside limits set beforehand."
        actions={<><Link className="btn btn-sm" href="/quality/links">{D.lotLinks.filter((l) => l.status === "suggested" && l.link_confidence < 0.8).length} links to confirm</Link><AskButton context="Lots at risk" label="Ask about lots" /></>} />
      <QualityTabs active="lots" />
      <NoReleaseLine />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Lots" meta={`${atRisk.length} at risk · ${D.lots.filter((l) => l.riskWord === "Watch").length} to watch · ${D.lots.length} in 10 days`} flush
            actions={<Link className="link" href={sp.all ? "/quality" : "/quality?all=1"} scroll={false}>{sp.all ? "Open lots only" : `Show all ${D.lots.length}`}</Link>}>
            <DataTable caption="Lots" rowKey={(l) => l.id} rows={rows} columns={[
              { key: "l", label: "Lot", render: (l) => <><Link className="link mono" href={`/quality/lots/${l.id}`} style={{ fontWeight: 600 }}>{lotNo(l.id)}</Link><span className="cell-sub">{gradeOf(l).name}</span></> },
              { key: "r", label: "Risk", render: (l) => <RiskTag risk={l.riskWord} /> },
              { key: "p", label: "Property, predicted", align: "right", render: (l) => { const p = propOf(l); return <>{p.predicted.point} {p.unit}<span className="cell-sub">{p.predicted.low} to {p.predicted.high}</span></>; } },
              { key: "s", label: "Spec", align: "right", render: (l) => { const s = specOf(l); return `${s.lsl} to ${s.usl}`; } },
              { key: "a", label: "Anchor", render: (l) => (propOf(l).anchored ? <Tag tone="success">Lab result</Tag> : <Tag tone="warning">Unanchored</Tag>) },
              { key: "j", label: "Join", render: (l) => <JoinTag label={weakestJoin(l)} /> },
              { key: "st", label: "Status", render: (l) => l.status },
              { key: "t", label: "Started", render: (l) => rel(l.startedAt) },
              { key: "v", label: "", render: (l) => <Link className="link" href={`/quality?lot=${l.id}`} scroll={false}>Preview</Link> },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title={`Lot ${lotNo(sel.id)}`} meta={gradeOf(sel).name} actions={<RiskTag risk={sel.riskWord} />}>
            <div className="stack-sm">
              <span className="label">{prop.name}, predicted against spec</span>
              {prop.anchored ? (
                <Confidence kind="prediction" label="Measured" measure={prop.name} unit={prop.unit} low={prop.predicted.low} point={prop.predicted.point} high={prop.predicted.high} spec={[spec.lsl, spec.usl]}
                  drivers={["Lab result", "Linked run outcomes"]} fit="accepted" method={`Anchored to the lab result (${lab?.value} ${prop.unit})`} />
              ) : (
                <Confidence kind="prediction" label="Estimated" measure={prop.name} unit={prop.unit} low={prop.predicted.low} point={prop.predicted.point} high={prop.predicted.high} spec={[spec.lsl, spec.usl]}
                  drivers={["Linked run outcomes", "End-of-hold torque"]} fit="accepted" method="Property band from linked runs; unanchored, cannot support a decision until the lab result arrives" />
              )}
              <span className="label" style={{ marginTop: 8 }}>Links to runs · weakest <JoinTag label={weakestJoin(sel)} /></span>
              {links.map((l) => (
                <Confidence key={l.id} kind="link" label={l.label} score={l.link_confidence} threshold={threshold(sel.id)} status={`${l.status}, run ${nameOf(l.runId)}`}
                  drivers={["time proximity", "recipe match", "sequence", "scanned id"]} method="Weights fitted on a verification sample" />
              ))}
              {proof ? <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><VerdictTag verdict={proof.verdict} /><Link className="link" href={`/quality?lot=${sel.id}&evidence=${proof.id}`} scroll={false}>Evidence on demand</Link></div> : null}
            </div>
            <CardActions actions={[
              { id: "corr", label: "Send correction to process", primary: sel.riskWord === "At risk", allowed: can(role, "send-correction"), reason: deniedReason("send-correction", "send corrections"), done: "Correction sent to Process as a recommendation. Illustrative: nothing was written." },
              { id: "open", label: "Investigate", allowed: true, done: "Opened an investigation draft." },
            ]} />
          </Section>
          <Section title="By grade" flush>
            <DataTable caption="Grades" rowKey={(g) => g.id} rows={D.grades} columns={[
              { key: "g", label: "Grade", render: (g) => g.name },
              { key: "n", label: "Lots", align: "right", render: (g) => D.lots.filter((l) => l.gradeId === g.id).length },
              { key: "r", label: "At risk", align: "right", render: (g) => D.lots.filter((l) => l.gradeId === g.id && l.riskWord === "At risk").length },
              { key: "s", label: "Spec", align: "right", render: (g) => { const s = D.specs.find((x) => x.gradeId === g.id)!; return `${s.lsl} to ${s.usl} ${s.unit}`; } },
            ]} />
          </Section>
          <Section title="Drift and corrections" flush>
            <div className="rows">
              {D.driftSignals.map((d) => <Link key={d.id} className="row" href="/quality/drift" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{d.property} drifting {d.direction}, {D.byId.line(d.lineId)!.short}</span><span className="row-sub">{d.magnitude}</span></span><Tag tone="warning">Drift</Tag></Link>)}
              {D.corrections.map((c) => <Link key={c.id} className="row" href="/quality/corrections" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{c.direction} {D.byId.window(c.toLineId, c.param)?.name.toLowerCase() ?? c.param}</span><span className="row-sub">Lot {lotNo(c.lotId)} · {c.reason}</span></span><Tag tone={c.status === "accepted" ? "success" : c.status === "sent" ? "accent" : "neutral"}>{c.status}</Tag></Link>)}
            </div>
          </Section>
          <Section title="Since this morning" flush>
            <ul className="tl">{D.shiftEvents.filter((e) => e.kind === "lot" || e.kind === "data").map((e) => <li key={e.at}><span className="t">{dayMonth(e.at)}</span><span className={`k ${e.kind === "lot" ? "x" : "s"}`} /><span>{e.text}</span><span /></li>)}</ul>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={sp.lot ? `/quality?lot=${sp.lot}` : "/quality"} /> : null}
    </Workspace>
  );
}
