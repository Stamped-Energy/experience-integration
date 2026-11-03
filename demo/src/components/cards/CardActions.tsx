"use client";
/** Card actions with RBAC: disabled actions name who can. Showcase actions record locally and write nothing. */
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/shell/icons";
import { AdjustInBand, type AdjustSpec } from "@/components/process/AdjustInBand";
import { Assign } from "@/components/agent/Assign";

export interface ActionSpec { id: string; label: string; primary?: boolean; allowed: boolean; reason?: string; done: ReactNode }
export interface StopSpec { effect: string; allowed: boolean; reason?: string }

export function CardActions({
  actions,
  stop,
  large,
  adjust,
  assignBar,
  bare,
}: {
  actions: ActionSpec[];
  stop?: StopSpec;
  large?: boolean;
  adjust?: AdjustSpec;
  assignBar?: { initial?: { to: string; by: string }; people: string[]; canAssign: boolean; by: string };
  bare?: boolean;
}) {
  const [done, setDone] = useState<ReactNode>(null);
  const [adjusting, setAdjusting] = useState(false);
  const denied = actions.find((a) => !a.allowed);
  const denyReason = denied?.reason;
  const size = large ? " btn-lg" : "";
  const footClass = bare ? "card-foot-inline" : "card-foot";
  if (done) {
    return (
      <div className={footClass}>
        <span className="feedback" role="status"><Icon.check width={16} height={16} />{done}</span>
        <span className="spacer" />
        <button type="button" className={`btn btn-quiet${size}`} onClick={() => setDone(null)}>Undo</button>
      </div>
    );
  }
  if (adjusting && adjust) {
    return <AdjustInBand spec={adjust} onCancel={() => setAdjusting(false)} onSend={(v) => { setAdjusting(false); setDone(`Sent ${v} ${adjust.unit} as your adjustment.`); }} />;
  }
  return (
    <div className={footClass}>
      {actions.map((a) => {
        const className = a.allowed
          ? a.primary
            ? " btn-primary"
            : ""
          : " btn-quiet";
        return (
          <button
            key={a.id}
            type="button"
            className={`btn${className}${size}`}
            disabled={!a.allowed}
            title={!a.allowed ? a.reason : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (a.id === "adjust" && adjust) setAdjusting(true);
              else setDone(a.done);
            }}
          >
            {!a.allowed ? <Icon.lock width={14} height={14} aria-hidden /> : null}
            {a.label}
          </button>
        );
      })}
      {denyReason ? <span className="why-not">{denyReason}</span> : null}
      {assignBar?.canAssign ? (
        <Assign initial={assignBar.initial} people={assignBar.people} canAssign by={assignBar.by} buttonOnly />
      ) : null}
      <span className="spacer" />
      {stop ? (
        <button type="button" className={`btn btn-stop${size}`} disabled={!stop.allowed} title={stop.allowed ? stop.effect : stop.reason}
          onClick={() => setDone(`Stopped. ${stop.effect}`)}><Icon.stop />Stop</button>
      ) : null}
    </div>
  );
}
