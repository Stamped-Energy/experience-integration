/**
 * Demonstration plant dataset. Fictional, generic, illustrative. No client names, no real results.
 * Deterministic: generated from a seeded PRNG against a fixed demo "now" so server and client agree.
 * Coverage follows /workspace/proto-bot/designs/data-needs.md.
 */
import type * as T from "./types";

export const DEMO_NOW = "2026-10-20T14:00:00+05:30";
const NOW_MS = Date.parse(DEMO_NOW);
const I = { illustrative: true } as const;

/** ISO time in IST, offset from demo now by days and hours (negative = past). */
export function at(days: number, hours = 0, minutes = 0): string {
  const d = new Date(NOW_MS + ((days * 24 + hours) * 60 + minutes) * 60_000);
  const ist = new Date(d.getTime() + 330 * 60_000);
  return ist.toISOString().replace("Z", "+05:30").replace(/\.\d{3}/, "");
}

let seed = 20261020;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

export const site: T.Site = { ...I, id: "site-demo", name: "Demonstration plant", timezone: "Asia/Kolkata", currency: "INR", units: "metric" };

export const areas: T.Area[] = [
  { ...I, id: "area-mix", siteId: site.id, name: "Mixing hall" },
  { ...I, id: "area-mould", siteId: site.id, name: "Moulding shop" },
  { ...I, id: "area-util", siteId: site.id, name: "Utilities" },
];

export const linePacks: T.LinePack[] = [
  {
    ...I, id: "pack-batch-mixer", equipmentClass: "Jacketed batch mixer",
    runDefinition: "One batch, charge to discharge", series: ["Jacket temperature", "Agitator speed", "Torque", "Batch viscosity"],
    setpoints: ["hold-temp", "hold-time", "agitator"], modelId: "model-a", constraints: ["Jacket temperature under 95 °C", "Hold time at least 40 min"],
    windowTemplate: "Per grade, signed per quarter", labels: { run: "Batch", runs: "Batches", unit: "batch", outcome: "Viscosity" }, linkThreshold: 0.8,
  },
  {
    ...I, id: "pack-moulding", equipmentClass: "Injection moulding cell",
    runDefinition: "One shift run per tool", series: ["Melt temperature", "Hold pressure", "Cycle time", "Part weight"],
    setpoints: ["melt-temp", "hold-pressure", "cycle-time"], modelId: "model-b", constraints: ["Melt temperature under 255 °C", "Cycle time at least 28 s"],
    windowTemplate: "Per tool, signed per quarter", labels: { run: "Shift run", runs: "Shift runs", unit: "part", outcome: "Scrap rate" }, linkThreshold: 0.8,
  },
];

export const lines: T.Line[] = [
  {
    ...I, id: "line-a", areaId: "area-mix", name: "Line A · Batch mixing", short: "Line A", type: "batch", linePackId: "pack-batch-mixer",
    mode: "Trial", product: "Grade A-12", status: "Batch 2418 in hold step",
    kpis: [
      { label: "Batches today", value: "7", label2: "Measured" },
      { label: "Right first time", value: "91.4", unit: "%", label2: "Measured" },
      { label: "Energy per batch", value: "412", unit: "kWh", label2: "Measured" },
    ],
  },
  {
    ...I, id: "line-b", areaId: "area-mould", name: "Line B · Moulding", short: "Line B", type: "discrete", linePackId: "pack-moulding",
    mode: "Proposing", product: "Housing B-40", status: "Tool T3 running, 1,840 parts this shift",
    kpis: [
      { label: "Parts this shift", value: "1,840", label2: "Measured" },
      { label: "Scrap rate", value: "3.2", unit: "%", label2: "Measured" },
      { label: "Cycle time", value: "33.6", unit: "s", label2: "Measured" },
    ],
  },
];

const assetDefs: [string, string, string, number, number, number, number][] = [
  ["line-a", "a-charge", "Charge hopper", 0, 0, 2, 2], ["line-a", "a-mixer", "Mixer M1", 2, 0, 3, 3], ["line-a", "a-jacket", "Jacket loop", 2, 3, 3, 1],
  ["line-a", "a-hold", "Hold tank H1", 5, 0, 2, 2], ["line-a", "a-pump", "Discharge pump", 7, 0, 1, 2],
  ["line-b", "b-dryer", "Resin dryer", 0, 0, 2, 2], ["line-b", "b-press", "Press P3", 2, 0, 3, 3], ["line-b", "b-tool", "Tool T3", 5, 0, 2, 2],
  ["line-b", "b-robot", "Take-out robot", 7, 0, 1, 2], ["line-b", "b-vision", "Vision check", 7, 2, 1, 1],
];
export const assets: T.Asset[] = assetDefs.map(([lineId, id, name, x, y, w, h]) => ({ ...I, id, lineId, name, section: { x, y, w, h }, keyReadingTagId: `tag-${id}-1` }));

const tagDefs: Record<string, [string, string][]> = {
  "a-charge": [["Charge mass", "kg"]], "a-mixer": [["Agitator speed", "rpm"], ["Torque", "N·m"], ["Batch temperature", "°C"]],
  "a-jacket": [["Jacket inlet temperature", "°C"], ["Jacket flow", "m³/h"]], "a-hold": [["Hold time", "min"], ["Viscosity", "mPa·s"]],
  "a-pump": [["Discharge pressure", "bar"]], "b-dryer": [["Dew point", "°C"]], "b-press": [["Melt temperature", "°C"], ["Hold pressure", "bar"], ["Cycle time", "s"]],
  "b-tool": [["Tool temperature", "°C"], ["Cavity pressure", "bar"]], "b-robot": [["Take-out time", "s"]], "b-vision": [["Part weight", "g"], ["Reject count", "parts"]],
};
export const tags: T.Tag[] = assets.flatMap((a) => (tagDefs[a.id] ?? []).map(([name, unit], i) => ({ ...I, id: `tag-${a.id}-${i + 1}`, assetId: a.id, lineId: a.lineId, name, unit })));

export const shifts: T.Shift[] = [
  { ...I, id: "shift-1", name: "Shift 1", start: "06:00", end: "14:00" },
  { ...I, id: "shift-2", name: "Shift 2", start: "14:00", end: "22:00" },
  { ...I, id: "shift-3", name: "Shift 3", start: "22:00", end: "06:00" },
];

export const roles: T.Role[] = [
  { id: "operator", name: "Operator", short: "Operator", home: "line" },
  { id: "shift-lead", name: "Shift lead", short: "Shift lead", home: "shift" },
  { id: "process-engineer", name: "Process engineer", short: "Process eng.", home: "plant" },
  { id: "quality-head", name: "Quality head", short: "Quality head", home: "plant" },
  { id: "plant-head", name: "Plant head", short: "Plant head", home: "plant" },
  { id: "owner", name: "Owner", short: "Owner", home: "owner" },
  { id: "stamped-engineer", name: "Stamped engineer", short: "Stamped eng.", home: "plant" },
  { id: "viewer", name: "Viewer", short: "Viewer", home: "plant" },
];

export const people: T.Person[] = [
  { ...I, id: "p-op-a", display: "Operator A.", initials: "OA", roles: [{ role: "operator", scope: "line-a" }] },
  { ...I, id: "p-op-b", display: "Operator B.", initials: "OB", roles: [{ role: "operator", scope: "line-b" }] },
  { ...I, id: "p-op-c", display: "Operator C.", initials: "OC", roles: [{ role: "operator", scope: "line-a" }] },
  { ...I, id: "p-op-d", display: "Operator D.", initials: "OD", roles: [{ role: "operator", scope: "line-b" }] },
  { ...I, id: "p-sl", display: "Shift lead A.", initials: "SA", roles: [{ role: "shift-lead", scope: "site-demo" }] },
  { ...I, id: "p-pe", display: "Process engineer A.", initials: "PE", roles: [{ role: "process-engineer", scope: "site-demo" }] },
  { ...I, id: "p-qh", display: "Quality head A.", initials: "QH", roles: [{ role: "quality-head", scope: "site-demo" }] },
  { ...I, id: "p-ph", display: "Plant head A.", initials: "PH", roles: [{ role: "plant-head", scope: "site-demo" }] },
  { ...I, id: "p-ow", display: "Owner A.", initials: "OW", roles: [{ role: "owner", scope: "site-demo" }] },
  { ...I, id: "p-se", display: "Stamped engineer A.", initials: "ST", roles: [{ role: "stamped-engineer", scope: "site-demo" }] },
  { ...I, id: "p-vw", display: "Viewer A.", initials: "VA", roles: [{ role: "viewer", scope: "site-demo" }] },
];
/** The person each role switcher entry acts as in the showcase. */
export const actingAs: Record<T.RoleId, string> = {
  operator: "p-op-a", "shift-lead": "p-sl", "process-engineer": "p-pe", "quality-head": "p-qh",
  "plant-head": "p-ph", owner: "p-ow", "stamped-engineer": "p-se", viewer: "p-vw",
};

