/**
 * Action cards for Process and Quality: each card shows what Stamped saw, the evidence,
 * the change it makes or asks for, who decides, and the expected result as a label and band.
 */
import Link from "next/link";
import { useState } from "react";
import type { ActionStep, ExampleAction, RoleId } from "@/lib/demo/types";
import { byId, roles } from "@/lib/demo/data";
import {
  exampleActions,
  actionHref,
  decisionOptionPair,
  optionShortLabel,
  whoDecidesShort,
} from "@/lib/demo/actions";
import { can } from "@/lib/rbac";
import { Tag } from "@/components/ui/primitives";
import { dayMonth, hhmm } from "@/lib/format";
import { FoldCard, FoldCardChevron } from "./FoldCard";
import { ActionOutcomeStrip } from "./ActionOutcomeStrip";
import { actionOutcomesForDisplay } from "@/lib/demo/actionOutcomes";
import { actionIsApplied, detailFor } from "@/lib/demo/actionDetail";
import { ShowMore } from "./ShowMore";
import * as A from "@/lib/demo/agent";
import { Assign } from "@/components/agent/Assign";
import { CardActions } from "./CardActions";
import { deniedReason } from "./DecisionCard";
import { FilterEmpty } from "@/components/ui/FilterEmpty";
import { stretchOver } from "@/components/ui/StretchLink";

const STEP_WORD: Record<ActionStep, string> = { Detect: "See", Explain: "Explain", Propose: "Change", Trial: "Try", Verify: "Check", Learn: "Learn", Decide: "Decide" };

const names = (ids: RoleId[]) => {
  const n = ids.map((r) => roles.find((x) => x.id === r)!.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0];
};

function cardDecisionActions(a: ExampleAction, role: RoleId) {
  const { primary, secondary } = decisionOptionPair(a);
  const allowed = a.who.roles.includes(role);
  const reason = `${names(a.who.roles)} can decide`;
  return [primary, secondary]
    .filter((o): o is NonNullable<typeof primary> => !!o)
    .map((o) => ({
      ...o,
      label: optionShortLabel(a.id, o.id, o.label),
      primary: o === primary,
      allowed,
      reason,
      done: (
        <span>
          {o.done} <Link href="/activity">Recorded in Activity.</Link>
        </span>
      ),
    }));
}

