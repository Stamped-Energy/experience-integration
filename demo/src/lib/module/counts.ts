import { exampleActions } from "@/lib/demo/actions";
import * as A from "@/lib/demo/agent";
import * as D from "@/lib/demo/data";
import { loopCampaigns } from "@/lib/demo/loopRuns";
import { belowThreshold } from "@/components/quality/common";

export function countForScreen(moduleId: "process" | "quality", screenId: string): number | undefined {
  if (moduleId === "process") {
    if (screenId === "actions") return D.proposals.filter((p) => p.state === "Waiting").length;
    if (screenId === "actions-queue") return exampleActions.filter((a) => a.area === "Process" && !a.closed && a.who.how !== "Record only").length;
    if (screenId === "optimisation") return loopCampaigns.filter((c) => c.area === "process" && c.kind === "optimisation").length;
    if (screenId === "simulations") return loopCampaigns.filter((c) => c.area === "process" && c.kind === "simulation").length;
    if (screenId === "trials") return D.trials.filter((t) => t.status === "running" || t.status === "awaiting signature").length;
    if (screenId === "settings") return D.runningSettings.length;
  }
  if (moduleId === "quality") {
    if (screenId === "actions") return exampleActions.filter((a) => a.area === "Quality" && !a.closed && a.who.how !== "Record only").length;
    if (screenId === "agent") return A.qualityWork.length;
    if (screenId === "investigations") return D.investigations.filter((i) => i.status === "open").length;
    if (screenId === "links") return belowThreshold().length;
    if (screenId === "simulations") return loopCampaigns.filter((c) => c.area === "quality" && c.kind === "simulation").length;
    if (screenId === "corrections") return D.corrections.filter((c) => c.status === "sent").length;
  }
  return undefined;
}
