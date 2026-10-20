/** Full Ask conversation: history, the thread with cited answers, and the sources panel. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { AskThread } from "@/lib/demo/types";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { AbstainNote, Answer, AskTabs, EvidenceItemSheet, allClaims, citations, contextOf, crumbs, evHref, proofFor, StaleTag, noPrice } from "./common";

export function ThreadView({ t, q, evidence, ev }: { t: AskThread; q?: string; evidence?: string; ev?: string }) {
  const base = `/ask/${t.id}`;
  const cites = citations(allClaims(t));
  const ctx = contextOf(t);
  const proofs = [...new Set(cites.map((c) => proofFor(c.id)?.id).filter(Boolean))] as string[];
  return (
    <Workspace crumbs={crumbs({ label: t.title })} askContext={t.title}>
      <PageHeader eyebrow="Ask" title={t.title} meta={<>Ask reads only. Every claim cites its evidence; answers show a label, and a band where the evidence has one. {ctx ? <>About: {ctx.href ? <Link className="link" href={ctx.href}>{ctx.name}</Link> : ctx.name}</> : null}</>} />
      <AskTabs active="threads" />
      <div className="grid">
        <div className="span-3 stack">
          <Section title="Conversations" flush>
            <div className="rows hist">{D.askThreads.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((x) => {
              const last = x.messages.at(-1)!;
              return <Link key={x.id} href={`/ask/${x.id}`} className={`row${x.id === t.id ? " on" : ""}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{x.title}</span><span className="row-sub">{rel(x.updatedAt)} · {last.abstain ? "abstained" : `${(last.claims ?? []).length} cited claims`}</span></span>{last.abstain ? <Tag tone="warning">Abstained</Tag> : <EvidenceTag label={(last.claims ?? [])[0]?.label ?? "Unknown"} />}</Link>;
            })}</div>
          </Section>
          <Section title="Suggested">
            <div className="qchips">{D.suggestedQuestions.map((s) => <Link key={s} prefetch={false} href={`${base}?q=${encodeURIComponent(s)}`}>{s}</Link>)}</div>
          </Section>
          <Section title="Saved answers" flush actions={<Link className="link" href="/ask/saved">All</Link>}>
            <div className="rows">{D.savedAnswers.slice(0, 5).map((s) => <Link key={s.id} href={`/ask/saved?id=${s.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{s.title}</span><span className="row-sub">{s.lineId ? D.byId.line(s.lineId)?.short : "Plant-wide"}{s.topic ? ` · ${s.topic}` : ""} · {dayMonth(s.at)}</span></span>{s.stale ? <Tag tone="warning">Stale</Tag> : null}</Link>)}</div>
          </Section>
        </div>
        <div className="span-6 stack">
          <Section title="Conversation" meta={`Updated ${rel(t.updatedAt)}`} flush>
            <div className="convo">
              {t.messages.map((m, i) => m.from === "person"
                ? <div key={i} className="turn-person">{m.text}</div>
                : <div key={i}><div className="turn-who">Stamped</div><Answer claims={m.claims} abstain={m.abstain} cardRef={m.cardRef} base={base} /></div>)}
              {q ? <><div className="turn-person">{q}</div><div><div className="turn-who">Stamped</div><AbstainNote text={`I can't answer that: the data this question needs is not available in the demonstration plant. Try a suggested question or open a saved answer.`} /></div></> : null}
            </div>
            <form className="composer" action={base}>
              <div className="row-in"><input name="q" autoComplete="off" placeholder="Ask about a line, lot or change" aria-label="Question" /><button className="btn btn-primary btn-sm" type="submit">Ask</button></div>
              <span className="muted" style={{ fontSize: 12 }}>Ask reads only. It cannot change a setting, and it says so when it does not know.</span>
            </form>
          </Section>
          <Section title="Saved from this conversation" meta="Saved answers keep their own state" flush>
            {D.savedAnswers.filter((s) => s.threadId === t.id).length ? <div className="rows">{D.savedAnswers.filter((s) => s.threadId === t.id).map((s) => <Link key={s.id} className="row" href={`/ask/saved?id=${s.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{s.title}</span><span className="row-sub">{s.savedBy} · {dayMonth(s.at)}{s.confidence?.band ? ` · band ${s.confidence.band}` : ""}{s.stale ? ` · ${s.stale.reason}` : ""}</span></span><StaleTag s={s} /></Link>)}</div> : <p className="muted" style={{ margin: 16, fontSize: 13 }}>Nobody has saved an answer from this conversation.</p>}
          </Section>
          <Section title="Same evidence elsewhere" meta="Other answers, notes and cards citing these ids" flush>
            <DataTable caption="Related" rowKey={(r) => r.k} rows={[
              ...D.askThreads.filter((x) => x.id !== t.id).flatMap((x) => allClaims(x).filter((c) => c.evidenceIds.some((e) => cites.some((y) => y.id === e))).map((c) => ({ k: x.id + c.text, where: x.title, href: `/ask/${x.id}`, text: c.text, label: c.label, kind: "Answer" }))),
              ...D.notes.flatMap((n) => n.claims.filter((c) => c.evidenceIds.some((e) => cites.some((y) => y.id === e))).map((c) => ({ k: n.id + c.text, where: n.title, href: `/ask/notes?id=${n.id}`, text: c.text, label: c.label, kind: "Note" }))),
              ...D.investigations.flatMap((i) => i.entries.filter((e) => e.evidenceIds.some((x) => cites.some((y) => y.id === x))).map((e) => ({ k: i.id + e.at, where: i.title, href: `/quality/investigations/${i.id}`, text: e.text, label: e.label, kind: "Investigation" }))),
            ]} columns={[
              { key: "k", label: "Kind", render: (r) => <Tag>{r.kind}</Tag> },
              { key: "t", label: "Claim", render: (r) => noPrice(r.text) },
              { key: "l", label: "Label", render: (r) => <EvidenceTag label={r.label} /> },
              { key: "w", label: "Where", render: (r) => <Link className="link" href={r.href}>{r.where}</Link> },
            ]} />
          </Section>
        </div>
        <div className="span-3 stack ctx">
          {ctx ? <Section title="In context" meta="Object this thread is about"><div style={{ fontSize: 14, fontWeight: 600 }}>{ctx.href ? <Link className="link" href={ctx.href}>{ctx.name}</Link> : ctx.name}</div>
            {t.objectRef && D.driftSignals.find((d) => d.id === t.objectRef) ? (() => { const d = D.driftSignals.find((x) => x.id === t.objectRef)!; return <dl className="facts-grid" style={{ marginTop: 8 }}><dt>Change</dt><dd>{d.magnitude}</dd><dt>Since</dt><dd>{dayMonth(d.startedAt)}</dd><dt>Label</dt><dd><EvidenceTag label={d.label} /></dd></dl>; })() : null}
          </Section> : null}
          <Section title="Sources" meta={`${cites.length} evidence ids cited`} flush>
            {cites.length ? <DataTable caption="Sources" rowKey={(c) => c.id} rows={cites} columns={[
              { key: "i", label: "Id", mono: true, render: (c) => <Link className="link" href={evHref(base, c.id)} scroll={false}>{c.id}</Link> },
              { key: "l", label: "Label", render: (c) => <EvidenceTag label={c.label} /> },
              { key: "p", label: "Proof", render: (c) => proofFor(c.id)?.id ?? <span className="muted">source</span> },
            ]} /> : <p className="muted" style={{ fontSize: 13, margin: 16 }}>No claims, so nothing is cited.</p>}
          </Section>
          {proofs.length ? <Section title="Proof records behind this answer" flush>
            <div className="rows">{proofs.map((id) => { const r = D.proofRecords.find((p) => p.id === id)!; return <Link key={id} className="row" href={`${base}?evidence=${id}`} scroll={false} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{r.title}</span><span className="row-sub mono">{r.id}</span></span><Tag>{r.verdict}</Tag></Link>; })}</div>
          </Section> : null}
          <Section title="What Ask will not do">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>Change a setting or approve a card</li>
              <li>Show a number it cannot cite</li>
              <li>Give an overall confidence percentage</li>
            </ul>
            <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>Last answer {dayMonth(t.updatedAt)} {hhmm(t.updatedAt)}.</p>
          </Section>
        </div>
      </div>
      {evidence ? <EvidenceSheet proofId={evidence} closeHref={base} /> : null}
      {ev ? <EvidenceItemSheet id={ev} closeHref={base} /> : null}
    </Workspace>
  );
}
