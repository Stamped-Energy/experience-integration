/** Charts as plain SVG (design system R15): subject series in accent, comparison grey, spec lines only where they matter. */
export function RunChart({ values, spec, height = 120, width = 560, label, highlightFrom }: { values: number[]; spec?: [number, number]; height?: number; width?: number; label: string; highlightFrom?: number }) {
  const lo = Math.min(...values, spec?.[0] ?? Infinity), hi = Math.max(...values, spec?.[1] ?? -Infinity);
  const pad = (hi - lo) * 0.12 || 1;
  const y = (v: number) => height - 16 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (height - 24);
  const x = (i: number) => 32 + (i / (values.length - 1)) * (width - 40);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const breach = spec ? values.map((v, i) => (v < spec[0] || v > spec[1] ? i : -1)).filter((i) => i >= 0) : [];
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
      {spec ? (
        <>
          <line x1={32} x2={width - 8} y1={y(spec[1])} y2={y(spec[1])} stroke="var(--border-strong)" strokeDasharray="3 3" />
          <line x1={32} x2={width - 8} y1={y(spec[0])} y2={y(spec[0])} stroke="var(--border-strong)" strokeDasharray="3 3" />
          <text x={0} y={y(spec[1]) + 3}>{spec[1]}</text>
          <text x={0} y={y(spec[0]) + 3}>{spec[0]}</text>
        </>
      ) : null}
      {highlightFrom !== undefined ? <rect x={x(highlightFrom)} y={4} width={x(values.length - 1) - x(highlightFrom)} height={height - 20} fill="var(--info-tint)" /> : null}
      <polyline points={pts} fill="none" stroke="var(--accent-500)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={breach.includes(i) ? 3 : 1.6} fill={breach.includes(i) ? "var(--critical)" : "var(--accent-500)"} />)}
    </svg>
  );
}

/** Weekly bars, two series side by side, never stacked (Verified vs Indicative are not added). */
export function PairedBars({ a, b, labels, height = 140, width = 560, label }: { a: number[]; b: number[]; labels: string[]; height?: number; width?: number; label: string }) {
  const max = Math.max(...a, ...b) * 1.1;
  const slot = (width - 32) / a.length;
  const bw = Math.min(14, slot / 3);
  const h = (v: number) => (v / max) * (height - 24);
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {[0.5, 1].map((f) => <line key={f} x1={32} x2={width} y1={height - 18 - (height - 24) * f} y2={height - 18 - (height - 24) * f} stroke="var(--border)" />)}
      <line x1={32} x2={width} y1={height - 18} y2={height - 18} stroke="var(--border-strong)" />
      <text x={0} y={height - 18 - (height - 24) + 4}>{Math.round(max)}k</text>
      {a.map((v, i) => {
        const cx = 32 + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={height - 18 - h(v)} width={bw} height={h(v)} fill="var(--accent-500)" />
            <rect x={cx + 1} y={height - 18 - h(b[i])} width={bw} height={h(b[i])} fill="var(--surface)" stroke="var(--text-muted)" strokeDasharray="2 2" />
            <text x={cx} y={height - 4} textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkline({ values, width = 120, height = 28, label }: { values: number[]; width?: number; height?: number; label: string }) {
  const lo = Math.min(...values), hi = Math.max(...values);
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 2 - ((v - lo) / (hi - lo || 1)) * (height - 4)).toFixed(1)}`).join(" ");
  return <svg className="chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}><polyline points={pts} fill="none" stroke="var(--accent-500)" strokeWidth={1.5} /></svg>;
}
