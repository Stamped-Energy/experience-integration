/** A word a first-time user may not know: dotted underline, plain explanation on hover or focus. */
import type { ReactNode } from "react";

export const GLOSSARY = {
  twin: "A computer model of this line, fitted to its own data. The agent tries changes on it before the real line sees them.",
  shadow: "Running alongside the line and learning, but writing nothing. A person promotes it before it acts.",
  band: "The range a value is expected to land in. A narrower band means the agent is surer.",
  signed: "Limits a named person signed beforehand. The agent can never go outside them.",
  MPC: "Model predictive control: looks a few minutes ahead and moves several settings together.",
  RL: "Reinforcement learning: a policy that learns from many past runs which choice works best.",
  PID: "The basic loop that holds one value, such as a temperature, at its setpoint.",
  "Rule-based": "Fixed steps and conditions from the line pack, such as charge, heat, hold, discharge.",
  "Run-to-run": "Suggests better settings for the next run from how the last runs went.",
  anchor: "A lab result for this lot. Without one the prediction rests only on the linked runs.",
  join: "How sure the link is between a lot and the runs that made it.",
} as const;

export function Term({ k, children }: { k: keyof typeof GLOSSARY; children?: ReactNode }) {
  return <span className="term" tabIndex={0} title={GLOSSARY[k]} data-tip={GLOSSARY[k]}>{children ?? k}</span>;
}