/* ---------------- Runs, readings, writes ---------------- */
function makeRuns(lineId: string, n: number, kind: "batch" | "discrete"): T.Run[] {
  const out: T.Run[] = [];
  for (let i = 0; i < n; i++) {
    const startH = -(n - i) * (kind === "batch" ? 9 : 8);
    const trialArm = i >= n - 10;
    if (kind === "batch") {
      const temp = trialArm && i % 2 === 0 ? 86 : 84;
      const visc = r1(2480 + (temp - 84) * -22 + (rnd() - 0.5) * 90);
      out.push({ ...I, id: `run-a-${2380 + i}`, lineId, product: "Grade A-12", start: at(0, startH), end: at(0, startH + 7),
        setpoints: { "hold-temp": temp, "hold-time": 55, agitator: 150 },
        outcomes: [
          { name: "Viscosity", value: visc, unit: "mPa·s", label: i % 5 === 0 ? "Measured" : "Estimated" },
          { name: "Energy per batch", value: r1(405 + rnd() * 20), unit: "kWh", label: "Measured" },
          { name: "Right first time", value: visc > 2380 && visc < 2600 ? 1 : 0, unit: "flag", label: "Measured" },
        ] });
    } else {
      const ct = trialArm ? 33.2 : 34.1;
      out.push({ ...I, id: `run-b-${640 + i}`, lineId, product: "Housing B-40", start: at(0, startH), end: at(0, startH + 8),
        setpoints: { "melt-temp": 236, "hold-pressure": 720, "cycle-time": ct },
        outcomes: [
          { name: "Scrap rate", value: r2(3.0 + rnd() * 1.2), unit: "%", label: "Measured" },
          { name: "Parts", value: Math.round((8 * 3600) / ct * 0.97), unit: "parts", label: "Measured" },
          { name: "Part weight", value: r2(48.1 + (rnd() - 0.5) * 0.4), unit: "g", label: "Measured" },
        ] });
    }
  }
  return out;
}
export const runs: T.Run[] = [...makeRuns("line-a", 40, "batch"), ...makeRuns("line-b", 40, "discrete")];
runs.find((r) => r.id === "run-a-2417")!.proofRecordId = "proof-1";
runs.find((r) => r.id === "run-b-679")!.proofRecordId = "proof-3";

const baseReadings: T.TagReading[] = runs.slice(-6).concat(runs.slice(34, 40)).flatMap((run) => {
  const tag = run.lineId === "line-a" ? "tag-a-mixer-3" : "tag-b-press-1";
  const base = run.lineId === "line-a" ? 84 : 236;
  return Array.from({ length: 12 }, (_, k) => ({ ...I, tagId: tag, runId: run.id, at: at(0, 0, -k * 20), value: r1(base + Math.sin(k / 2) * 1.2 + (rnd() - 0.5)), qualityCode: (k === 7 ? "uncertain" : "good") as T.QualityCode, label: "Measured" as const }));
});


/**
 * Readings for every other tag: same shape as the base series (last 6 runs per line, 12 points per run),
 * values inside each tag's normal band and tied to the run's setpoints. Separate seed so the rest of the
 * dataset (which shares rnd) is unchanged.
 */
let tagSeed = 4242;
function trnd(): number { tagSeed = (tagSeed * 1664525 + 1013904223) % 4294967296; return tagSeed / 4294967296; }
type Profile = (run: T.Run, k: number) => number;
const wave = (k: number, amp: number) => Math.sin(k / 2) * amp + (trnd() - 0.5) * amp * 0.8;
const TAG_PROFILES: Record<string, Profile> = {
  "tag-a-charge-1": (r, k) => r1(1200 + (k === 0 ? -40 : 0) + wave(k, 6)), // kg, charge mass settles after charging
  "tag-a-mixer-1": (r, k) => r1(r.setpoints.agitator + wave(k, 1.5)), // rpm, follows setpoint
  "tag-a-mixer-2": (r, k) => r1(380 + k * 3 + wave(k, 6)), // N·m, rises as viscosity builds in the hold
  "tag-a-jacket-1": (r, k) => r1(r.setpoints["hold-temp"] + 4 + wave(k, 1)), // °C, jacket runs above batch
  "tag-a-jacket-2": (_r, k) => r2(11 + wave(k, 0.4)), // m³/h
  "tag-a-hold-1": (r, k) => r1(Math.min(r.setpoints["hold-time"], (k * r.setpoints["hold-time"]) / 11)), // min, elapsed hold
  "tag-a-hold-2": (r, k) => Math.round(1900 + k * ((r.outcomes[0].value - 1900) / 11) + wave(k, 15)), // mPa·s, climbs to the run's outcome
  "tag-a-pump-1": (_r, k) => r2(2.4 + wave(k, 0.12)), // bar
  "tag-b-dryer-1": (_r, k) => r1(-40 + wave(k, 1.2)), // °C dew point
  "tag-b-press-2": (r, k) => Math.round(r.setpoints["hold-pressure"] + wave(k, 6)), // bar
  "tag-b-press-3": (r, k) => r2(r.setpoints["cycle-time"] + wave(k, 0.15)), // s
  "tag-b-tool-1": (_r, k) => r1(62 + wave(k, 0.8)), // °C tool temperature
  "tag-b-tool-2": (r, k) => Math.round(r.setpoints["hold-pressure"] * 0.62 + wave(k, 8)), // bar cavity pressure
  "tag-b-robot-1": (_r, k) => r2(2.8 + wave(k, 0.08)), // s take-out
  "tag-b-vision-1": (r, k) => r2(r.outcomes[2].value + wave(k, 0.08)), // g part weight around the run's mean
  "tag-b-vision-2": (r) => Math.max(0, Math.round(r.outcomes[0].value * 0.9 + (trnd() - 0.5) * 2)), // parts rejected per interval
};
const readingRuns = runs.slice(-6).concat(runs.slice(34, 40));
const extraReadings: T.TagReading[] = tags.filter((t) => TAG_PROFILES[t.id]).flatMap((tag) =>
  readingRuns.filter((r) => r.lineId === tag.lineId).flatMap((run) => {
    const step = tag.lineId === "line-a" ? 35 : 40;
    return Array.from({ length: 12 }, (_, k) => ({
      ...I, tagId: tag.id, runId: run.id, at: at(0, 0, (Date.parse(run.start) - NOW_MS) / 60000 + k * step), value: TAG_PROFILES[tag.id](run, k),
      qualityCode: (k === 7 && tag.id.endsWith("-1") ? "uncertain" : "good") as T.QualityCode, label: "Measured" as const,
    }));
  }),
);
export const tagReadings: T.TagReading[] = [...baseReadings, ...extraReadings];

/** Every run on every line has its setpoint writes (one per line-pack setpoint). Trial-arm runs show the switches. */
export const setpointWrites: T.SetpointWrite[] = runs.flatMap((r, idx) => {
  const lineRuns = runs.filter((x) => x.lineId === r.lineId);
  const k = lineRuns.indexOf(r);
  const inTrialWindow = k >= lineRuns.length - 10;
  return Object.entries(r.setpoints).map(([param, value], j) => {
    const changed = r.lineId === "line-a" ? param === "hold-temp" && inTrialWindow : param === "cycle-time" && inTrialWindow;
    const skipped = r.lineId === "line-a" && param === "hold-temp" && k === lineRuns.length - 7;
    const byRole: T.RoleId = r.lineId === "line-b" && changed ? "operator" : j === 0 && idx % 9 === 0 ? "shift-lead" : "operator";
    return {
      ...I, runId: r.id, param, value, source: changed ? (k % 2 === 0 || r.lineId === "line-b" ? "proposal" : "prior") : idx % 11 === 0 && j === 1 ? "operator adjust" : "prior",
      byRole, at: at(0, 0, (Date.parse(r.start) - NOW_MS) / 60000 + j), status: skipped ? "skipped" : "written",
      reason: skipped ? "Charge mass outside recipe, switch skipped" : undefined,
    } as T.SetpointWrite;
  });
});

/* ---------------- Limits ---------------- */
export const signedWindows: T.SignedWindow[] = [
  { ...I, id: "win-a-1", lineId: "line-a", param: "hold-temp", name: "Hold temperature", unit: "°C", low: 78, high: 92, narrowedLow: 80, narrowedHigh: 90, narrowedBy: "Process engineer A.", signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-41), expiresAt: at(50), version: 3, manifestRef: "manifest-demo-v7#A1" },
  { ...I, id: "win-a-2", lineId: "line-a", param: "hold-time", name: "Hold time", unit: "min", low: 40, high: 70, signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-41), expiresAt: at(50), version: 3, manifestRef: "manifest-demo-v7#A2" },
  { ...I, id: "win-a-3", lineId: "line-a", param: "agitator", name: "Agitator speed", unit: "rpm", low: 120, high: 180, narrowedLow: 130, narrowedHigh: 170, narrowedBy: "Stamped engineer A.", signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-41), expiresAt: at(50), version: 2, manifestRef: "manifest-demo-v7#A3" },
  { ...I, id: "win-b-1", lineId: "line-b", param: "melt-temp", name: "Melt temperature", unit: "°C", low: 225, high: 248, signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-30), expiresAt: at(61), version: 1, manifestRef: "manifest-demo-v7#B1" },
  { ...I, id: "win-b-2", lineId: "line-b", param: "hold-pressure", name: "Hold pressure", unit: "bar", low: 600, high: 860, narrowedLow: 640, narrowedHigh: 820, narrowedBy: "Process engineer A.", signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-30), expiresAt: at(61), version: 1, manifestRef: "manifest-demo-v7#B2" },
  { ...I, id: "win-b-3", lineId: "line-b", param: "cycle-time", name: "Cycle time", unit: "s", low: 30, high: 38, signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-30), expiresAt: at(61), version: 2, manifestRef: "manifest-demo-v7#B3" },
];

