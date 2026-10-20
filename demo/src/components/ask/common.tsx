/** Ask area: tabs, evidence chips, answers with label and band only, abstain notes, sources and the evidence lookup. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { AskClaim, AskThread, EvidenceLabel } from "@/lib/demo/types";
import type { Crumb } from "@/components/shell/Shell";
import { Confidence } from "@/components/ui/Confidence";
import { EvidenceTag, Tabs, Tag } from "@/components/ui/primitives";

export type AskTab = "threads" | "saved" | "notes";
export function AskTabs({ active }: { active: AskTab }) {
  return <Tabs label="Ask" items={[
    { href: "/ask", label: "Conversations", count: D.askThreads.length, active: active === "threads" },
    { href: "/ask/saved", label: "Saved answers", count: D.savedAnswers.length, active: active === "saved" },
    { href: "/ask/notes", label: "Handover and weekly note", count: D.notes.length, active: active === "notes" },
  ]} />;
}
export const crumbs = (...rest: Crumb[]): Crumb[] => [{ label: "Demonstration plant", href: "/" }, { label: "Ask", href: "/ask" }, ...rest];

const ORDER: EvidenceLabel[] = ["Unknown", "Assumed", "Modelled", "Estimated", "Measured"];
/** An answer carries the weakest label among its claims; never an overall percentage. */
export const weakest = (claims: AskClaim[]): EvidenceLabel => claims.map((c) => c.label).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0] ?? "Unknown";

/** A proof record that cites this evidence id, if any; the evidence panel opens on it. */
export const proofFor = (ev: string) => D.proofRecords.find((p) => p.questions.some((q) => q.evidenceIds.includes(ev)));
export const evHref = (base: string, ev: string) => { const p = proofFor(ev); const sep = base.includes("?") ? "&" : "?"; return p ? `${base}${sep}evidence=${p.id}` : `${base}${sep}ev=${ev}`; };

export function EvidenceChip({ id, label, base }: { id: string; label: EvidenceLabel; base: string }) {
  return <Link className="ev-chip" href={evHref(base, id)} scroll={false} title="Open evidence"><span className="mono">{id}</span><EvidenceTag label={label} /></Link>;
}

export function AbstainNote({ text }: { text: string }) {
  return <div className="abstain" role="note"><Tag tone="warning">Abstained</Tag><span>{text}</span></div>;
}

const objName = (ref?: string) => {
  if (!ref) return undefined;
  const d = D.driftSignals.find((x) => x.id === ref); if (d) return { name: `${d.property} drift, ${D.byId.line(d.lineId)!.short}`, href: "/quality/drift" };
  const p = D.proposals.find((x) => x.id === ref); if (p) return { name: `Proposal ${p.id}`, href: `/process/proposals/${p.id}` };
  const l = D.lots.find((x) => x.id === ref); if (l) return { name: `Lot ${l.id.split("-").pop()}`, href: `/quality/lots/${l.id}` };
  return { name: ref, href: undefined };
};
export const contextOf = (t: AskThread) => objName(t.objectRef) ?? (t.messages.find((m) => m.cardRef) ? objName(t.messages.find((m) => m.cardRef)!.cardRef) : undefined);

/** Inline card from the allow-list: a proposal (read-only, with its predicted band) or a proof record. */
export function AllowedCard({ refId, base }: { refId: string; base: string }) {
  const p = D.proposals.find((x) => x.id === refId);
  if (p) return (
    <div className="ask-card">
      <div className="ask-card-head"><span className="label">Card, read-only</span><Link className="link" href={`/process/proposals/${p.id}`}>{p.id}</Link><Tag tone="accent">{p.state}</Tag></div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.param}: {p.current} to {p.proposed}</div>
      <Confidence kind="prediction" label={p.weakestLabel} measure={p.predicted.name} unit={p.predicted.unit} low={p.predicted.low} point={p.predicted.point} high={p.predicted.high} spec={p.predicted.spec} drivers={p.drivers} fit={p.fitState} method="Line model; band only, no single percentage" evidenceIds={p.evidenceIds} />
    </div>
  );
  const r = D.proofRecords.find((x) => x.id === refId);
  if (r) return (
    <div className="ask-card">
      <div className="ask-card-head"><span className="label">Proof record</span><span className="mono">{r.id}</span><Link className="link" href={`${base}${base.includes("?") ? "&" : "?"}evidence=${r.id}`} scroll={false}>Open evidence</Link></div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
      <Confidence kind="verdict" label={r.questions[2].label} verdict={r.verdict} rung={r.rung} effect={`${r.effect.measure} ${r.effect.value > 0 ? "+" : ""}${r.effect.value} ${r.effect.unit}`} interval={`${r.effect.low} to ${r.effect.high} ${r.effect.unit}`} diagnostics={r.diagnostics} method="Proof record" withheldNeeds={r.withheldNeeds} />
    </div>
  );
  return null;
}

