/**
Action cards for Process and Quality: each card shows what Stamped saw, the evidence,
 * the change it makes or asks for, who decides, and the expected result as a label and band.
 */
import Link from "next/link";
import { useState } from "react";
import type { ActionStep, ExampleAction, RoleId } from "@/lib/demo/types";
import { byId, roles } from "@/lib/demo/data";
import {
  exampleActions,
  actionHref,
  actionOutcomeForDisplay,
  decisionOptionPair,
  optionShortLabel,
  whoDecidesShort,
} from "@/lib/demo/actions";
import { can } from "@/lib/rbac";
import { Tag } from "@/components/ui/primitives";
import { dayMonth, hhmm } from "@/lib/format";
import { FoldCard, FoldCardChevron } from "./FoldCard";
import { ActionOutcomeLine } from "./ActionOutcomeLine";
import { ShowMore } from "./ShowMore";
import * as A from "@/lib/demo/agent";
import { Assign } from "@/components/agent/Assign";
import { CardActions } from "./CardActions";
import { deniedReason } from "./DecisionCard";
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
  const outcome = actionOutcomeForDisplay(a);
  const decisionActions = cardDecisionActions(a, role);
  const summary = (
    <span className="ex-sum">
      <span className="ex-sum-t">{a.title}</span>
      <ActionOutcomeLine outcome={outcome} />
      <span className="ex-sum-m">
        <Tag tone={statusTone}>{status}</Tag>
        <span className="ex-sum-who">{c ? `${c.by} · ${dayMonth(c.at)}` : names(a.who.roles)}</span>
        <Link className={`btn btn-sm ex-open ${stretchOver}`} href={href} scroll={false}>
          Open
        </Link>
      </span>
    </span>
  );
  const footerMeta = c
    ? `${c.changed} · ${c.by} · ${c.state}`
    : `${a.action} · ${whoDecidesShort(a.who.how)} · ${names(a.who.roles)}`;

  return (
    <FoldCard summary={summary} labelledBy={`${a.id}-t`} anchor={a.id} detailHref={href}>
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
        <ActionOutcomeLine outcome={outcome} />
        <p className="ex-why-line ex-why-clamp">{a.seen}</p>
        <p className="ex-why-line ex-why-clamp">{a.why}</p>
        <p className="ex-foot-meta muted">{footerMeta}</p>
        <div className={`ex-meta ex-meta-foot ${stretchOver}`}>
          <Assign initial={A.assigned[a.id]} people={A.PEOPLE} canAssign={A.ASSIGNERS.includes(role)} by={A.ME[role] ?? "Plant head A."} />
        </div>
      </div>
      {!c && (decisionActions.length || stop) ? <CardActions actions={decisionActions} stop={stop} /> : null}
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
      {g.label} <span className="cnt">{n}</span>
      <span className="act-sub">{g.sub}</span>
    </h3>
  );
}

/** One two-column grid. A group with a spare cell takes the next group's card instead of leaving a hole. */
function ActionGrid({ list, role }: { list: ExampleAction[]; role: RoleId }) {
  const blocks = GROUPS.map((g) => ({ g, xs: list.filter((a) => groupOf(a) === g.id) })).filter((b) => b.xs.length);
  if (blocks.length <= 1) {
    return (
      <>
        {blocks.map(({ g, xs }) => (
          <section key={g.id} className="ex-group act-group" data-act-group={g.id} aria-label={g.label}>
            <GroupHead g={g} n={xs.length} />
            <ShowMore className="ex-cards act-cards">{xs.map((a) => <ExampleActionCard key={a.id} a={a} role={role} />)}</ShowMore>
          </section>
        ))}
      </>
    );
  }
  const slots = blocks.flatMap(({ g, xs }) => xs.map((a, i) => ({ g, a, lead: i === 0, n: xs.length })));
  const rows: (typeof slots)[] = [];
  for (let i = 0; i < slots.length; i += 2) rows.push(slots.slice(i, i + 2));
  return (
    <div className="act-pack">
      {rows.map((row) => {
        const same = row.length === 2 && row[0].g.id === row[1].g.id;
        if (same) {
          const head = row[0].lead || row[1].lead;
          return (
            <div key={row[0].a.id} className="act-pack-row">
              {head ? <GroupHead g={row[0].g} n={row[0].n} className="act-pack-span" /> : null}
              {row.map((s) => (
                <ExampleActionCard key={s.a.id} a={s.a} role={role} />
              ))}
            </div>
          );
        }
        return (
          <div key={row[0].a.id} className="act-pack-row">
            {row.map((s) => (
              <div key={s.a.id} className="act-slot">
                {s.lead ? <GroupHead g={s.g} n={s.n} /> : <div className="act-slot-gap" aria-hidden />}
                <ExampleActionCard a={s.a} role={role} />
              </div>
            ))}
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
        <div className="ex-cards act-cards brief-card-grid">
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
  const list = all.filter((a) => (!status || groupOf(a) === status) && (!mine || (me && A.assigned[a.id]?.to === me)));
  const q = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams({ tab: "actions" });
    const v = { status, line, mine, ...p };
    for (const [k, x] of Object.entries(v)) if (x) u.set(k, x);
    return `${base}?${u}`;
  };
  const chip = (on: boolean, href: string, label: string, n?: number) => (
    <Link className={`chip${on ? " on" : ""}`} href={href} scroll={false}>
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
      {list.length === 0 ? <p className="secondary" style={{ margin: 0 }}>No actions match these filters.</p> : null}
      <ActionGrid list={list} role={role} />
    </div>
  );
}
