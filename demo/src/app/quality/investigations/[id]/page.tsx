import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
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
import { notFound } from "next/navigation";

export default async function Investigation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ evidence?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const inv = D.investigations.find((i) => i.id === id);
  if (!inv) notFound();
  const role = await currentRole();
  const proof = D.proofRecords.find((p) => p.id === inv.proofRecordId);
  const lots = inv.lotIds.map((l) => D.byId.lot(l)!);
  const base = `/quality/investigations/${inv.id}`;
  return (
    <Workspace crumbs={crumbs({ label: "Investigations", href: "/quality/investigations" }, { label: inv.title })} askContext={inv.title}>
      <PageHeader eyebrow={`Investigation · ${inv.status}`} title={inv.title} meta={`Opened by ${inv.openedBy} · ${inv.lotIds.length} lots · ${inv.runIds.length} runs`}
        actions={<>{proof ? <Link className="btn btn-sm btn-accent" href={`${base}?evidence=${proof.id}`} scroll={false}>Evidence</Link> : null}<AskButton context={inv.title} label="Ask about this case" /></>} />
      <QualityTabs active="investigations" />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Case file" flush>
            <ul className="tl" style={{ padding: 16 }}>{inv.entries.map((e) => <li key={e.at}><span className="t">{dayMonth(e.at)} {hhmm(e.at)}</span><span className={`k ${e.type === "conclusion" ? "a" : "s"}`} /><span><b style={{ textTransform: "capitalize" }}>{e.type}</b> · {e.text} <EvidenceIds ids={e.evidenceIds} /></span><span><EvidenceTag label={e.label} /></span></li>)}</ul>
          </Section>
          <Section title="Lots in this case" flush>
            <DataTable caption="Lots" rowKey={(l) => l.id} rows={lots} columns={[
              { key: "l", label: "Lot", mono: true, render: (l) => <Link className="link" href={`/quality/lots/${l.id}`}>{lotNo(l.id)}</Link> },
              { key: "r", label: "Risk", render: (l) => <RiskTag risk={l.riskWord} /> },
              { key: "p", label: "Predicted", align: "right", render: (l) => `${propOf(l).predicted.low} to ${propOf(l).predicted.high} ${propOf(l).unit}` },
              { key: "s", label: "Spec", align: "right", render: (l) => `${specOf(l).lsl} to ${specOf(l).usl}` },
              { key: "j", label: "Join", render: (l) => <JoinTag label={weakestJoin(l)} /> },
              { key: "k", label: "Links", render: (l) => linksOf(l).map((k) => k.link_confidence.toFixed(2)).join(", ") },
            ]} />
          </Section>
          <Section title="Linked runs" flush>
            <div className="rows">{inv.runIds.map((r) => { const run = D.runs.find((x) => x.id === r)!; return <Link key={r} className="row" href={`/process/runs/${r}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{runLabel(run)}</span><span className="row-sub">{run.outcomes.filter((o) => o.unit !== "flag").map((o) => `${o.name} ${o.value} ${o.unit}`).join(" · ")}</span></Link>; })}</div>
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Conclusion">
            {inv.conclusion ? <p style={{ margin: 0, fontSize: 14 }}>{inv.conclusion}</p> : <p className="muted" style={{ margin: 0, fontSize: 13 }}>Open. A conclusion is written once the evidence answers the question.</p>}
            <CardActions actions={[
              { id: "c", label: "Send correction to process", primary: inv.status === "open", allowed: can(role, "send-correction"), reason: deniedReason("send-correction", "send corrections"), done: "Correction sent as a recommendation." },
              { id: "n", label: "Add note", allowed: true, done: "Note added." },
            ]} />
          </Section>
          {proof ? <Section title="Proof record" meta={<span >{nameOf(proof.id)}</span>}>
            <Confidence kind="verdict" label={proof.questions[2].label} verdict={proof.verdict} rung={proof.rung} effect={`${proof.effect.measure} ${proof.effect.value > 0 ? "+" : ""}${proof.effect.value} ${proof.effect.unit}`} interval={`${proof.effect.low} to ${proof.effect.high} ${proof.effect.unit}`} diagnostics={proof.diagnostics} method="Before and after on matched lots" withheldNeeds={proof.withheldNeeds} />
            <Link className="btn btn-sm" style={{ marginTop: 8 }} href={`${base}?evidence=${proof.id}`} scroll={false}>Open the four questions</Link>
          </Section> : null}
          <Section title="Corrections from this case" flush>
            <div className="rows">{D.corrections.filter((c) => inv.lotIds.includes(c.lotId)).map((c) => <Link key={c.id} href="/quality/corrections" className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{c.direction} {D.byId.window(c.toLineId, c.param)?.name.toLowerCase()}</span><Tag>{c.status}</Tag></Link>)}</div>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
    </Workspace>
  );
}