function StepMenu({ steps }: { steps: ActionStep[] }) {
  const [open, setOpen] = useState(false);
  const label = steps.map((s) => STEP_WORD[s]).join(" · ");
  return (
    <span className={`ex-step-menu ${stretchOver}`}>
      <button type="button" className="btn btn-sm btn-quiet" aria-expanded={open} aria-haspopup="menu" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}>
        Steps
      </button>
      {open ? (
        <span className="ex-step-menu-pop" role="menu">
          {steps.map((s) => (
            <span key={s} role="menuitem" className="ex-step" data-step={s}>
              {STEP_WORD[s]}
            </span>
          ))}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

export function ExampleActionCard({ a, role }: { a: ExampleAction; role: RoleId }) {
  const line = byId.line(a.lineId)!;
  const stop = a.who.how === "On its own, inside the signed band"
    ? { effect: "Stopped. The previous setting comes back and nothing new is written.", allowed: can(role, "press-stop", a.lineId), reason: deniedReason("press-stop", "press Stop") }
    : undefined;
  const c = a.closed;
  const trialing = !c && a.steps.includes("Trial");
  const status = c ? c.state : trialing ? "Trial running" : a.who.how === "On its own, inside the signed band" ? "Running on its own" : a.who.how === "Record only" ? "Checked" : a.who.how === "Recommend only" ? "Recommend only" : "Needs a decision";
  const statusTone = c ? "success" : status === "Needs a decision" ? "info" : status === "Trial running" ? "accent" : "neutral";
  const href = actionHref(a);
  const outcomes = actionOutcomesForDisplay(a);
  const appliedLoop = actionIsApplied(a) ? detailFor(a).loop : undefined;
  const decisionActions = cardDecisionActions(a, role);
  const summary = (
    <span className="ex-sum">
      <span className="ex-sum-t">{a.title}</span>
      <span className="ex-sum-m">
        <Tag tone={statusTone}>{status}</Tag>
        <span className="ex-sum-who">{c ? `${c.by} · ${dayMonth(c.at)}` : names(a.who.roles)}</span>
        <FoldCardChevron className="ex-sum-chev" />
      </span>
    </span>
  );
  const footerMeta = c
    ? `${c.changed} · ${c.by} · ${c.state}`
    : `${a.action} · ${whoDecidesShort(a.who.how)} · ${names(a.who.roles)}`;

  const linkCta = !c && !decisionActions.length && a.href;

  return (
    <FoldCard summary={summary} labelledBy={`${a.id}-t`} anchor={a.id} detailHref={href} className={c ? "is-closed" : undefined}>
      <div className="card-head">
        <span className="card-head-meta">
          <span className="src">{a.area} agent</span>
          <span className="dotsep">·</span>
          <span className="card-head-clip">{line.short}</span>
        </span>
        <span className="right">
          <StepMenu steps={a.steps} />
          <FoldCardChevron />
          {c ? <Tag tone="success">{c.state}</Tag> : null}
        </span>
      </div>
      <div className="card-body ex-body-simple">
        <span className="label">{a.mechanism}</span>
        <h3 className="card-title" id={`${a.id}-t`}>
          {a.title}
        </h3>
        <ActionOutcomeStrip outcomes={outcomes} />
        {appliedLoop?.statusLine ? (
          <p className="ex-loop-status">
            <span className="ex-loop-status-text">{appliedLoop.statusLine}</span>
            <Tag tone="success">MEASURED</Tag>
          </p>
        ) : null}
        <p className="ex-why-line ex-why-clamp">{a.seen}</p>
        <p className="ex-why-line ex-why-clamp">{a.why}</p>
        <p className="ex-foot-meta muted">{footerMeta}</p>
        <div className={`ex-meta ex-meta-foot ${stretchOver}`}>
          <Assign initial={A.assigned[a.id]} people={A.PEOPLE} canAssign={A.ASSIGNERS.includes(role)} by={A.ME[role] ?? "Plant head A."} />
        </div>
      </div>
      <div className="card-foot card-foot-actions" data-no-nav onClick={(e) => e.stopPropagation()}>
        {!c && linkCta && !decisionActions.length && !stop && a.href ? (
          <Link href={a.href!} className="btn btn-sm btn-quiet" scroll={false} data-no-nav onClick={(e) => e.stopPropagation()}>
            {a.hrefLabel ?? "Related record"}
          </Link>
        ) : null}
        {!c && (decisionActions.length || stop) ? (
          <CardActions bare actions={decisionActions} stop={stop} />
        ) : null}
        <span className="spacer" />
        <Link href={href} className="btn btn-sm btn-outline" scroll={false} data-no-nav onClick={(e) => e.stopPropagation()}>
          Open action
        </Link>
      </div>
    </FoldCard>
  );
}

export type ActionGroup = "decision" | "running" | "trial" | "closed";
export const GROUPS: { id: ActionGroup; label: string; sub: string }[] = [
  { id: "decision", label: "Needs a decision", sub: "nothing changes until they do" },
  { id: "trial", label: "Being tried", sub: "planned trials; Stop restores the previous setting" },
  { id: "running", label: "Running on its own", sub: "inside a signed band; anyone can press Stop" },
  { id: "closed", label: "Accepted and closed", sub: "accepted by a named person, or held on the records" },
];
export function groupOf(a: ExampleAction): ActionGroup {
  if (a.closed || a.who.how === "Record only") return "closed";
  if (a.steps.includes("Trial")) return "trial";
  if (a.who.how === "On its own, inside the signed band") return "running";
  return "decision";
}
function GroupHead({ g, n, className }: { g: (typeof GROUPS)[number]; n: number; className?: string }) {
  return (
    <h3 className={className}>
      <span className="act-list-head-main">
        {g.label} <span className="cnt">{n}</span>
      </span>
      <span className="act-sub">{g.sub}</span>
    </h3>
  );
}

/** One full-width row per action, grouped by status. */
function ActionList({ list, role }: { list: ExampleAction[]; role: RoleId }) {
  const sorted = [...list].sort(
    (a, b) => GROUPS.findIndex((g) => g.id === groupOf(a)) - GROUPS.findIndex((g) => g.id === groupOf(b)),
  );
  let last: ActionGroup | null = null;
  return (
    <div className="act-list">
      {sorted.map((a) => {
        const g = groupOf(a);
        const showHead = g !== last;
        if (showHead) last = g;
        const groupDef = GROUPS.find((x) => x.id === g)!;
        return (
          <div key={a.id} className="act-list-row">
            {showHead ? (
              <GroupHead g={groupDef} n={sorted.filter((x) => groupOf(x) === g).length} className="act-list-head" />
            ) : null}
            <ExampleActionCard a={a} role={role} />
          </div>
        );
      })}
    </div>
  );
}

/** Actions for one area, optionally one line. Filters come from the URL. */
export function listActions(area: "Process" | "Quality", lineId?: string) {
  return exampleActions.filter((a) => a.area === area && (!lineId || a.lineId === lineId));
}

export function openActionCount(area: "Process" | "Quality", lineId?: string) {
  return listActions(area, lineId).filter((a) => groupOf(a) !== "closed").length;
}

/** Compact brief for an overview: the same foldable action cards as the Actions board, capped for the page. */
export function ActionsBrief({
  area,
  role,
  lineId,
  href,
  limit = 4,
}: {
  area: "Process" | "Quality";
  role: RoleId;
  lineId?: string;
  href: string;
  limit?: number;
}) {
  const list = listActions(area, lineId);
  const open = list
    .filter((a) => groupOf(a) !== "closed")
    .sort((a, b) => GROUPS.findIndex((g) => g.id === groupOf(a)) - GROUPS.findIndex((g) => g.id === groupOf(b)));
  const count = (g: ActionGroup) => list.filter((a) => groupOf(a) === g).length;
  const summary = [
    count("decision") ? `${count("decision")} need a decision` : "",
    count("trial") ? `${count("trial")} being tried` : "",
    count("running") ? `${count("running")} running on its own` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const shown = open.slice(0, limit);
  return (
    <section className="brief brief-cards" aria-labelledby={`brief-${area}${lineId ?? ""}`}>
      <div className="brief-head">
        <h2 id={`brief-${area}${lineId ?? ""}`}>Actions</h2>
        <span className="muted">{summary || "Nothing open"}</span>
        <Link className="link" href={href} style={{ marginLeft: "auto" }}>
          See all actions
        </Link>
      </div>
      {shown.length ? (
        <div className="ex-cards act-cards act-cards-single brief-card-grid">
          {shown.map((a) => (
            <ExampleActionCard key={a.id} a={a} role={role} />
          ))}
        </div>
      ) : (
        <p className="brief-empty muted">Nothing open right now.</p>
      )}
      {open.length > limit ? (
        <div className="brief-more">
          <Link className="link" href={href}>
            {open.length - limit} more open
          </Link>
        </div>
      ) : null}
    </section>
  );
}

/** The detailed home of all action cards: open first, grouped by what they need, then accepted and closed. */
export function ActionsBoard({
  area,
  role,
  lineId,
  base,
  status,
  line,
  mine,
}: {
  area: "Process" | "Quality";
  role: RoleId;
  lineId?: string;
  base: string;
  status?: string;
  line?: string;
  mine?: string;
}) {
  const me = A.ME[role];
  const all = listActions(area, lineId ?? line);
  const filtered = all.filter((a) => (!status || groupOf(a) === status) && (!mine || (me && A.assigned[a.id]?.to === me)));
  const list = filtered;
  const hasFilters = !!(status || line || mine);
  const q = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams({ tab: "actions" });
    const v = { status, line, mine, ...p };
    for (const [k, x] of Object.entries(v)) if (x) u.set(k, x);
    return `${base}?${u}`;
  };
  const chip = (on: boolean, href: string, label: string, n?: number) => (
    <Link className={`chip${on ? " on" : ""}${n === 0 ? " chip-zero" : ""}`} href={href} scroll={false}>
      {label}
      {n !== undefined ? <span className="cnt">{n}</span> : null}
    </Link>
  );
  const lines = [...new Set(listActions(area).map((a) => a.lineId))];
  return (
    <div className="act-board">
      <div className="act-filters" role="group" aria-label="Filter actions">
        <span className="chips">
          {chip(!status, q({ status: undefined }), "All", all.length)}
          {GROUPS.filter((g) => status === g.id || all.some((a) => groupOf(a) === g.id)).map((g) =>
            chip(status === g.id, q({ status: g.id }), g.label, all.filter((a) => groupOf(a) === g.id).length),
          )}
        </span>
        {lineId ? null : (
          <span className="chips">
            {chip(!line, q({ line: undefined }), "All lines")}
            {lines.map((l) => chip(line === l, q({ line: l }), byId.line(l)!.short))}
          </span>
        )}
        {me ? (
          <span className="chips">
            {chip(!!mine, q({ mine: mine ? undefined : "1" }), "Assigned to me", all.filter((a) => A.assigned[a.id]?.to === me).length)}
          </span>
        ) : null}
      </div>
      {list.length === 0 ? (
        <FilterEmpty
          clearHref={hasFilters ? q({ status: undefined, line: undefined, mine: undefined }) : undefined}
          hint={mine && all.length > 0 ? "None of these actions are assigned to you." : undefined}
        />
      ) : (
        <ActionList list={list} role={role} />
      )}
    </div>
  );
}
