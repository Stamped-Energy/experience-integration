/** Ask, redesigned: one turn model for threads and live questions, the answer as plain prose with numbered sources,
 *  a label-and-band chip, a Sources strip and three follow-ups. The same component renders in the side panel. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { AskThread, EvidenceLabel } from "@/lib/demo/types";
import { dayMonth, rel } from "@/lib/format";
import { EvidenceTag, Tag } from "@/components/ui/primitives";
import { evHref, proofFor } from "./common";
import { HistScroll, SourceMark } from "./AskClient";
import { SequenceMascot } from "@/components/mascot/StampedMascot";
import { nameOf, proposalName, proposalShort } from "@/lib/names";

const ORDER: EvidenceLabel[] = ["Unknown", "Assumed", "Modelled", "Estimated", "Measured"];
export type Source = { id: string; label: EvidenceLabel; what: string; href: string };
export type Turn = {
  q: string;
  lead?: string;
  rest?: { text: string; marks: number[] }[];
  leadMarks?: number[];
  label?: EvidenceLabel; band?: string; why?: string;
  sources?: Source[];
  card?: { id: string; title: string; href: string; state: string };
  abstain?: { text: string; missing: string[]; suggest?: string };
  followUps: string[];
  step?: string;
};

/* ---------- Suggested questions, built from live data ---------- */
export function suggestions(): { q: string; href: string }[] {
  const out: { q: string; href: string }[] = [];
  const d = D.driftSignals[0];
  if (d) { const t = D.askThreads.find((x) => x.objectRef === d.id); out.push({ q: `Why is ${D.byId.line(d.lineId)!.short} ${d.property.toLowerCase()} drifting?`, href: t ? `/ask/${t.id}` : `/ask?q=${encodeURIComponent(d.property)}` }); }
  const risk = D.lots.filter((l) => l.riskWord === "At risk").length;
  if (risk) out.push({ q: "Which lots are at risk today?", href: `/ask?q=${encodeURIComponent("Which lots are at risk today?")}` });
  if (D.inboxItems.some((i) => i.bucket === "waiting")) out.push({ q: "What is waiting for my decision?", href: `/ask?q=${encodeURIComponent("What is waiting for my decision?")}` });
  const tr = D.trials.find((t) => t.status === "running");
  if (tr) out.push({ q: `How is the ${tr.change.split(" ").slice(0, 2).join(" ").toLowerCase()} trial doing?`, href: `/ask?q=${encodeURIComponent(`How is the ${tr.change.split(" ").slice(0, 2).join(" ").toLowerCase()} trial doing?`)}` });
  return out.slice(0, 4);
}
const follow = (except: string, extra: string[] = []) => [...extra, ...suggestions().map((s) => s.q).filter((q) => q !== except)].slice(0, 3);
const weakestOf = (ls: EvidenceLabel[]) => ls.slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0] ?? "Unknown";
const firstSentence = (s: string) => s.split(/(?<=\.)\s/)[0];

