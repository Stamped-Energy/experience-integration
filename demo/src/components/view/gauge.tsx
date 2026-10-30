/** Loop health gauge dial (from PlantCraft CardView GaugeDial, Apache-2.0). */

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

export function LoopHealthGauge({
  label,
  value,
  unit = "%",
  low = 0,
  high = 100,
  tone,
}: {
  label: string;
  value: number;
  unit?: string;
  low?: number;
  high?: number;
  tone?: string;
}) {
  const [min, max] = gaugeRange(value, low, high);
  const point = (x: number, radius = 80) => {
    const angle = Math.PI * (1 - share(x, min, max));
    return [100 + radius * Math.cos(angle), 100 - radius * Math.sin(angle)] as const;
  };
  const arc = (from: number, to: number) => {
    const [x0, y0] = point(from);
    const [x1, y1] = point(to);
    return `M ${x0} ${y0} A 80 80 0 0 1 ${x1} ${y1}`;
  };
  const colour = tone ?? "var(--accent)";
  return (
    <div className="pc-gauge">
      <svg viewBox="-16 -14 232 128" role="img" aria-label={`${label}: ${value} ${unit}`}>
        <path d={arc(min, max)} className="pc-gauge-track" />
        <path d={arc(min, value)} stroke={colour} className="pc-gauge-value" />
        <text x="20" y="110" className="pc-gauge-end" textAnchor="middle">
          {min}
        </text>
        <text x="180" y="110" className="pc-gauge-end" textAnchor="middle">
          {max}
        </text>
      </svg>
      <div className="pc-gauge-number">
        <b className="num" style={{ color: colour }}>
          {value}
        </b>
        <span>{unit}</span>
      </div>
      <small className="pc-gauge-name">{label}</small>
    </div>
  );
}
