/**
 * Confidence component (spec §7.1). Word label first, value in the item's own measure, a drawn band,
 * "Driven by" parts, and a Why disclosure. No single invented percentage: proposals and Ask answers show a label and
 * band only; lot links show link_confidence 0 to 1 because lot-join.md defines it.
 */
import type { EvidenceLabel, Rung, Verdict } from "@/lib/demo/types";
import { EvidenceTag, Tag, VerdictTag } from "./primitives";

export type ConfidenceProps =
  | { kind: "prediction"; label: EvidenceLabel; measure: string; unit: string; low: number; point: number; high: number; spec?: [number, number];
      intervalName?: string; drivers: string[]; fit: "accepted" | "not accepted"; safety?: { pass: boolean; rules: string[] }; method: string; evidenceIds?: string[] }
  | { kind: "link"; label: "verified" | "estimated" | "unverified"; score: number; threshold: number; status: string; drivers: string[]; method: string }
  | { kind: "verdict"; label: EvidenceLabel; verdict: Verdict; rung: Rung; effect: string; interval: string; diagnostics: string[]; method: string; withheldNeeds?: number }
  | { kind: "label"; label: EvidenceLabel; note: string; method: string; evidenceIds?: string[] };

const pct = (v: number, lo: number, hi: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`;

export function Confidence(props: ConfidenceProps) {
  return (
    <div className="conf">
      {props.kind === "prediction" ? <Prediction {...props} /> : null}
      {props.kind === "link" ? <Link_ {...props} /> : null}
      {props.kind === "verdict" ? <VerdictC {...props} /> : null}
      {props.kind === "label" ? (
        <div className="conf-line1"><EvidenceTag label={props.label} /><span className="secondary">{props.note}</span></div>
      ) : null}
      <details className="conf-why">
        <summary>Why this confidence</summary>
        <dl>
          <dt>Method</dt><dd>{props.method}</dd>
          {props.kind === "prediction" ? (<><dt>Model fit</dt><dd>{props.fit === "accepted" ? "Accepted, four checks passed" : "Not accepted, number withheld"}</dd>
            {props.safety ? (<><dt>Safety filter</dt><dd>{props.safety.pass ? "Passed" : "Failed"}: {props.safety.rules.join("; ")}</dd></>) : null}</>) : null}
          {"evidenceIds" in props && props.evidenceIds ? (<><dt>Evidence</dt><dd className="mono">{props.evidenceIds.join(", ")}</dd></>) : null}
          {props.kind === "verdict" ? (<><dt>Diagnostics</dt><dd>{props.diagnostics.join("; ") || "None run yet"}</dd></>) : null}
        </dl>
      </details>
    </div>
  );
}

function Prediction(p: Extract<ConfidenceProps, { kind: "prediction" }>) {
  const lo = Math.min(p.low, p.spec?.[0] ?? p.low), hi = Math.max(p.high, p.spec?.[1] ?? p.high);
  const pad = (hi - lo) * 0.15;
  const L = lo - pad, H = hi + pad;
  const breach = p.spec ? p.low < p.spec[0] || p.high > p.spec[1] : false;
  return (
    <>
      <div className="conf-line1">
        <EvidenceTag label={p.label} />
        <span className="secondary">{p.measure}</span>
        <span className="conf-value">{p.point} {p.unit}</span>
        <span className="muted num">{p.intervalName ?? "90% interval"} {p.low} to {p.high}</span>
        {p.fit === "not accepted" ? <Tag tone="warning">Fit not accepted</Tag> : null}
        {p.safety && !p.safety.pass ? <Tag tone="critical">Safety filter failed</Tag> : null}
      </div>
      <div className={`conf-band${breach ? " breach" : ""}`} aria-hidden>
        <div className="axis" />
        {p.spec ? <div className="spec" style={{ left: pct(p.spec[0], L, H), width: `calc(${pct(p.spec[1], L, H)} - ${pct(p.spec[0], L, H)})` }} /> : null}
        <div className="interval" style={{ left: pct(p.low, L, H), width: `calc(${pct(p.high, L, H)} - ${pct(p.low, L, H)})` }} />
        <div className="point" style={{ left: pct(p.point, L, H) }} />
      </div>
      <div className="conf-drivers">
        {p.spec ? <>Spec {p.spec[0]} to {p.spec[1]} {p.unit} (dashed). </> : null}Driven by {p.drivers.join(", ")}.
      </div>
    </>
  );
}

function Link_(p: Extract<ConfidenceProps, { kind: "link" }>) {
  const below = p.score < p.threshold;
  return (
    <>
      <div className="conf-line1">
        <Tag tone={p.label === "unverified" ? "warning" : "neutral"}>{p.label}</Tag>
        <span className="secondary">Link</span>
        <span className="conf-value mono">{p.score.toFixed(2)}</span>
        <span className="muted">{p.status}{below ? `, below pack threshold ${p.threshold}` : ""}</span>
      </div>
      <div className="conf-meter" aria-hidden>
        <div className="track"><div className="fill" style={{ width: `${p.score * 100}%` }} /><div className="thr" style={{ left: `${p.threshold * 100}%` }} /></div>
      </div>
      <div className="conf-drivers">Driven by {p.drivers.join(", ")}.</div>
    </>
  );
}

function VerdictC(p: Extract<ConfidenceProps, { kind: "verdict" }>) {
  return (
    <>
      <div className="conf-line1">
        <VerdictTag verdict={p.verdict} />
        <Tag tone={p.rung === "R3" || p.rung === "R4" ? "success" : "neutral"}>{p.rung}{p.rung === "R3" || p.rung === "R4" ? " Verified" : ""}</Tag>
        <EvidenceTag label={p.label} />
      </div>
      <div className="conf-drivers">
        {p.withheldNeeds ? <>Withheld: needs {p.withheldNeeds} more batches. </> : null}
        Effect {p.effect}, interval {p.interval}.
      </div>
    </>
  );
}
