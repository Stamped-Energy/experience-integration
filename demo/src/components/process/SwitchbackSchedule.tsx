/** Switchback schedule: one cell per run, arm A (prior) or B (change), skipped switches with their reason, planned runs still to come. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { Trial } from "@/lib/demo/types";
import { runLabel } from "./common";

export function SwitchbackSchedule({ trial }: { trial: Trial }) {
  const plan = D.measurementPlans.find((m) => m.id === trial.measurementPlanId);
  const todo = Math.max(0, (plan?.minBatches ?? trial.switches.length) - trial.switches.length);
  return (
    <>
      <div className="sw-grid" style={{ gridTemplateColumns: `repeat(${Math.ceil((trial.switches.length + todo) / ((trial.switches.length + todo) > 12 ? 2 : 1))}, minmax(0, 1fr))` }} role="list" aria-label={`Switchback schedule for ${trial.id}`}>
        {trial.switches.map((s) => {
          const run = D.runs.find((r) => r.id === s.runId)!;
          return (
            <div key={s.runId} role="listitem" className={`sw ${s.arm}${s.skippedReason ? " sw-skip" : ""}`} title={s.skippedReason}>
              <span className="arm">{s.arm} {s.arm === "B" ? "change" : "prior"}</span>
              <Link href={`/process/runs/${run.id}`} className="mono">{runLabel(run).replace(/^\D+/, "")}</Link>
              <span className="muted">{s.skippedReason ? "Skipped" : "Written"}</span>
            </div>
          );
        })}
        {Array.from({ length: todo }, (_, i) => <div key={`t${i}`} role="listitem" className="sw todo"><span className="arm">{(trial.switches.length + i) % 2 === 0 ? "B" : "A"}</span><span>Planned</span></div>)}
      </div>
      <div className="chart-legend" style={{ paddingTop: 8 }}>
        <span>B: change applied</span><span>A: prior configuration</span><span>Shaded amber: switch skipped and recorded</span><span>Grey: planned</span>
      </div>
    </>
  );
}
