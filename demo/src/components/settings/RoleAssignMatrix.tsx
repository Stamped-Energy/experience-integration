"use client";
/** Card type × role: default owner and who may assign. Click a cell to cycle. */
import { Fragment, useState } from "react";
import type { Cell } from "@/lib/demo/agent";

const NEXT: Record<Cell, Cell> = { "": "owner", owner: "both", both: "assign", assign: "" };
export function RoleAssignMatrix({ rows, roles, editable }: { rows: { group: string; type: string; cells: Cell[] }[]; roles: string[]; editable: boolean }) {
  const [m, setM] = useState(rows);
  const dirty = JSON.stringify(m) !== JSON.stringify(rows);
  const groups = [...new Set(m.map((r) => r.group))];
  return (
    <div>
      <div className="ram-legend">
        <span><i className="ram-o">Owner</i> gets the card by default</span>
        <span><i className="ram-a">Assigns</i> can give it to a named person</span>
        <span className="spacer" />
        {dirty ? <><span className="feedback" role="status">Changed, not saved</span><button type="button" className="btn btn-sm btn-quiet" onClick={() => setM(rows)}>Reset</button></> : <span className="muted">{editable ? "Click a cell to change it." : "Read only for your role."}</span>}
      </div>
      <div className="ram-wrap">
        <table className="ram">
          <caption className="sr-only">Assignment matrix</caption>
          <thead><tr><th scope="col">Card or question</th>{roles.map((r) => <th key={r} scope="col">{r}</th>)}</tr></thead>
          <tbody>{groups.map((g) => (
            <Fragment key={g}>
              <tr className="ram-g"><th colSpan={roles.length + 1} scope="colgroup">{g}</th></tr>
              {m.filter((r) => r.group === g).map((r) => (
                <tr key={r.type}><th scope="row">{r.type}</th>
                  {r.cells.map((c, i) => (
                    <td key={i}><button type="button" disabled={!editable} aria-label={`${r.type}, ${roles[i]}: ${c || "none"}`}
                      onClick={() => setM((x) => x.map((y) => y.type === r.type ? { ...y, cells: y.cells.map((z, k) => (k === i ? NEXT[z] : z)) } : y))}>
                      {c === "owner" || c === "both" ? <i className="ram-o">Owner</i> : null}{c === "assign" || c === "both" ? <i className="ram-a">Assigns</i> : null}{!c ? <span className="ram-none">·</span> : null}
                    </button></td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
