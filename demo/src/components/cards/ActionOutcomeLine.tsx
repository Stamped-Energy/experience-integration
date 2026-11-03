import type { ActionOutcome } from "@/lib/demo/types";
import { Tag } from "@/components/ui/primitives";

const TAG: Record<ActionOutcome["label"], string> = {
  Measured: "MEASURED",
  Estimated: "ESTIMATED",
  Modelled: "MODELLED",
  Assumed: "ASSUMED",
  Unknown: "UNKNOWN",
};

/** One-line metric, before, arrow, after (after in coral) plus basis tag. */
export function ActionOutcomeLine({ outcome, size = "card" }: { outcome: ActionOutcome; size?: "card" | "hero" }) {
  return (
    <p className={`ex-outcome ex-outcome--${size}`}>
      <span className="ex-outcome-lead">
        <span className="ex-outcome-metric">{outcome.metric}</span>{" "}
        <span className="num tabular">{outcome.before}</span>
        <span className="ex-outcome-arrow" aria-hidden>
          {" "}
          →{" "}
        </span>
        <span className="ex-outcome-after num tabular">{outcome.after}</span>
      </span>
      <span className="ex-outcome-tag">
        <Tag tone="neutral">{TAG[outcome.label]}</Tag>
      </span>
    </p>
  );
}
