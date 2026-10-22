"use client";
/** Assign a card to a person. Shift lead, process engineer, quality head and plant head can assign; others see the chip only. Illustrative. */
import { useState } from "react";

export function Assign({ initial, people, canAssign, by }: { initial?: { to: string; by: string }; people: string[]; canAssign: boolean; by: string }) {
  const [a, setA] = useState(initial);
  const [open, setOpen] = useState(false);
  return (
    <span className="assign">
      {a ? <span className="assignee" title={`Assigned by ${a.by}`}><span className="av">{a.to.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>{a.to}</span> : <span className="muted">Unassigned</span>}
      {canAssign ? (
        <span className="assign-pop">
          <button type="button" className="btn btn-sm btn-quiet" aria-expanded={open} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}>{a ? "Reassign" : "Assign"}</button>
          {open ? (
            <span className="assign-menu" role="menu">
              {people.map((p) => <button key={p} type="button" role="menuitem" className={a?.to === p ? "on" : undefined} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setA({ to: p, by }); setOpen(false); }}>{p}</button>)}
              {a ? <button type="button" role="menuitem" className="muted" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setA(undefined); setOpen(false); }}>Remove assignee</button> : null}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
