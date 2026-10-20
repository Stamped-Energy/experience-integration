import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { Answer, AskTabs, EvidenceItemSheet, allClaims, citations, crumbs, evHref, proofFor, weakest } from "@/components/ask/common";

export const metadata = { title: "Saved answers" };
/** Stale when cited data changed after the answer was saved: here, when the thread was updated after the save. */
const staleOf = (s: (typeof D.savedAnswers)[number]) => D.askThreads.find((t) => t.id === s.threadId)!.updatedAt > s.at;

export default async function Saved({ searchParams }: { searchParams: Promise<{ id?: string; evidence?: string; ev?: string }> }) {
  const sp = await searchParams;
  const sel = D.savedAnswers.find((s) => s.id === sp.id) ?? D.savedAnswers[0];
  const t = D.askThreads.find((x) => x.id === sel.threadId)!;
  const ans = t.messages.filter((m) => m.from === "stamped").at(-1)!;
  const base = `/ask/saved?id=${sel.id}`;
  return (
    <Workspace crumbs={crumbs({ label: "Saved answers" })} askContext="Saved answers">
      <PageHeader eyebrow="Ask" title="Saved answers" meta="Answers people kept. An answer turns stale when the data it cites changes; open it to see the current evidence." actions={<AskButton context="Saved answers" label="Ask a new question" />} />
      <AskTabs active="saved" />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Saved" meta={`${D.savedAnswers.length} answers`} flush>
            <DataTable caption="Saved answers" rowKey={(s) => s.id} rows={D.savedAnswers} columns={[
              { key: "q", label: "Question", render: (s) => <><Link className="link" href={`/ask/saved?id=${s.id}`} scroll={false} style={s.id === sel.id ? { fontWeight: 600 } : undefined}>{s.title}</Link><span className="cell-sub">{D.askThreads.find((t) => t.id === s.threadId)!.messages[0].text}</span></> },
              { key: "b", label: "Saved by", render: (s) => s.savedBy },
              { key: "d", label: "Saved", render: (s) => dayMonth(s.at) },
              { key: "l", label: "Label", render: (s) => <EvidenceTag label={weakest(allClaims(D.askThreads.find((t) => t.id === s.threadId)!))} /> },
              { key: "c", label: "Cites", align: "right", render: (s) => citations(allClaims(D.askThreads.find((t) => t.id === s.threadId)!)).length },
              { key: "s", label: "State", render: (s) => (staleOf(s) ? <Tag tone="warning">Stale</Tag> : <Tag tone="success">Still current</Tag>) },
            ]} />
          </Section>
          <Section title="Conversations not saved" flush>
            <DataTable caption="Threads" rowKey={(t) => t.id} rows={D.askThreads.filter((t) => !D.savedAnswers.some((s) => s.threadId === t.id))} columns={[
              { key: "t", label: "Conversation", render: (t) => <Link className="link" href={`/ask/${t.id}`}>{t.title}</Link> },
              { key: "u", label: "Updated", render: (t) => rel(t.updatedAt) },
              { key: "a", label: "Answer", render: (t) => { const m = t.messages.at(-1)!; return m.abstain ? <Tag tone="warning">Abstained</Tag> : <EvidenceTag label={weakest(m.claims ?? [])} />; } },
            ]} />
          </Section>
          <Section title="Evidence these answers rest on" meta="If any of it changes, the answer turns stale" flush>
            <DataTable caption="Evidence" rowKey={(r) => r.s + r.id} rows={D.savedAnswers.flatMap((s) => citations(allClaims(D.askThreads.find((t) => t.id === s.threadId)!)).map((c) => ({ ...c, s: s.title, sid: s.id })))} columns={[
              { key: "i", label: "Id", mono: true, render: (r) => <Link className="link" href={evHref(`/ask/saved?id=${r.sid}`, r.id)} scroll={false}>{r.id}</Link> },
              { key: "l", label: "Label", render: (r) => <EvidenceTag label={r.label} /> },
              { key: "c", label: "Claim", render: (r) => r.texts[0] },
              { key: "s", label: "Saved answer", render: (r) => r.s },
              { key: "p", label: "Proof", mono: true, render: (r) => proofFor(r.id)?.id ?? "source" },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title={sel.title} meta={sel.savedBy} actions={staleOf(sel) ? <Tag tone="warning">Stale</Tag> : <Tag tone="success">Still current</Tag>}>
            <div className="turn-person" style={{ marginBottom: 12, maxWidth: "100%" }}>{t.messages[0].text}</div>
            <Answer claims={ans.claims} abstain={ans.abstain} cardRef={ans.cardRef} base={base} />
            <div className="panel-open" style={{ marginTop: 12 }}><Link className="btn btn-sm" href={`/ask/${t.id}`}>Open in Ask</Link></div>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
      {sp.ev ? <EvidenceItemSheet id={sp.ev} closeHref={base} /> : null}
    </Workspace>
  );
}