export const standingApprovals: T.StandingApproval[] = [
  { ...I, id: "sa-1", lineId: "line-b", params: ["cycle-time"], band: "32.5 to 34.5 s", grantedBy: "Plant head A.", from: at(-14), until: at(16), uses: 23, reviewedAt: at(-3) },
  { ...I, id: "sa-2", lineId: "line-a", params: ["agitator"], band: "145 to 160 rpm on Grade A-12", grantedBy: "Plant head A.", from: at(-26), until: at(2), uses: 41, reviewedAt: at(-12) },
  { ...I, id: "sa-3", lineId: "line-b", params: ["melt-temp"], band: "234 to 240 °C on Tool T3", grantedBy: "Plant head A.", from: at(-20), until: at(10), uses: 9, reviewedAt: at(-6),
    revokedBy: "Shift lead A.", revokedAt: at(-4, 1), revokeReason: "New resin lot on the line; melt temperature back to per-run decisions until it settles." },
  { ...I, id: "sa-4", lineId: "line-a", params: ["hold-time"], band: "52 to 58 min on Grade A-12", grantedBy: "Plant head A.", from: at(-5), until: at(25), uses: 6, reviewedAt: at(-5) },
];

export const runningSettings: T.RunningSetting[] = [
  { ...I, lineId: "line-a", param: "hold-temp", name: "Hold temperature", value: 86, unit: "°C", band: [80, 90], mode: "Trial", writtenAt: at(0, -3), signerRole: "plant-head", expiresAt: at(9), assetId: "a-hold" },
  { ...I, lineId: "line-a", param: "hold-time", name: "Hold time", value: 55, unit: "min", band: [40, 70], mode: "Stay", writtenAt: at(-6), signerRole: "plant-head", expiresAt: at(50), assetId: "a-hold" },
  { ...I, lineId: "line-a", param: "agitator", name: "Agitator speed", value: 150, unit: "rpm", band: [130, 170], mode: "Stay", writtenAt: at(-6), signerRole: "plant-head", expiresAt: at(50), assetId: "a-mixer" },
  { ...I, lineId: "line-b", param: "melt-temp", name: "Melt temperature", value: 236, unit: "°C", band: [225, 248], mode: "Stay", writtenAt: at(-9), signerRole: "plant-head", expiresAt: at(61), assetId: "b-press" },
  { ...I, lineId: "line-b", param: "hold-pressure", name: "Hold pressure", value: 720, unit: "bar", band: [640, 820], mode: "Stay", writtenAt: at(-9), signerRole: "plant-head", expiresAt: at(61), assetId: "b-press" },
  { ...I, lineId: "line-b", param: "cycle-time", name: "Cycle time", value: 33.2, unit: "s", band: [30, 38], mode: "Stay", writtenAt: at(0, -5), signerRole: "plant-head", expiresAt: at(16), assetId: "b-tool" },
];

/* ---------------- Proposals ---------------- */
const P = (p: Omit<T.Proposal, "illustrative">): T.Proposal => ({ ...I, ...p });
export const proposals: T.Proposal[] = [
  P({ id: "prop-101", lineId: "line-b", assetId: "b-press", param: "hold-pressure", current: 720, proposed: 760, optimiserVersion: "opt 2.4.1",
    reason: "Short shots rose on cavity 2 over the last three shift runs while melt temperature held steady. Higher hold pressure closed the gap in 6 of the 8 best runs.",
    evidenceIds: ["EV-B-2201", "EV-B-2207", "EV-B-2214"], predicted: { name: "Scrap rate", low: 2.4, point: 2.8, high: 3.3, unit: "%", spec: [0, 4] },
    drivers: ["Cavity 2 pressure trend", "Part weight on cavity 2", "Tool temperature"], safetyFilter: { pass: true, rules: ["Inside narrowed band 640 to 820 bar", "Clamp force margin over 12%"] },
    fitState: "accepted", weakestLabel: "Estimated", mode: "Stay", state: "Waiting", createdAt: at(0, -1, -10), expiresAt: at(0, 2),
    stopEffect: "Stop keeps 760 bar and writes nothing new. The next value waits for a person." }),
  P({ id: "prop-102", lineId: "line-a", assetId: "a-mixer", param: "agitator", current: 150, proposed: 158, optimiserVersion: "opt 2.4.1",
    reason: "Torque at the end of the hold step is 6% above the grade's best batches, which tracks with high viscosity in the last four batches.",
    evidenceIds: ["EV-A-1188", "EV-A-1191"], predicted: { name: "Viscosity", low: 2430, point: 2490, high: 2560, unit: "mPa·s", spec: [2380, 2600] },
    drivers: ["End-of-hold torque", "Charge mass", "Jacket inlet temperature"], safetyFilter: { pass: true, rules: ["Inside narrowed band 130 to 170 rpm", "Seal temperature margin held"] },
    fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Waiting", createdAt: at(0, -0, -40), expiresAt: at(0, 3),
    stopEffect: "Stop keeps 158 rpm for this batch and writes nothing new." }),
  P({ id: "prop-103", lineId: "line-b", assetId: "b-press", param: "melt-temp", current: 236, proposed: 239, optimiserVersion: "opt 2.4.1",
    reason: "Resin lot R-77 dries slower; part weight on the first 200 parts sat at the low edge.",
    evidenceIds: ["EV-B-2190"], predicted: { name: "Part weight", low: 47.9, point: 48.2, high: 48.5, unit: "g", spec: [47.6, 48.8] },
    drivers: ["Dew point", "Resin lot"], safetyFilter: { pass: true, rules: ["Inside signed band 225 to 248 °C"] },
    fitState: "accepted", weakestLabel: "Estimated", mode: "Stay", state: "Waiting", createdAt: at(0, -2), expiresAt: at(0, 1),
    stopEffect: "Stop keeps 239 °C and writes nothing new." }),
  P({ id: "prop-104", lineId: "line-a", assetId: "a-jacket", param: "hold-temp", current: 84, proposed: 86, optimiserVersion: "opt 2.4.0",
    reason: "Batches held at 86 °C reached target viscosity 6 minutes sooner in the model of the mixer, inside the narrowed band.",
    evidenceIds: ["EV-A-1102", "EV-A-1120"], predicted: { name: "Viscosity", low: 2410, point: 2470, high: 2540, unit: "mPa·s", spec: [2380, 2600] },
    drivers: ["Hold temperature", "Hold time", "Charge mass"], safetyFilter: { pass: true, rules: ["Inside narrowed band 80 to 90 °C"] },
    fitState: "accepted", weakestLabel: "Modelled", mode: "Trial", state: "Running trial", createdAt: at(-6), expiresAt: at(9), decidedBy: "Plant head A.", decidedAt: at(-5),
    stopEffect: "Stop restores the checked prior value, 84 °C, from the next batch. If restore fails the line goes recommend-only." }),
  P({ id: "prop-105", lineId: "line-b", assetId: "b-press", param: "cycle-time", current: 34.1, proposed: 33.2, optimiserVersion: "opt 2.4.0",
    reason: "Cooling margin on tool T3 allows a shorter cycle without part weight drift.", evidenceIds: ["EV-B-2101"],
    predicted: { name: "Scrap rate", low: 2.9, point: 3.2, high: 3.6, unit: "%", spec: [0, 4] }, drivers: ["Tool temperature", "Take-out time"],
    safetyFilter: { pass: true, rules: ["Inside standing approval 32.5 to 34.5 s"] }, fitState: "accepted", weakestLabel: "Measured", mode: "Stay", state: "Measuring",
    createdAt: at(-1), expiresAt: at(16), decidedBy: "Operator B.", decidedAt: at(0, -5), stopEffect: "Stop keeps 33.2 s and writes nothing new." }),
  P({ id: "prop-106", lineId: "line-a", assetId: "a-mixer", param: "hold-time", current: 55, proposed: 50, optimiserVersion: "opt 2.4.0",
    reason: "Shorter hold looked possible on Grade A-12.", evidenceIds: ["EV-A-1060"], predicted: { name: "Viscosity", low: 2300, point: 2450, high: 2620, unit: "mPa·s", spec: [2380, 2600] },
    drivers: ["Hold time"], safetyFilter: { pass: false, rules: ["Predicted band crosses the upper spec"] }, fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Withheld",
    createdAt: at(-2), expiresAt: at(-1), stopEffect: "Nothing was written." }),
  P({ id: "prop-107", lineId: "line-b", assetId: "b-tool", param: "melt-temp", current: 236, proposed: 232, optimiserVersion: "opt 2.3.9",
    reason: "Lower melt temperature to save heater energy.", evidenceIds: ["EV-B-1988"], predicted: { name: "Scrap rate", low: 3.0, point: 3.5, high: 4.1, unit: "%", spec: [0, 4] },
    drivers: ["Melt temperature", "Tool temperature"], safetyFilter: { pass: true, rules: ["Inside signed band"] }, fitState: "accepted", weakestLabel: "Estimated", mode: "Stay", state: "Declined",
    createdAt: at(-4), expiresAt: at(-3), decidedBy: "Shift lead A.", decidedAt: at(-4, 1), declineReason: "New resin lot on the line; not changing two things at once.", stopEffect: "Nothing was written." }),
  P({ id: "prop-108", lineId: "line-a", assetId: "a-mixer", param: "agitator", current: 150, proposed: 144, optimiserVersion: "opt 2.3.9",
    reason: "Lower speed on the low-viscosity grade.", evidenceIds: ["EV-A-1011"], predicted: { name: "Viscosity", low: 2390, point: 2440, high: 2500, unit: "mPa·s", spec: [2380, 2600] },
    drivers: ["Agitator speed"], safetyFilter: { pass: true, rules: ["Inside narrowed band"] }, fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Expired",
    createdAt: at(-5), expiresAt: at(-5, 3), stopEffect: "Nothing was written." }),
  P({ id: "prop-109", lineId: "line-b", assetId: "b-press", param: "hold-pressure", current: 700, proposed: 720, optimiserVersion: "opt 2.3.8",
    reason: "Sink marks on rib side.", evidenceIds: ["EV-B-1902"], predicted: { name: "Scrap rate", low: 3.1, point: 3.4, high: 3.8, unit: "%", spec: [0, 4] },
    drivers: ["Hold pressure"], safetyFilter: { pass: true, rules: ["Inside narrowed band"] }, fitState: "accepted", weakestLabel: "Measured", mode: "Stay", state: "Holding",
    createdAt: at(-12), expiresAt: at(-11), decidedBy: "Operator D.", decidedAt: at(-12, 1), stopEffect: "Stop keeps the value and writes nothing new." }),
  P({ id: "prop-110", lineId: "line-a", assetId: "a-jacket", param: "hold-temp", current: 84, proposed: 88, optimiserVersion: "opt 2.4.1",
    reason: "Model of the mixer is outside its accepted fit for the new grade A-14, so no number is offered.", evidenceIds: ["EV-A-1201"],
    predicted: { name: "Viscosity", low: 2200, point: 2500, high: 2800, unit: "mPa·s", spec: [2380, 2600] }, drivers: ["Grade change"], safetyFilter: { pass: true, rules: ["Inside narrowed band"] },
    fitState: "not accepted", weakestLabel: "Assumed", mode: "Recommend-only", state: "Withheld", createdAt: at(0, -6), expiresAt: at(1), stopEffect: "Nothing was written." }),
];

