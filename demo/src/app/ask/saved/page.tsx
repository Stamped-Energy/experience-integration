import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { Answer, AskTabs, EvidenceItemSheet, FilterBar, allClaims, citations, crumbs, evHref, lineShort, matches, proofFor, refHref, StaleTag } from "@/components/ask/common";

export const metadata = { title: "Saved answers" };
type SP = { id?: string; line?: string; topic?: string; state?: string; evidence?: string; ev?: string };


export default async function Saved({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const rows = D.savedAnswers.filter((s) => matches(s, sp.line, sp.topic) && (!sp.state || (sp.state === "stale" ? !!s.stale : !s.stale)));
  const sel = D.savedAnswers.find((s) => s.id === sp.id) ?? rows[0] ?? D.savedAnswers[0];
  const t = D.askThreads.find((x) => x.id === sel.threadId)!;
  const ans = t.messages.filter((m) => m.from === "stamped").at(-1)!;
  const keep = new URLSearchParams(Object.entries({ line: sp.line, topic: sp.topic, state: sp.state }).filter(([, v]) => v) as [string, string][]).toString();
  const hrefFor = (id: string) => `/ask/saved?${keep ? keep + "&" : ""}id=${id}`;
  const base = hrefFor(sel.id);
  const groups = [...D.lines.map((l) => l.id), undefined].map((l) => ({ l, rows: rows.filter((r) => r.lineId === l) })).filter((g) => g.rows.length);
  const stale = D.savedAnswers.filter((s) => s.stale);
  return (
    <Workspace crumbs={crumbs({ label: "Saved answers" })} askContext="Saved answers">
      <PageHeader eyebrow="Ask" title="Saved answers" meta="Answers people kept. An answer turns stale when the data it cites changes; the reason and date are shown." actions={<AskButton context="Saved answers" label="Ask a new question" />} />
      <AskTabs active="saved" />
      <FilterBar base="/ask/saved" line={sp.line} topic={sp.topic} extra={<><span className="label" style={{ marginLeft: 12 }}>State</span>{[undefined, "current", "stale"].map((s) => { const p = new URLSearchParams(Object.entries({ line: sp.line, topic: sp.topic, state: s }).filter(([, v]) => v) as [string, string][]).toString(); return <Link key={s ?? "all"} scroll={false} className={`fchip${sp.state === s ? " on" : ""}`} href={p ? `/ask/saved?${p}` : "/ask/saved"}>{s ? (s === "stale" ? "Stale" : "Still current") : "All"}</Link>; })}</>} />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Saved" meta={`${rows.length} of ${D.savedAnswers.length} · grouped by line`} flush>
            {groups.map((g) => (
              <div key={g.l ?? "plant"}>
                <div className="group-h">{lineShort(g.l)} · {g.rows.length}</div>
                <DataTable caption={`Saved answers, ${lineShort(g.l)}`} rowKey={(s) => s.id} rows={g.rows} columns={[
                  { key: "q", label: "Question", render: (s) => <><Link className="link" href={hrefFor(s.id)} scroll={false} style={s.id === sel.id ? { fontWeight: 600 } : undefined}>{s.title}</Link><span className="cell-sub">{s.summary}</span></> },
                  { key: "t", label: "Topic", render: (s) => s.topic ?? "" },
                  { key: "b", label: "Saved by", render: (s) => <>{s.savedBy}<span className="cell-sub">{dayMonth(s.at)}</span></> },
                  { key: "c", label: "Confidence", render: (s) => s.confidence ? <><EvidenceTag label={s.confidence.label} />{s.confidence.band ? <span className="cell-sub">{s.confidence.band}</span> : null}</> : null },
                  { key: "s", label: "State", render: (s) => <StaleTag s={s} /> },
                ]} />
              </div>
            ))}
            {!rows.length ? <p className="muted" style={{ margin: 16, fontSize: 13 }}>No saved answers match these filters.</p> : null}
          </Section>
          <div className="split">
            <Section title="Went stale" meta="Why, and since when" flush>
              <div className="rows">{stale.map((s) => <Link key={s.id} className="row" href={hrefFor(s.id)} scroll={false} style={{ gridTemplateColumns: "minmax(0,1fr)" }}><span><span className="row-title" style={{ display: "block" }}>{s.title} · since {dayMonth(s.stale!.since)}</span><span className="row-sub">{s.stale!.reason}</span></span></Link>)}</div>
            </Section>
            <Section title="By line and topic" flush>
              <DataTable caption="Counts" rowKey={(r) => r.k} rows={[...D.lines.map((l) => l.id), undefined].flatMap((l) => (["Process", "Quality"] as const).map((tp) => ({ k: `${l}-${tp}`, l, tp, n: D.savedAnswers.filter((s) => s.lineId === l && s.topic === tp) }))).filter((r) => r.n.length)} columns={[
                { key: "l", label: "Line", render: (r) => <Link className="link" href={`/ask/saved?${r.l ? `line=${r.l}&` : ""}topic=${r.tp}`}>{lineShort(r.l)}</Link> },
                { key: "t", label: "Topic", render: (r) => r.tp },
                { key: "n", label: "Saved", align: "right", render: (r) => r.n.length },
                { key: "s", label: "Stale", align: "right", render: (r) => r.n.filter((s) => s.stale).length },
              ]} />
            </Section>
          </div>
          <Section title="Evidence the thread behind each answer cites" flush>
            <DataTable caption="Evidence" rowKey={(r) => r.sid + r.id} rows={rows.flatMap((s) => citations(allClaims(D.askThreads.find((x) => x.id === s.threadId)!)).map((c) => ({ ...c, s: s.title, sid: s.id })))} columns={[
              { key: "i", label: "Id", mono: true, render: (r) => <Link className="link" href={evHref(hrefFor(r.sid), r.id)} scroll={false}>{r.id}</Link> },
              { key: "l", label: "Label", render: (r) => <EvidenceTag label={r.label} /> },
              { key: "c", label: "Claim", render: (r) => r.texts[0] },
              { key: "s", label: "Saved answer", render: (r) => r.s },
              { key: "p", label: "Proof", mono: true, render: (r) => proofFor(r.id)?.id ?? "source" },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title={sel.title} meta={`${sel.savedBy} · ${lineShort(sel.lineId)}${sel.topic ? ` · ${sel.topic}` : ""}`} actions={<StaleTag s={sel} />}>
            <div className="stack-sm">
              {sel.stale ? <div className="stale-note" role="note"><b>Stale since {dayMonth(sel.stale.since)} ({rel(sel.stale.since)})</b><span>{sel.stale.reason}</span></div> : null}
              {sel.summary ? <p style={{ margin: 0, fontSize: 14 }}>{sel.summary}</p> : null}
              {sel.confidence ? <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><EvidenceTag label={sel.confidence.label} />{sel.confidence.band ? <span>Band {sel.confidence.band}</span> : null}</div> : null}
              {sel.refs?.length ? <div className="refs">{sel.refs.map((r) => { const h = r.startsWith("proof-") ? `${base}&evidence=${r}` : refHref(r); return h ? <Link key={r} href={h} scroll={false}>{r}</Link> : <span key={r}>{r}</span>; })}</div> : null}
              <span className="label" style={{ marginTop: 8 }}>Answer as saved, from the thread</span>
              <div className="turn-person" style={{ maxWidth: "100%" }}>{t.messages[0].text}</div>
              <Answer claims={ans.claims} abstain={ans.abstain} cardRef={ans.cardRef} base={base} />
              <div className="panel-open"><Link className="btn btn-sm" href={`/ask/${t.id}`}>Open in Ask</Link><span className="muted" style={{ fontSize: 12 }}>Saved {dayMonth(sel.at)}</span></div>
            </div>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
      {sp.ev ? <EvidenceItemSheet id={sp.ev} closeHref={base} /> : null}
    </Workspace>
  );
}