/* ---------- Turns from a stored thread ---------- */
export function turnsOf(t: AskThread, base: string): Turn[] {
  const out: Turn[] = [];
  for (let i = 0; i < t.messages.length; i += 2) {
    const q = t.messages[i].text ?? "";
    const m = t.messages[i + 1];
    if (!m) { out.push({ q, followUps: [] }); continue; }
    if (m.abstain) { out.push({ q, abstain: { text: firstSentence(m.abstain), missing: m.abstain.split(/(?<=\.)\s/).slice(1), suggest: suggestions()[1]?.q }, followUps: follow(q) }); continue; }
    const cl = m.claims ?? [];
    const sources: Source[] = [];
    const markOf = (e: string, label: EvidenceLabel) => { let k = sources.findIndex((s) => s.id === e); if (k < 0) { const p = proofFor(e); sources.push({ id: e, label, what: p ? p.title : "Source record", href: evHref(base, e) }); k = sources.length - 1; } return k + 1; };
    const marked = cl.map((c) => ({ text: c.text, marks: c.evidenceIds.map((e) => markOf(e, c.label)) }));
    const p = m.cardRef ? D.byId.proposal(m.cardRef) : undefined;
    const r = m.cardRef ? D.byId.proof(m.cardRef) : undefined;
    const band = t.confidence ? t.confidence.band : p ? `${p.predicted.name} ${p.predicted.low} to ${p.predicted.high} ${p.predicted.unit}` : r ? `${r.effect.low} to ${r.effect.high} ${r.effect.unit}` : undefined;
    out.push({
      q, lead: marked[0]?.text, leadMarks: marked[0]?.marks, rest: marked.slice(1), label: t.confidence?.label ?? weakestOf(cl.map((c) => c.label)), band, sources,
      why: t.confidence ? `Label and band recorded for this answer as a whole, from its ${cl.length} cited claim${cl.length === 1 ? "" : "s"}.` : `The answer takes the weakest label of its ${cl.length} cited claim${cl.length === 1 ? "" : "s"}${band ? `; the band comes from ${p ? "the line model behind the card" : "the proof record"}` : "; none of the evidence carries a band"}.`,
      card: p ? { id: p.id, title: proposalName(p.id), href: `/process/proposals/${p.id}`, state: p.state } : r ? { id: r.id, title: r.title, href: `${base}?evidence=${r.id}`, state: r.verdict } : undefined,
      followUps: follow(t.title, p ? [`What happens if I accept ${proposalShort(p.id)}?`] : r ? ["Is the effect holding?"] : []),
    });
  }
  return out;
}

/* ---------- Live answers for the suggested questions; anything else abstains ---------- */
export function liveTurn(q: string, base: string): Turn {
  const s = q.toLowerCase();
  if (s.includes("lots") && s.includes("risk")) {
    const lots = D.lots.filter((l) => l.riskWord === "At risk");
    const props = lots.map((l) => D.lotProperties.find((p) => p.lotId === l.id)!);
    const sources = lots.map((l, i) => ({ id: l.id, label: (props[i].anchored ? "Measured" : "Modelled") as EvidenceLabel, what: `Lot ${l.id.split("-").pop()} · ${props[i].name} ${props[i].predicted.low} to ${props[i].predicted.high} ${props[i].unit}`, href: `/quality/lots/${l.id}` }));
    const byLine = D.lines.map((ln) => ({ ln, n: lots.filter((l) => l.lineIds[0] === ln.id).length })).filter((x) => x.n);
    return { q, lead: `${lots.length} lots are at risk: ${byLine.map((x) => `${x.n} on ${x.ln.short}`).join(" and ")}.`, leadMarks: sources.map((_, i) => i + 1),
      rest: [{ text: `The predicted ${props[0].name.toLowerCase()} band for each sits near or past the spec limit, and none is anchored by a lab result yet.`, marks: [1, 2] }, { text: "Release stays in the quality system; Stamped only flags them.", marks: [] }],
      label: weakestOf(sources.map((x) => x.label)), band: `${props[0].name} ${props[0].predicted.low} to ${props[0].predicted.high} ${props[0].unit} on lot ${lots[0].id.split("-").pop()}`, why: "Predicted bands are modelled until the lab result arrives, so the answer is labelled Modelled.",
      sources, followUps: follow(q, ["What would bring them back inside spec?"]), step: "Reading lot predictions and specs" };
  }
  if (s.includes("waiting") || s.includes("decision")) {
    const w = D.inboxItems.filter((i) => i.bucket === "waiting");
    const soon = w.slice().sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0];
    const sources = w.map((i) => ({ id: i.ref, label: "Measured" as EvidenceLabel, what: i.title, href: `/inbox/${i.id}` }));
    return { q, lead: `${w.length} decisions are waiting; the first due is "${soon.title}", ${rel(soon.due!)}.`, leadMarks: [w.indexOf(soon) + 1],
      rest: [{ text: `${w.filter((i) => i.kind === "proposal").length} are per-run proposals, one is a trial signature and one is a correction from Quality.`, marks: sources.map((_, i) => i + 1) }],
      label: "Measured", why: "These are records in the inbox, not predictions, so they carry no band.", sources, followUps: follow(q, ["Which of these can wait until next shift?"]), step: "Reading the inbox" };
  }
  if (s.includes("trial")) {
    const tr = D.trials.find((t) => t.status === "running")!;
    const r = D.proofRecords.find((p) => p.objectId === tr.id)!;
    const sources: Source[] = [...new Set(r.questions.flatMap((x) => x.evidenceIds))].map((e) => ({ id: e, label: r.questions.find((x) => x.evidenceIds.includes(e))!.label, what: r.sourceRows.find((x) => x.id === e)?.tag ?? r.title, href: `${base}${base.includes("?") ? "&" : "?"}evidence=${r.id}` }));
    const done = tr.switches.filter((x) => x.done).length;
    return { q, lead: `Too early to call: ${r.effect.measure.toLowerCase()} is ${r.effect.value} ${r.effect.unit} on average, but the band still crosses zero.`, leadMarks: [1],
      rest: [{ text: `${done} of ${tr.switches.length} switches are done.`, marks: [1] }, { text: r.questions[2].answer + ".", marks: [sources.length] }],
      label: weakestOf(r.questions.map((x) => x.label)), band: `${r.effect.low} to ${r.effect.high} ${r.effect.unit}`, why: `Proof record ${nameOf(r.id)}: verdict ${r.verdict}, rung ${r.rung}. The label is the weakest of its four questions.`,
      sources, card: { id: r.id, title: r.title, href: `${base}${base.includes("?") ? "&" : "?"}evidence=${r.id}`, state: r.verdict }, followUps: follow(q, ["When will the trial have enough batches?"]), step: `Reading ${D.byId.line(tr.lineId)!.short} batches` };
  }
  return { q, abstain: { text: "Not enough data to answer.", missing: ["This plant has no records this question needs.", "Ask only answers from plant data it can cite."], suggest: suggestions()[0]?.q }, followUps: follow(q) };
}
export const stepFor = (q: string) => liveTurn(q, "/ask").step ?? "Reading plant data";