/* ---------------- Trials, stops, plans, checks, fits ---------------- */
export const measurementPlans: T.MeasurementPlan[] = [
  { ...I, id: "mp-1", version: 2, hash: "9f2c41ab", lockedAt: at(-6), trialId: "trial-1", measures: [{ name: "Time to target viscosity", unit: "min", method: "Switchback, batch level, difference in means" }, { name: "Energy per batch", unit: "kWh", method: "Switchback, metered" }], minBatches: 16 },
  { ...I, id: "mp-2", version: 1, hash: "1b7d09e3", lockedAt: at(-27), trialId: "trial-2", measures: [{ name: "Scrap rate", unit: "%", method: "Switchback, shift level" }], minBatches: 12 },
];
export const trials: T.Trial[] = [
  { ...I, id: "trial-1", lineId: "line-a", change: "Hold temperature 84 to 86 °C on Grade A-12", restoreTarget: { "hold-temp": 84 },
    schedule: ["Alternate batches, 16 batches", "Ends after batch 2426 or on 29 Oct"],
    switches: runs.filter((r) => r.lineId === "line-a").slice(-10).map((r, i) => ({ runId: r.id, arm: i % 2 === 0 ? "B" : "A", done: true, skippedReason: i === 3 ? "Charge mass outside recipe" : undefined })),
    measurementPlanId: "mp-1", draftedBy: "Process engineer A.", signerRole: "plant-head", signedAt: at(-5), status: "running" },
  { ...I, id: "trial-2", lineId: "line-b", change: "Hold pressure 700 to 720 bar on Tool T3", restoreTarget: { "hold-pressure": 700 },
    schedule: ["Alternate shift runs, 12 runs"], switches: runs.filter((r) => r.lineId === "line-b").slice(8, 20).map((r, i) => ({ runId: r.id, arm: i % 2 ? "A" : "B", done: true })),
    measurementPlanId: "mp-2", draftedBy: "Process engineer A.", signerRole: "plant-head", signedAt: at(-27), status: "finished" },
  { ...I, id: "trial-3", lineId: "line-b", change: "Tool temperature 62 to 58 °C on Tool T3", restoreTarget: { "tool-temp": 62 }, schedule: ["Alternate shift runs, 12 runs"], switches: [],
    measurementPlanId: "mp-2", draftedBy: "Process engineer A.", signerRole: "plant-head", status: "awaiting signature" },
];
export const stopEvents: T.StopEvent[] = [
  { ...I, id: "stop-1", lineId: "line-a", trialId: "trial-1", by: "Operator C.", at: at(-2, -4), mode: "trial", effect: "Restored 84 °C for batch 2409; trial resumed next batch after review", restoreResult: "restored" },
  { ...I, id: "stop-2", lineId: "line-b", by: "Shift lead A.", at: at(-9), mode: "stay", effect: "Kept 720 bar, no new writes for 2 h", restoreResult: "not needed" },
];
export const holdingChecks: T.HoldingCheck[] = [
  { ...I, planId: "mp-2", checkedAt: at(-13), result: "holding", nextAt: at(1) },
  { ...I, planId: "mp-2", checkedAt: at(-6), result: "holding", nextAt: at(1) },
  { ...I, planId: "mp-1", checkedAt: at(-1), result: "inconclusive", nextAt: at(3) },
];
export const modelFits: T.ModelFit[] = [
  { ...I, modelId: "model-b", version: "b-1.6", lineId: "line-b", coverage: 0.91, heldOutN: 214, calibratedAt: at(-8), state: "accepted",
    checks: [{ name: "Held-out error", pass: true, value: "0.21 % scrap" }, { name: "90% interval coverage", pass: true, value: "91%" }, { name: "No drift in residuals", pass: true, value: "flat, 30 d" }, { name: "Physical limits respected", pass: true, value: "all" }] },
  { ...I, modelId: "model-a", version: "a-2.2", lineId: "line-a", coverage: 0.81, heldOutN: 96, calibratedAt: at(-3), state: "not accepted",
    checks: [{ name: "Held-out error", pass: true, value: "41 mPa·s" }, { name: "90% interval coverage", pass: false, value: "81%, needs 85 to 95%" }, { name: "No drift in residuals", pass: true, value: "flat, 30 d" }, { name: "Physical limits respected", pass: true, value: "all" }] },
];

