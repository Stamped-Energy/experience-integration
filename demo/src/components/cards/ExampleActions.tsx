/**
 * Worked example actions for the Process and Quality overviews: each card shows what Stamped saw, the evidence,
 * the change it makes or asks for, who decides, and the expected result as a label and band. Illustrative.
 */
import Link from "next/link";
import type { ActionStep, ExampleAction, RoleId } from "@/lib/demo/types";
import { byId, roles } from "@/lib/demo/data";
import { exampleActions } from "@/lib/demo/actions";
import { can } from "@/lib/rbac";
import { EvidenceTag, Illustrative, Section, Tag } from "@/components/ui/primitives";
import { dayMonth, hhmm } from "@/lib/format";
import { FoldCard } from "./FoldCard";
import { CardActions } from "./CardActions";
import { deniedReason } from "./DecisionCard";

const STEP_WORD: Record<ActionStep, string> = { Detect: "See", Explain: "Explain", Propose: "Change", Trial: "Try", Verify: "Check", Learn: "Learn", Decide: "Decide" };
const HOW_TONE = { "On its own, inside the signed band": "success", "A person decides": "info", "Recommend only": "warning", "Record only": "neutral" } as const;
const names = (ids: RoleId[]) => { const n = ids.map((r) => roles.find((x) => x.id === r)!.name); return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0]; };

export function ExampleActionCard({ a, role }: { a: ExampleAction; role: RoleId }) {
  const line = byId.line(a.lineId)!;
  const allowed = a.who.roles.includes(role);
  const stop = a.who.how === "On its own, inside the signed band" ? { effect: "Stopped. The previous setting comes back and nothing new is written.", allowed: can(role, "press-stop", a.lineId), reason: deniedReason("press-stop", "press Stop") } : undefined;
  const c = a.closed;
  const trialing = !c && a.steps.includes("Trial");
  const status = c ? c.state : trialing ? "Trial running" : a.who.how === "On its own, inside the signed band" ? "Running on its own" : a.who.how === "Record only" ? "Checked" : a.who.how === "Recommend only" ? "Recommend only" : "Needs a decision";
  const canAct = allowed || !!stop?.allowed;
  const summary = (
    <span className="ex-sum">
      <span className="ex-sum-t">{a.title}</span>
      <span className="ex-sum-m"><Tag tone={c ? "success" : status === "Needs a decision" ? "info" : "neutral"}>{status}</Tag><span>{c ? `${c.by} · ${dayMonth(c.at)}` : names(a.who.roles)}</span></span>
    </span>
  );
  return (
    <FoldCard summary={summary} labelledBy={`${a.id}-t`}>
      <div className="card-head">
        <span className="src">{a.area} agent</span><span className="dotsep">·</span><span>{line.short}</span>
        <span className="right">{a.steps.map((s) => <span key={s} className="ex-step" data-step={s}>{STEP_WORD[s]}</span>)}{c ? <Tag tone="success">{c.state}</Tag> : null}</span>
      </div>
      <div className="card-body">
        <div className="card-block">
          <span className="label">{a.mechanism}</span>
          <h3 className="card-title" id={`${a.id}-t`}>{a.title}</h3>
          <p className="card-obs">{a.seen}</p>
          <ul className="ex-ev">{a.evidence.map((e) => <li key={e.text}><EvidenceTag label={e.label} /><span>{e.text}{e.id ? <span className="mono muted"> · {e.id}</span> : null}</span></li>)}</ul>
        </div>
        {c ? (
          <div className="ex-grid">
            <span className="label">Changed</span><span>{c.changed}</span>
            <span className="label">{c.state === "Kept" ? "Kept by" : "Accepted by"}</span><span>{c.by} · {dayMonth(c.at)} {hhmm(c.at)}</span>
            <span className="label">Result</span><span><Tag tone={c.result.status === "Verified" ? "success" : "neutral"}>{c.result.status}</Tag> <b>{c.result.label}</b>, band {c.result.band} <Illustrative /></span>
          </div>
        ) : (
          <div className="ex-grid">
            <span className="label">{a.who.how === "Record only" ? "Result" : "The change"}</span><span>{a.action}</span>
            {a.expected ? <><span className="label">Expected</span><span><b>{a.expected.label}</b>, band {a.expected.band}</span></> : null}
            <span className="label">Who decides</span><span><Tag tone={HOW_TONE[a.who.how]}>{a.who.how}</Tag> {a.who.note}</span>
          </div>
        )}
        <p className="ex-why"><span className="label">Why it matters</span>{a.why}</p>
        {a.href ? <Link className="link" href={a.href} scroll={false}>{a.hrefLabel ?? "Open"}</Link> : null}
      </div>
      {!c && (a.options || stop) ? (canAct
        ? <CardActions actions={(a.options ?? []).map((o) => ({ ...o, allowed, reason: `${names(a.who.roles)} can decide`, done: <span>{o.done} <Link href="/activity">Recorded in Activity.</Link></span> }))} stop={stop} />
        : <p className="ex-who">{names(a.who.roles)} decides.</p>) : null}
    </FoldCard>
  );
}

const OPEN_RANK: Record<string, number> = { "A person decides": 0, "Recommend only": 1, "On its own, inside the signed band": 3 };
function openRank(a: ExampleAction) { return a.steps.includes("Trial") ? 2 : OPEN_RANK[a.who.how] ?? 0; }
function isAccepted(a: ExampleAction) { return !!a.closed || a.who.how === "Record only"; }

export function ExampleActions({ area, role }: { area: "Process" | "Quality"; role: RoleId }) {
  const list = exampleActions.filter((a) => a.area === area);
  const open = list.filter((a) => !isAccepted(a)).sort((a, b) => openRank(a) - openRank(b));
  const accepted = list.filter(isAccepted);
  return (
    <Section title="Example actions" meta={<>Worked examples on the demonstration plant <Illustrative /></>} id={`ex-${area.toLowerCase()}`}>
      <div className="ex-group">
        <h3>Open now</h3>
        <p>Waiting for a person, or running now.</p>
        <div className="ex-cards">{open.map((a) => <ExampleActionCard key={a.id} a={a} role={role} />)}</div>
      </div>
      <div className="ex-group">
        <h3>Already accepted</h3>
        <p>A named person accepted it, or the records show it held.</p>
        <div className="ex-cards">{accepted.map((a) => <ExampleActionCard key={a.id} a={a} role={role} />)}</div>
      </div>
    </Section>
  );
}
