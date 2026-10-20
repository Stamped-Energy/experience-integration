/**
 * Evidence on demand (spec Revision 3, §8 layer 5). Not an area: opens over the Process or Quality page that asked for it,
 * via `?evidence=<proofId>`. Shows the four-question staircase, verdict, rung, effect with interval, diagnostics,
 * the locked measurement plan and the source rows. Value at the plant's prices is never shown here (Home owner view only).
 */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth, hhmm } from "@/lib/format";
import { Confidence } from "@/components/ui/Confidence";
import { EmptyState, EvidenceTag, Illustrative, Tag } from "@/components/ui/primitives";
import type { EvidenceLabel } from "@/lib/demo/types";

const ORDER: EvidenceLabel[] = ["Unknown", "Assumed", "Modelled", "Estimated", "Measured"];
const weakest = (ls: EvidenceLabel[]) => ls.reduce((a, b) => (ORDER.indexOf(b) < ORDER.indexOf(a) ? b : a), "Measured" as EvidenceLabel);

export function EvidenceSheet({ proofId, closeHref }: { proofId: string; closeHref: string }) {
  const p = D.byId.proof(proofId);
  return (
    <>
      <Link href={closeHref} className="ev-scrim" aria-label="Close evidence" scroll={false} />
      <aside className="ev-sheet" role="dialog" aria-modal="false" aria-labelledby="ev-title">
        <div className="ev-head">
          <div style={{ minWidth: 0 }}>
            <div className="label">Evidence on demand · <span className="mono">{proofId}</span></div>
            <h2 id="ev-title">{p ? p.title : "Proof record not found"}</h2>
          </div>
          <Link href={closeHref} className="btn btn-sm btn-quiet" scroll={false}>Close</Link>
        </div>
        {!p ? (
          <div className="ev-body"><EmptyState title="No proof record with this id" body="The link may be old. Proof records open from a run, trial or lot." /></div>
        ) : (
          <div className="ev-body">
            <Confidence kind="verdict" label={weakest(p.questions.map((q) => q.label))} verdict={p.verdict} rung={p.rung}
              effect={p.verdict === "Withheld" ? "not measured yet" : `${p.effect.measure} ${p.effect.value > 0 ? "+" : ""}${p.effect.value} ${p.effect.unit}`}
              interval={p.verdict === "Withheld" ? "none" : `${p.effect.low} to ${p.effect.high} ${p.effect.unit}`} diagnostics={p.diagnostics}
              method={p.measurementPlanId ? `Measurement plan ${p.measurementPlanId}, locked before the trial` : "Before and after on matched runs"} withheldNeeds={p.withheldNeeds} />
            <ol className="stair" aria-label="Four questions">
              {p.questions.map((q, i) => (
                <li key={q.question} className={`stair-step${q.label === "Unknown" ? " open" : ""}`}>
                  <span className="stair-n">{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="stair-q">{q.question}</div>
                    <div className="stair-a">{q.answer}</div>
                    <div className="stair-meta"><EvidenceTag label={q.label} />{q.evidenceIds.map((e) => <a key={e} className="mono" href={`#${e}`}>{e}</a>)}</div>
                  </div>
                </li>
              ))}
            </ol>
            <dl className="ev-facts">
              <dt>Object</dt><dd className="mono">{p.objectType} {p.objectId}</dd>
              <dt>Rung</dt><dd>{p.rung}{p.rung === "R3" || p.rung === "R4" ? ", Verified" : ", not yet Verified (R3 or R4 needed)"}</dd>
              <dt>Measurement plan</dt><dd>{p.measurementPlanId ? <Link className="link" href={`/process/measurement?plan=${p.measurementPlanId}`}>{p.measurementPlanId}</Link> : "None, matched runs"}</dd>
              <dt>Method</dt><dd><Tag>{p.measurementPlanId ? "Switchback" : "Matched runs"}</Tag></dd>
            </dl>
            <div className="label" style={{ marginTop: 16 }}>Source rows</div>
            {p.sourceRows.length ? (
              <table className="table ev-rows">
                <thead><tr><th>Id</th><th>Tag</th><th className="right">Value</th><th>Quality</th><th>Label</th></tr></thead>
                <tbody>{p.sourceRows.map((r) => (
                  <tr key={r.id} id={r.id}><td className="mono">{r.id}</td><td>{r.tag}<div className="muted" style={{ fontSize: 11 }}>{dayMonth(r.at)} {hhmm(r.at)}</div></td><td className="right num">{r.value}</td>
                    <td>{r.qualityCode === "good" ? "Good" : <Tag tone="warning">{r.qualityCode === "uncertain" ? "Uncertain" : "Bad"}</Tag>}</td><td><EvidenceTag label={r.label} /></td></tr>
                ))}</tbody>
              </table>
            ) : <p className="muted" style={{ fontSize: 13 }}>No source rows yet. Rows appear once the first measured run ends.</p>}
            <div className="ev-foot"><Illustrative /><span className="muted">Value at the plant&apos;s prices is shown on Home, owner view, never inside a proof record.</span></div>
          </div>
        )}
      </aside>
    </>
  );
}
