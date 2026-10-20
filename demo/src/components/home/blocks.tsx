/** Home building blocks shared by the four views. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { Line, ShiftEvent } from "@/lib/demo/types";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { RunChart } from "@/components/ui/charts";
import { LineModeTag, Tag, VerdictTag, EvidenceTag } from "@/components/ui/primitives";

export const proofHref = (id: string) => {
  const p = D.byId.proof(id);
  if (!p) return "/process";
  return p.objectType === "lot" ? `/quality?evidence=${id}` : `/process?evidence=${id}`;
};

export function lineSeries(line: Line) {
  const rs = D.runs.filter((r) => r.lineId === line.id).slice(-24);
  const name = line.type === "batch" ? "Viscosity" : "Scrap rate";
  return { values: rs.map((r) => r.outcomes.find((o) => o.name === name)!.value), name, unit: line.type === "batch" ? "mPa·s" : "%", spec: (line.type === "batch" ? [2380, 2600] : [0, 4]) as [number, number] };
}

export function LineStrip() {
  return (
    <div className="linestrip" role="list" aria-label="Lines">
      {D.lines.map((l) => {
        const s = lineSeries(l);
        const waiting = D.proposals.filter((p) => p.lineId === l.id && p.state === "Waiting").length;
        return (
          <div className="linecell" role="listitem" key={l.id}>
            <div>
              <h3><Link href={`/process?line=${l.id}`}>{l.name}</Link><LineModeTag mode={l.mode} /></h3>
              <div className="secondary" style={{ marginTop: 2 }}>{l.product} · {l.status}</div>
              <div className="facts">
                {l.kpis.map((k) => <div className="fact" key={k.label}><div className="label">{k.label}</div><div className="v">{k.value}{k.unit ? <span className="unit">{k.unit}</span> : null}</div></div>)}
                <div className="fact"><div className="label">Waiting</div><div className="v" style={waiting ? { color: "var(--accent-700)" } : undefined}>{waiting}</div></div>
              </div>
            </div>
            <div>
              <div className="label" style={{ display: "flex", justifyContent: "space-between" }}><span>{s.name}, last 24 {l.type === "batch" ? "batches" : "shift runs"}</span></div>
              <RunChart values={s.values} spec={l.type === "batch" ? s.spec : undefined} width={220} height={84} label={`${s.name} trend on ${l.short}`} highlightFrom={l.mode === "Trial" ? 14 : undefined} />
              <div className="muted" style={{ fontSize: 11 }}>{l.mode === "Trial" ? "Shaded: trial running" : `Spec under ${s.spec[1]} ${s.unit}`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ShiftTimeline({ events = D.shiftEvents, limit }: { events?: ShiftEvent[]; limit?: number }) {
  const list = [...events].reverse().slice(0, limit);
  return (
    <ol className="timeline">
      {list.map((e, i) => (
        <li key={i}>
          <span className="t">{hhmm(e.at)}</span>
          <span className={`m k-${e.kind}`} aria-hidden />
          <span><span className="muted">{D.byId.line(e.lineId)!.short} · </span>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}

export function LotsAtRisk({ limit = 4 }: { limit?: number }) {
  const lots = D.lots.filter((l) => l.riskWord === "At risk").slice(0, limit);
  return (
    <div className="rows">
      {lots.map((l) => {
        const prop = D.lotProperties.find((p) => p.lotId === l.id)!;
        const spec = D.specs.find((s) => s.gradeId === l.gradeId)!;
        return (
          <Link className="row" key={l.id} href={`/quality?lot=${l.id}`} style={{ gridTemplateColumns: "88px minmax(0,1fr) auto" }}>
            <span className="mono">{l.id.replace("lot-", "").toUpperCase()}</span>
            <span style={{ minWidth: 0 }}>
              <span className="row-title" style={{ display: "block" }}>{prop.name} {prop.predicted.point} {prop.unit}</span>
              <span className="row-sub">Band {prop.predicted.low} to {prop.predicted.high}, spec {spec.lsl} to {spec.usl} · {prop.anchored ? "anchored" : "unanchored"}</span>
            </span>
            <Tag tone="warning">At risk</Tag>
          </Link>
        );
      })}
    </div>
  );
}

export function ProofUpdates({ limit = 4 }: { limit?: number }) {
  return (
    <div className="rows">
      {D.proofRecords.filter((p) => p.verdict !== "Withheld").slice(0, limit).map((p) => (
        <Link className="row" key={p.id} href={proofHref(p.id)} style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
          <span style={{ minWidth: 0 }}>
            <span className="row-title" style={{ display: "block" }}>{p.title}</span>
            <span className="row-sub num">{p.effect.measure} {p.effect.value > 0 ? "+" : ""}{p.effect.value} {p.effect.unit}, interval {p.effect.low} to {p.effect.high}</span>
          </span>
          <VerdictTag verdict={p.verdict} />
          <Tag tone={p.rung === "R3" || p.rung === "R4" ? "success" : "neutral"}>{p.rung}</Tag>
        </Link>
      ))}
    </div>
  );
}

export function RecentActivity({ limit = 6 }: { limit?: number }) {
  return (
    <div className="rows">
      {D.auditEvents.slice(0, limit).map((a) => (
        <div className="row" key={a.id} style={{ gridTemplateColumns: "92px minmax(0,1fr) auto" }}>
          <span className="mono muted">{dayMonth(a.at)} {hhmm(a.at)}</span>
          <span className="row-title" style={{ fontWeight: 400 }}>{D.byId.person(a.personId)!.display} <span className="secondary">{a.action.toLowerCase()}</span> <span className="mono muted">{a.objectId}</span></span>
          <span className="muted" style={{ fontSize: 12 }}>{rel(a.at)}</span>
        </div>
      ))}
    </div>
  );
}

export function NoteClaims({ id }: { id: string }) {
  const n = D.notes.find((x) => x.id === id)!;
  return (
    <div className="ask-claims" style={{ padding: "var(--space-3) var(--space-4)" }}>
      {n.claims.map((c) => (
        <div className="ask-claim" key={c.text}><span>{c.text}</span><span className="meta"><EvidenceTag label={c.label} />{c.evidenceIds.map((e) => <span key={e} className="mono muted">{e}</span>)}</span></div>
      ))}
    </div>
  );
}
