"use client";
/** Card actions with RBAC: disabled actions name who can. Showcase actions record locally and write nothing. */
import { useState } from "react";
import { Icon } from "@/components/shell/icons";

export interface ActionSpec { id: string; label: string; primary?: boolean; allowed: boolean; reason?: string; done: string }
export interface StopSpec { effect: string; allowed: boolean; reason?: string }

export function CardActions({ actions, stop, large }: { actions: ActionSpec[]; stop?: StopSpec; large?: boolean }) {
  const [done, setDone] = useState<string | null>(null);
  const denied = actions.find((a) => !a.allowed);
  const size = large ? " btn-lg" : "";
  if (done) {
    return (
      <div className="card-foot">
        <span className="feedback" role="status"><Icon.check width={16} height={16} />{done}</span>
        <span className="spacer" />
        <button type="button" className={`btn btn-quiet${size}`} onClick={() => setDone(null)}>Undo</button>
      </div>
    );
  }
  return (
    <div className="card-foot">
      {actions.map((a) => (
        <button key={a.id} type="button" className={`btn${a.primary ? " btn-primary" : ""}${size}`} disabled={!a.allowed}
          title={!a.allowed ? a.reason : undefined} onClick={() => setDone(a.done)}>{a.label}</button>
      ))}
      {denied ? <span className="why-not"><Icon.lock width={12} height={12} style={{ verticalAlign: -1, marginRight: 4 }} />{denied.reason}</span> : null}
      <span className="spacer" />
      {stop ? (
        <button type="button" className={`btn btn-stop${size}`} disabled={!stop.allowed} title={stop.allowed ? stop.effect : stop.reason}
          onClick={() => setDone(`Stopped. ${stop.effect}`)}><Icon.stop />Stop</button>
      ) : null}
    </div>
  );
}
