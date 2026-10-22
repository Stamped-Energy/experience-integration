/** Server blocks that show the agent at work: working-on strip, onboarding tracker, control stack, a new layer tried on the twin,
 *  what it learned, proposals left on the table, answered-by chips and the compact example-action strip. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import * as A from "@/lib/demo/agent";
import type { RoleId } from "@/lib/demo/types";
import { dayMonth, hhmm, inr, rel } from "@/lib/format";
import { Illustrative, Section, Tag, type Tone } from "@/components/ui/primitives";
import { CardActions } from "@/components/cards/CardActions";
import { Assign } from "./Assign";
import { Term } from "@/components/ui/Term";

const W_TONE: Record<A.WorkItem["status"], Tone> = { Investigating: "neutral", Simulating: "info", "Waiting on you": "accent", Onboarding: "neutral" };

export function WorkingOn({ lineId, items: given }: { lineId?: string; items?: A.WorkItem[] }) {
  const items = (given ?? A.workingOn).filter((w) => !lineId || w.lineId === lineId);
  if (!items.length) return null;
  return (
    <section className="working" aria-label="What the agent is working on">
      <div className="working-head"><span className="pulse" aria-hidden /><b>Working on</b><span className="muted">{items.length} now</span><Illustrative /></div>
      <div className="working-items">
        {items.map((w) => (
          <Link key={w.id} href={w.href} className="work">
            <span className="work-top"><Tag tone={W_TONE[w.status]}>{w.status}</Tag>{lineId ? null : <span className="muted">{D.byId.line(w.lineId)!.short}</span>}</span>
            <span className="work-t">{w.title}</span>
            <span className="work-s">{w.step}{w.waits ? <> · waits on <b>{w.waits}</b></> : null}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AnsweredChip({ qid }: { qid: string }) {
  const q = A.questions.find((x) => x.id === qid);
  if (!q?.answered) return null;
  return <Link href="/inbox?tab=questions" className="answered-chip" title={q.answered.changed}>Answered by {D.byId.role(q.answered.by).name}, {hhmm(q.answered.at)}</Link>;
}

export function Onboarding() {
  const o = A.onboarding;
  return (
    <Section title={`New part: ${o.part}`} meta={`Started ${rel(o.started)} · step ${o.current} of 5`} id="onboarding" actions={<Illustrative />}>
      <ol className="onb">
        {o.steps.map((s) => (
          <li key={s.n} data-state={s.state}>
            <span className="onb-n">{s.state === "done" ? "✓" : s.n}</span>
            <span className="onb-b"><b>{s.title}</b>{s.state === "live" ? <Tag tone="info">Now</Tag> : null}<span className="secondary">{s.detail}</span>
              {"answeredBy" in s && s.answeredBy ? <AnsweredChip qid="q-4" /> : null}
              {s.state === "live" ? <Link className="link" href="/inbox?tab=questions">Asked the operator to run the next move</Link> : null}</span>
          </li>
        ))}
      </ol>
      <p className="muted" style={{ margin: "8px 0 0", fontSize: 12 }}>Until step 5 the line stays recommend-only for this part. A person promotes it.</p>
    </Section>
  );
}

const K_TONE: Record<A.ControlLayer["state"], Tone> = { Active: "success", "In shadow": "neutral", "Prebuilt, not on": "neutral", Simulating: "info" };
export function ControlStack({ lineId }: { lineId: string }) {
  const layers = A.controlStacks[lineId];
  return (
    <Section title="Control stack" meta="Prebuilt for this equipment, tuned at integration" id="control" flush>
      <ol className="cstack">
        {layers.map((l) => (
          <li key={l.id} data-state={l.state}>
            <span className="ck"><Term k={l.kind} /></span>
            <span className="cb"><b>{l.name}</b><span className="secondary">{l.scope}</span><span className="muted">{l.tuned}</span></span>
            {l.state === "In shadow" ? <Term k="shadow"><Tag tone={K_TONE[l.state]}>{l.state}</Tag></Term> : <Tag tone={K_TONE[l.state]}>{l.state}</Tag>}
          </li>
        ))}
      </ol>
      <p className="cstack-foot">Top layers steer the ones below. Each comes ready for this kind of equipment, so only its settings are tuned to this line. Hover or tap a type to see what it does.</p>
    </Section>
  );
}

export function LayerProposal({ role }: { role: RoleId }) {
  const p = A.layerProposal;
  const allowed = ["process-engineer", "plant-head"].includes(role);
  return (
    <article className="card decision" id="layer">
      <div className="card-head"><span className="src">Process agent</span><span className="dotsep">·</span><span>{D.byId.line(p.lineId)!.short}</span>
        <span className="right"><Tag tone="info">New control layer</Tag><Tag tone="accent">Needs a decision</Tag></span></div>
      <div className="card-body">
        <div className="card-block"><h3 className="card-title">{p.title}</h3><p className="card-obs">{p.summary}</p></div>
        <TwinBlock rows={p.rows} runs={p.sim.runs} fit={p.sim.fit} label={p.sim.label} />
        <p className="mode-line" style={{ margin: 0 }}><span className="label" style={{ paddingTop: 2 }}>Safety</span><span>{p.guard}</span></p>
        <p className="mode-line" style={{ margin: 0 }}><span className="label" style={{ paddingTop: 2 }}>Next</span><span>{p.next}</span></p>
      </div>
      <CardActions actions={[
        { id: "draft", label: "Draft a trial", primary: true, allowed, reason: "Process engineer or Plant head can decide", done: "Trial draft opened for the plant head to sign." },
        { id: "no", label: "Not now, with a reason", allowed, reason: "Process engineer or Plant head can decide", done: "Kept on the twin. Your reason is logged." },
      ]} />
    </article>
  );
}

export function TwinBlock({ rows, runs, fit, label }: { rows: { m: string; unit: string; now: string; with: string }[]; runs: string; fit: string; label: string }) {
  return (
    <div className="twin">
      <div className="twin-head"><b>Tried on the <Term k="twin">twin</Term> first</b><Tag>{label}</Tag><span className="muted">Twin fit: {fit}</span></div>
      <table className="twin-t"><thead><tr><th>Measure</th><th className="right">Today</th><th className="right">With the change, expected <Term k="band">band</Term></th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.m}><td>{r.m}</td><td className="right num">{r.now} {r.unit}</td><td className="right num"><b>{r.with} {r.unit}</b></td></tr>)}</tbody></table>
      <span className="muted" style={{ fontSize: 12 }}>{runs}. Every move stays inside the <Term k="signed">signed limits</Term>.</span>
    </div>
  );
}

export function Learned({ limit, items = A.learned }: { limit?: number; items?: typeof A.learned }) {
  return (
    <ul className="learned">
      {items.slice(0, limit).map((l) => (
        <li key={l.id}><Tag>{l.kind}</Tag><span><b>{l.text}</b><span className="cell-sub">{l.from} · {dayMonth(l.at)} · {l.state}</span></span></li>
      ))}
    </ul>
  );
}

/** Proposals nobody has decided. Units on worker pages; rupees only on the Owner view. */
export function IdleList({ rupees, role }: { rupees: boolean; role: RoleId }) {
  const can = A.ASSIGNERS.includes(role);
  const me = A.ME[role] ?? "Plant head A.";
  return (
    <div className="rows">
      {A.idleProposals.map((p) => {
        const r = A.idleInr(p);
        return (
          <div key={p.id} className="row idle-row">
            <span style={{ minWidth: 0 }}><span className="row-title" style={{ display: "block" }}>{p.title}</span>
              <span className="row-sub">{D.byId.line(p.lineId)!.short} · waiting {p.waitingDays} days · {p.lastSeen}</span></span>
            <span className="idle-loss">{rupees ? <><b>{inr(r.perWeek)}</b><span className="cell-sub">lost per week · {inr(r.lostSoFar)} so far</span></>
              : <><b>{p.loss.perWeek.toLocaleString("en-IN")} {p.loss.unit}</b><span className="cell-sub">{p.loss.what} per week</span></>}</span>
            {rupees ? null : <Assign initial={A.assigned[p.id]} people={A.PEOPLE} canAssign={can} by={me} />}
          </div>
        );
      })}
    </div>
  );
}

