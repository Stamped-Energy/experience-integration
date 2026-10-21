import Link from "next/link";
import { nameOf } from "@/lib/names";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { Confidence } from "@/components/ui/Confidence";
import { RunChart } from "@/components/ui/charts";
import { DataTable, EvidenceTag, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { runLabel } from "@/components/process/common";
import { JoinTag, QualityTabs, RiskTag, crumbs, gradeOf, labOf, linksOf, lotNo, proofForLot, propOf, specOf, threshold, weakestJoin, whyRisk } from "@/components/quality/common";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Lot ${lotNo(id)}` };
}

export default async function LotDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ evidence?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const lot = D.byId.lot(id);
  if (!lot) notFound();
  const role = await currentRole();
  const line = D.byId.line(lot.lineIds[0])!;
  const prop = propOf(lot), spec = specOf(lot), lab = labOf(lot), links = linksOf(lot), proof = proofForLot(lot);
  const thr = threshold(lot.id);
  const corr = D.corrections.filter((c) => c.lotId === lot.id);
  const inv = D.investigations.filter((i) => i.lotIds.includes(lot.id));
  const same = D.lots.filter((l) => l.gradeId === lot.gradeId).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const series = same.map((l) => propOf(l).predicted.point);
  const base = `/quality/lots/${lot.id}`;
  return (
    <Workspace crumbs={crumbs({ label: "Lots", href: "/quality" }, { label: `Lot ${lotNo(lot.id)}` })} askContext={`Lot ${lotNo(lot.id)}`}>
      <PageHeader eyebrow={`Lot detail and join · ${line.name}`} title={`Lot ${lotNo(lot.id)} · ${gradeOf(lot).name}`}
        meta={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><RiskTag risk={lot.riskWord} /><span >{nameOf(lot.id)}</span>{lot.status} · started {dayMonth(lot.startedAt)} {hhmm(lot.startedAt)}</span>}
        actions={<>{proof ? <Link className="btn btn-sm btn-accent" href={`${base}?evidence=${proof.id}`} scroll={false}>Evidence</Link> : null}<AskButton context={`Lot ${lotNo(lot.id)}`} label="Ask about this lot" /></>} />
      <QualityTabs active="lots" />
      <div className="grid">
        <div className="span-8 stack">
          <Section title={lot.riskWord === "At risk" ? "Why this lot is at risk" : lot.riskWord === "Watch" ? "Why this lot is on watch" : "Why this lot is on track"}>
            {whyRisk(lot).map((line) => <p key={line} style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{line}</p>)}
          </Section>
          <Section title="Join" meta={`Quality owns the lot join; every link carries its confidence · pack threshold ${thr} · weakest label sets the lot`} flush actions={<JoinTag label={weakestJoin(lot)} />}>
            <div className="join" style={{ padding: 16 }}>
              <div className="join-lot"><div className="label">Lot</div><div className="mono" style={{ fontWeight: 600 }}>{lotNo(lot.id)}</div><div className="cell-sub">{lot.stages.join(" · ")}</div></div>
              <div className="join-edges" aria-hidden />
              <div className="join-runs">{links.map((l) => {
                const run = D.runs.find((r) => r.id === l.runId)!;
                return (
                  <div key={l.id} className={`join-run${l.link_confidence < thr ? " weak" : ""}`}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><Link className="link" href={`/process/runs/${run.id}`} style={{ fontWeight: 600 }}>{runLabel(run)}</Link><span className="muted mono">{nameOf(l.id)}</span></div>
                    <Confidence kind="link" label={l.label} score={l.link_confidence} threshold={thr} status={l.status} drivers={["time proximity", "recipe match", "sequence consistency", "scanned identifier"]} method="Weights fitted on a verification sample; penalty when several candidates fit" />
                    <div className="parts">
                      <span>Time<b>{l.parts.timeProximity}</b></span><span>Recipe<b>{l.parts.recipeMatch}</b></span><span>Sequence<b>{l.parts.sequenceConsistency}</b></span><span>Scanned id<b>{l.parts.scannedIdAgreement}</b></span><span>Penalty<b>{l.parts.multiCandidatePenalty}</b></span>
                    </div>
                    {l.link_confidence < thr ? <CardActions actions={[
                      { id: "ok", label: "Confirm link", primary: true, allowed: can(role, "confirm-lot-link"), reason: deniedReason("confirm-lot-link", "confirm links"), done: "Link confirmed. Illustrative." },
                      { id: "no", label: "Reject", allowed: can(role, "confirm-lot-link"), reason: deniedReason("confirm-lot-link", "confirm links"), done: "Link rejected. Illustrative." },
                    ]} /> : null}
                  </div>
                );
              })}</div>
            </div>
          </Section>
          <div className="split">
            <Section title={`${prop.name} against spec`} meta={spec.sourceDoc}>
              <Confidence kind="prediction" label={prop.anchored ? "Measured" : "Estimated"} measure={prop.name} unit={prop.unit} low={prop.predicted.low} point={prop.predicted.point} high={prop.predicted.high} spec={[spec.lsl, spec.usl]}
                drivers={["Linked run outcomes", prop.anchored ? "Lab result" : "No lab result yet"]} fit="accepted" method={prop.anchored ? `Anchored to the lab result${lab ? ` of ${dayMonth(lab.at)}` : ""}` : "Unanchored, cannot support a decision"} />
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>{prop.anchored ? <Tag tone="success">Anchored</Tag> : <Tag tone="warning">Unanchored, cannot support a decision</Tag>}{lab ? <span className="muted">Lab {lab.value} {prop.unit} · {dayMonth(lab.at)}</span> : <span className="muted">Waiting for the lab system</span>}</div>
            </Section>
            <Section title={`${gradeOf(lot).name}, last ${same.length} lots`} meta="Predicted point per lot · spec dashed" flush>
              <div className="chart-pad"><RunChart values={series} spec={[spec.lsl, spec.usl]} width={460} height={130} label={`${prop.name} per lot`} highlightFrom={same.findIndex((l) => l.id === lot.id)} /></div>
            </Section>
          </div>
          <Section title="Runs in this lot" flush>
            <DataTable caption="Runs" rowKey={(l) => l.id} rows={links} columns={[
              { key: "r", label: "Run", render: (l) => <Link className="link" href={`/process/runs/${l.runId}`}>{runLabel(D.runs.find((r) => r.id === l.runId)!)}</Link> },
              { key: "e", label: "Ended", mono: true, render: (l) => { const r = D.runs.find((x) => x.id === l.runId)!; return `${dayMonth(r.end)} ${hhmm(r.end)}`; } },
              ...D.runs.find((r) => r.id === links[0]?.runId)!.outcomes.filter((o) => o.unit !== "flag").map((o) => ({ key: o.name, label: o.name, align: "right" as const, render: (l: typeof links[number]) => { const x = D.runs.find((r) => r.id === l.runId)!.outcomes.find((y) => y.name === o.name)!; return <>{x.value} {x.unit} <EvidenceTag label={x.label} /></>; } })),
              { key: "s", label: "Link", render: (l) => <>{l.link_confidence.toFixed(2)} <Tag>{l.status}</Tag></> },
            ]} />
          </Section>
          <Section title={`Other ${gradeOf(lot).name} lots`} meta="Newest first" flush>
            <DataTable caption="Same grade" rowKey={(l) => l.id} rows={same.filter((l) => l.id !== lot.id).reverse().slice(0, 6)} columns={[
              { key: "l", label: "Lot", mono: true, render: (l) => <Link className="link" href={`/quality/lots/${l.id}`}>{lotNo(l.id)}</Link> },
              { key: "r", label: "Risk", render: (l) => <RiskTag risk={l.riskWord} /> },
              { key: "p", label: "Predicted", align: "right", render: (l) => `${propOf(l).predicted.point} ${propOf(l).unit}` },
              { key: "a", label: "Anchor", render: (l) => (propOf(l).anchored ? <Tag tone="success">Lab result</Tag> : <Tag tone="warning">Unanchored</Tag>) },
              { key: "j", label: "Join", render: (l) => <JoinTag label={weakestJoin(l)} /> },
              { key: "s", label: "Status", render: (l) => l.status },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Facts">
            <dl className="facts-grid">
              <dt>Grade</dt><dd>{gradeOf(lot).name}</dd>
              <dt>Spec</dt><dd>{spec.property} {spec.lsl} to {spec.usl} {spec.unit}, target {spec.target}</dd>
              <dt>Source</dt><dd>{spec.sourceDoc}</dd>
              <dt>Stages</dt><dd>{lot.stages.join(", ")}</dd>
              <dt>Status</dt><dd>{lot.status}</dd>
              <dt>Release</dt><dd>In the plant&apos;s quality system only</dd>
            </dl>
          </Section>
          <Section title="Evidence on demand" meta={proof ? <span >{nameOf(proof.id)}</span> : undefined}>
            {proof ? <div className="stack-sm"><div style={{ fontWeight: 600, fontSize: 14 }}>{proof.title}</div>
              <Confidence kind="verdict" label={proof.questions[2].label} verdict={proof.verdict} rung={proof.rung} effect={`${proof.effect.measure} ${proof.effect.value > 0 ? "+" : ""}${proof.effect.value} ${proof.effect.unit}`} interval={`${proof.effect.low} to ${proof.effect.high} ${proof.effect.unit}`} diagnostics={proof.diagnostics} method="Before and after on matched lots" withheldNeeds={proof.withheldNeeds} />
              <Link className="btn btn-sm btn-accent" style={{ alignSelf: "flex-start" }} href={`${base}?evidence=${proof.id}`} scroll={false}>Open the four questions</Link></div>
              : <p className="muted" style={{ margin: 0, fontSize: 13 }}>No proof record for this lot. Records exist once a correction or investigation is measured.</p>}
          </Section>
          <Section title="Corrections to process" flush>
            {corr.length ? <div className="rows">{corr.map((c) => <Link key={c.id} href="/quality/corrections" className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{c.direction} {D.byId.window(c.toLineId, c.param)?.name.toLowerCase()}</span><span className="row-sub">{c.reason}</span></span><Tag tone={c.status === "accepted" ? "success" : c.status === "sent" ? "accent" : "neutral"}>{c.status}</Tag></Link>)}</div>
              : <CardActions actions={[{ id: "c", label: "Send correction to process", allowed: can(role, "send-correction"), reason: deniedReason("send-correction", "send corrections"), done: "Correction sent as a recommendation. Illustrative." }]} />}
          </Section>
          {inv.length ? <Section title="Investigations" flush><div className="rows">{inv.map((i) => <Link key={i.id} href={`/quality/investigations/${i.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{i.title}</span><Tag tone={i.status === "open" ? "info" : "neutral"}>{i.status}</Tag></Link>)}</div></Section> : null}
          <Section title={`Lab results, ${gradeOf(lot).name}`} meta="From the lab system" flush>
            <DataTable caption="Lab results" rowKey={(r) => r.id} rows={D.labResults.filter((r) => D.byId.lot(r.lotId)?.gradeId === lot.gradeId).slice(-6).reverse()} columns={[
              { key: "l", label: "Lot", mono: true, render: (r) => <Link className="link" href={`/quality/lots/${r.lotId}`}>{lotNo(r.lotId)}</Link> },
              { key: "v", label: prop.name, align: "right", render: (r) => `${r.value} ${prop.unit}` },
              { key: "t", label: "At", render: (r) => `${dayMonth(r.at)} ${hhmm(r.at)}` },
            ]} />
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
    </Workspace>
  );
}
