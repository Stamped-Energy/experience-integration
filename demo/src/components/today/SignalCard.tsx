"use client";

import type { StatusTone } from "@/components/ui/primitives";
import { STATUS_LABELS } from "@/components/ui/primitives";
import { StatusDot } from "@/components/ui/indicators";

export function SignalCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: StatusTone;
}) {
  return (
    <article className={`forge-signal-card forge-signal-card--${tone}`} data-tone={tone}>
      <div className="forge-signal-card__dot" aria-hidden>
        <StatusDot tone={tone} size={7} pulse={tone === "critical"} />
      </div>
      <p className="forge-signal-card__label">{label}</p>
      <p className="forge-signal-card__value tabular">{value}</p>
      {hint ? <p className="forge-signal-card__hint">{hint}</p> : null}
      <span className="sr-only">{STATUS_LABELS[tone]}</span>
    </article>
  );
}
