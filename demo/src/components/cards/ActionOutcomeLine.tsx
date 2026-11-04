import type { ActionOutcome } from "@/lib/demo/types";
import { outcomePhrase } from "@/lib/demo/actions";
import { Tag } from "@/components/ui/primitives";

const TAG: Record<ActionOutcome["label"], string> = {
  Measured: "MEASURED",
  Estimated: "ESTIMATED",
  Modelled: "EXPECTED",
  Assumed: "ASSUMED",
  Unknown: "UNKNOWN",
};

/** One-line metric, before → after (coral) plus basis tag on the same baseline. */
export function ActionOutcomeLine({ outcome, size = "card" }: { outcome: ActionOutcome; size?: "card" | "hero" }) {
  const { metric, now, after } = outcomePhrase(outcome);
  return (
    <p className={`ex-outcome ex-outcome--${size}`}>
      <span className="ex-outcome-metric">{metric}</span>{" "}
      <span className="num tabular ex-outcome-now">{now}</span>
      <span className="ex-outcome-arrow-target">
        <span className="ex-outcome-arrow" aria-hidden>
          {" "}
          →{" "}
        </span>
        <span className="ex-outcome-after num tabular">{after}</span>
      </span>
      <span className="ex-outcome-tag">
        <Tag tone="neutral">{TAG[outcome.label]}</Tag>
      </span>
    </p>
  );
}
