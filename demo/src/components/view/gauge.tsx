"use client";

/**
 * Loop health gauge: single semicircle track + value arc (PlantCraft GaugeDial pattern, Apache-2.0).
 * Value fill uses stroke-dasharray on the same path as the track so it never jumps the large-arc.
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
  const r = 72;
  const stroke = 10;
  // Upper semicircle: left → top → right (sweep 0 in SVG y-down coords).
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  const filled = Math.round(share(value, min, max) * 1000) / 10;
  return (
    <article className="pc-gauge">
      <svg viewBox="0 0 200 120" role="img" aria-label={`${label}: ${value} ${unit}`}>
        <path d={track} className="pc-gauge-track" strokeWidth={stroke} />
        {filled > 0 ? (
          <path
            d={track}
            stroke={colour}
            className="pc-gauge-value"
            strokeWidth={stroke}
            pathLength={100}
            strokeDasharray={`${filled} ${100 - filled}`}
          />
        ) : null}
        <text x={cx - r + 4} y={cy + 16} className="pc-gauge-end" textAnchor="middle">
          {min}
        </text>
        <text x={cx + r - 4} y={cy + 16} className="pc-gauge-end" textAnchor="middle">
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