export function Qualification() {
  const o = A.qualification;
  return (
    <Section title={o.title} meta={`Started ${rel(o.started)} · step ${o.current} of ${o.steps.length}`} actions={<Illustrative />}>
      <ol className="onb">
        {o.steps.map((s) => (
          <li key={s.n} data-state={s.state}>
            <span className="onb-n">{s.state === "done" ? "✓" : s.n}</span>
            <span className="onb-b"><b>{s.title}</b>{s.state === "live" ? <Tag tone="info">Now</Tag> : null}<span className="secondary">{s.detail}</span></span>
          </li>
        ))}
      </ol>
      <p className="muted" style={{ margin: "8px 0 0", fontSize: 12 }}>Until the quality head approves it, lots of this part are shown with the wider borrowed band.</p>
    </Section>
  );
}

/** Questions the agent asked, filtered; answered ones carry the chip, open ones link to Inbox Questions. */
export function AskedHere({ list }: { list: A.Question[] }) {
  return (
    <Section title="Questions it asked" meta={`${list.filter((q) => !q.answered).length} open`} flush>
      <div className="rows">{list.map((q) => (
        <div key={q.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)", height: "auto", padding: "8px 16px" }}>
          <span><span className="row-title" style={{ display: "block", whiteSpace: "normal" }}>{q.title}</span><span className="row-sub">{q.type} · sent to {D.byId.role(q.routedTo).name}</span>{q.answered ? <AnsweredChip qid={q.id} /> : <Link className="link" href="/inbox?tab=questions" style={{ fontSize: 12, marginLeft: 6 }}>Answer in Inbox</Link>}</span>
        </div>))}</div>
    </Section>
  );
}
