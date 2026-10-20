"use client";
/** RBAC matrix: actions by roles, cells allow, view or hidden. Editable per plant by those who manage people; changes are local and illustrative. */
import { useState } from "react";

type Grant = "allow" | "view" | "hidden";
const NEXT: Record<Grant, Grant> = { allow: "view", view: "hidden", hidden: "allow" };
const SIGNING = new Set(["sign-trial", "sign-limits", "grant-standing-approval"]);

export function RbacMatrix({ roles, rows, editable }: { roles: { id: string; short: string }[]; rows: { action: string; label: string; cells: Grant[] }[]; editable: boolean }) {
  const [cells, setCells] = useState(() => rows.map((r) => r.cells.slice()));
  const changed = cells.reduce((n, row, i) => n + row.filter((c, j) => c !== rows[i].cells[j]).length, 0);
  return (
    <div>
      <div className="card-foot" style={{ borderTop: 0, borderBottom: "1px solid var(--border)" }}>
        <span className="muted" style={{ fontSize: 12 }}>{editable ? "Click a cell to cycle allow, view, hidden." : "Read only for your role."} Release a hold is not an action in any role.</span>
        <span className="spacer" />
        {changed ? <><span className="feedback" role="status">{changed} change{changed === 1 ? "" : "s"}, not saved (illustrative)</span><button type="button" className="btn btn-sm btn-quiet" onClick={() => setCells(rows.map((r) => r.cells.slice()))}>Reset</button></> : null}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="rbac">
          <caption className="sr-only">Permissions by role</caption>
          <thead><tr><th scope="col">Action</th>{roles.map((r) => <th key={r.id} scope="col">{r.short}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.action} className={SIGNING.has(r.action) ? "signing" : undefined}>
              <td>{r.label}</td>
              {roles.map((ro, j) => { const v = cells[i][j]; return <td key={ro.id}><button type="button" disabled={!editable} className={`${v}${v !== r.cells[j] ? " changed" : ""}`} aria-label={`${r.label}, ${ro.short}: ${v}`} onClick={() => setCells((c) => c.map((row, x) => (x === i ? row.map((g, y) => (y === j ? NEXT[g] : g)) : row)))}>{v === "allow" ? "Allow" : v === "view" ? "View" : "Hidden"}</button></td>; })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/** Who signs is set per plant: plant head by default, another named role if the plant chooses. Illustrative. */
export function SignerPicker({ items, roles, editable }: { items: { action: string; label: string; current: string }[]; roles: { id: string; name: string }[]; editable: boolean }) {
  const [v, setV] = useState(() => Object.fromEntries(items.map((i) => [i.action, i.current])));
  return (
    <div className="field-grid">{items.map((i) => (
      <label key={i.action} className="field">{i.label}
        <select value={v[i.action]} disabled={!editable} onChange={(e) => setV((x) => ({ ...x, [i.action]: e.target.value }))}>{roles.filter((r) => r.id !== "stamped-engineer" && r.id !== "viewer").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        {v[i.action] !== i.current ? <span className="feedback">Changed, not saved (illustrative)</span> : <span>Stamped staff can never sign</span>}
      </label>
    ))}</div>
  );
}
