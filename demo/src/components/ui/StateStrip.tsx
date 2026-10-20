/** Card state strip (spec §7.3, old showcase closure timeline). Shows the main path with the current state marked. */
import type { CardState } from "@/lib/demo/types";

const PATH: CardState[] = ["Noticed", "Proposed", "Waiting", "Running stay", "Measuring", "Verdict", "Holding"];
const TERMINAL: CardState[] = ["Declined", "Expired", "Withheld", "Abstained", "Stopped"];

export function StateStrip({ state }: { state: CardState }) {
  const path = state === "Running trial" ? PATH.map((s) => (s === "Running stay" ? "Running trial" : s)) : [...PATH];
  let idx = path.indexOf(state);
  let steps = path;
  if (idx < 0 && TERMINAL.includes(state)) {
    const cut = state === "Withheld" || state === "Abstained" ? 2 : state === "Stopped" ? 4 : 3;
    steps = [...path.slice(0, cut), state];
    idx = steps.length - 1;
  }
  return (
    <div className="strip" aria-label={`State: ${state}`}>
      {steps.map((s, i) => (
        <span key={s} style={{ display: "contents" }}>
          {i > 0 ? <span className="bar" /> : null}
          <span className={`st${i < idx ? " done" : i === idx ? " now" : ""}`} aria-current={i === idx ? "step" : undefined}>{s.replace("Running ", "")}</span>
        </span>
      ))}
    </div>
  );
}