/* ---------------- Proof records ---------------- */
const src = (id: string, tag: string, value: string, q: T.QualityCode = "good", label: T.EvidenceLabel = "Measured"): T.SourceRow => ({ id, tag, at: at(-1), value, qualityCode: q, label });
const Q4 = (a: [string, T.EvidenceLabel][], ev: string[]) => [
  "Did the change happen as planned?", "Did the outcome move?", "Could something else explain it?", "Does it hold?",
].map((question, i) => ({ question, answer: a[i][0], label: a[i][1], evidenceIds: [ev[i % ev.length]] }));
export const proofRecords: T.ProofRecord[] = [
  { ...I, id: "proof-1", objectType: "trial", objectId: "trial-1", title: "Hold temperature 86 °C, Line A", verdict: "Inconclusive", rung: "R2",
    questions: Q4([["Yes, 9 of 10 switches written; 1 skipped and recorded", "Measured"], ["Time to target fell 4.1 min on average", "Measured"], ["Charge mass varied more on trial batches; not yet ruled out", "Estimated"], ["Too early: 10 of 16 batches", "Unknown"]], ["EV-A-1102", "EV-A-1120", "EV-A-1131"]),
    effect: { value: -4.1, low: -8.0, high: 0.4, unit: "min", measure: "Time to target viscosity" }, diagnostics: ["Balance check passed", "Carry-over check pending"], measurementPlanId: "mp-1", withheldNeeds: 6,
    sourceRows: [src("EV-A-1102", "Batch temperature", "86.1 °C"), src("EV-A-1120", "Viscosity", "2,471 mPa·s", "good", "Estimated"), src("EV-A-1131", "Charge mass", "1,204 kg", "uncertain")] },
  { ...I, id: "proof-2", objectType: "trial", objectId: "trial-2", title: "Hold pressure 720 bar, Line B", verdict: "Improved", rung: "R3",
    questions: Q4([["Yes, 12 of 12 switches written", "Measured"], ["Scrap fell 0.6 points", "Measured"], ["Resin lot and tool temperature balanced across arms", "Measured"], ["Holding at 6 and 13 days", "Measured"]], ["EV-B-1902", "EV-B-1911"]),
    effect: { value: -0.6, low: -0.9, high: -0.3, unit: "pp", measure: "Scrap rate" }, diagnostics: ["Balance check passed", "Carry-over check passed", "Pre-period parallel"], measurementPlanId: "mp-2",
    sourceRows: [src("EV-B-1902", "Reject count", "54 parts"), src("EV-B-1911", "Hold pressure", "720 bar")] },
  { ...I, id: "proof-3", objectType: "run", objectId: "run-b-679", title: "Cycle time 33.2 s, Line B", verdict: "Improved", rung: "R4",
    questions: Q4([["Yes, standing approval used 23 times", "Measured"], ["Parts per shift up 2.6%", "Measured"], ["Same tool, same resin lot, demand-driven schedule", "Measured"], ["Holding at 14 days", "Measured"]], ["EV-B-2101"]),
    effect: { value: 2.6, low: 1.9, high: 3.3, unit: "%", measure: "Parts per shift" }, diagnostics: ["All passed"],
    sourceRows: [src("EV-B-2101", "Cycle time", "33.2 s")] },
  { ...I, id: "proof-4", objectType: "lot", objectId: "lot-a-3307", title: "Lot 3307 viscosity save", verdict: "No change", rung: "R2",
    questions: Q4([["Correction sent and accepted", "Measured"], ["Viscosity moved inside the band of normal batches", "Estimated"], ["Lab result not yet in", "Unknown"], ["Not applicable to a single lot", "Unknown"]], ["EV-A-1188"]),
    effect: { value: 12, low: -30, high: 54, unit: "mPa·s", measure: "Viscosity vs predicted" }, diagnostics: ["Unanchored until lab result"],
    sourceRows: [src("EV-A-1188", "Torque", "412 N·m")] },
  { ...I, id: "proof-5", objectType: "trial", objectId: "trial-0", title: "Jacket flow schedule, Line A", verdict: "Improved", rung: "R3",
    questions: Q4([["Yes", "Measured"], ["Energy per batch down 3.8%", "Measured"], ["Ambient temperature adjusted for", "Modelled"], ["Holding at 30 days", "Measured"]], ["EV-A-0910"]),
    effect: { value: -3.8, low: -5.1, high: -2.4, unit: "%", measure: "Energy per batch" }, diagnostics: ["All passed"], sourceRows: [src("EV-A-0910", "Jacket flow", "11.2 m³/h")] },
  { ...I, id: "proof-6", objectType: "run", objectId: "run-b-660", title: "Dryer dew point alarm tuning, Line B", verdict: "No change", rung: "R2",
    questions: Q4([["Yes", "Measured"], ["Splay defects unchanged", "Measured"], ["Resin supplier changed mid-period", "Estimated"], ["Not applicable", "Unknown"]], ["EV-B-1801"]),
    effect: { value: 0.0, low: -0.3, high: 0.3, unit: "pp", measure: "Splay defects" }, diagnostics: ["Passed"], sourceRows: [src("EV-B-1801", "Dew point", "-38 °C")] },
  { ...I, id: "proof-7", objectType: "trial", objectId: "trial-3", title: "Tool temperature 58 °C, Line B", verdict: "Withheld", rung: "R0",
    questions: Q4([["Not started; awaiting signature", "Unknown"], ["No data yet", "Unknown"], ["No data yet", "Unknown"], ["No data yet", "Unknown"]], ["EV-B-2230"]),
    effect: { value: 0, low: 0, high: 0, unit: "%", measure: "Scrap rate" }, diagnostics: [], withheldNeeds: 12, sourceRows: [] },
];

/* ---------------- Value at the plant's prices (owner Home) ---------------- */
export const prices: T.Price[] = [
  { ...I, item: "Electricity", unit: "kWh", value: 8.4, currency: "INR", effectiveFrom: at(-56) },
  { ...I, item: "Scrapped part, Housing B-40", unit: "part", value: 38, currency: "INR", effectiveFrom: at(-56) },
  { ...I, item: "Reworked batch, Grade A-12", unit: "batch", value: 46000, currency: "INR", effectiveFrom: at(-56) },
  { ...I, item: "Extra part per shift (contribution)", unit: "part", value: 21, currency: "INR", effectiveFrom: at(-56) },
];
export const valueItems: T.ValueItem[] = [
  { ...I, id: "val-1", title: "Shorter cycle on Tool T3", lineId: "line-b", status: "Verified", rung: "R4", inrPerMonth: 214000, basis: "2.6% more parts per shift × contribution per part", proofRecordId: "proof-3" },
  { ...I, id: "val-2", title: "Hold pressure 720 bar", lineId: "line-b", status: "Verified", rung: "R3", inrPerMonth: 138000, basis: "0.6 pp less scrap × scrapped part price", proofRecordId: "proof-2" },
  { ...I, id: "val-3", title: "Jacket flow schedule", lineId: "line-a", status: "Verified", rung: "R3", inrPerMonth: 96000, basis: "3.8% less energy per batch × electricity price", proofRecordId: "proof-5" },
  { ...I, id: "val-4", title: "Hold temperature 86 °C trial", lineId: "line-a", status: "Indicative", rung: "R2", inrPerMonth: 172000, basis: "Faster batches, if the trial holds; interval includes zero", proofRecordId: "proof-1" },
  { ...I, id: "val-5", title: "Lot saves from early warnings", lineId: "line-a", status: "Indicative", rung: "R2", inrPerMonth: 92000, basis: "Two batches not reworked × rework price; lab results pending", proofRecordId: "proof-4" },
];
/** 8 weeks of verified value per week (₹ thousand), for the owner trend. Illustrative. */
export const verifiedWeekly: number[] = [38, 41, 52, 60, 71, 84, 98, 104];
export const indicativeWeekly: number[] = [12, 18, 30, 26, 40, 52, 58, 61];

/* ---------------- Quality ---------------- */
export const grades: T.Grade[] = [
  { ...I, id: "g-a12", name: "Grade A-12", lineId: "line-a" }, { ...I, id: "g-a14", name: "Grade A-14", lineId: "line-a" }, { ...I, id: "g-b40", name: "Housing B-40", lineId: "line-b" },
];
export const specs: T.Spec[] = [
  { ...I, gradeId: "g-a12", property: "Viscosity", unit: "mPa·s", lsl: 2380, target: 2490, usl: 2600, sourceDoc: "SPEC-A12 rev 4", version: 4 },
  { ...I, gradeId: "g-a14", property: "Viscosity", unit: "mPa·s", lsl: 2600, target: 2720, usl: 2840, sourceDoc: "SPEC-A14 rev 1", version: 1 },
  { ...I, gradeId: "g-b40", property: "Part weight", unit: "g", lsl: 47.6, target: 48.2, usl: 48.8, sourceDoc: "SPEC-B40 rev 2", version: 2 },
];
export const lots: T.Lot[] = Array.from({ length: 30 }, (_, i) => {
  const isA = i % 2 === 0;
  const risk: T.Lot["riskWord"] = [0, 3, 6, 9].includes(i) ? "At risk" : i % 7 === 0 ? "Watch" : "On track";
  return { ...I, id: isA ? `lot-a-${3290 + i}` : `lot-b-${7710 + i}`, gradeId: isA ? (i === 6 ? "g-a14" : "g-a12") : "g-b40", lineIds: [isA ? "line-a" : "line-b"],
    stages: isA ? ["Charge", "Mix", "Hold", "Discharge", "Lab"] : ["Mould", "Vision", "Pack"], startedAt: at(-Math.floor(i / 3), -i),
    status: i < 8 ? "in process" : i < 14 ? "awaiting lab" : i === 20 ? "on hold in quality system" : "complete", riskWord: risk };
});
lots[0].id = "lot-a-3307";
export const lotProperties: T.LotProperty[] = lots.map((l, i) => {
  const isA = l.lineIds[0] === "line-a";
  const at_ = l.riskWord === "At risk";
  const point = isA ? (at_ ? 2585 : 2480 + (i % 5) * 12) : at_ ? 47.7 : 48.2;
  const w = isA ? 45 : 0.25;
  return { ...I, lotId: l.id, name: isA ? "Viscosity" : "Part weight", unit: isA ? "mPa·s" : "g", predicted: { low: r1(point - w), point, high: r1(point + w) }, anchored: l.status === "complete", labResultId: l.status === "complete" ? `lab-${l.id}` : undefined };
});
export const labResults: T.LabResult[] = lots.filter((l) => l.status === "complete").map((l) => ({ ...I, id: `lab-${l.id}`, lotId: l.id, property: l.lineIds[0] === "line-a" ? "Viscosity" : "Part weight", value: l.lineIds[0] === "line-a" ? 2490 : 48.2, at: at(0, -2) }));
export const lotLinks: T.LotLink[] = lots.flatMap((l, i) => {
  const lineRuns = runs.filter((r) => r.lineId === l.lineIds[0]);
  const count = i < 10 ? 2 : 1;
  return Array.from({ length: count }, (_, k) => {
    const low = (i === 2 && k === 0) || (i === 5 && k === 1) || (i === 11 && k === 0);
    const score = low ? r2(0.52 + rnd() * 0.2) : r2(0.86 + rnd() * 0.12);
    return { ...I, id: `link-${l.id}-${k}`, lotId: l.id, runId: lineRuns[(39 - i - k + 40) % 40].id, link_confidence: score,
      parts: { timeProximity: r2(0.7 + rnd() * 0.3), recipeMatch: low ? 0.6 : 1, sequenceConsistency: r2(0.8 + rnd() * 0.2), scannedIdAgreement: low ? 0 : 1, multiCandidatePenalty: low ? -0.15 : 0 },
      status: low ? "suggested" : i > 15 ? "approved" : "suggested", label: low ? "unverified" : i > 15 ? "verified" : "estimated",
      candidates: low ? [lineRuns[(38 - i + 40) % 40].id] : [] } as T.LotLink;
  });
});
export const driftSignals: T.DriftSignal[] = [
  { ...I, id: "drift-1", property: "Viscosity", lineId: "line-a", startedAt: at(-3), direction: "up", magnitude: "+38 mPa·s over 9 batches", label: "Measured" },
  { ...I, id: "drift-2", property: "Part weight", lineId: "line-b", startedAt: at(-1), direction: "down", magnitude: "-0.12 g over 3 shift runs", label: "Measured" },
];
export const alarmBudget: T.AlarmBudget = { ...I, period: "This week", used: 7, limit: 12 };
export const investigations: T.Investigation[] = [
  { ...I, id: "inv-1", title: "High viscosity on Grade A-12", lotIds: ["lot-a-3307", "lot-a-3296"], runIds: ["run-a-2416", "run-a-2417"], openedBy: "Quality head A.", status: "open", proofRecordId: "proof-4",
    entries: [
      { at: at(-3), type: "evidence", text: "Viscosity drifting up over 9 batches", evidenceIds: ["EV-A-1180"], label: "Measured" },
      { at: at(-2), type: "link", text: "Lots 3307 and 3296 linked to batches 2416 and 2417", evidenceIds: ["EV-A-1185"], label: "Estimated" },
      { at: at(-1), type: "note", text: "End-of-hold torque high on both; charge mass in recipe", evidenceIds: ["EV-A-1188"], label: "Measured" },
    ] },
  { ...I, id: "inv-2", title: "Light parts on cavity 2", lotIds: ["lot-b-7711"], runIds: ["run-b-678", "run-b-679"], openedBy: "Quality head A.", status: "closed", conclusion: "Hold pressure raised by Process; holding",
    entries: [{ at: at(-14), type: "conclusion", text: "Correction accepted by Process, verdict improved", evidenceIds: ["EV-B-1902"], label: "Measured" }], proofRecordId: "proof-2" },
];
export const corrections: T.Correction[] = [
  { ...I, id: "corr-1", lotId: "lot-a-3307", toLineId: "line-a", param: "agitator", direction: "raise", estimate: { low: -90, high: -30, unit: "mPa·s" }, label: "Modelled", sentBy: "Quality head A.", status: "sent", proposalId: "prop-102", reason: "Bring lot 3307 back inside the band" },
  { ...I, id: "corr-2", lotId: "lot-b-7711", toLineId: "line-b", param: "hold-pressure", direction: "raise", estimate: { low: 0.1, high: 0.3, unit: "g" }, label: "Estimated", sentBy: "Quality head A.", status: "accepted", proposalId: "prop-109", reason: "Light parts on cavity 2" },
  { ...I, id: "corr-3", lotId: "lot-b-7713", toLineId: "line-b", param: "melt-temp", direction: "lower", estimate: { low: -0.1, high: 0.1, unit: "g" }, label: "Assumed", sentBy: "Quality head A.", status: "declined", reason: "Flash on parting line" },
];

