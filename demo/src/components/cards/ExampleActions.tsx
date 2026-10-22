/**
Action cards for Process and Quality: each card shows what Stamped saw, the evidence,
 * the change it makes or asks for, who decides, and the expected result as a label and band.
 */
import Link from "next/link";
import type { ActionStep, ExampleAction, RoleId } from "@/lib/demo/types";
import { byId, roles } from "@/lib/demo/data";
import { exampleActions } from "@/lib/demo/actions";
import { can } from "@/lib/rbac";
import { EvidenceTag, Tag } from "@/components/ui/primitives";
import { dayMonth, hhmm } from "@/lib/format";
import { FoldCard } from "./FoldCard";
import * as A from "@/lib/demo/agent";
import { Assign } from "@/components/agent/Assign";
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
    <FoldCard summary={summary} labelledBy={`${a.id}-t`} anchor={a.id}>
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
            <span className="label">Result</span><span><Tag tone={c.result.status === "Verified" ? "success" : "neutral"}>{c.result.status}</Tag> <b>{c.result.label}</b>, band {c.result.band}</span>
          </div>
        ) : (
          <div className="ex-grid">
            <span className="label">{a.who.how === "Record only" ? "Result" : "The change"}</span><span>{a.action}</span>
            {a.expected ? <><span className="label">Expected</span><span><b>{a.expected.label}</b>, band {a.expected.band}</span></> : null}
            <span className="label">Who decides</span><span><Tag tone={HOW_TONE[a.who.how]}>{a.who.how}</Tag> {a.who.note}</span>
          </div>
        )}
        <p className="ex-why"><span className="label">Why it matters</span>{a.why}</p>
        <div className="ex-meta">
          {a.href ? <Link className="link" href={a.href} scroll={false}>{a.hrefLabel ?? "Open"}</Link> : null}
          <span className="spacer" />
          <Assign initial={A.assigned[a.id]} people={A.PEOPLE} canAssign={A.ASSIGNERS.includes(role)} by={A.ME[role] ?? "Plant head A."} />
        </div>
      </div>
      {!c && (a.options || stop) ? (canAct
        ? <CardActions actions={(a.options ?? []).map((o) => ({ ...o, allowed, reason: `${names(a.who.roles)} can decide`, done: <span>{o.done} <Link href="/activity">Recorded in Activity.</Link></span> }))} stop={stop} />
        : <p className="ex-who">{names(a.who.roles)} decides.</p>) : null}
    </FoldCard>
  );
}

export type ActionGroup = "decision" | "running" | "trial" | "closed";
export const GROUPS: { id: ActionGroup; label: string; sub: string }[] = [
  { id: "decision", label: "Needs a decision", sub: "Nothing changes until the named person decides." },
  { id: "trial", label: "Being tried", sub: "Running as a planned trial. Stop restores the previous setting." },
  { id: "running", label: "Running on its own", sub: "Inside a band someone signed. Anyone on the line can press Stop." },
  { id: "closed", label: "Accepted and closed", sub: "A named person accepted it, or the records show it held." },
];
export function groupOf(a: ExampleAction): ActionGroup {
  if (a.closed || a.who.how === "Record only") return "closed";
  if (a.steps.includes("Trial")) return "trial";
  if (a.who.how === "On its own, inside the signed band") return "running";
  return "decision";
}
const NEEDS: Record<ActionGroup, (a: ExampleAction) => string> = {
  decision: (a) => `${names(a.who.roles)} to decide`,
  trial: () => "Nothing needed while it runs",
  running: () => "Nothing needed. Stop is always there",
  closed: (a) => (a.closed ? `Accepted by ${a.closed.by}` : "Checked against the records"),
};
const G_TONE = { decision: "info", trial: "neutral", running: "success", closed: "neutral" } as const;

/** Actions for one area, optionally one line. Filters come from the URL. */
export function listActions(area: "Process" | "Quality", lineId?: string) {
  return exampleActions.filter((a) => a.area === area && (!lineId || a.lineId === lineId));
}

