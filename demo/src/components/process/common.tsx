/** Shared helpers for the Process area: hub chrome, crumbs and run lookups. */
import * as D from "@/lib/demo/data";
import type { Line, Run } from "@/lib/demo/types";
import type { Crumb } from "@/components/shell/Shell";
import { hubForProcessPath } from "@/lib/module/hubs";
import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";

export type ProcessTab =
  | "measurement" | "settings" | "model-fit" | "trials"
  | "simulate" | "modules" | "drift" | "tool-life" | "cycle-time" | "oee" | "smed"
  | "lines" | "actions" | "proposals";

/** @deprecated Use ProcessHubTabs. Kept so detail routes keep hub chrome. */
export function ProcessTabs(_props: { active: ProcessTab }) {
  return <ProcessHubTabs />;
}

export function processEyebrow(path: string): string {
  const hub = hubForProcessPath(path);
  return hub ? `Process · ${hub.sidebarLabel}` : "Process";
}

export const crumbs = (...rest: Crumb[]): Crumb[] => [{ label: "Demonstration plant", href: "/" }, { label: "Process", href: "/process/proposals" }, ...rest];

export const runsOf = (lineId: string) => D.runs.filter((r) => r.lineId === lineId);
export const packOf = (line: Line) => D.linePacks.find((p) => p.id === line.linePackId)!;
export const outcomeName = (line: Line) => packOf(line).labels.outcome;
export const outcome = (run: Run, name: string) => run.outcomes.find((o) => o.name === name);
export const specOf = (line: Line): [number, number] => packOf(line).spec;
export const runLabel = (run: Run) => `${packOf(D.byId.line(run.lineId)!).labels.run} ${run.id.split("-").pop()}`;

/** Trial that ran on this run, with its arm. */
export function trialArm(runId: string) {
  for (const t of D.trials) {
    const s = t.switches.find((x) => x.runId === runId);
    if (s) return { trial: t, sw: s };
  }
  return undefined;
}

/** Proof record that covers a run: its own, or the trial it belongs to. */
export function proofForRun(run: Run) {
  if (run.proofRecordId) return D.byId.proof(run.proofRecordId);
  const t = trialArm(run.id);
  return t ? D.proofRecords.find((p) => p.objectId === t.trial.id) : undefined;
}

export const evidenceHref = (base: string, proofId: string) => `${base}${base.includes("?") ? "&" : "?"}evidence=${proofId}`;
