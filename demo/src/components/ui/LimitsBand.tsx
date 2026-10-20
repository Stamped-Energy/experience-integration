/** Limits band (spec §12.2): signed window in sunken grey, Stamped's narrowing hatched, current as a dot, proposal as an accent tick. */
export interface LimitsBandProps {
  name: string; unit: string; signed: [number, number]; narrowed?: [number, number];
  current: number; proposed?: number; signedBy: string; signedAt: string; signerRole?: string; large?: boolean;
}
export function LimitsBand({ name, unit, signed, narrowed, current, proposed, signedBy, signedAt, large }: LimitsBandProps) {
  const span = signed[1] - signed[0];
  const L = signed[0] - span * 0.08, H = signed[1] + span * 0.08;
  const p = (v: number) => `${((v - L) / (H - L)) * 100}%`;
  const w = (a: number, b: number) => `${((b - a) / (H - L)) * 100}%`;
  return (
    <div className="limits" style={large ? { fontSize: 16 } : undefined}>
      <div className="conf-line1">
        <span className="secondary">{name}</span>
        <span className="conf-value num">{current} {unit}</span>
        {proposed !== undefined ? <span className="num" style={{ color: "var(--accent-700)", fontWeight: 600 }}>to {proposed} {unit}</span> : null}
      </div>
      <div className="limits-scale" role="img" aria-label={`${name}: signed ${signed[0]} to ${signed[1]} ${unit}${narrowed ? `, Stamped narrowed to ${narrowed[0]} to ${narrowed[1]}` : ""}, current ${current}${proposed !== undefined ? `, proposed ${proposed}` : ""}`}>
        <div className="axis" />
        <div className="signed" style={{ left: p(signed[0]), width: w(signed[0], signed[1]) }} />
        {narrowed ? <div className="narrowed" style={{ left: p(narrowed[0]), width: w(narrowed[0], narrowed[1]) }} /> : null}
        <div className="current" style={{ left: p(current) }} />
        {proposed !== undefined ? <div className="proposed" style={{ left: p(proposed) }} /> : null}
      </div>
      <div className="limits-ticks" style={{ paddingLeft: p(signed[0]), paddingRight: `calc(100% - ${p(signed[1])})` }}>
        <span>{signed[0]}</span>{narrowed ? <span>{narrowed[0]} to {narrowed[1]} narrowed</span> : null}<span>{signed[1]}</span>
      </div>
      <div className="limits-legend">
        <span><i className="k-signed" />Signed by {signedBy} · {signedAt}</span>
        {narrowed ? <span><i className="k-narrow" />Stamped narrowing</span> : null}
        <span><i className="k-current" />Now</span>
        {proposed !== undefined ? <span><i className="k-prop" />Proposed</span> : null}
      </div>
    </div>
  );
}
