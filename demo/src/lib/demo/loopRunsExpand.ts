/**
 * Generated demonstration loop campaigns (15+ runs per optimisation loop).
 */
import type { LoopCampaign, LoopRunResult } from "./loopRuns";

const iso = (d: number, h: number) => `2026-10-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00+05:30`;

export const DEMO_LOOP_CATALOG: Array<{ loopId: string; family: string; lineId: string; short: string }> = [
  { loopId: "loop-press-barrel-temp", family: "Press / barrel", lineId: "line-b", short: "Barrel zones" },
  { loopId: "loop-press-hold", family: "Press / hold", lineId: "line-b", short: "Hold pressure" },
  { loopId: "loop-press-tonnage", family: "Press / tonnage", lineId: "line-b", short: "Press tonnage" },
  { loopId: "loop-forge-induction", family: "Forging / induction", lineId: "line-b", short: "Induction heat" },
  { loopId: "loop-induction-zone1", family: "Forging / induction", lineId: "line-b", short: "Induction zone 1" },
  { loopId: "loop-ht-zone1", family: "Heat treat / furnace", lineId: "line-a", short: "Furnace zone 1" },
  { loopId: "loop-ht-zone2", family: "Heat treat / furnace", lineId: "line-a", short: "Furnace zone 2" },
  { loopId: "loop-ht-zone3", family: "Heat treat / furnace", lineId: "line-a", short: "Furnace zone 3" },
  { loopId: "loop-ht-quench", family: "Heat treat / quench", lineId: "line-a", short: "Quench oil" },
  { loopId: "loop-ht-temper", family: "Heat treat / temper", lineId: "line-a", short: "Temper soak" },
  { loopId: "loop-cnc-spindle", family: "Machining", lineId: "line-b", short: "Spindle load" },
  { loopId: "loop-util-compressed-air", family: "Utilities / air", lineId: "line-b", short: "Plant air" },
  { loopId: "loop-util-cooling-water", family: "Utilities / water", lineId: "line-a", short: "Cooling water" },
  { loopId: "loop-mixer-agit", family: "Batch / mixer", lineId: "line-a", short: "Agitator torque" },
  { loopId: "loop-mixer-hold", family: "Batch / hold", lineId: "line-a", short: "Hold time" },
  { loopId: "loop-qc-sample", family: "Quality / sampling", lineId: "line-a", short: "Hardness sampling" },
  { loopId: "loop-qc-spc", family: "Quality / SPC", lineId: "line-b", short: "Weight SPC" },
];

function pseudo(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateOptimisationCampaigns(): LoopCampaign[] {
  return DEMO_LOOP_CATALOG.map((loop, i) => ({
    id: `camp-p-opt-${loop.loopId}`,
    area: "process" as const,
    kind: "optimisation" as const,
    label: `${loop.short} · regulatory sweep (demo)`,
    lineId: loop.lineId,
    loopId: loop.loopId,
    loopFamily: loop.family,
    runType: "pid" as const,
    configsTried: 18,
    status: (i % 7 === 0 ? "running" : "complete") as LoopCampaign["status"],
    startedAt: iso(20 + (i % 9), 8 + (i % 10)),
    ownerInrPerMonth: loop.lineId === "line-b" ? 48000 + i * 3200 : 28000 + i * 2100,
    ownerLabel: "Illustrative at plant prices on demonstration data",
  })).filter((c) => c.loopId.startsWith("loop-") && (c.loopFamily.includes("Press") || c.loopFamily.includes("Heat") || c.loopFamily.includes("Forging") || c.loopFamily.includes("Machining") || c.loopFamily.includes("Utilities") || c.loopFamily.includes("Batch")));
}

export function generateSimulationCampaigns(): LoopCampaign[] {
  const processSims: LoopCampaign[] = [
    "loop-press-hold",
    "loop-ht-zone2",
    "loop-forge-induction",
    "loop-ht-quench",
    "loop-press-tonnage",
    "loop-cnc-spindle",
  ].map((loopId, i) => {
    const meta = DEMO_LOOP_CATALOG.find((l) => l.loopId === loopId)!;
    const id = loopId === "loop-press-hold" ? "camp-p-sim-1" : loopId === "loop-forge-induction" ? "camp-p-sim-induction" : loopId === "loop-ht-zone2" ? "camp-p-sim-2" : `camp-p-sim-x-${loopId}`;
    return {
      id,
      area: "process" as const,
      kind: "simulation" as const,
      label: `Agent search · ${meta.short} (demo)`,
      lineId: meta.lineId,
      loopId,
      loopFamily: meta.family,
      runType: "pid" as const,
      configsTried: 10 + (i % 6),
      status: (i === 2 ? "running" : i === 0 ? "chosen" : "complete") as LoopCampaign["status"],
      startedAt: iso(25 + i, 10 + i),
      chosenRunId: i === 0 ? "run-camp-p-sim-1-7" : undefined,
      proposalId: i === 0 ? "prop-101" : undefined,
      ownerInrPerMonth: 52000 + i * 8000,
      ownerLabel: "Illustrative simulation economics (demo)",
    };
  });
  const qualitySims: LoopCampaign[] = ["loop-qc-sample", "loop-qc-spc"].map((loopId, i) => {
    const meta = DEMO_LOOP_CATALOG.find((l) => l.loopId === loopId)!;
    return {
      id: i === 0 ? "camp-q-sim-1" : "camp-q-sim-spc",
      area: "quality" as const,
      kind: "simulation" as const,
      label: `Quality agent · ${meta.short} (demo)`,
      lineId: meta.lineId,
      loopId,
      loopFamily: meta.family,
      runType: "pid" as const,
      configsTried: 8 + i * 3,
      status: "complete" as const,
      startedAt: iso(22 + i, 14),
      ownerInrPerMonth: 24000 + i * 12000,
      ownerLabel: "Illustrative scrap avoided (demo)",
    };
  });
  return [...processSims, ...qualitySims];
}

export function generateRunResults(campaigns: LoopCampaign[]): LoopRunResult[] {
  const out: LoopRunResult[] = [];
  for (const c of campaigns) {
    const n = c.kind === "optimisation" ? 18 : Math.max(c.configsTried, 8);
    const rnd = pseudo(c.loopId.length * 997 + n);
    for (let r = 1; r <= n; r += 1) {
      const scrapDelta = -0.1 - rnd() * 0.55;
      const cycleDeltaS = (rnd() - 0.35) * 1.4;
      const constraintOk = rnd() > 0.12;
      const score = constraintOk ? 0.45 + rnd() * 0.5 : 0;
      out.push({
        id: `run-${c.id}-${r}`,
        campaignId: c.id,
        rank: r,
        label: c.kind === "optimisation" ? `PID set ${r}` : `Config ${String.fromCharCode(64 + ((r - 1) % 26) + 1)}`,
        scrapDelta: Number(scrapDelta.toFixed(2)),
        cycleDeltaS: Number(cycleDeltaS.toFixed(2)),
        constraintOk,
        score: Number(score.toFixed(2)),
        ownerInrPerMonth: constraintOk ? Math.round(40000 + rnd() * 90000) : undefined,
      });
    }
  }
  return out;
}
