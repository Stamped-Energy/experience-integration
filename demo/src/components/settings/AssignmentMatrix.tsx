"use client";
/** Assignment matrix kept from the old responsibility board: scopes by people, one primary and up to three backups each.
 *  Click sets primary; Alt or right-click toggles a backup. Recommend scores people by scope and skill overlap. Illustrative. */
import { useState } from "react";

export interface AScope { scope: string; label: string; primary: string; backups: string[]; skills: string[] }
export interface APerson { id: string; display: string; scopes: string[]; role: string }

export function AssignmentMatrix({ scopes, people, editable }: { scopes: AScope[]; people: APerson[]; editable: boolean }) {
  const [rows, setRows] = useState(scopes);
  const [rec, setRec] = useState<{ scope: string; ids: string[] } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const setPrimary = (s: string, p: string) => setRows((r) => r.map((x) => (x.scope === s ? { ...x, primary: p, backups: x.backups.filter((b) => b !== p) } : x)));
  const toggleBackup = (s: string, p: string) => setRows((r) => r.map((x) => {
    if (x.scope !== s || x.primary === p) return x;
    if (x.backups.includes(p)) return { ...x, backups: x.backups.filter((b) => b !== p) };
    if (x.backups.length >= 3) { setMsg("At most three backups per scope."); return x; }
    return { ...x, backups: [...x.backups, p] };
  }));
  const recommend = (s: AScope) => {
    const scored = people.map((p) => ({ p, n: (p.scopes.includes(s.scope) ? 5 : 0) + (p.scopes.includes("site-demo") ? 1 : 0) + (s.skills.some((k) => p.role.toLowerCase().includes(k.split(" ")[0].toLowerCase())) ? 2 : 0) }))
      .filter((x) => x.n > 0 && x.p.display !== s.primary).sort((a, b) => b.n - a.n).slice(0, 3).map((x) => x.p.display);
    setRec({ scope: s.scope, ids: scored });
  };
  const dirty = JSON.stringify(rows) !== JSON.stringify(scopes);
  return (
    <div>
      <div className="card-foot" style={{ borderTop: 0, borderBottom: "1px solid var(--border)" }}>
        <span className="muted" style={{ fontSize: 12 }}>P primary, B backup. {editable ? "Click to set primary; Alt-click to toggle a backup." : "Read only for your role."}</span>
        <span className="spacer" />
        {msg ? <span className="feedback" role="status">{msg}</span> : null}
        {dirty ? <><span className="feedback" role="status">Changed, not saved (illustrative)</span><button type="button" className="btn btn-sm btn-quiet" onClick={() => { setRows(scopes); setMsg(null); }}>Reset</button></> : null}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="amatrix">
          <caption className="sr-only">Assignments by scope and person</caption>
          <thead><tr><th scope="col">Scope</th>{people.map((p) => <th key={p.id} scope="col" title={p.display}>{p.display.replace("Operator", "Op.").replace("Process engineer", "Proc. eng.").replace("Quality head", "Quality").replace("Shift lead", "Shift lead").replace("Plant head", "Plant head")}</th>)}<th scope="col">Skills</th><th scope="col" /></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.scope}>
              <td><b>{s.label}</b></td>
              {people.map((p) => { const k = s.primary === p.display ? "p" : s.backups.includes(p.display) ? "b" : ""; const r = rec?.scope === s.scope && rec.ids.includes(p.display);
                return <td key={p.id}><button type="button" disabled={!editable} className={`${k}${r ? " rec" : ""}`} aria-label={`${s.label}, ${p.display}: ${k === "p" ? "primary" : k === "b" ? "backup" : "none"}`}
                  onClick={(e) => { setMsg(null); if (e.altKey) toggleBackup(s.scope, p.display); else setPrimary(s.scope, p.display); }}
                  onContextMenu={(e) => { e.preventDefault(); setMsg(null); toggleBackup(s.scope, p.display); }}>{k === "p" ? "P" : k === "b" ? "B" : ""}</button></td>; })}
              <td style={{ textAlign: "left" }}>{s.skills.join(", ")}</td>
              <td><button type="button" className="btn btn-sm btn-quiet" onClick={() => recommend(s)}>Suggest</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rec ? <div className="card-foot"><span style={{ fontSize: 12 }}>Recommended backups for {rows.find((r) => r.scope === rec.scope)?.label}: {rec.ids.join(", ") || "nobody in scope"} (dashed outline)</span><span className="spacer" /><button type="button" className="btn btn-sm btn-quiet" onClick={() => setRec(null)}>Clear</button></div> : null}
    </div>
  );
}