/* ---------------- Plant, data, box ---------------- */
export const dataSources: T.DataSource[] = [
  { ...I, id: "ds-hist", kind: "historian", name: "Plant historian", lastSeen: at(0, 0, -1), tags: 46, gapPct: 0.4, qualityCodes: { good: 98.9, uncertain: 0.9, bad: 0.2 } },
  { ...I, id: "ds-mes", kind: "MES", name: "Production system", lastSeen: at(0, 0, -4), tags: 12, gapPct: 0, qualityCodes: { good: 100, uncertain: 0, bad: 0 } },
  { ...I, id: "ds-lims", kind: "LIMS", name: "Lab system", lastSeen: at(0, -2), tags: 6, gapPct: 3.1, qualityCodes: { good: 96.2, uncertain: 3.8, bad: 0 } },
  { ...I, id: "ds-qms", kind: "quality system", name: "Quality system", lastSeen: at(0, -1), tags: 4, gapPct: 0, qualityCodes: { good: 100, uncertain: 0, bad: 0 } },
];
export const dataGaps: T.DataGap[] = [
  { ...I, id: "gap-1", sourceId: "ds-lims", from: at(0, -9), to: at(0, -5), affects: "Viscosity anchors for lots 3301 to 3305" },
  { ...I, id: "gap-2", sourceId: "ds-hist", from: at(-2, -3), to: at(-2, -2), affects: "Jacket flow on Line A, 52 minutes" },
  { ...I, id: "gap-3", sourceId: "ds-hist", from: at(-6), to: at(-6, 0, 20), affects: "Vision check counts, Line B" },
];
export const plantBox: T.PlantBox = { ...I, id: "box-1", version: "box 1.9.2", lastSync: at(0, 0, -1) };
export const leases: T.Lease[] = [
  { ...I, id: "lease-7", issuedAt: at(0, -6), maxOfflineH: 4, hardCapH: 8, state: "active", offlineMin: 0 },
  { ...I, id: "lease-6", issuedAt: at(-1, -6), maxOfflineH: 4, hardCapH: 8, state: "expired", offlineMin: 37 },
  { ...I, id: "lease-5", issuedAt: at(-9), maxOfflineH: 4, hardCapH: 8, state: "revoked", revokedBy: "Shift lead A.", offlineMin: 0 },
];

/* ---------------- Settings ---------------- */
export const assignments: T.Assignment[] = [
  { ...I, scope: "line-a", primary: "Operator A.", backup: "Operator C.", skills: ["Batch mixer", "Recipe changes"] },
  { ...I, scope: "line-b", primary: "Operator B.", backup: "Operator D.", skills: ["Moulding", "Tool change"] },
  { ...I, scope: "area-mix", primary: "Process engineer A.", backup: "Shift lead A.", skills: ["Trials"] },
  { ...I, scope: "area-mould", primary: "Process engineer A.", backup: "Shift lead A.", skills: ["Trials"] },
  { ...I, scope: "quality", primary: "Quality head A.", backup: "Shift lead A.", skills: ["Lot links", "Specs"] },
];
export const notificationRules: T.NotificationRule[] = [
  { ...I, event: "Proposal waiting", role: "operator", channel: "in-app" },
  { ...I, event: "Trial needs signature", role: "plant-head", channel: "email" },
  { ...I, event: "Lot at risk", role: "quality-head", channel: "in-app" },
  { ...I, event: "Stop pressed", role: "shift-lead", channel: "in-app" },
  { ...I, event: "Weekly note", role: "owner", channel: "email" },
];
export const integrations: T.Integration[] = [
  { ...I, id: "int-1", kind: "Historian", name: "Plant historian", status: "connected", lastSync: at(0, 0, -1) },
  { ...I, id: "int-2", kind: "MES", name: "Production system", status: "connected", lastSync: at(0, 0, -4) },
  { ...I, id: "int-3", kind: "LIMS", name: "Lab system", status: "degraded", lastSync: at(0, -2) },
  { ...I, id: "int-4", kind: "Sign-in", name: "Microsoft sign-in", status: "connected", lastSync: at(-1) },
  { ...I, id: "int-5", kind: "Quality system", name: "Quality system", status: "connected", lastSync: at(0, -1) },
  { ...I, id: "int-6", kind: "Energy meters", name: "Line meters", status: "degraded", lastSync: at(0, -4) },
  { ...I, id: "int-7", kind: "ERP", name: "Plant ERP export", status: "not connected", lastSync: at(-30) },
];
export const apiKeys: T.ApiKey[] = [
  { ...I, id: "key-1", label: "Reporting export", created: at(-40), lastUsed: at(-1) },
  { ...I, id: "key-2", label: "Plant data warehouse", created: at(-20), lastUsed: at(0, -3) },
];
export const webhooks: T.Webhook[] = [
  { ...I, id: "wh-1", url: "https://hooks.example.invalid/stamped", events: ["card.decided", "stop.pressed"], status: "healthy", lastDelivery: at(0, 0, -6) },
  { ...I, id: "wh-2", url: "https://mes.example.invalid/hooks/setpoints", events: ["setpoint.written", "setpoint.skipped"], status: "healthy", lastDelivery: at(0, -3) },
  { ...I, id: "wh-3", url: "https://quality.example.invalid/hooks/lots", events: ["lot.at_risk", "correction.sent"], status: "failing", lastDelivery: at(0, -9), note: "Receiver returns 503 since 05:00; 14 deliveries queued for retry." },
  { ...I, id: "wh-4", url: "https://reports.example.invalid/hooks/weekly", events: ["note.weekly"], status: "paused", lastDelivery: at(-8), note: "Paused by Plant head A. while the reporting system moves." },
];

