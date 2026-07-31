/**
 * Industrial-style sweep dial (≈250° arc) with tick marks, colored
 * load zones, and a needle - adapted from stamped-energy-dashboard.
 */
const START = 145;
const SWEEP = 250;

/** Stable SVG coords across SSR/client (avoids float hydration drift). */
function r4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [r4(cx + r * Math.cos(rad)), r4(cy + r * Math.sin(rad))];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r4(r)} ${r4(r)} 0 ${large} 1 ${x1} ${y1}`;
}

export function LoadDial({
  loadPct,
  value,
  max = 120,
  size = 118,
  label,
  unit = "%",
  displayText,
}: {
  /** Legacy prop - same as `value`. */
  loadPct?: number;
  value?: number;
  max?: number;
  size?: number;
  label: string;
  unit?: string;
  /** Overrides the numeric readout in the dial centre. */
  displayText?: string;
}) {
  const raw = value ?? loadPct ?? 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const pct = Math.max(0, Math.min(1, raw / max));
  const angle = START + SWEEP * pct;

  /** Coloured bands always use the standard 0–120% load scale. */
  const zNormal = 85 / 120;
  const zWarn = 100 / 120;

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = START + (SWEEP * i) / 10;
    const [ox, oy] = polar(cx, cy, r, a);
    const [ix, iy] = polar(cx, cy, r - (i % 5 === 0 ? 10 : 6), a);
    return { ox, oy, ix, iy, major: i % 5 === 0 };
  });

  const [nx, ny] = polar(cx, cy, r - 14, angle);

  const valueColor =
    raw > max * 0.85 ? "var(--forge-error)" : raw > max * 0.7 ? "var(--forge-warning)" : "var(--forge-tertiary)";

  const centreMain = displayText ?? String(Math.round(raw));
  const centreFontSize = r4(
    displayText && displayText.length > 4 ? size * 0.13 : size * 0.18,
  );

  return (
    <div
      role="img"
      aria-label={`${label} load ${Math.round(raw)} percent`}
      style={{ width: size, textAlign: "center" }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP * zNormal)}
          fill="none"
          stroke="var(--forge-tertiary)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.55}
        />
        <path
          d={arcPath(cx, cy, r, START + SWEEP * zNormal, START + SWEEP * zWarn)}
          fill="none"
          stroke="var(--forge-warning)"
          strokeWidth={5}
          opacity={0.55}
        />
        <path
          d={arcPath(cx, cy, r, START + SWEEP * zWarn, START + SWEEP)}
          fill="none"
          stroke="var(--forge-error)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.7}
        />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.ox}
            y1={t.oy}
            x2={t.ix}
            y2={t.iy}
            stroke="var(--forge-outline)"
            strokeWidth={t.major ? 1.4 : 0.8}
            opacity={0.7}
          />
        ))}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={valueColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ transition: "all 0.8s cubic-bezier(.2,.8,.2,1)" }}
        />
        <circle cx={cx} cy={cy} r={5} fill="var(--forge-secondary)" />
        <circle cx={cx} cy={cy} r={2} fill={valueColor} />
        <text
          x={cx}
          y={r4(cy + r * 0.55)}
          textAnchor="middle"
          fontFamily="var(--forge-font-display)"
          fontWeight={800}
          fontSize={centreFontSize}
          fill={valueColor}
        >
          {centreMain}
          {unit ? (
            <tspan fontSize={r4(size * 0.1)} dx={1}>
              {unit}
            </tspan>
          ) : null}
        </text>
        {label ? (
          <text
            x={cx}
            y={r4(cy + r * 0.78)}
            textAnchor="middle"
            fontFamily="var(--forge-font-body)"
            fontWeight={600}
            fontSize={r4(size * 0.085)}
            fill="var(--forge-on-surface-variant)"
            style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
