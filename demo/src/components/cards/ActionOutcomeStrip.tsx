import type { ActionOutcome } from "@/lib/demo/types";
import { outcomePhrase } from "@/lib/demo/actions";
import { Tag } from "@/components/ui/primitives";

const TAG: Record<ActionOutcome["label"], string> = {
  Measured: "MEASURED",
  Estimated: "ESTIMATED",
  Modelled: "MODELLED",
  Assumed: "ASSUMED",
  Unknown: "UNKNOWN",
};

/** Compact outcome for a wide action card row. Shows measured-after next to modelled when present. */
export function ActionOutcomeChip({ outcome }: { outcome: ActionOutcome }) {
  const { metric, now, after } = outcomePhrase(outcome);
  return (
    <div className="ex-outcome-chip">
      <span className="ex-outcome-chip-metric">{metric}</span>
      <span className="ex-outcome-chip-row">
        <span className="ex-outcome-chip-val num tabular">
          <span className="ex-outcome-chip-before">{now}</span>
          <span className="ex-outcome-arrow" aria-hidden>
            {" "}
            →{" "}
          </span>
          <span className="ex-outcome-after">{after}</span>
          {outcome.measuredAfter ? (
            <span className="ex-outcome-measured" title="Measured on the line after the change">
              {" "}
              · line {outcome.measuredAfter}
            </span>
          ) : null}
        </span>
        <Tag tone="neutral">{TAG[outcome.label]}</Tag>
      </span>
    </div>
  );
}

export function ActionOutcomeStrip({ outcomes }: { outcomes: ActionOutcome[] }) {
  return (
    <div className="ex-outcome-strip" role="list">
      {outcomes.map((o) => (
        <ActionOutcomeChip key={o.metric} outcome={o} />
      ))}
    </div>
  );
}