/** Compact brief for an overview: a few rows, each opens inline; the full card lives in the Actions tab. */
export function ActionsBrief({ area, lineId, href, limit = 4 }: { area: "Process" | "Quality"; lineId?: string; href: string; limit?: number }) {
  const list = listActions(area, lineId);
  const open = list.filter((a) => groupOf(a) !== "closed").sort((a, b) => GROUPS.findIndex((g) => g.id === groupOf(a)) - GROUPS.findIndex((g) => g.id === groupOf(b)));
  const count = (g: ActionGroup) => list.filter((a) => groupOf(a) === g).length;
  const summary = [count("decision") ? `${count("decision")} need a decision` : "", count("trial") ? `${count("trial")} being tried` : "", count("running") ? `${count("running")} running on its own` : ""].filter(Boolean).join(" · ");
  return (
    <section className="brief" aria-labelledby={`brief-${area}${lineId ?? ""}`}>
      <div className="brief-head"><h2 id={`brief-${area}${lineId ?? ""}`}>Actions</h2><span className="muted">{summary || "Nothing open"}</span><Link className="link" href={href} style={{ marginLeft: "auto" }}>See all actions</Link></div>
      <div className="brief-rows">
        {open.slice(0, limit).map((a) => {
          const g = groupOf(a);
          return (
            <details key={a.id} className="brief-row">
              <summary>
                <Tag tone={G_TONE[g]}>{GROUPS.find((x) => x.id === g)!.label}</Tag>
                <span className="brief-t">{a.title}</span>
                <span className="brief-n">{NEEDS[g](a)}</span>
                {a.expected ? <EvidenceTag label={a.expected.label} /> : <span />}
                <svg className="brief-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <div className="brief-body">
                <p>{a.seen}</p>
                <p><span className="label">The change</span> {a.action}</p>
                {a.expected ? <p><span className="label">Expected</span> {a.expected.label}, band {a.expected.band}</p> : null}
                <Link className="btn btn-sm" href={`${href}#${a.id}`}>Open in Actions</Link>
              </div>
            </details>
          );
        })}
      </div>
      {open.length > limit ? <div className="brief-more"><Link className="link" href={href}>{open.length - limit} more open</Link></div> : null}
    </section>
  );
}

/** The detailed home of all action cards: open first, grouped by what they need, then accepted and closed. */
export function ActionsBoard({ area, role, lineId, base, status, line, mine }: { area: "Process" | "Quality"; role: RoleId; lineId?: string; base: string; status?: string; line?: string; mine?: string }) {
  const me = A.ME[role];
  const all = listActions(area, lineId ?? line);
  const list = all.filter((a) => (!status || groupOf(a) === status) && (!mine || (me && A.assigned[a.id]?.to === me)));
  const q = (p: Record<string, string | undefined>) => { const u = new URLSearchParams({ tab: "actions" }); const v = { status, line, mine, ...p }; for (const [k, x] of Object.entries(v)) if (x) u.set(k, x); return `${base}?${u}`; };
  const chip = (on: boolean, href: string, label: string, n?: number) => <Link className={`chip${on ? " on" : ""}`} href={href} scroll={false}>{label}{n !== undefined ? <span className="cnt">{n}</span> : null}</Link>;
  const lines = [...new Set(listActions(area).map((a) => a.lineId))];
  return (
    <div className="stack">
      <div className="act-filters" role="group" aria-label="Filter actions">
        <span className="chips">
          {chip(!status, q({ status: undefined }), "All", all.length)}
          {GROUPS.map((g) => chip(status === g.id, q({ status: g.id }), g.label, all.filter((a) => groupOf(a) === g.id).length))}
        </span>
        {lineId ? null : <span className="chips">{chip(!line, q({ line: undefined }), "All lines")}{lines.map((l) => chip(line === l, q({ line: l }), byId.line(l)!.short))}</span>}
        {me ? <span className="chips">{chip(!!mine, q({ mine: mine ? undefined : "1" }), "Assigned to me", all.filter((a) => A.assigned[a.id]?.to === me).length)}</span> : null}
      </div>
      {list.length === 0 ? <p className="secondary" style={{ margin: 0 }}>No actions match these filters.</p> : null}
      {GROUPS.map((g) => {
        const xs = list.filter((a) => groupOf(a) === g.id);
        if (!xs.length) return null;
        return (
          <section key={g.id} className="ex-group" aria-label={g.label}>
            <h3>{g.label} <span className="cnt muted">{xs.length}</span></h3>
            <p>{g.sub}</p>
            <div className="ex-cards">{xs.map((a) => <ExampleActionCard key={a.id} a={a} role={role} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
