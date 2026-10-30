/**
 * Loop health gauge.
 * Arc + threshold bands inspired by Tremor GaugeChart
 * (https://github.com/Rouic/tremor-gauge), restyled to Stamped tokens.
 */

export function gaugeRange(value: number, low = 0, high = 100): [number, number] {
  let lo = low;
  let hi = high;
  if (!(hi > lo)) {
    lo = Math.min(lo, value - 1);
    hi = Math.max(hi, value + 1);
  }
  return [lo, hi];
}

function share(x: number, low: number, high: number) {
  return Math.max(0, Math.min(1, (x - low) / (high - low)));
}

function toneFor(value: number, tone?: string) {
  if (tone) return tone;
  if (value < 50) return "var(--critical)";
  if (value < 75) return "var(--warning)";
  return "var(--success)";
}

export function LoopHealthGauge({
  label,
  value,
  unit = "/100",
  low = 0,
  high = 100,
  tone,
  line,
}: {
  label: string;
  value: number;
  unit?: string;
  low?: number;
  high?: number;
  tone?: string;
  line?: string;
}) {
  const [min, max] = gaugeRange(value, low, high);
  const colour = toneFor(value, tone);
  const cx = 100;
  const cy = 100;
  const r = 78;
  const point = (x: number, radius = r) => {
    const angle = Math.PI * (1 - share(x, min, max));
    return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)] as const;
  };
  const arc = (from: number, to: number, radius = r) => {
    const [x0, y0] = point(from, radius);
    const [x1, y1] = point(to, radius);
    const large = share(to, min, max) - share(from, min, max) > 0.5 ? 1 : 0;
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
  };
  // Threshold bands: critical <50, warning <75, success >=75 (Tremor-style zones)
  const bandCritical = Math.min(50, max);
  const bandWarn = Math.min(75, max);
  return (
    <article className="pc-gauge">
      <svg viewBox="0 0 200 128" role="img" aria-label={`${label}: ${value} ${unit}`}>
        <path d={arc(min, max)} className="pc-gauge-track" />
        {bandCritical > min ? <path d={arc(min, bandCritical)} className="pc-gauge-band pc-gauge-band-critical" /> : null}
        {bandWarn > bandCritical ? <path d={arc(bandCritical, bandWarn)} className="pc-gauge-band pc-gauge-band-warning" /> : null}
        {max > bandWarn ? <path d={arc(bandWarn, max)} className="pc-gauge-band pc-gauge-band-success" /> : null}
        <path d={arc(min, value)} stroke={colour} className="pc-gauge-value" />
        {/* needle tip */}
        {(() => {
          const [nx, ny] = point(value, r - 6);
          return <circle cx={nx} cy={ny} r={3.5} fill={colour} />;
        })()}
        <text x="22" y="118" className="pc-gauge-end" textAnchor="middle">
          {min}
        </text>
        <text x="178" y="118" className="pc-gauge-end" textAnchor="middle">
          {max}
        </text>
      </svg>
      <div className="pc-gauge-number">
        <b className="num" style={{ color: colour }}>
          {value}
        </b>
        <span>{unit}</span>
      </div>
      <strong className="pc-gauge-name">{label}</strong>
      {line ? <small className="pc-gauge-line">{line}</small> : null}
    </article>
  );
}
