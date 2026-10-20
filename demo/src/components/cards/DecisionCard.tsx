/**
 * The shared card (spec §7, design system decision item). One card for every agent proposal:
 * header, observation, reason with evidence ids, recommendation, confidence, limits, mode and what Stop does,
 * state strip and the actions the role allows.
 */
import Link from "next/link";
import type { Proposal, RoleId } from "@/lib/demo/types";
import { byId } from "@/lib/demo/data";
import { can, whoCan } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { roles } from "@/lib/demo/data";
import { Confidence } from "@/components/ui/Confidence";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { StateStrip } from "@/components/ui/StateStrip";
import { EvidenceIds, ModeTag, Tag } from "@/components/ui/primitives";
import { CardActions, type ActionSpec } from "./CardActions";

const roleList = (ids: RoleId[]) => {
  const n = ids.map((r) => roles.find((x) => x.id === r)!.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0];
};
export const deniedReason = (action: Parameters<typeof whoCan>[0], verb: string) => `${roleList(whoCan(action))} can ${verb}`;

export function DecisionCard({ p, role, href, variant = "full" }: { p: Proposal; role: RoleId; href?: string; variant?: "full" | "operator" | "compact" }) {
  const line = byId.line(p.lineId)!;
  const asset = byId.asset(p.assetId)!;
  const win = byId.window(p.lineId, p.param);
  const open = p.state === "Waiting";
  const running = p.state === "Running trial" || p.state === "Running stay" || p.state === "Measuring";
  const allowed = can(role, "decide-proposal", p.lineId) && line.mode !== "Recommend-only";
  const reason = deniedReason("decide-proposal", "decide");
  const unit = win?.unit ?? "";
  const actions: ActionSpec[] = open
    ? [
        { id: "accept", label: `Accept ${p.proposed} ${unit}`, primary: true, allowed, reason, done: `Accepted ${p.proposed} ${unit}. Illustrative: nothing was written.` },
        { id: "adjust", label: "Adjust in band", allowed, reason, done: "Adjust opened. Any value inside the signed band can be sent." },
        { id: "decline", label: "Decline with reason", allowed, reason, done: "Declined. The reason is recorded and the agent learns from it." },
      ]
    : [];
  const stop = running || open ? { effect: p.stopEffect, allowed: can(role, "press-stop", p.lineId), reason: deniedReason("press-stop", "press Stop") } : undefined;
  const big = variant === "operator";
  return (
    <article className={`card${open ? " decision" : ""}`} aria-labelledby={`${p.id}-t`}>
      <div className="card-head">
        <span className="src">Process agent</span>
        <span className="dotsep">·</span><span>{line.short}</span><span className="dotsep">·</span><span>{asset.name}</span>
        <span className="dotsep">·</span><span className="mono">{p.id}</span><span className="dotsep">·</span><span>{hhmm(p.createdAt)}</span>
        <span className="right">
          {p.mode ? <ModeTag mode={p.mode} /> : null}
          {open ? <Tag tone="accent">Needs a decision</Tag> : <Tag>{p.state}</Tag>}
          {open ? <span className="muted">expires {rel(p.expiresAt)}</span> : null}
        </span>
      </div>
      <div className="card-body">
        <div className="card-block">
          <h3 className="card-title" id={`${p.id}-t`}>{href ? <Link href={href}>{titleOf(p, unit)}</Link> : titleOf(p, unit)}</h3>
          <p className="card-obs" style={big ? { fontSize: 16, lineHeight: "26px" } : undefined}>{p.reason}</p>
          <EvidenceIds ids={p.evidenceIds} />
        </div>
        {variant !== "compact" ? (
          <div className="card-cols">
            <div className="card-block">
              <span className="label">Expected result</span>
              <Confidence kind="prediction" label={p.weakestLabel} measure={p.predicted.name} unit={p.predicted.unit} low={p.predicted.low} point={p.predicted.point}
                high={p.predicted.high} spec={p.predicted.spec} drivers={p.drivers} fit={p.fitState} safety={p.safetyFilter}
                method={`Optimiser ${p.optimiserVersion}; band from the model of the machine; weakest input ${p.weakestLabel.toLowerCase()}`} evidenceIds={p.evidenceIds} />
            </div>
            <div className="card-block">
              <span className="label">Limits</span>
              {win ? <LimitsBand name={win.name} unit={win.unit} signed={[win.low, win.high]} narrowed={win.narrowedLow !== undefined ? [win.narrowedLow, win.narrowedHigh!] : undefined}
                current={p.current} proposed={p.fitState === "accepted" && p.safetyFilter.pass ? p.proposed : undefined} signedBy={win.signedBy} signedAt={dayMonth(win.signedAt)} /> : null}
            </div>
          </div>
        ) : null}
        <div className="mode-line">
          <span className="label" style={{ paddingTop: 2 }}>If stopped</span><span>{p.stopEffect}</span>
        </div>
        {p.declineReason ? <div className="mode-line"><span className="label" style={{ paddingTop: 2 }}>Declined</span><span>{p.decidedBy}: {p.declineReason}</span></div> : null}
        {p.decidedBy && !p.declineReason ? <div className="mode-line"><span className="label" style={{ paddingTop: 2 }}>Decided</span><span>{p.decidedBy} · {dayMonth(p.decidedAt!)} {hhmm(p.decidedAt!)}</span></div> : null}
        <StateStrip state={p.state} />
      </div>
      {actions.length || stop ? <CardActions actions={actions} stop={stop} large={big} /> : null}
    </article>
  );
}

function titleOf(p: Proposal, unit: string) {
  const win = byId.window(p.lineId, p.param);
  const name = win?.name ?? p.param;
  if (p.state === "Withheld") return `${name}: no number offered`;
  const dir = p.proposed > p.current ? "Raise" : "Lower";
  return `${dir} ${name.toLowerCase()} from ${p.current} to ${p.proposed} ${unit}`;
}