/* ---------- Rendering ---------- */
const Marks = ({ ns }: { ns: number[]; open?: string }) => <>{ns.map((n) => <SourceMark key={n} n={n} />)}</>;

export function TurnView({ t, idx, compact }: { t: Turn; idx: number; compact?: boolean }) {
  const anchor = `t${idx}`;
  return (
    <div className="turn" id={anchor}>
      <div className="q-bubble">{t.q}</div>
      <div className="a-row">
      <span className="a-mascot"><SequenceMascot size={compact ? 22 : 28} label="Stamped assistant" steps={t.abstain ? [["thinking", 0.5], ["warning", 0]] : t.lead ? [["thinking", 0.6], ["answering", 2.2], ["success", 0]] : [["thinking", 0]]} /></span>
      {t.abstain ? (
        <div className="a-prose">
          <p className="a-lead">{t.abstain.text}</p>
          <span className="cchip warn"><Tag tone="warning">Abstained</Tag></span>
          {t.abstain.missing.length ? <><p className="muted" style={{ margin: "8px 0 2px" }}>Here is what is missing:</p><ul className="missing">{t.abstain.missing.map((m) => <li key={m}>{m}</li>)}</ul></> : null}
          {t.abstain.suggest ? <p className="muted" style={{ margin: "6px 0 0" }}>Try: <Link prefetch={false} className="link" href={`/ask?q=${encodeURIComponent(t.abstain.suggest)}`}>{t.abstain.suggest}</Link></p> : null}
        </div>
      ) : t.lead ? (
        <div className="a-prose">
          <p className="a-lead">{t.lead}<Marks ns={t.leadMarks ?? []} open="" /></p>
          <details className="cchip"><summary><b>{t.label}</b>{t.band ? <span>, band {t.band}</span> : <span className="muted">, no band</span>}<span className="why-l">Why</span></summary><div className="why-pop">{t.why}</div></details>
          {t.rest?.length ? <p className="a-rest">{t.rest.map((r, i) => <span key={i}>{r.text}<Marks ns={r.marks} open="" />{" "}</span>)}</p> : null}
          {t.card ? <div className="card-row"><span className="label">{t.card.id.startsWith("prop") ? "Card" : "Proof record"}</span><span>{t.card.title}</span><Tag>{t.card.state}</Tag><Link className="link" href={t.card.href} scroll={false}>Open card</Link></div> : null}
          {t.sources?.length ? <details className="src-strip"><summary>{t.sources.length} source{t.sources.length === 1 ? "" : "s"}</summary>
            <ol>{t.sources.map((s, i) => <li key={s.id}><span className="smark">{i + 1}</span><Link className={`link${s.id.startsWith("EV-") ? " mono" : ""}`} href={s.href} scroll={false}>{s.id.startsWith("EV-") ? s.id : nameOf(s.id)}</Link><span className="src-what">{s.what}</span><EvidenceTag label={s.label} /></li>)}</ol></details> : null}
        </div>
      ) : <div className="a-prose"><p className="thinking">{t.step ?? "Reading plant data"}…</p></div>}
      </div>
      {!compact && t.followUps.length ? <div className="followups">{t.followUps.map((f) => <Link key={f} prefetch={false} href={`/ask?q=${encodeURIComponent(f)}`}>{f}</Link>)}</div> : null}
    </div>
  );
}