/** One answer: label and band only, then each claim with its evidence chips. */
export function Answer({ claims, abstain, cardRef, base, compact }: { claims?: AskClaim[]; abstain?: string; cardRef?: string; base: string; compact?: boolean }) {
  if (abstain) return <AbstainNote text={abstain} />;
  const cs = claims ?? [];
  return (
    <div className="answer">
      <Confidence kind="label" label={weakest(cs)} note={`Weakest of ${cs.length} cited claim${cs.length === 1 ? "" : "s"}`} method="Each claim carries the label of its evidence; the answer takes the weakest. Uncited numbers are removed before an answer is shown." evidenceIds={cs.flatMap((c) => c.evidenceIds)} />
      <ol className="claims">{cs.map((c) => <li key={c.text}><span>{c.text}</span><span className="claim-ev">{c.evidenceIds.map((e) => <EvidenceChip key={e} id={e} label={c.label} base={base} />)}</span></li>)}</ol>
      {cardRef && !compact ? <AllowedCard refId={cardRef} base={base} /> : null}
    </div>
  );
}

/** Every evidence id cited in a set of claims, with label, how many claims cite it and the proof record behind it. */
export function citations(claims: AskClaim[]) {
  const m = new Map<string, { id: string; label: EvidenceLabel; n: number; texts: string[] }>();
  for (const c of claims) for (const e of c.evidenceIds) { const x = m.get(e) ?? { id: e, label: c.label, n: 0, texts: [] }; x.n++; x.texts.push(c.text); m.set(e, x); }
  return [...m.values()];
}
export const allClaims = (t: AskThread) => t.messages.flatMap((m) => m.claims ?? []);

/** Light evidence sheet for an id with no proof record: what cites it, across Ask, notes, proposals and investigations. */
export function EvidenceItemSheet({ id, closeHref }: { id: string; closeHref: string }) {
  const claims = [...D.askThreads.flatMap((t) => allClaims(t).map((c) => ({ c, where: t.title, href: `/ask/${t.id}` }))), ...D.notes.flatMap((n) => n.claims.map((c) => ({ c, where: n.title, href: `/ask/notes?id=${n.id}` })))].filter((x) => x.c.evidenceIds.includes(id));
  const props = D.proposals.filter((p) => p.evidenceIds.includes(id));
  const inv = D.investigations.flatMap((i) => i.entries.filter((e) => e.evidenceIds.includes(id)).map((e) => ({ e, i })));
  return (
    <>
      <Link className="ev-scrim" href={closeHref} scroll={false} aria-label="Close evidence" />
      <aside className="ev-sheet" aria-label={`Evidence ${id}`}>
        <div className="ev-head"><div><div className="label">Evidence</div><h2 className="mono" style={{ margin: 0, fontSize: 18 }}>{id}</h2></div><Link className="btn btn-sm" href={closeHref} scroll={false}>Close</Link></div>
        <div className="ev-body">
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>No proof record cites this id. It is a source record: a reading, a lab result or a log entry, labelled where it is used.</p>
          <div className="stack-sm">
            <span className="label">Cited by claims</span>
            {claims.map((x) => <div key={x.where + x.c.text} className="ask-claim"><span>{x.c.text}</span><span className="meta"><EvidenceTag label={x.c.label} /><Link className="link" href={x.href}>{x.where}</Link></span></div>)}
          </div>
          {props.length ? <div className="stack-sm"><span className="label">Cited by proposals</span>{props.map((p) => <Link key={p.id} className="link" href={`/process/proposals/${p.id}`}>{p.id}: {p.param} {p.current} to {p.proposed}</Link>)}</div> : null}
          {inv.length ? <div className="stack-sm"><span className="label">In investigations</span>{inv.map(({ e, i }) => <div key={i.id + e.at} className="ask-claim"><span>{e.text}</span><span className="meta"><EvidenceTag label={e.label} /><Link className="link" href={`/quality/investigations/${i.id}`}>{i.title}</Link></span></div>)}</div> : null}
        </div>
      </aside>
    </>
  );
}
