/**
 * Alarms-over-days bar strip.
 * Layout inspired by Tremor BarChart docs
 * (https://tremor.so/docs/visualizations/bar-chart) and shadcn chart cards
 * (https://ui.shadcn.com/charts), restyled to Stamped tokens.
 */
export function AlarmBars({
  values,
  label = "Alarms per day",
}: {
  values: number[];
  label?: string;
}) {
  const max = Math.max(1, ...values);
  const w = 320;
  const h = 88;
  const padL = 8;
  const padB = 18;
  const padT = 8;
  const plotH = h - padB - padT;
  const slot = (w - padL) / values.length;
  const bw = Math.min(14, slot * 0.55);
  return (
    <div className="anal-alarm">
      <svg className="anal-alarm-plot" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} width="100%" height={h}>
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={w}
            y1={padT + plotH * (1 - f)}
            y2={padT + plotH * (1 - f)}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
        ))}
        {values.map((v, i) => {
          const barH = (v / max) * plotH;
          const x = padL + slot * i + (slot - bw) / 2;
          const y = padT + plotH - barH;
          const tone = v >= 3 ? "var(--critical)" : v >= 2 ? "var(--warning)" : "var(--accent-500)";
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={Math.max(barH, v > 0 ? 2 : 0)} rx={2} fill={tone} opacity={0.9} />
              {(i === 0 || i === values.length - 1 || i % 3 === 0) && (
                <text x={x + bw / 2} y={h - 4} textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontFamily="var(--font-geist-mono), monospace">
                  D{i + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
