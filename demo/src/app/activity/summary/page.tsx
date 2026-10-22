import Link from "next/link";
import * as D from "@/lib/demo/data";
import * as A from "@/lib/demo/agent";
import { currentRole } from "@/lib/role";
import { rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ActivityTabs, crumbs } from "@/components/activity/common";
import { IdleList, Learned } from "@/components/agent/blocks";

export const metadata = { title: "Summary" };
const RESULT_TONE = { Verified: "success", Indicative: "neutral", Measuring: "info", Declined: "neutral" } as const;

export default async function Summary({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;
  const role = await currentRole();
  const period = sp.p === "month" ? "month" : "week";
  const s = A.summaries[period];
  const answered = A.questions.filter((q) => q.answered);
  return (
    <Workspace crumbs={crumbs({ label: "Summary" })} askContext="Activity summary">
      <PageHeader eyebrow="Activity" title={period === "week" ? "This week" : "This month"} meta={`${s.label}. What the agent achieved, what people decided and what it will do next. Compared with ${s.prev}.`}
        actions={<div className="seg" role="group" aria-label="Period"><Link href="/activity/summary" aria-current={period === "week" ? "true" : undefined} scroll={false}>Week</Link><Link href="/activity/summary?p=month" aria-current={period === "month" ? "true" : undefined} scroll={false}>Month</Link></div>} />
      <ActivityTabs active="summary" />
      <section className="sum-reason">
        <div className="label">Why the numbers moved <Illustrative /></div>
        <p>{s.reasoning}</p>
        <div className="label" style={{ marginTop: 8 }}>Next, the agent will focus on</div>
        <ol>{s.next.map((n) => <li key={n}>{n}</li>)}</ol>
      </section>
      <div className="stat-row" style={{ margin: "var(--space-5) 0" }}>
        {s.outcomes.map((o) => <div className="stat" key={o.k}><div className="label">{o.k}</div><div className="v">{o.v}</div><div className="s"><EvidenceTag label={o.label} />{o.d}</div></div>)}
      </div>
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Actions and their results" meta={`${s.accepted} accepted · ${s.declined} declined with a reason · ${s.expired} expired`} flush>
            <div className="rows">{s.actions.map((a) => (
              <div key={a.t} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span><span className="row-title" style={{ display: "block" }}>{a.t}</span><span className="row-sub">{a.by} · {a.band}</span></span>
                <Tag tone={RESULT_TONE[a.result as keyof typeof RESULT_TONE]}>{a.result}</Tag>
              </div>))}</div>
          </Section>
          <Section title="Questions answered, and what they changed" meta={`${s.answered} of ${s.questions} answered`} actions={<Link className="link" href="/inbox?tab=questions">Questions</Link>} flush>
            <div className="rows">{answered.map((q) => (
              <div key={q.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                <span><span className="row-title" style={{ display: "block" }}>{q.answered!.changed}</span><span className="row-sub">{q.type} · {q.answered!.person} said "{q.answered!.answer}" · {rel(q.answered!.at)}</span></span>
              </div>))}</div>
          </Section>
          <Section title="What the agent learned" meta={`${s.learnedN} new rules, memories and refits`} flush><Learned /></Section>
        </div>
        <div className="span-4 stack">
          <Section title="Left on the table" meta={`${A.idleProposals.length} undecided`} flush><IdleList rupees={false} role={role} /></Section>
          <Section title="By line" flush>
            <div className="rows">{D.lines.map((l) => <Link key={l.id} className="row" href={`/process/lines/${l.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span>{l.name}</span><span className="muted">{l.kpis[1].label} {l.kpis[1].value}{l.kpis[1].unit ?? ""}</span></Link>)}</div>
          </Section>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>Value at the plant's prices is on the Owner view of Home.</p>
        </div>
      </div>
    </Workspace>
  );
}