/* ---------- History: Today, This week, Saved, Notes ---------- */
export function History({ current, filter, base }: { current?: string; filter?: string; base: string }) {
  const now = Date.parse(D.DEMO_NOW);
  const th = D.askThreads.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const today = th.filter((t) => now - Date.parse(t.updatedAt) < 864e5);
  const week = th.filter((t) => now - Date.parse(t.updatedAt) >= 864e5);
  const f = (v?: string) => `${base}${base.includes("?") ? "&" : "?"}${v ? `h=${v}` : ""}`.replace(/[?&]$/, "");
  const item = (t: AskThread) => <Link key={t.id} href={`/ask/${t.id}`} prefetch={false} className={`h-item${t.id === current ? " on" : ""}`}>{t.title}<span>{rel(t.updatedAt)}</span></Link>;
  return (
    <nav className="hist2" aria-label="Ask history">
      <Link className="btn btn-sm h-new" href="/ask" prefetch={false}>New question</Link>
      <div className="h-filters">{[["", "All"], ["saved", "Saved"], ["notes", "Notes"]].map(([v, l]) => <Link key={l} prefetch={false} scroll={false} className={`fchip${(filter ?? "") === v ? " on" : ""}`} href={f(v || undefined)}>{l}</Link>)}</div>
      <HistScroll>
        {(!filter) && <>{today.length ? <><div className="h-group" data-head>Today</div>{today.map(item)}</> : null}{week.length ? <><div className="h-group" data-head>This week</div>{week.map(item)}</> : null}</>}
        {(!filter || filter === "saved") && <><div className="h-group" data-head>Saved</div>{D.savedAnswers.map((s) => <div key={s.id} className="h-item">
          <Link prefetch={false} href={`/ask/saved?id=${s.id}`}>{s.title}</Link>
          <span>{s.stale ? <><Tag tone="warning" title={s.stale.reason}>Stale</Tag> <Link prefetch={false} className="link" href={`/ask?q=${encodeURIComponent(s.title)}`}>Re-run</Link></> : dayMonth(s.at)}</span></div>)}</>}
        {filter === "notes" && <><div className="h-group" data-head>Notes</div>{D.notes.map((n) => <Link key={n.id} prefetch={false} href={`/ask/notes?id=${n.id}`} className="h-item">{n.title}<span>{n.kind} · {dayMonth(n.at)}</span></Link>)}</>}
      </HistScroll>
    </nav>
  );
}
