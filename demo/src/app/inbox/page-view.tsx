"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { EmptyState, PageHeader, Section, Tabs, Tag } from "@/components/ui/primitives";
import { InboxCard } from "@/components/inbox/InboxCard";
import { DeskDayList } from "@/components/desk/desk-day";
import { deskToday } from "@/lib/demo/desk";
import * as A from "@/lib/demo/agent";
import { Assign } from "@/components/agent/Assign";
import { QuestionCard, type QView } from "@/components/agent/QuestionCard";
import { dayMonth, hhmm } from "@/lib/format";
import type { RoleId } from "@/lib/demo/types";

const TABS = [{ id: "waiting", label: "Waiting for me" }, { id: "task", label: "Tasks" }, { id: "decided", label: "Decided" }, { id: "questions", label: "Questions" }] as const;
const KIND: Record<string, string> = { proposal: "Proposal", "trial-signature": "Trial signature", "lot-link": "Lot link", "data-gap": "Data gap", correction: "Correction", "lot-risk": "Lot at risk" };

export default function Inbox() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const role = demoRole();
  const tab = (TABS.some((t) => t.id === sp.tab) ? sp.tab : "waiting") as (typeof TABS)[number]["id"];
  const heading = TABS.find((t) => t.id === tab)!;
  const me = A.ME[role];
  const canAssign = A.ASSIGNERS.includes(role);
  const tabs = <Tabs label="Inbox" items={TABS.map((t) => ({ href: `/inbox?tab=${t.id}`, label: t.label, count: t.id === "questions" ? qCount(role) : D.inboxItems.filter((i) => i.bucket === t.id).length, active: t.id === tab }))} />;
  if (tab === "questions") return <Questions role={role} tabs={tabs} filter={sp.q} />;
  const all = D.inboxItems.filter((i) => i.bucket === tab);
  const items = sp.mine ? all.filter((i) => me && A.assigned[i.id]?.to === me) : all;
  const mine = items.filter((i) => i.owner === role);
  const ordered = [...mine, ...items.filter((i) => i.owner !== role)];
  const [first, ...rest] = ordered;
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Inbox" }, { label: heading.label }]} askContext="Inbox">
      <PageHeader eyebrow="Inbox" title={heading.label} meta={`${mine.length} of ${items.length} ${mine.length === 1 ? "is" : "are"} for the ${D.byId.role(role).name.toLowerCase()}. Each one names an owner, a due time and the proof.`} />
      {tabs}
      {me ? <div className="chips filter-row" role="group" aria-label="Filter"><Link className={`chip${sp.mine ? "" : " on"}`} href={`/inbox?tab=${tab}`} scroll={false}>Everything</Link><Link className={`chip${sp.mine ? " on" : ""}`} href={`/inbox?tab=${tab}&mine=1`} scroll={false}>Assigned to me <span className="cnt">{all.filter((i) => A.assigned[i.id]?.to === me).length}</span></Link></div> : null}
      <div className="grid">
        <div className="span-8 stack-sm">
          {first ? <div className="stack-sm"><InboxCard item={first} role={role} /><div className="assign-bar"><span className="label">Assignee</span><Assign initial={A.assigned[first.id]} people={A.PEOPLE} canAssign={canAssign} by={me ?? "Plant head A."} />{canAssign ? null : <span className="muted" style={{ fontSize: 12 }}>Shift lead, process engineer, quality head or plant head can assign</span>}</div></div> : <EmptyState title="Nothing here" body="Items arrive here when an agent needs a person." />}
          {rest.length ? (
            <Section title="Also in this list" meta={`${rest.length} items`} flush>
              <div className="rows">
                {rest.map((i) => (
                  <Link key={i.id} href={`/inbox/${i.id}`} className="row" style={{ gridTemplateColumns: "120px minmax(0,1fr) 170px 64px" }}>
                    <Tag>{KIND[i.kind]}</Tag>
                    <span style={{ minWidth: 0 }}>
                      <span className="row-title" style={{ display: "block" }}>{i.title}</span>
                      {i.bucket === "waiting" && i.due ? <span className="row-sub">expires {rel(i.due)}, then nothing changes</span> : i.due ? <span className="row-sub">due {rel(i.due)}</span> : null}
                    </span>
                    <span className="secondary" style={{ fontSize: 12 }}>{D.byId.role(i.owner).name}{i.owner === role ? " (you)" : ""}{A.assigned[i.id] ? <span className="cell-sub">Assigned to {A.assigned[i.id].to}</span> : null}</span>
                    <span className="link" style={{ fontSize: 13, textAlign: "right" }}>Open</span>
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}
          <Section title="How decisions work" meta="The same for every card">
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13 }} className="secondary">
              <li>Stamped works inside limits set beforehand. Every number sits inside a signed band.</li>
              <li>Accept, adjust in band, or decline with a reason. Declines teach the agent.</li>
              <li>Stop always says what it will do before you press it.</li>
              <li>Releasing a hold happens in your quality system, not here.</li>
            </ul>
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="My day" meta="Beside the decision card, not instead of it">
            <DeskDayList items={deskToday} />
          </Section>
          <Section title="By owner" meta="Routing from Settings" flush>
            <div className="rows">
              {D.roles.filter((r) => D.inboxItems.some((i) => i.owner === r.id && i.bucket !== "decided")).map((r) => {
                const n = D.inboxItems.filter((i) => i.owner === r.id && i.bucket !== "decided").length;
                return <div key={r.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span>{r.name}{r.id === role ? " (you)" : ""}</span><span className="mono">{n}</span></div>;
              })}
            </div>
          </Section>
          <Section title="Decided recently" flush>
            <div className="rows">{D.inboxItems.filter((i) => i.bucket === "decided").slice(0, 4).map((i) => <Link key={i.id} href={`/inbox/${i.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title" style={{ fontWeight: 400 }}>{i.title}</span><Tag>{D.byId.proposal(i.ref)?.state ?? "Done"}</Tag></Link>)}</div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}

function qCount(role: RoleId) { const v = A.questionsFor(role); return [...v.mine, ...v.wide].filter((q) => !q.answered).length; }

function view(q: A.Question): QView {
  return { q, owner: D.byId.role(q.routedTo).name, line: q.lineId ? D.byId.line(q.lineId)?.short : undefined, asked: rel(q.askedAt), due: q.due ? rel(q.due) : undefined, answeredAt: q.answered ? `${dayMonth(q.answered.at)} ${hhmm(q.answered.at)}` : undefined };
}

function Questions({ role, tabs, filter }: { role: RoleId; tabs: React.ReactNode; filter?: string }) {
  const { mine, wide, held } = A.questionsFor(role);
  const worker = A.WORKER_ROLES.includes(role) || role === "stamped-engineer";
  const me = A.ME[role] ?? "Plant head A.";
  const canAssign = A.ASSIGNERS.includes(role);
  const list = filter === "wide" ? wide : filter === "answered" ? [...mine, ...wide].filter((q) => q.answered) : filter === "assigned" ? [...mine, ...wide].filter((q) => A.assigned[q.id]?.to === me) : mine.filter((q) => !q.answered);
  const showWideBelow = !filter && role !== "operator";
  const openWide = wide.filter((q) => !q.answered);
  const card = (q: A.Question) => <QuestionCard key={q.id} v={view(q)} canAnswer={q.routedTo === role || (q.plantWide && role !== "operator" && role !== "stamped-engineer")} canAssign={canAssign} me={me} people={A.PEOPLE} assignee={A.assigned[q.id]} />;
  const chip = (id: string | undefined, label: string, n: number) => <Link className={`chip${filter === id ? " on" : ""}`} href={`/inbox?tab=questions${id ? `&q=${id}` : ""}`} scroll={false}>{label} <span className="cnt">{n}</span></Link>;
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Inbox" }, { label: "Questions" }]} askContext="Inbox questions">
      <PageHeader eyebrow="Inbox" title="Questions from the agent" meta="When the agent is unsure, it asks the person who knows. Each answer changes something, and you can see what." />
      {tabs}
      {!worker ? <EmptyState title="Questions go to people on the plant floor" body={`${A.questions.filter((q) => !q.answered).length} questions are open with operators, shift leads, engineers and the quality head. Answers show up in Activity, Summary.`} /> : (
        <div className="grid">
          <div className="span-8 stack-sm">
            <div className="chips filter-row" role="group" aria-label="Filter questions">
              {chip(undefined, role === "operator" ? "Sent to you" : "Open", mine.filter((q) => !q.answered).length + (role === "operator" ? 0 : openWide.length))}
              {role === "operator" ? null : chip("wide", "Plant-wide", openWide.length)}
              {canAssign || role === "operator" ? chip("assigned", "Assigned to me", [...mine, ...wide].filter((q) => A.assigned[q.id]?.to === me).length) : null}
              {chip("answered", "Answered", [...mine, ...wide].filter((q) => q.answered).length)}
            </div>
            {showWideBelow && list.length ? <h3 className="q-group">Sent to you</h3> : null}
            {list.length ? list.map(card) : showWideBelow && openWide.length ? null : <EmptyState title={filter ? "Nothing in this filter" : "Nothing sent to you right now"} body={role === "operator" ? "You only see questions sent to you." : "Plant-wide questions are below."} />}
            {showWideBelow && openWide.length ? <><h3 className="q-group">Plant-wide <span className="muted">anyone in a lead role can answer or assign</span></h3>{openWide.map(card)}</> : null}
            {held ? <p className="muted" style={{ fontSize: 12, margin: 0 }}>{held} more question held back until next shift, so you are not interrupted too often.</p> : null}
          </div>
          <div className="span-4 stack">
            <Section title="How questions work" flush>
              <ul className="q-how">
                <li><b>It asks, then waits.</b> Whatever depends on the answer is paused and named on the card. Nothing on the line changes meanwhile.</li>
                <li><b>You see what each answer does</b> before you send it.</li>
                <li><b>Your answer is used.</b> The page it unblocks shows who answered.</li>
                <li><b>Not sure?</b> Ask someone else and it goes to the next person in the routing.</li>
                <li>{role === "operator" ? "You only see questions sent to you." : "Leads also see plant-wide questions."}</li>
              </ul>
            </Section>
            <Section title="Recently answered" flush>
              <div className="rows">{A.questions.filter((q) => q.answered).map((q) => <div key={q.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)" }}><span><span className="row-title" style={{ display: "block", fontWeight: 400 }}>{q.answered!.changed}</span><span className="row-sub">{q.answered!.person} · {rel(q.answered!.at)}</span></span></div>)}</div>
            </Section>
          </div>
        </div>
      )}
    </Workspace>
  );
}