/* ---------------- Ask ---------------- */
export const askThreads: T.AskThread[] = [
  { ...I, id: "ask-1", title: "Why is Line A viscosity drifting?", objectRef: "drift-1", updatedAt: at(0, -1),
    messages: [
      { from: "person", text: "Why is Line A viscosity drifting up this week?" },
      { from: "stamped", claims: [
        { text: "Viscosity rose 38 mPa·s over the last 9 batches.", evidenceIds: ["EV-A-1180"], label: "Measured" },
        { text: "End-of-hold torque rose with it on the same batches.", evidenceIds: ["EV-A-1188"], label: "Measured" },
        { text: "A small agitator speed increase would bring it back inside the band.", evidenceIds: ["EV-A-1191"], label: "Modelled" },
      ], cardRef: "prop-102" },
    ] },
  { ...I, id: "ask-2", title: "What did the cycle time change earn?", updatedAt: at(-1),
    messages: [{ from: "person", text: "What did the Tool T3 cycle change earn last month?" }, { from: "stamped", claims: [{ text: "Parts per shift rose 2.6%, interval 1.9 to 3.3%.", evidenceIds: ["EV-B-2101"], label: "Measured" }], cardRef: "proof-3" }] },
  { ...I, id: "ask-3", title: "Will lot 3307 meet spec?", updatedAt: at(-1, -3),
    messages: [{ from: "person", text: "Will lot 3307 meet spec?" }, { from: "stamped", abstain: "I cannot say yet. The lab result for lot 3307 is missing, so the viscosity band is unanchored." }] },
  { ...I, id: "ask-4", title: "Handover for Shift 2", updatedAt: at(0, 0, -5),
    messages: [{ from: "person", text: "Summarise Shift 1 for handover." }, { from: "stamped", claims: [{ text: "Two proposals accepted on Line B, one waiting on Line A.", evidenceIds: ["EV-B-2214"], label: "Measured" }] }] },
];
/** Short conversations started from an asset or a line (Ask opened in context). */
const scoped = (id: string, title: string, scope: { assetId?: string; lineId: string }, q: string, claims: T.AskClaim[], confidence: { label: T.EvidenceLabel; band?: string }, refs: string[], ago: number): T.AskThread =>
  ({ ...I, id, title, scope, confidence, refs, updatedAt: at(0, -ago), messages: [{ from: "person", text: q }, { from: "stamped", claims }] });
askThreads.push(
  scoped("ask-m1", "Mixer M1 torque", { assetId: "a-mixer", lineId: "line-a" }, "Why is torque on Mixer M1 higher at the end of the hold?",
    [{ text: "End-of-hold torque is about 6% above the best batches of this grade.", evidenceIds: ["EV-A-1188"], label: "Measured" },
     { text: "It rises with viscosity on the same batches; a small increase in agitator speed is modelled to bring viscosity back inside the band.", evidenceIds: ["EV-A-1191"], label: "Modelled" }],
    { label: "Modelled", band: "viscosity 2430 to 2560 mPa·s after the change" }, ["prop-102", "drift-1", "a-mixer"], 1),
  scoped("ask-h1", "Hold tank H1 settings", { assetId: "a-hold", lineId: "line-a" }, "What is Hold tank H1 running at, and why?",
    [{ text: "Hold temperature is 86 °C as the trial arm of the current trial; hold time stays at 55 minutes.", evidenceIds: ["EV-A-1102"], label: "Measured" },
     { text: "Pressing Stop restores 84 °C from the next batch.", evidenceIds: ["EV-A-1131"], label: "Measured" }],
    { label: "Measured", band: "signed 78 to 92 °C, narrowed to 80 to 90 °C" }, ["trial-1", "win-a-1", "a-hold"], 2),
  scoped("ask-p3", "Press P3 hold pressure", { assetId: "b-press", lineId: "line-b" }, "Is it safe to raise hold pressure on Press P3?",
    [{ text: "The proposed value sits inside the narrowed band of 640 to 820 bar and passes the clamp force check.", evidenceIds: ["EV-B-2207"], label: "Measured" },
     { text: "Scrap is expected to fall slightly with the higher pressure.", evidenceIds: ["EV-B-2214"], label: "Estimated" }],
    { label: "Estimated", band: "scrap rate 2.4 to 3.3%" }, ["prop-101", "win-b-2", "b-press"], 1),
  scoped("ask-t3", "Tool T3 cycle time", { assetId: "b-tool", lineId: "line-b" }, "Has the shorter cycle on Tool T3 held up?",
    [{ text: "Parts per shift are up 2.6% on the same tool and resin lot.", evidenceIds: ["EV-B-2101"], label: "Measured" },
     { text: "Part weight has not drifted since the change.", evidenceIds: ["EV-B-2101"], label: "Measured" }],
    { label: "Measured", band: "1.9 to 3.3% more parts per shift" }, ["proof-3", "sa-1", "b-tool"], 3),
  scoped("ask-la", "Line A today", { lineId: "line-a" }, "What needs attention on Line A today?",
    [{ text: "One proposal is waiting on agitator speed, and the hold temperature trial is on batch 10 of 16.", evidenceIds: ["EV-A-1131"], label: "Measured" },
     { text: "One lot is at risk on viscosity; its band is unanchored until the lab result arrives.", evidenceIds: ["EV-A-1188"], label: "Estimated" }],
    { label: "Estimated", band: "lot viscosity 2540 to 2630 mPa·s" }, ["prop-102", "trial-1", "lot-a-3307"], 1),
  scoped("ask-lb", "Line B today", { lineId: "line-b" }, "How is Line B doing this shift?",
    [{ text: "1,840 parts so far with scrap at 3.2%, inside the 4% limit.", evidenceIds: ["EV-B-2214"], label: "Measured" },
     { text: "Two proposals are waiting: hold pressure on Press P3 and melt temperature for the new resin lot.", evidenceIds: ["EV-B-2190"], label: "Measured" }],
    { label: "Measured", band: "scrap 3.0 to 4.2% over the last 40 shift runs" }, ["prop-101", "prop-103", "line-b"], 0),
);
export const suggestedQuestions: string[] = ["What changed on Line B this shift?", "Which lots are at risk today?", "Is the hold temperature trial on track?", "What is waiting for my decision?"];
export const savedAnswers: T.SavedAnswer[] = [
  { ...I, id: "sa-ans-1", threadId: "ask-2", title: "Tool T3 cycle change, value", savedBy: "Owner A.", at: at(-1), lineId: "line-b", topic: "Process",
    summary: "Parts per shift rose 2.6% after the cycle change; the value at the plant's prices is on the owner's Home.", confidence: { label: "Measured", band: "1.9 to 3.3% parts per shift" }, refs: ["proof-3", "val-1", "prop-105"] },
  { ...I, id: "sa-ans-2", threadId: "ask-1", title: "Line A viscosity drift", savedBy: "Quality head A.", at: at(0, -1), lineId: "line-a", topic: "Quality",
    summary: "Viscosity rose 38 mPa·s over 9 batches with end-of-hold torque; a small agitator increase is modelled to bring it back.", confidence: { label: "Modelled", band: "2430 to 2560 mPa·s after the change" }, refs: ["drift-1", "prop-102", "inv-1"] },
  { ...I, id: "sa-ans-3", threadId: "ask-1", title: "Will a shorter hold work on Grade A-12?", savedBy: "Process engineer A.", at: at(-9), lineId: "line-a", topic: "Process",
    summary: "A 50 min hold was predicted to keep viscosity inside spec.", confidence: { label: "Modelled", band: "2300 to 2620 mPa·s" }, refs: ["prop-106", "model-a"],
    stale: { since: at(-3), reason: "Model of the mixer recalibrated to a-2.2 and its fit is no longer accepted; the safety filter has since withheld this change." } },
  { ...I, id: "sa-ans-4", threadId: "ask-3", title: "Lot 3307 outlook", savedBy: "Shift lead A.", at: at(-2), lineId: "line-a", topic: "Quality",
    summary: "Predicted viscosity sat near the upper spec; the band was unanchored at the time.", confidence: { label: "Estimated", band: "2540 to 2630 mPa·s" }, refs: ["lot-a-3307", "corr-1"],
    stale: { since: at(-1), reason: "A correction was sent to Process after this was saved, and lab results for the lot are still missing." } },
  { ...I, id: "sa-ans-5", threadId: "ask-2", title: "Hold pressure 720 bar, did it hold?", savedBy: "Plant head A.", at: at(-6), lineId: "line-b", topic: "Process",
    summary: "Scrap fell 0.6 points and was still holding at the last check.", confidence: { label: "Measured", band: "0.3 to 0.9 points less scrap" }, refs: ["proof-2", "trial-2", "val-2"] },
  { ...I, id: "sa-ans-6", threadId: "ask-4", title: "Light parts on cavity 2", savedBy: "Quality head A.", at: at(-13), lineId: "line-b", topic: "Quality",
    summary: "Part weight on cavity 2 recovered after Process raised hold pressure.", confidence: { label: "Measured", band: "48.0 to 48.4 g" }, refs: ["inv-2", "corr-2", "lot-b-7711"] },
];
export const notes: T.Note[] = [
  { ...I, id: "note-1", kind: "handover", title: "Shift 1 to Shift 2", at: at(0, 0, -5), lineId: "line-a", topic: "Process", claims: [{ text: "Hold temperature trial on batch 10 of 16.", evidenceIds: ["EV-A-1131"], label: "Measured" }, { text: "Lot 3307 at risk, correction sent to Process.", evidenceIds: ["EV-A-1188"], label: "Estimated" }] },
  { ...I, id: "note-2", kind: "weekly", title: "Week 42 note", at: at(-1), claims: [{ text: "Three changes verified this quarter, two indicative.", evidenceIds: ["EV-B-2101"], label: "Measured" }] },
  { ...I, id: "note-3", kind: "handover", title: "Shift 3 to Shift 1", at: at(0, -8), lineId: "line-b", topic: "Process", claims: [
    { text: "Cycle time 33.2 s running under the standing approval; 23 uses so far.", evidenceIds: ["EV-B-2101"], label: "Measured" },
    { text: "Resin lot R-77 on the dryer; first parts sat at the low edge of part weight.", evidenceIds: ["EV-B-2190"], label: "Measured" },
  ] },
  { ...I, id: "note-4", kind: "handover", title: "Shift 2 to Shift 3, yesterday", at: at(-1, -6), lineId: "line-a", topic: "Quality", claims: [
    { text: "Viscosity drifting up over the last 9 batches.", evidenceIds: ["EV-A-1180"], label: "Measured" },
    { text: "Lab system late; four lots unanchored until results arrive.", evidenceIds: ["EV-A-1185"], label: "Unknown" },
  ] },
  { ...I, id: "note-5", kind: "weekly", title: "Week 41 note", at: at(-8), topic: "Process", claims: [
    { text: "Hold pressure 720 bar on Tool T3 verified at R3, with less scrap holding at both checks.", evidenceIds: ["EV-B-1902"], label: "Measured" },
    { text: "Hold temperature trial on Line A signed and started.", evidenceIds: ["EV-A-1102"], label: "Measured" },
  ] },
  { ...I, id: "note-6", kind: "weekly", title: "Week 40 note", at: at(-15), topic: "Quality", claims: [
    { text: "Light parts on cavity 2 closed after a correction to Process.", evidenceIds: ["EV-B-1902"], label: "Measured" },
    { text: "Dryer alarm tuning showed no change in splay defects.", evidenceIds: ["EV-B-1801"], label: "Measured" },
  ] },
];

/* ---------------- Activity ---------------- */
const auditActions: [string, T.RoleId, string, string, string][] = [
  ["Accepted proposal", "operator", "proposal", "prop-105", "p-op-b"], ["Declined proposal", "shift-lead", "proposal", "prop-107", "p-sl"], ["Signed trial order", "plant-head", "trial", "trial-1", "p-ph"],
  ["Pressed Stop", "operator", "trial", "trial-1", "p-op-c"], ["Confirmed lot link", "quality-head", "lot", "lot-a-3296", "p-qh"], ["Sent correction", "quality-head", "correction", "corr-1", "p-qh"],
  ["Narrowed limit", "process-engineer", "window", "win-a-1", "p-pe"], ["Granted standing approval", "plant-head", "approval", "sa-1", "p-ph"], ["Exported report", "owner", "report", "rep-1", "p-ow"],
  ["Revoked lease", "shift-lead", "lease", "lease-5", "p-sl"], ["Setpoint written", "operator", "run", "run-a-2417", "p-op-a"], ["Drafted trial", "process-engineer", "trial", "trial-3", "p-pe"],
];
export const auditEvents: T.AuditEvent[] = Array.from({ length: 60 }, (_, i) => {
  const [action, role, objectType, objectId, personId] = auditActions[i % auditActions.length];
  return { ...I, id: `aud-${1000 + i}`, at: at(0, -i * 3, -i * 7), personId, role, action, objectType, objectId,
    before: action === "Narrowed limit" ? "78 to 92 °C" : undefined, after: action === "Narrowed limit" ? "80 to 90 °C" : undefined,
    reason: action === "Declined proposal" ? "New resin lot on the line" : undefined, channel: action === "Setpoint written" ? "system" : "in-app" };
});
export const reports: T.Report[] = [
  { ...I, id: "rep-1", kind: "Monthly value", period: "September 2026", status: "approved", approvedBy: "Plant head A.", formats: ["CSV", "DOCX"] },
  { ...I, id: "rep-2", kind: "Trial report", period: "Trial 2", status: "approved", approvedBy: "Plant head A.", formats: ["HTML", "DOCX"] },
  { ...I, id: "rep-3", kind: "Weekly note", period: "Week 42", status: "awaiting approval", formats: ["HTML"] },
  { ...I, id: "rep-4", kind: "Audit export", period: "Q3 2026", status: "draft", formats: ["CSV"] },
];

/* ---------------- Inbox and shift ---------------- */
export const inboxItems: T.InboxItem[] = [
  { ...I, id: "in-1", kind: "proposal", ref: "prop-101", bucket: "waiting", owner: "operator", due: at(0, 2), title: "Raise hold pressure to 760 bar on Press P3" },
  { ...I, id: "in-2", kind: "proposal", ref: "prop-102", bucket: "waiting", owner: "operator", due: at(0, 3), title: "Raise agitator speed to 158 rpm on Mixer M1" },
  { ...I, id: "in-3", kind: "proposal", ref: "prop-103", bucket: "waiting", owner: "operator", due: at(0, 1), title: "Raise melt temperature to 239 °C for resin lot R-77" },
  { ...I, id: "in-4", kind: "trial-signature", ref: "trial-3", bucket: "waiting", owner: "plant-head", due: at(1), title: "Sign trial: tool temperature 58 °C on Tool T3" },
  { ...I, id: "in-5", kind: "correction", ref: "corr-1", bucket: "waiting", owner: "process-engineer", due: at(0, 4), title: "Correction from Quality: lot 3307 viscosity" },
  { ...I, id: "in-6", kind: "lot-link", ref: "link-lot-a-3292-0", bucket: "task", owner: "quality-head", due: at(0, 6), title: "Confirm link: lot 3292 to its batch" },
  { ...I, id: "in-7", kind: "lot-link", ref: "link-lot-b-7715-1", bucket: "task", owner: "quality-head", due: at(0, 8), title: "Confirm link: lot 7715 to its shift run" },
  { ...I, id: "in-8", kind: "data-gap", ref: "gap-1", bucket: "task", owner: "stamped-engineer", due: at(1), title: "Lab results missing for lots 3301 to 3305" },
  { ...I, id: "in-9", kind: "proposal", ref: "prop-110", bucket: "task", owner: "process-engineer", title: "Model fit below accepted for Grade A-14" },
  { ...I, id: "in-10", kind: "proposal", ref: "prop-105", bucket: "decided", owner: "operator", title: "Cycle time 33.2 s accepted" },
  { ...I, id: "in-11", kind: "proposal", ref: "prop-107", bucket: "decided", owner: "shift-lead", title: "Melt temperature 232 °C declined" },
  { ...I, id: "in-12", kind: "proposal", ref: "prop-104", bucket: "decided", owner: "plant-head", title: "Hold temperature trial signed" },
  { ...I, id: "in-13", kind: "proposal", ref: "prop-108", bucket: "decided", owner: "operator", title: "Agitator 144 rpm expired" },
  { ...I, id: "in-14", kind: "proposal", ref: "prop-106", bucket: "decided", owner: "process-engineer", title: "Hold time 50 min withheld by safety filter" },
];
export const shiftEvents: T.ShiftEvent[] = [
  { ...I, at: at(0, -7, -50), lineId: "line-a", text: "Shift 1 started, handover read by Shift lead A.", kind: "handover" },
  { ...I, at: at(0, -6, -20), lineId: "line-b", text: "Withheld proposal for Grade A-14: model fit not accepted", kind: "proposal", ref: "prop-110" },
  { ...I, at: at(0, -5), lineId: "line-b", text: "Cycle time 33.2 s accepted by Operator B. under standing approval", kind: "accepted", ref: "prop-105" },
  { ...I, at: at(0, -4, -15), lineId: "line-a", text: "Lab results late from the lab system; 4 lots unanchored", kind: "data", ref: "gap-1" },
  { ...I, at: at(0, -3), lineId: "line-a", text: "Batch 2417 written at 86 °C (trial arm B)", kind: "accepted", ref: "trial-1" },
  { ...I, at: at(0, -2), lineId: "line-b", text: "Melt temperature proposal for resin lot R-77", kind: "proposal", ref: "prop-103" },
  { ...I, at: at(0, -1, -30), lineId: "line-a", text: "Lot 3307 flagged at risk on viscosity", kind: "lot", ref: "lot-a-3307" },
  { ...I, at: at(0, -1, -10), lineId: "line-b", text: "Hold pressure proposal on Press P3", kind: "proposal", ref: "prop-101" },
  { ...I, at: at(0, 0, -40), lineId: "line-a", text: "Agitator speed proposal on Mixer M1", kind: "proposal", ref: "prop-102" },
];

/* ---------------- Lookups ---------------- */
export const byId = {
  line: (id: string) => lines.find((l) => l.id === id),
  asset: (id: string) => assets.find((a) => a.id === id),
  proposal: (id: string) => proposals.find((p) => p.id === id),
  trial: (id: string) => trials.find((t) => t.id === id),
  proof: (id: string) => proofRecords.find((p) => p.id === id),
  lot: (id: string) => lots.find((l) => l.id === id),
  link: (id: string) => lotLinks.find((l) => l.id === id),
  correction: (id: string) => corrections.find((c) => c.id === id),
  gap: (id: string) => dataGaps.find((g) => g.id === id),
  window: (lineId: string, param: string) => signedWindows.find((w) => w.lineId === lineId && w.param === param),
  inbox: (id: string) => inboxItems.find((i) => i.id === id),
  person: (id: string) => people.find((p) => p.id === id),
  role: (id: T.RoleId) => roles.find((r) => r.id === id)!,
};
