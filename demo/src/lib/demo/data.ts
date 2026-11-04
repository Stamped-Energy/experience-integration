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

export const site: T.Site = { ...I, id: "site-demo", name: "Metal works", timezone: "Asia/Kolkata", currency: "INR", units: "metric" };

export const areas: T.Area[] = [
  { ...I, id: "area-forge", siteId: site.id, name: "Forge shop" },
  { ...I, id: "area-heat", siteId: site.id, name: "Heat treatment shop" },
  { ...I, id: "area-foundry", siteId: site.id, name: "Foundry" },
  { ...I, id: "area-machining", siteId: site.id, name: "Machining shop" },
  { ...I, id: "area-mould", siteId: site.id, name: "Moulding shop" },
  { ...I, id: "area-util", siteId: site.id, name: "Utilities" },
];

export const linePacks: T.LinePack[] = [
  {
    ...I, id: "pack-forge", equipmentClass: "Induction billet heater and screw press",
    runDefinition: "One shift run", series: ["Billet exit temperature", "Pusher rate", "Coil power", "Press force", "Die temperature"],
    setpoints: ["billet-temp", "pusher-rate", "coil-power"], modelId: "model-a", constraints: ["Billet exit temperature under 1250 °C", "Die temperature under 300 °C"],
    windowTemplate: "Per part number, signed per quarter", labels: { run: "Shift run", runs: "Shift runs", runShort: "Run", unit: "part", outcome: "Overheating scrap" }, linkThreshold: 0.8,
    outcomeUnit: "%", spec: [0, 1.5], chartSpec: true, keySetpoint: "billet-temp",
  },
  {
    ...I, id: "pack-heat-treatment", equipmentClass: "Hardening furnace, quench tank and temper furnace",
    runDefinition: "One load (basket), charge to unload", series: ["Zone temperature", "Quench oil temperature", "Soak time", "Load mass"],
    setpoints: ["zone-temp", "quench-oil-temp", "soak-time"], modelId: "model-c", constraints: ["Zone temperature under 880 °C", "Quench oil temperature under 85 °C"],
    windowTemplate: "Per part family, signed per quarter", labels: { run: "Load", runs: "Loads", runShort: "Load", unit: "load", outcome: "Hardness" }, linkThreshold: 0.8,
    outcomeUnit: "HRC", spec: [58, 62], chartSpec: true, keySetpoint: "zone-temp",
  },
  {
    ...I, id: "pack-foundry", equipmentClass: "Induction melt furnace and mould line",
    runDefinition: "One heat, melt to last mould poured", series: ["Pour temperature", "Carbon equivalent", "Melt power", "Hold time"],
    setpoints: ["pour-temp", "hold-time", "melt-power"], modelId: "model-d", constraints: ["Pour temperature under 1450 °C", "Hold time at least 10 min"],
    windowTemplate: "Per alloy, signed per quarter", labels: { run: "Heat", runs: "Heats", runShort: "Heat", unit: "casting", outcome: "Casting scrap" }, linkThreshold: 0.8,
    outcomeUnit: "%", spec: [0, 4], chartSpec: true, keySetpoint: "pour-temp",
  },
  {
    ...I, id: "pack-machining", equipmentClass: "Vertical and horizontal machining centres",
    runDefinition: "One shift run per cell", series: ["Spindle load", "Cycle time", "Tool life count"],
    setpoints: ["cycle-time", "spindle-speed", "tool-life-limit"], modelId: "model-e", constraints: ["Spindle load under 85%", "Tool change at or before the life limit"],
    windowTemplate: "Per part number, signed per quarter", labels: { run: "Shift run", runs: "Shift runs", runShort: "Run", unit: "part", outcome: "Rework" }, linkThreshold: 0.8,
    outcomeUnit: "%", spec: [0, 3], chartSpec: true, keySetpoint: "cycle-time",
  },
  {
    ...I, id: "pack-moulding", equipmentClass: "Injection moulding cell",
    runDefinition: "One shift run per tool", series: ["Melt temperature", "Hold pressure", "Cycle time", "Part weight"],
    setpoints: ["melt-temp", "hold-pressure", "cycle-time"], modelId: "model-b", constraints: ["Melt temperature under 255 °C", "Cycle time at least 28 s"],
    windowTemplate: "Per tool, signed per quarter", labels: { run: "Shift run", runs: "Shift runs", runShort: "Run", unit: "part", outcome: "Scrap rate" }, linkThreshold: 0.8,
    outcomeUnit: "%", spec: [0, 4], chartSpec: false, keySetpoint: "cycle-time",
  },
];

export const lines: T.Line[] = [
  {
    ...I, id: "line-a", areaId: "area-forge", name: "Forge line", short: "Forge", type: "discrete", linePackId: "pack-forge",
    mode: "Trial", product: "Axle shaft forging", status: "Heater H1 feeding screw press P1, 72 billets/h",
    kpis: [
      { label: "Parts this shift", value: "552", label2: "Measured" },
      { label: "Overheating scrap", value: "0.9", unit: "%", label2: "Measured" },
      { label: "Heats per 100 parts", value: "104", label2: "Measured" },
    ],
  },
  {
    ...I, id: "line-c", areaId: "area-heat", name: "Heat treatment", short: "Heat treatment", type: "batch", linePackId: "pack-heat-treatment",
    mode: "Proposing", product: "Axle shaft, case hardened", status: "Load 5118 soaking in hardening furnace F1",
    kpis: [
      { label: "Loads today", value: "5", label2: "Measured" },
      { label: "Hardness in spec", value: "96", unit: "%", label2: "Measured" },
      { label: "Quench oil", value: "68", unit: "°C", label2: "Measured" },
    ],
  },
  {
    ...I, id: "line-d", areaId: "area-foundry", name: "Foundry", short: "Foundry", type: "batch", linePackId: "pack-foundry",
    mode: "Proposing", product: "Ductile iron housing", status: "Heat 8836 in melt furnace M1, holding for pour",
    kpis: [
      { label: "Heats today", value: "4", label2: "Measured" },
      { label: "Casting scrap", value: "2.9", unit: "%", label2: "Measured" },
      { label: "Carbon equivalent", value: "4.3", unit: "%", label2: "Measured" },
    ],
  },
  {
    ...I, id: "line-e", areaId: "area-machining", name: "Machining cell", short: "Machining", type: "discrete", linePackId: "pack-machining",
    mode: "Recommend-only", product: "Axle shaft, finish machined", status: "VMC-2 and HMC-1 running, tool life at 61%",
    kpis: [
      { label: "Parts this shift", value: "214", label2: "Measured" },
      { label: "Rework", value: "1.8", unit: "%", label2: "Measured" },
      { label: "Cycle time", value: "108", unit: "s", label2: "Measured" },
    ],
  },
  {
    ...I, id: "line-b", areaId: "area-mould", name: "Moulding", short: "Moulding", type: "discrete", linePackId: "pack-moulding",
    mode: "Proposing", product: "Housing B-40", status: "Tool T3 running, 1,840 parts this shift",
    kpis: [
      { label: "Parts this shift", value: "1,840", label2: "Measured" },
      { label: "Scrap rate", value: "3.2", unit: "%", label2: "Measured" },
      { label: "Cycle time", value: "33.6", unit: "s", label2: "Measured" },
    ],
  },
];

/** [lineId, assetId, name, x, y, w, h]. Machining reuses the CNC asset ids of cycleTime.ts and toolLife.ts. */
const assetDefs: [string, string, string, number, number, number, number][] = [
  ["line-a", "a-heater", "Induction billet heater H1", 0, 0, 3, 3], ["line-a", "a-press", "Screw press P1", 3, 0, 3, 3], ["line-a", "a-trim", "Trim press", 6, 0, 2, 2],
  ["line-c", "c-furnace", "Hardening furnace F1", 0, 0, 3, 3], ["line-c", "c-quench", "Quench tank Q1", 3, 0, 2, 3], ["line-c", "c-temper", "Temper furnace T1", 5, 0, 3, 3],
  ["line-d", "d-melt", "Induction melt furnace M1", 0, 0, 3, 3], ["line-d", "d-mould", "Mould line ML1", 3, 0, 3, 3], ["line-d", "d-spectro", "Lab spectrometer", 6, 0, 2, 2],
  ["line-e", "asset-vmc-2", "VMC-2", 0, 0, 4, 3], ["line-e", "asset-hmc-1", "HMC-1", 4, 0, 4, 3],
  ["line-b", "b-dryer", "Resin dryer", 0, 0, 2, 2], ["line-b", "b-press", "Press P3", 2, 0, 3, 3], ["line-b", "b-tool", "Tool T3", 5, 0, 2, 2],
  ["line-b", "b-robot", "Take-out robot", 7, 0, 1, 2], ["line-b", "b-vision", "Vision check", 7, 2, 1, 1],
];
export const assets: T.Asset[] = assetDefs.map(([lineId, id, name, x, y, w, h]) => ({ ...I, id, lineId, name, section: { x, y, w, h }, keyReadingTagId: `tag-${id}-1` }));

/** [name, unit, normal range low, high]. The range is where readings sit in normal running; the first tag is the asset's key reading. */
const tagDefs: Record<string, [string, string, number, number][]> = {
  "a-heater": [["Billet exit temperature", "°C", 1180, 1240], ["Pusher rate", "billets/h", 60, 90], ["Coil power", "kW", 420, 520]],
  "a-press": [["Press force", "kN", 3800, 5200], ["Die temperature", "°C", 200, 280]],
  "a-trim": [["Trim force", "kN", 500, 800]],
  "c-furnace": [["Zone temperature", "°C", 850, 870], ["Soak time", "min", 90, 130], ["Load mass", "kg", 800, 1200]],
  "c-quench": [["Quench oil temperature", "°C", 60, 80]],
  "c-temper": [["Temper temperature", "°C", 170, 200]],
  "d-melt": [["Pour temperature", "°C", 1400, 1440], ["Melt power", "kW", 900, 1200], ["Hold time", "min", 10, 30]],
  "d-mould": [["Mould rate", "moulds/h", 45, 60]],
  "d-spectro": [["Carbon equivalent", "%", 4.2, 4.4]],
  "asset-vmc-2": [["Spindle load", "%", 35, 75], ["Cycle time", "s", 95, 125], ["Tool life count", "parts", 0, 400]],
  "asset-hmc-1": [["Spindle load", "%", 35, 75], ["Cycle time", "s", 140, 170], ["Tool life count", "parts", 0, 400]],
  "b-dryer": [["Dew point", "°C", -45, -35]], "b-press": [["Melt temperature", "°C", 225, 248], ["Hold pressure", "bar", 640, 820], ["Cycle time", "s", 30, 38]],
  "b-tool": [["Tool temperature", "°C", 58, 66], ["Cavity pressure", "bar", 380, 520]], "b-robot": [["Take-out time", "s", 2.4, 3.2]],
  "b-vision": [["Part weight", "g", 47.6, 48.8], ["Reject count", "parts", 0, 8]],
};
export const tags: T.Tag[] = assets.flatMap((a) => (tagDefs[a.id] ?? []).map(([name, unit, lo, hi], i) => ({ ...I, id: `tag-${a.id}-${i + 1}`, assetId: a.id, lineId: a.lineId, name, unit, range: [lo, hi] as [number, number] })));

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

/** Plant-facing roles for client deploys (Stamped engineer omitted). */
export const CLIENT_ROLES: T.RoleId[] = [
  "operator",
  "shift-lead",
  "process-engineer",
  "quality-head",
  "plant-head",
  "owner",
  "viewer",
];

/** View as list for the showcase today; includes Stamped engineer. Flip to CLIENT_ROLES later. */
export const SHOWCASE_ROLES: T.RoleId[] = [...CLIENT_ROLES, "stamped-engineer"];

export const people: T.Person[] = [
  { ...I, id: "p-op-a", display: "Operator A.", initials: "OA", roles: [{ role: "operator", scope: "line-a" }] },
  { ...I, id: "p-op-b", display: "Operator B.", initials: "OB", roles: [{ role: "operator", scope: "line-b" }] },
  { ...I, id: "p-op-c", display: "Operator C.", initials: "OC", roles: [{ role: "operator", scope: "line-a" }] },
  { ...I, id: "p-op-d", display: "Operator D.", initials: "OD", roles: [{ role: "operator", scope: "line-b" }] },
  { ...I, id: "p-op-e", display: "Operator E.", initials: "OE", roles: [{ role: "operator", scope: "line-c" }] },
  { ...I, id: "p-op-f", display: "Operator F.", initials: "OF", roles: [{ role: "operator", scope: "line-d" }] },
  { ...I, id: "p-op-g", display: "Operator G.", initials: "OG", roles: [{ role: "operator", scope: "line-e" }] },
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
/** Separate seeded stream for forge, heat treatment, foundry and machining run values, so records built on `rnd` keep their numbers. */
let lineSeed = 7771;
function lrnd(): number {
  lineSeed = (lineSeed * 1664525 + 1013904223) % 4294967296;
  return lineSeed / 4294967296;
}

function makeForgeRuns(lineId: string, n: number): T.Run[] {
  const out: T.Run[] = [];
  for (let i = 0; i < n; i++) {
    const startH = -(n - i) * 8;
    const trialArm = i >= n - 10;
    // Trial arm B runs the billets 10 °C cooler; the prior arm A and every earlier run use 1215 °C.
    const billetTemp = trialArm && i % 2 === 0 ? 1205 : 1215;
    const scrap = r2(1.05 + (billetTemp - 1215) * 0.02 + (lrnd() - 0.5) * 0.5);
    out.push({ ...I, id: `run-a-${2380 + i}`, lineId, product: "Axle shaft 4140", start: at(0, startH), end: at(0, startH + 8),
      setpoints: { "billet-temp": billetTemp, "pusher-rate": 75, "coil-power": 470 },
      outcomes: [
        { name: "Overheating scrap", value: scrap, unit: "%", label: i % 5 === 0 ? "Measured" : "Estimated" },
        { name: "Heats per 100 parts", value: r1(102 + scrap * 2 + lrnd() * 3), unit: "heats", label: "Measured" },
      ] });
  }
  return out;
}

function makeMouldingRuns(lineId: string, n: number): T.Run[] {
  const out: T.Run[] = [];
  for (let i = 0; i < n; i++) {
    const startH = -(n - i) * 8;
    const trialArm = i >= n - 10;
    const ct = trialArm ? 33.2 : 34.1;
    out.push({ ...I, id: `run-b-${640 + i}`, lineId, product: "Housing B-40", start: at(0, startH), end: at(0, startH + 8),
      setpoints: { "melt-temp": 236, "hold-pressure": 720, "cycle-time": ct },
      outcomes: [
        { name: "Scrap rate", value: r2(3.0 + rnd() * 1.2), unit: "%", label: "Measured" },
        { name: "Parts", value: Math.round((8 * 3600) / ct * 0.97), unit: "parts", label: "Measured" },
        { name: "Part weight", value: r2(48.1 + (rnd() - 0.5) * 0.4), unit: "g", label: "Measured" },
      ] });
  }
  return out;
}

/** Runs for the lines that carry no legacy records: `shape` gives each run's setpoints and outcomes from its index. */
function makeLineRuns(lineId: string, letter: string, firstNo: number, n: number, hours: number, product: string, shape: (i: number) => Pick<T.Run, "setpoints" | "outcomes">): T.Run[] {
  return Array.from({ length: n }, (_, i) => {
    const startH = -(n - i) * hours;
    return { ...I, id: `run-${letter}-${firstNo + i}`, lineId, product, start: at(0, startH), end: at(0, startH + hours), ...shape(i) };
  });
}

const heatTreatmentRuns = makeLineRuns("line-c", "c", 5090, 30, 6, "Axle shaft, case hardened", (i) => ({
  setpoints: { "zone-temp": 858 + (i % 4) * 3, "quench-oil-temp": 66 + (i % 4) * 2, "soak-time": 105 + (i % 3) * 5 },
  outcomes: [
    { name: "Hardness", value: i % 13 === 5 ? 57.4 : r1(60 + (lrnd() - 0.5) * 2.4), unit: "HRC", label: "Measured" },
    { name: "Load mass", value: Math.round(980 + lrnd() * 160), unit: "kg", label: "Measured" },
  ],
}));
const foundryRuns = makeLineRuns("line-d", "d", 8810, 30, 5, "Ductile iron housing", (i) => ({
  setpoints: { "pour-temp": 1414 + (i % 5) * 5, "hold-time": 14 + (i % 4) * 3, "melt-power": 1000 + (i % 5) * 40 },
  outcomes: [
    { name: "Casting scrap", value: r2(2.2 + lrnd() * 1.6), unit: "%", label: "Measured" },
    { name: "Carbon equivalent", value: r2(4.26 + lrnd() * 0.1), unit: "%", label: "Measured" },
  ],
}));
const machiningRuns = makeLineRuns("line-e", "e", 3300, 30, 8, "Axle shaft, finish machined", (i) => {
  const cycle = i >= 20 ? 106.5 : 108;
  return {
    setpoints: { "cycle-time": cycle, "spindle-speed": 3200, "tool-life-limit": 400 },
    outcomes: [
      { name: "Rework", value: r2(1.2 + lrnd() * 1.2), unit: "%", label: "Measured" },
      { name: "Cycle time", value: r1(cycle + (lrnd() - 0.5) * 1.2), unit: "s", label: "Measured" },
    ],
  };
});

export const runs: T.Run[] = [...makeForgeRuns("line-a", 40), ...makeMouldingRuns("line-b", 40), ...heatTreatmentRuns, ...foundryRuns, ...machiningRuns];
runs.find((r) => r.id === "run-a-2417")!.proofRecordId = "proof-1";
runs.find((r) => r.id === "run-b-679")!.proofRecordId = "proof-3";

/** The six most recent runs of a line: these carry the historian readings. */
const lastRunsOf = (lineId: string): T.Run[] => runs.filter((r) => r.lineId === lineId).slice(-6);

const baseReadings: T.TagReading[] = lastRunsOf("line-b").flatMap((run) =>
  Array.from({ length: 12 }, (_, k) => ({ ...I, tagId: "tag-b-press-1", runId: run.id, at: at(0, 0, -k * 20), value: r1(236 + Math.sin(k / 2) * 1.2 + (rnd() - 0.5)), qualityCode: (k === 7 ? "uncertain" : "good") as T.QualityCode, label: "Measured" as const })),
);

/**
 * Readings for every other tag: same shape as the base series (last 6 runs per line, 12 points per run),
 * values inside each tag's normal range and, where the tag follows a setting, tied to the run's setpoint.
 * Separate seed so the rest of the dataset (which shares rnd) is unchanged.
 */
let tagSeed = 4242;
function trnd(): number { tagSeed = (tagSeed * 1664525 + 1013904223) % 4294967296; return tagSeed / 4294967296; }
type Profile = (run: T.Run, k: number) => number;
const wave = (k: number, amp: number) => Math.sin(k / 2) * amp + (trnd() - 0.5) * amp * 0.8;
/** Moulding tags tied to the run's settings or outcomes. */
const MOULDING_PROFILES: Record<string, Profile> = {
  "tag-b-dryer-1": (_r, k) => r1(-40 + wave(k, 1.2)), // °C dew point
  "tag-b-press-2": (r, k) => Math.round(r.setpoints["hold-pressure"] + wave(k, 6)), // bar
  "tag-b-press-3": (r, k) => r2(r.setpoints["cycle-time"] + wave(k, 0.15)), // s
  "tag-b-tool-1": (_r, k) => r1(62 + wave(k, 0.8)), // °C tool temperature
  "tag-b-tool-2": (r, k) => Math.round(r.setpoints["hold-pressure"] * 0.62 + wave(k, 8)), // bar cavity pressure
  "tag-b-robot-1": (_r, k) => r2(2.8 + wave(k, 0.08)), // s take-out
  "tag-b-vision-1": (r, k) => r2(r.outcomes[2].value + wave(k, 0.08)), // g part weight around the run's mean
  "tag-b-vision-2": (r) => Math.max(0, Math.round(r.outcomes[0].value * 0.9 + (trnd() - 0.5) * 2)), // parts rejected per interval
};
/** Tags that follow a run setpoint: [setpoint key, noise amplitude]. */
const FOLLOWS_SETPOINT: Record<string, [string, number]> = {
  "tag-a-heater-1": ["billet-temp", 4], "tag-a-heater-2": ["pusher-rate", 2], "tag-a-heater-3": ["coil-power", 8],
  "tag-c-furnace-1": ["zone-temp", 2], "tag-c-furnace-2": ["soak-time", 3], "tag-c-quench-1": ["quench-oil-temp", 2],
  "tag-d-melt-1": ["pour-temp", 3], "tag-d-melt-2": ["melt-power", 15], "tag-d-melt-3": ["hold-time", 1],
  "tag-asset-vmc-2-2": ["cycle-time", 0.8],
};
const TOOL_LIFE_TAGS = new Set(["tag-asset-vmc-2-3", "tag-asset-hmc-1-3"]);
/** Decimal places that suit a tag's range width. */
const decimalsFor = (t: T.Tag) => ((t.range[1] - t.range[0]) >= 100 ? 0 : (t.range[1] - t.range[0]) >= 10 ? 1 : 2);
const roundTo = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;

function profileFor(tag: T.Tag): Profile | undefined {
  if (tag.id === "tag-b-press-1") return undefined; // carried by baseReadings
  if (MOULDING_PROFILES[tag.id]) return MOULDING_PROFILES[tag.id];
  const dp = decimalsFor(tag);
  const follow = FOLLOWS_SETPOINT[tag.id];
  if (follow) return (r, k) => roundTo(r.setpoints[follow[0]] + wave(k, follow[1]), dp);
  if (TOOL_LIFE_TAGS.has(tag.id)) return (_r, k) => Math.round(60 + k * 26 + trnd() * 8); // parts since the last tool change, climbing
  if (tag.id === "tag-d-spectro-1") return (r, k) => roundTo(r.outcomes[1].value + wave(k, 0.01), dp); // carbon equivalent around the heat's value
  const mid = (tag.range[0] + tag.range[1]) / 2;
  return (_r, k) => roundTo(mid + wave(k, (tag.range[1] - tag.range[0]) * 0.08), dp);
}

const readingRuns = lines.flatMap((l) => lastRunsOf(l.id));
const extraReadings: T.TagReading[] = tags.filter((t) => profileFor(t)).flatMap((tag) => {
  const profile = profileFor(tag)!;
  return readingRuns.filter((r) => r.lineId === tag.lineId).flatMap((run) =>
    Array.from({ length: 12 }, (_, k) => ({
      ...I, tagId: tag.id, runId: run.id, at: at(0, 0, (Date.parse(run.start) - NOW_MS) / 60000 + k * 40), value: profile(run, k),
      qualityCode: (k === 7 && tag.id.endsWith("-1") ? "uncertain" : "good") as T.QualityCode, label: "Measured" as const,
    })),
  );
});
export const tagReadings: T.TagReading[] = [...baseReadings, ...extraReadings];

/** Every run on every line has its setpoint writes (one per line-pack setpoint). Trial-arm runs show the switches. */
export const setpointWrites: T.SetpointWrite[] = runs.flatMap((r, idx) => {
  const lineRuns = runs.filter((x) => x.lineId === r.lineId);
  const k = lineRuns.indexOf(r);
  const inTrialWindow = k >= lineRuns.length - 10;
  return Object.entries(r.setpoints).map(([param, value], j) => {
    const changed = inTrialWindow && ((r.lineId === "line-a" && param === "billet-temp") || (r.lineId === "line-b" && param === "cycle-time"));
    const skipped = r.lineId === "line-a" && param === "billet-temp" && k === lineRuns.length - 7;
    const byRole: T.RoleId = r.lineId === "line-b" && changed ? "operator" : j === 0 && idx % 9 === 0 ? "shift-lead" : "operator";
    return {
      ...I, runId: r.id, param, value, source: changed ? (k % 2 === 0 || r.lineId === "line-b" ? "proposal" : "prior") : idx % 11 === 0 && j === 1 ? "operator adjust" : "prior",
      byRole, at: at(0, 0, (Date.parse(r.start) - NOW_MS) / 60000 + j), status: skipped ? "skipped" : "written",
      reason: skipped ? "Coil fault on heater H1, switch skipped" : undefined,
    } as T.SetpointWrite;
  });
});

/* ---------------- Limits ---------------- */
const signed = { signerRole: "plant-head", signedBy: "Plant head A." } as const;
export const signedWindows: T.SignedWindow[] = [
  { ...I, id: "win-a-1", lineId: "line-a", param: "billet-temp", name: "Billet exit temperature", unit: "°C", low: 1170, high: 1250, narrowedLow: 1180, narrowedHigh: 1240, narrowedBy: "Process engineer A.", ...signed, signedAt: at(-41), expiresAt: at(50), version: 3, manifestRef: "manifest-demo-v7#A1" },
  { ...I, id: "win-a-2", lineId: "line-a", param: "pusher-rate", name: "Pusher rate", unit: "billets/h", low: 55, high: 95, ...signed, signedAt: at(-41), expiresAt: at(50), version: 3, manifestRef: "manifest-demo-v7#A2" },
  { ...I, id: "win-a-3", lineId: "line-a", param: "coil-power", name: "Coil power", unit: "kW", low: 400, high: 540, narrowedLow: 420, narrowedHigh: 520, narrowedBy: "Stamped engineer A.", ...signed, signedAt: at(-41), expiresAt: at(50), version: 2, manifestRef: "manifest-demo-v7#A3" },
  { ...I, id: "win-b-1", lineId: "line-b", param: "melt-temp", name: "Melt temperature", unit: "°C", low: 225, high: 248, signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-30), expiresAt: at(61), version: 1, manifestRef: "manifest-demo-v7#B1" },
  { ...I, id: "win-b-2", lineId: "line-b", param: "hold-pressure", name: "Hold pressure", unit: "bar", low: 600, high: 860, narrowedLow: 640, narrowedHigh: 820, narrowedBy: "Process engineer A.", signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-30), expiresAt: at(61), version: 1, manifestRef: "manifest-demo-v7#B2" },
  { ...I, id: "win-b-3", lineId: "line-b", param: "cycle-time", name: "Cycle time", unit: "s", low: 30, high: 38, signerRole: "plant-head", signedBy: "Plant head A.", signedAt: at(-30), expiresAt: at(61), version: 2, manifestRef: "manifest-demo-v7#B3" },
  { ...I, id: "win-c-1", lineId: "line-c", param: "zone-temp", name: "Zone temperature", unit: "°C", low: 845, high: 875, narrowedLow: 850, narrowedHigh: 870, narrowedBy: "Process engineer A.", ...signed, signedAt: at(-41), expiresAt: at(50), version: 2, manifestRef: "manifest-demo-v7#C1" },
  { ...I, id: "win-c-2", lineId: "line-c", param: "quench-oil-temp", name: "Quench oil temperature", unit: "°C", low: 55, high: 85, narrowedLow: 60, narrowedHigh: 80, narrowedBy: "Process engineer A.", ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#C2" },
  { ...I, id: "win-c-3", lineId: "line-c", param: "soak-time", name: "Soak time", unit: "min", low: 85, high: 135, ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#C3" },
  { ...I, id: "win-d-1", lineId: "line-d", param: "pour-temp", name: "Pour temperature", unit: "°C", low: 1395, high: 1445, narrowedLow: 1400, narrowedHigh: 1440, narrowedBy: "Process engineer A.", ...signed, signedAt: at(-41), expiresAt: at(50), version: 2, manifestRef: "manifest-demo-v7#D1" },
  { ...I, id: "win-d-2", lineId: "line-d", param: "hold-time", name: "Hold time", unit: "min", low: 10, high: 30, ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#D2" },
  { ...I, id: "win-d-3", lineId: "line-d", param: "melt-power", name: "Melt power", unit: "kW", low: 800, high: 1250, ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#D3" },
  { ...I, id: "win-e-1", lineId: "line-e", param: "cycle-time", name: "Cycle time", unit: "s", low: 95, high: 125, ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#E1" },
  { ...I, id: "win-e-2", lineId: "line-e", param: "spindle-speed", name: "Spindle speed", unit: "rpm", low: 2800, high: 3600, ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#E2" },
  { ...I, id: "win-e-3", lineId: "line-e", param: "tool-life-limit", name: "Tool life limit", unit: "parts", low: 300, high: 450, ...signed, signedAt: at(-41), expiresAt: at(50), version: 1, manifestRef: "manifest-demo-v7#E3" },
];

export const standingApprovals: T.StandingApproval[] = [
  { ...I, id: "sa-1", lineId: "line-b", params: ["cycle-time"], band: "32.5 to 34.5 s", grantedBy: "Plant head A.", from: at(-14), until: at(16), uses: 23, reviewedAt: at(-3) },
  { ...I, id: "sa-2", lineId: "line-a", params: ["coil-power"], band: "450 to 480 kW on axle shaft 4140", grantedBy: "Plant head A.", from: at(-26), until: at(2), uses: 41, reviewedAt: at(-12) },
  { ...I, id: "sa-3", lineId: "line-b", params: ["melt-temp"], band: "234 to 240 °C on Tool T3", grantedBy: "Plant head A.", from: at(-20), until: at(10), uses: 9, reviewedAt: at(-6),
    revokedBy: "Shift lead A.", revokedAt: at(-4, 1), revokeReason: "New resin lot on the line; melt temperature back to per-run decisions until it settles." },
  { ...I, id: "sa-4", lineId: "line-a", params: ["pusher-rate"], band: "72 to 78 billets/h on axle shaft 4140", grantedBy: "Plant head A.", from: at(-5), until: at(25), uses: 6, reviewedAt: at(-5) },
];

const setting = (lineId: string, param: string, name: string, value: number, unit: string, band: [number, number], assetId: string, writtenAt: string, expiresAt: string, mode: T.Mode = "Stay"): T.RunningSetting =>
  ({ ...I, lineId, param, name, value, unit, band, mode, writtenAt, signerRole: "plant-head", expiresAt, assetId });
export const runningSettings: T.RunningSetting[] = [
  setting("line-a", "billet-temp", "Billet exit temperature", 1205, "°C", [1180, 1240], "a-heater", at(0, -3), at(9), "Trial"),
  setting("line-a", "pusher-rate", "Pusher rate", 75, "billets/h", [55, 95], "a-heater", at(-6), at(50)),
  setting("line-a", "coil-power", "Coil power", 470, "kW", [420, 520], "a-heater", at(-6), at(50)),
  setting("line-b", "melt-temp", "Melt temperature", 236, "°C", [225, 248], "b-press", at(-9), at(61)),
  setting("line-b", "hold-pressure", "Hold pressure", 720, "bar", [640, 820], "b-press", at(-9), at(61)),
  setting("line-b", "cycle-time", "Cycle time", 33.2, "s", [30, 38], "b-tool", at(0, 0, -5), at(16)),
  setting("line-c", "zone-temp", "Zone temperature", 860, "°C", [850, 870], "c-furnace", at(-6), at(50)),
  setting("line-c", "quench-oil-temp", "Quench oil temperature", 70, "°C", [60, 80], "c-quench", at(-6), at(50)),
  setting("line-c", "soak-time", "Soak time", 110, "min", [85, 135], "c-furnace", at(-6), at(50)),
  setting("line-d", "pour-temp", "Pour temperature", 1420, "°C", [1400, 1440], "d-melt", at(-5), at(50)),
  setting("line-d", "hold-time", "Hold time", 18, "min", [10, 30], "d-melt", at(-5), at(50)),
  setting("line-d", "melt-power", "Melt power", 1050, "kW", [800, 1250], "d-melt", at(-5), at(50)),
  setting("line-e", "cycle-time", "Cycle time", 106.5, "s", [95, 125], "asset-vmc-2", at(-8), at(50)),
  setting("line-e", "spindle-speed", "Spindle speed", 3200, "rpm", [2800, 3600], "asset-vmc-2", at(-8), at(50)),
  setting("line-e", "tool-life-limit", "Tool life limit", 400, "parts", [300, 450], "asset-vmc-2", at(-8), at(50)),
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
  P({ id: "prop-102", lineId: "line-a", assetId: "a-heater", param: "coil-power", current: 470, proposed: 455, optimiserVersion: "opt 2.4.1",
    reason: "Billet exit temperature has crept up 9 °C over the last four shift runs at the same pusher rate, and overheating scrap rose with it. A small cut in coil power brings the exit temperature back to the middle of its band.",
    evidenceIds: ["EV-A-1188", "EV-A-1191"], predicted: { name: "Overheating scrap", low: 0.7, point: 0.9, high: 1.2, unit: "%", spec: [0, 1.5] },
    drivers: ["Billet exit temperature", "Pusher rate", "Die temperature"], safetyFilter: { pass: true, rules: ["Inside narrowed band 420 to 520 kW", "Billet exit temperature stays under 1250 °C"] },
    fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Waiting", createdAt: at(0, -0, -40), expiresAt: at(0, 3),
    stopEffect: "Stop keeps 455 kW for this shift run and writes nothing new." }),
  P({ id: "prop-103", lineId: "line-b", assetId: "b-press", param: "melt-temp", current: 236, proposed: 239, optimiserVersion: "opt 2.4.1",
    reason: "Resin lot R-77 dries slower; part weight on the first 200 parts sat at the low edge.",
    evidenceIds: ["EV-B-2190"], predicted: { name: "Part weight", low: 47.9, point: 48.2, high: 48.5, unit: "g", spec: [47.6, 48.8] },
    drivers: ["Dew point", "Resin lot"], safetyFilter: { pass: true, rules: ["Inside signed band 225 to 248 °C"] },
    fitState: "accepted", weakestLabel: "Estimated", mode: "Stay", state: "Waiting", createdAt: at(0, -2), expiresAt: at(0, 1),
    stopEffect: "Stop keeps 239 °C and writes nothing new." }),
  P({ id: "prop-104", lineId: "line-a", assetId: "a-heater", param: "billet-temp", current: 1215, proposed: 1205, optimiserVersion: "opt 2.4.0",
    reason: "Shift runs with billets leaving the coil at 1205 °C showed less scale and less overheating scrap in the model of the heater, inside the narrowed band.",
    evidenceIds: ["EV-A-1102", "EV-A-1120"], predicted: { name: "Overheating scrap", low: 0.7, point: 0.85, high: 1.1, unit: "%", spec: [0, 1.5] },
    drivers: ["Billet exit temperature", "Pusher rate", "Coil power"], safetyFilter: { pass: true, rules: ["Inside narrowed band 1180 to 1240 °C"] },
    fitState: "accepted", weakestLabel: "Modelled", mode: "Trial", state: "Running trial", createdAt: at(-6), expiresAt: at(9), decidedBy: "Plant head A.", decidedAt: at(-5),
    stopEffect: "Stop restores the checked prior value, 1215 °C, from the next shift run. If restore fails the line goes recommend-only." }),
  P({ id: "prop-105", lineId: "line-b", assetId: "b-press", param: "cycle-time", current: 34.1, proposed: 33.2, optimiserVersion: "opt 2.4.0",
    reason: "Cooling margin on tool T3 allows a shorter cycle without part weight drift.", evidenceIds: ["EV-B-2101"],
    predicted: { name: "Scrap rate", low: 2.9, point: 3.2, high: 3.6, unit: "%", spec: [0, 4] }, drivers: ["Tool temperature", "Take-out time"],
    safetyFilter: { pass: true, rules: ["Inside standing approval 32.5 to 34.5 s"] }, fitState: "accepted", weakestLabel: "Measured", mode: "Stay", state: "Measuring",
    createdAt: at(-1), expiresAt: at(16), decidedBy: "Operator B.", decidedAt: at(0, -5), stopEffect: "Stop keeps 33.2 s and writes nothing new." }),
  P({ id: "prop-106", lineId: "line-a", assetId: "a-heater", param: "pusher-rate", current: 75, proposed: 82, optimiserVersion: "opt 2.4.0",
    reason: "A faster pusher looked like a way to raise billets per hour on axle shaft 4140.", evidenceIds: ["EV-A-1060"], predicted: { name: "Overheating scrap", low: 1.1, point: 1.4, high: 1.9, unit: "%", spec: [0, 1.5] },
    drivers: ["Pusher rate"], safetyFilter: { pass: false, rules: ["Predicted band crosses the upper spec"] }, fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Withheld",
    createdAt: at(-2), expiresAt: at(-1), stopEffect: "Nothing was written." }),
  P({ id: "prop-107", lineId: "line-b", assetId: "b-tool", param: "melt-temp", current: 236, proposed: 232, optimiserVersion: "opt 2.3.9",
    reason: "Lower melt temperature to save heater energy.", evidenceIds: ["EV-B-1988"], predicted: { name: "Scrap rate", low: 3.0, point: 3.5, high: 4.1, unit: "%", spec: [0, 4] },
    drivers: ["Melt temperature", "Tool temperature"], safetyFilter: { pass: true, rules: ["Inside signed band"] }, fitState: "accepted", weakestLabel: "Estimated", mode: "Stay", state: "Declined",
    createdAt: at(-4), expiresAt: at(-3), decidedBy: "Shift lead A.", decidedAt: at(-4, 1), declineReason: "New resin lot on the line; not changing two things at once.", stopEffect: "Nothing was written." }),
  P({ id: "prop-108", lineId: "line-a", assetId: "a-heater", param: "coil-power", current: 470, proposed: 462, optimiserVersion: "opt 2.3.9",
    reason: "Lower coil power on the lighter billet size.", evidenceIds: ["EV-A-1011"], predicted: { name: "Overheating scrap", low: 0.8, point: 0.95, high: 1.2, unit: "%", spec: [0, 1.5] },
    drivers: ["Coil power"], safetyFilter: { pass: true, rules: ["Inside narrowed band"] }, fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Expired",
    createdAt: at(-5), expiresAt: at(-5, 3), stopEffect: "Nothing was written." }),
  P({ id: "prop-109", lineId: "line-b", assetId: "b-press", param: "hold-pressure", current: 700, proposed: 720, optimiserVersion: "opt 2.3.8",
    reason: "Sink marks on rib side.", evidenceIds: ["EV-B-1902"], predicted: { name: "Scrap rate", low: 3.1, point: 3.4, high: 3.8, unit: "%", spec: [0, 4] },
    drivers: ["Hold pressure"], safetyFilter: { pass: true, rules: ["Inside narrowed band"] }, fitState: "accepted", weakestLabel: "Measured", mode: "Stay", state: "Holding",
    createdAt: at(-12), expiresAt: at(-11), decidedBy: "Operator D.", decidedAt: at(-12, 1), stopEffect: "Stop keeps the value and writes nothing new." }),
  P({ id: "prop-110", lineId: "line-a", assetId: "a-heater", param: "billet-temp", current: 1215, proposed: 1225, optimiserVersion: "opt 2.4.1",
    reason: "Model of the heater is outside its accepted fit for the new axle shaft 4340, so no number is offered.", evidenceIds: ["EV-A-1201"],
    predicted: { name: "Overheating scrap", low: 0.5, point: 1.0, high: 1.8, unit: "%", spec: [0, 1.5] }, drivers: ["Part change"], safetyFilter: { pass: true, rules: ["Inside narrowed band"] },
    fitState: "not accepted", weakestLabel: "Assumed", mode: "Recommend-only", state: "Withheld", createdAt: at(0, -6), expiresAt: at(1), stopEffect: "Nothing was written." }),
  P({ id: "prop-111", lineId: "line-c", assetId: "c-quench", param: "quench-oil-temp", current: 70, proposed: 67, optimiserVersion: "opt 2.4.1",
    reason: "Hardness on the last two loads sat at the low edge of the spec while quench oil ran at the top of its band. Cooler oil brought hardness back to the middle of the spec in 5 of the 7 best loads.",
    evidenceIds: ["EV-C-2102", "EV-C-2104"], predicted: { name: "Hardness", low: 59.2, point: 60.0, high: 60.8, unit: "HRC", spec: [58, 62] },
    drivers: ["Quench oil temperature", "Soak time", "Load mass"], safetyFilter: { pass: true, rules: ["Inside narrowed band 60 to 80 °C", "Oil flash margin held"] },
    fitState: "accepted", weakestLabel: "Estimated", mode: "Stay", state: "Waiting", createdAt: at(0, -1, -30), expiresAt: at(0, 2),
    stopEffect: "Stop keeps 67 °C and writes nothing new." }),
  P({ id: "prop-112", lineId: "line-d", assetId: "d-melt", param: "pour-temp", current: 1420, proposed: 1428, optimiserVersion: "opt 2.4.1",
    reason: "Misruns rose on the last two heats while pour temperature sat at the bottom of its band. A slightly hotter pour closed the gap in 4 of the 6 best heats.",
    evidenceIds: ["EV-D-3101", "EV-D-3108"], predicted: { name: "Casting scrap", low: 2.2, point: 2.7, high: 3.3, unit: "%", spec: [0, 4] },
    drivers: ["Pour temperature", "Carbon equivalent", "Hold time"], safetyFilter: { pass: true, rules: ["Inside narrowed band 1400 to 1440 °C", "Ladle lining temperature margin held"] },
    fitState: "accepted", weakestLabel: "Modelled", mode: "Stay", state: "Waiting", createdAt: at(0, -2, -10), expiresAt: at(0, 1),
    stopEffect: "Stop keeps 1428 °C for this heat and writes nothing new." }),
  P({ id: "prop-113", lineId: "line-e", assetId: "asset-vmc-2", param: "tool-life-limit", current: 400, proposed: 430, optimiserVersion: "opt 2.4.0",
    reason: "Finish-pass inserts on VMC-2 held size past 400 parts on the last three tool changes.", evidenceIds: ["EV-E-4102"],
    predicted: { name: "Rework", low: 1.4, point: 2.2, high: 3.4, unit: "%", spec: [0, 3] }, drivers: ["Tool life count", "Spindle load"],
    safetyFilter: { pass: false, rules: ["Predicted band crosses the upper rework limit"] }, fitState: "accepted", weakestLabel: "Estimated", mode: "Recommend-only", state: "Withheld",
    createdAt: at(-2), expiresAt: at(-1), stopEffect: "Nothing was written." }),
];

/* ---------------- Trials, stops, plans, checks, fits ---------------- */
export const measurementPlans: T.MeasurementPlan[] = [
  { ...I, id: "mp-1", version: 2, hash: "9f2c41ab", lockedAt: at(-6), trialId: "trial-1", measures: [{ name: "Overheating scrap", unit: "%", method: "Switchback, shift run level, difference in means" }, { name: "Heats per 100 parts", unit: "heats", method: "Switchback, from the line counters" }], minBatches: 16 },
  { ...I, id: "mp-2", version: 1, hash: "1b7d09e3", lockedAt: at(-27), trialId: "trial-2", measures: [{ name: "Scrap rate", unit: "%", method: "Switchback, shift level" }], minBatches: 12 },
  { ...I, id: "mp-3", version: 1, hash: "c41e77d0", lockedAt: at(-1), trialId: "trial-4", measures: [{ name: "Hardness", unit: "HRC", method: "Switchback, load level, difference in means" }, { name: "Furnace energy per load", unit: "kWh", method: "Switchback, metered" }], minBatches: 12 },
];
export const trials: T.Trial[] = [
  { ...I, id: "trial-1", lineId: "line-a", change: "Billet exit temperature 1215 to 1205 °C on axle shaft 4140", restoreTarget: { "billet-temp": 1215 },
    schedule: ["Alternate shift runs, 16 shift runs", "Ends after shift run 2426 or on 29 Oct"],
    switches: runs.filter((r) => r.lineId === "line-a").slice(-10).map((r, i) => ({ runId: r.id, arm: i % 2 === 0 ? "B" : "A", done: true, skippedReason: i === 3 ? "Coil fault on heater H1" : undefined })),
    measurementPlanId: "mp-1", draftedBy: "Process engineer A.", signerRole: "plant-head", signedAt: at(-5), status: "running" },
  { ...I, id: "trial-2", lineId: "line-b", change: "Hold pressure 700 to 720 bar on Tool T3", restoreTarget: { "hold-pressure": 700 },
    schedule: ["Alternate shift runs, 12 runs"], switches: runs.filter((r) => r.lineId === "line-b").slice(8, 20).map((r, i) => ({ runId: r.id, arm: i % 2 ? "A" : "B", done: true })),
    measurementPlanId: "mp-2", draftedBy: "Process engineer A.", signerRole: "plant-head", signedAt: at(-27), status: "finished" },
  { ...I, id: "trial-3", lineId: "line-b", change: "Tool temperature 62 to 58 °C on Tool T3", restoreTarget: { "tool-temp": 62 }, schedule: ["Alternate shift runs, 12 runs"], switches: [],
    measurementPlanId: "mp-2", draftedBy: "Process engineer A.", signerRole: "plant-head", status: "awaiting signature" },
  { ...I, id: "trial-4", lineId: "line-c", change: "Soak time 110 to 100 min on case-hardened shafts", restoreTarget: { "soak-time": 110 }, schedule: ["Alternate loads, 12 loads"], switches: [],
    measurementPlanId: "mp-3", draftedBy: "Process engineer A.", signerRole: "plant-head", status: "awaiting signature" },
];
export const stopEvents: T.StopEvent[] = [
  { ...I, id: "stop-1", lineId: "line-a", trialId: "trial-1", by: "Operator C.", at: at(-2, -4), mode: "trial", effect: "Restored 1215 °C for shift run 2412; trial resumed next shift run after review", restoreResult: "restored" },
  { ...I, id: "stop-2", lineId: "line-b", by: "Shift lead A.", at: at(-9), mode: "stay", effect: "Kept 720 bar, no new writes for 2 h", restoreResult: "not needed" },
  { ...I, id: "stop-3", lineId: "line-d", by: "Operator F.", at: at(-3, -2), mode: "stay", effect: "Kept 1420 °C pour temperature, no new writes for 90 min", restoreResult: "not needed" },
];
export const holdingChecks: T.HoldingCheck[] = [
  { ...I, planId: "mp-2", checkedAt: at(-13), result: "holding", nextAt: at(1) },
  { ...I, planId: "mp-2", checkedAt: at(-6), result: "holding", nextAt: at(1) },
  { ...I, planId: "mp-1", checkedAt: at(-1), result: "inconclusive", nextAt: at(3) },
];
const fitChecks = (error: string, cover: string, covered: boolean): T.ModelFit["checks"] => [
  { name: "Held-out error", pass: true, value: error }, { name: "90% interval coverage", pass: covered, value: cover },
  { name: "No drift in residuals", pass: true, value: "flat, 30 d" }, { name: "Physical limits respected", pass: true, value: "all" },
];
export const modelFits: T.ModelFit[] = [
  { ...I, modelId: "model-b", version: "b-1.6", lineId: "line-b", coverage: 0.91, heldOutN: 214, calibratedAt: at(-8), state: "accepted", checks: fitChecks("0.21 % scrap", "91%", true) },
  { ...I, modelId: "model-c", version: "c-1.1", lineId: "line-c", coverage: 0.9, heldOutN: 120, calibratedAt: at(-10), state: "accepted", checks: fitChecks("0.8 HRC", "90%", true) },
  { ...I, modelId: "model-d", version: "d-1.0", lineId: "line-d", coverage: 0.89, heldOutN: 88, calibratedAt: at(-12), state: "accepted", checks: fitChecks("0.4 pp scrap", "89%", true) },
  { ...I, modelId: "model-e", version: "e-1.3", lineId: "line-e", coverage: 0.92, heldOutN: 150, calibratedAt: at(-6), state: "accepted", checks: fitChecks("0.3 pp rework", "92%", true) },
  { ...I, modelId: "model-a", version: "a-2.2", lineId: "line-a", coverage: 0.81, heldOutN: 96, calibratedAt: at(-3), state: "not accepted", checks: fitChecks("0.12 pp scrap", "81%, needs 85 to 95%", false) },
];

/* ---------------- Proof records ---------------- */
const src = (id: string, tag: string, value: string, q: T.QualityCode = "good", label: T.EvidenceLabel = "Measured"): T.SourceRow => ({ id, tag, at: at(-1), value, qualityCode: q, label });
const Q4 = (a: [string, T.EvidenceLabel][], ev: string[]) => [
  "Did the change happen as planned?", "Did the outcome move?", "Could something else explain it?", "Does it hold?",
].map((question, i) => ({ question, answer: a[i][0], label: a[i][1], evidenceIds: [ev[i % ev.length]] }));
export const proofRecords: T.ProofRecord[] = [
  { ...I, id: "proof-1", objectType: "trial", objectId: "trial-1", title: "Billet exit temperature 1205 °C, Forge line", verdict: "Inconclusive", rung: "R2",
    questions: Q4([["Yes, 9 of 10 switches written; 1 skipped and recorded", "Measured"], ["Overheating scrap fell 0.3 points on average", "Measured"], ["Billet mass varied more on trial shift runs; not yet ruled out", "Estimated"], ["Too early: 10 of 16 shift runs", "Unknown"]], ["EV-A-1102", "EV-A-1120", "EV-A-1131"]),
    effect: { value: -0.3, low: -0.7, high: 0.1, unit: "pp", measure: "Overheating scrap" }, diagnostics: ["Balance check passed", "Carry-over check pending"], measurementPlanId: "mp-1", withheldNeeds: 6,
    sourceRows: [src("EV-A-1102", "Billet exit temperature", "1,205 °C"), src("EV-A-1120", "Overheating scrap", "0.84%", "good", "Estimated"), src("EV-A-1131", "Billet mass", "11.2 kg", "uncertain")] },
  { ...I, id: "proof-2", objectType: "trial", objectId: "trial-2", title: "Hold pressure 720 bar, Moulding", verdict: "Improved", rung: "R3",
    questions: Q4([["Yes, 12 of 12 switches written", "Measured"], ["Scrap fell 0.6 points", "Measured"], ["Resin lot and tool temperature balanced across arms", "Measured"], ["Holding at 6 and 13 days", "Measured"]], ["EV-B-1902", "EV-B-1911"]),
    effect: { value: -0.6, low: -0.9, high: -0.3, unit: "pp", measure: "Scrap rate" }, diagnostics: ["Balance check passed", "Carry-over check passed", "Pre-period parallel"], measurementPlanId: "mp-2",
    sourceRows: [src("EV-B-1902", "Reject count", "54 parts"), src("EV-B-1911", "Hold pressure", "720 bar")] },
  { ...I, id: "proof-3", objectType: "run", objectId: "run-b-679", title: "Cycle time 33.2 s, Moulding", verdict: "Improved", rung: "R4",
    questions: Q4([["Yes, standing approval used 23 times", "Measured"], ["Parts per shift up 2.6%", "Measured"], ["Same tool, same resin lot, demand-driven schedule", "Measured"], ["Holding at 14 days", "Measured"]], ["EV-B-2101"]),
    effect: { value: 2.6, low: 1.9, high: 3.3, unit: "%", measure: "Parts per shift" }, diagnostics: ["All passed"],
    sourceRows: [src("EV-B-2101", "Cycle time", "33.2 s")] },
  { ...I, id: "proof-4", objectType: "lot", objectId: "lot-a-3307", title: "Lot 3307 decarb depth save", verdict: "No change", rung: "R2",
    questions: Q4([["Correction sent and accepted", "Measured"], ["Decarb depth moved inside the band of normal lots", "Estimated"], ["Lab result not yet in", "Unknown"], ["Not applicable to a single lot", "Unknown"]], ["EV-A-1188"]),
    effect: { value: 0.02, low: -0.05, high: 0.09, unit: "mm", measure: "Decarb depth vs predicted" }, diagnostics: ["Unanchored until lab result"],
    sourceRows: [src("EV-A-1188", "Coil power", "486 kW")] },
  { ...I, id: "proof-5", objectType: "trial", objectId: "trial-0", title: "Heater idle schedule, Forge line", verdict: "Improved", rung: "R3",
    questions: Q4([["Yes", "Measured"], ["Heats per 100 parts down 3.8%", "Measured"], ["Ambient temperature adjusted for", "Modelled"], ["Holding at 30 days", "Measured"]], ["EV-A-0910"]),
    effect: { value: -3.8, low: -5.1, high: -2.4, unit: "%", measure: "Heats per 100 parts" }, diagnostics: ["All passed"], sourceRows: [src("EV-A-0910", "Coil power", "471 kW")] },
  { ...I, id: "proof-6", objectType: "run", objectId: "run-b-660", title: "Dryer dew point alarm tuning, Moulding", verdict: "No change", rung: "R2",
    questions: Q4([["Yes", "Measured"], ["Splay defects unchanged", "Measured"], ["Resin supplier changed mid-period", "Estimated"], ["Not applicable", "Unknown"]], ["EV-B-1801"]),
    effect: { value: 0.0, low: -0.3, high: 0.3, unit: "pp", measure: "Splay defects" }, diagnostics: ["Passed"], sourceRows: [src("EV-B-1801", "Dew point", "-38 °C")] },
  { ...I, id: "proof-7", objectType: "trial", objectId: "trial-3", title: "Tool temperature 58 °C, Moulding", verdict: "Withheld", rung: "R0",
    questions: Q4([["Not started; awaiting signature", "Unknown"], ["No data yet", "Unknown"], ["No data yet", "Unknown"], ["No data yet", "Unknown"]], ["EV-B-2230"]),
    effect: { value: 0, low: 0, high: 0, unit: "%", measure: "Scrap rate" }, diagnostics: [], withheldNeeds: 12, sourceRows: [] },
];

/* ---------------- Value at the plant's prices (owner Home) ---------------- */
export const prices: T.Price[] = [
  { ...I, item: "Electricity", unit: "kWh", value: 8.4, currency: "INR", effectiveFrom: at(-56) },
  { ...I, item: "Scrapped part, Housing B-40", unit: "part", value: 38, currency: "INR", effectiveFrom: at(-56) },
  { ...I, item: "Reworked batch, axle shaft 4140", unit: "batch", value: 46000, currency: "INR", effectiveFrom: at(-56) },
  { ...I, item: "Extra part per shift (contribution)", unit: "part", value: 21, currency: "INR", effectiveFrom: at(-56) },
];
export const valueItems: T.ValueItem[] = [
  { ...I, id: "val-1", title: "Shorter cycle on Tool T3", lineId: "line-b", status: "Verified", rung: "R4", inrPerMonth: 214000, basis: "2.6% more parts per shift × contribution per part", proofRecordId: "proof-3" },
  { ...I, id: "val-2", title: "Hold pressure 720 bar", lineId: "line-b", status: "Verified", rung: "R3", inrPerMonth: 138000, basis: "0.6 pp less scrap × scrapped part price", proofRecordId: "proof-2" },
  { ...I, id: "val-3", title: "Heater idle schedule", lineId: "line-a", status: "Verified", rung: "R3", inrPerMonth: 96000, basis: "3.8% fewer heats per 100 parts × coil energy per heat × electricity price", proofRecordId: "proof-5" },
  { ...I, id: "val-4", title: "Billet exit temperature 1205 °C trial", lineId: "line-a", status: "Indicative", rung: "R2", inrPerMonth: 172000, basis: "Less overheating scrap, if the trial holds; interval includes zero", proofRecordId: "proof-1" },
  { ...I, id: "val-5", title: "Lot saves from early warnings", lineId: "line-a", status: "Indicative", rung: "R2", inrPerMonth: 92000, basis: "Two batches not reworked × rework price; lab results pending", proofRecordId: "proof-4" },
];
/** 8 weeks of verified value per week (₹ thousand), for the owner trend. */
export const verifiedWeekly: number[] = [38, 41, 52, 60, 71, 84, 98, 104];
export const indicativeWeekly: number[] = [12, 18, 30, 26, 40, 52, 58, 61];

/* ---------------- Quality ---------------- */
export const grades: T.Grade[] = [
  { ...I, id: "g-a12", name: "Axle shaft 4140", lineId: "line-a" }, { ...I, id: "g-a14", name: "Axle shaft 4340", lineId: "line-a" }, { ...I, id: "g-b40", name: "Housing B-40", lineId: "line-b" },
  { ...I, id: "g-c1", name: "Case-hardened shaft", lineId: "line-c" }, { ...I, id: "g-d1", name: "Ductile iron housing", lineId: "line-d" }, { ...I, id: "g-e1", name: "Machined shaft", lineId: "line-e" },
];
export const specs: T.Spec[] = [
  { ...I, gradeId: "g-a12", property: "Decarb depth", unit: "mm", lsl: 0, target: 0.4, usl: 0.8, sourceDoc: "SPEC-A12 rev 4", version: 4 },
  { ...I, gradeId: "g-a14", property: "Decarb depth", unit: "mm", lsl: 0, target: 0.3, usl: 0.6, sourceDoc: "SPEC-A14 rev 1", version: 1 },
  { ...I, gradeId: "g-b40", property: "Part weight", unit: "g", lsl: 47.6, target: 48.2, usl: 48.8, sourceDoc: "SPEC-B40 rev 2", version: 2 },
  { ...I, gradeId: "g-c1", property: "Case hardness", unit: "HRC", lsl: 58, target: 60, usl: 62, sourceDoc: "SPEC-C01 rev 3", version: 3 },
  { ...I, gradeId: "g-d1", property: "Tensile strength", unit: "MPa", lsl: 450, target: 490, usl: 550, sourceDoc: "SPEC-D01 rev 2", version: 2 },
  { ...I, gradeId: "g-e1", property: "Journal diameter", unit: "mm", lsl: 49.98, target: 50.0, usl: 50.02, sourceDoc: "SPEC-E01 rev 1", version: 1 },
];

/** How each line's lots look: id letter and number base, stages, the lab property, and where its predicted band sits. */
interface LotKind {
  letter: string; base: number; stages: string[]; property: string; unit: string; dp: number; halfWidth: number;
  atRisk: number; normal: (i: number) => number; lab: number; gradeId: (i: number) => string;
}
const LOT_KINDS: Record<string, LotKind> = {
  "line-a": { letter: "a", base: 3290, stages: ["Heat", "Forge", "Trim", "Inspect", "Lab"], property: "Decarb depth", unit: "mm", dp: 2, halfWidth: 0.06, atRisk: 0.76, normal: (i) => 0.34 + (i % 5) * 0.03, lab: 0.4, gradeId: (i) => (i === 6 ? "g-a14" : "g-a12") },
  "line-b": { letter: "b", base: 7710, stages: ["Mould", "Vision", "Pack"], property: "Part weight", unit: "g", dp: 1, halfWidth: 0.25, atRisk: 47.7, normal: () => 48.2, lab: 48.2, gradeId: () => "g-b40" },
  "line-c": { letter: "c", base: 5200, stages: ["Load", "Harden", "Quench", "Temper", "Lab"], property: "Case hardness", unit: "HRC", dp: 1, halfWidth: 0.5, atRisk: 58.3, normal: (i) => 59.8 + (i % 5) * 0.3, lab: 60, gradeId: () => "g-c1" },
  "line-d": { letter: "d", base: 8900, stages: ["Melt", "Pour", "Shakeout", "Spectro", "Lab"], property: "Tensile strength", unit: "MPa", dp: 0, halfWidth: 12, atRisk: 458, normal: (i) => 490 + (i % 5) * 6, lab: 492, gradeId: () => "g-d1" },
  "line-e": { letter: "e", base: 3400, stages: ["Rough", "Finish", "Gauge"], property: "Journal diameter", unit: "mm", dp: 3, halfWidth: 0.004, atRisk: 50.018, normal: (i) => 50.002 + (i % 5) * 0.001, lab: 50.003, gradeId: () => "g-e1" },
};
/** The first ten lots alternate forge and moulding (pinned records); the rest cycle through all five lines. */
const lotLineId = (i: number): string => (i < 10 ? (i % 2 === 0 ? "line-a" : "line-b") : ["line-a", "line-b", "line-c", "line-d", "line-e"][(i - 10) % 5]);
export const lots: T.Lot[] = Array.from({ length: 30 }, (_, i) => {
  const lineId = lotLineId(i);
  const kind = LOT_KINDS[lineId];
  const risk: T.Lot["riskWord"] = [0, 3, 6, 9].includes(i) ? "At risk" : i % 7 === 0 ? "Watch" : "On track";
  return { ...I, id: `lot-${kind.letter}-${kind.base + i}`, gradeId: kind.gradeId(i), lineIds: [lineId], stages: kind.stages, startedAt: at(-Math.floor(i / 3), -i),
    status: i < 8 ? "in process" : i < 14 ? "awaiting lab" : i === 20 ? "on hold in quality system" : "complete", riskWord: risk };
});
lots[0].id = "lot-a-3307";
export const lotProperties: T.LotProperty[] = lots.map((l, i) => {
  const kind = LOT_KINDS[l.lineIds[0]];
  const point = l.riskWord === "At risk" ? kind.atRisk : kind.normal(i);
  const dp = kind.dp;
  return { ...I, lotId: l.id, name: kind.property, unit: kind.unit, predicted: { low: roundTo(point - kind.halfWidth, dp), point: roundTo(point, dp), high: roundTo(point + kind.halfWidth, dp) }, anchored: l.status === "complete", labResultId: l.status === "complete" ? `lab-${l.id}` : undefined };
});
export const labResults: T.LabResult[] = lots.filter((l) => l.status === "complete").map((l) => ({ ...I, id: `lab-${l.id}`, lotId: l.id, property: LOT_KINDS[l.lineIds[0]].property, value: LOT_KINDS[l.lineIds[0]].lab, at: at(0, -2) }));
export const lotLinks: T.LotLink[] = lots.flatMap((l, i) => {
  const lineRuns = runs.filter((r) => r.lineId === l.lineIds[0]);
  const runAt = (back: number) => lineRuns[(((lineRuns.length - 1 - back) % lineRuns.length) + lineRuns.length) % lineRuns.length];
  const count = i < 10 ? 2 : 1;
  return Array.from({ length: count }, (_, k) => {
    const low = (i === 2 && k === 0) || (i === 5 && k === 1) || (i === 11 && k === 0);
    const score = low ? r2(0.52 + rnd() * 0.2) : r2(0.86 + rnd() * 0.12);
    return { ...I, id: `link-${l.id}-${k}`, lotId: l.id, runId: runAt(i + k).id, link_confidence: score,
      parts: { timeProximity: r2(0.7 + rnd() * 0.3), recipeMatch: low ? 0.6 : 1, sequenceConsistency: r2(0.8 + rnd() * 0.2), scannedIdAgreement: low ? 0 : 1, multiCandidatePenalty: low ? -0.15 : 0 },
      status: low ? "suggested" : i > 15 ? "approved" : "suggested", label: low ? "unverified" : i > 15 ? "verified" : "estimated",
      candidates: low ? [runAt(i + 1).id] : [] } as T.LotLink;
  });
});
export const driftSignals: T.DriftSignal[] = [
  { ...I, id: "drift-1", property: "Decarb depth", lineId: "line-a", startedAt: at(-3), direction: "up", magnitude: "+0.07 mm over 9 shift runs", label: "Measured" },
  { ...I, id: "drift-2", property: "Part weight", lineId: "line-b", startedAt: at(-1), direction: "down", magnitude: "-0.12 g over 3 shift runs", label: "Measured" },
];
export const alarmBudget: T.AlarmBudget = { ...I, period: "This week", used: 7, limit: 12 };
export const investigations: T.Investigation[] = [
  { ...I, id: "inv-1", title: "Deep decarburisation on axle shaft 4140", lotIds: ["lot-a-3307", "lot-a-3296"], runIds: ["run-a-2416", "run-a-2417"], openedBy: "Quality head A.", status: "open", proofRecordId: "proof-4",
    entries: [
      { at: at(-3), type: "evidence", text: "Decarb depth drifting up over 9 shift runs", evidenceIds: ["EV-A-1180"], label: "Measured" },
      { at: at(-2), type: "link", text: "Lots 3307 and 3296 linked to shift runs 2416 and 2417", evidenceIds: ["EV-A-1185"], label: "Estimated" },
      { at: at(-1), type: "note", text: "Billet exit temperature high on both; pusher rate in band", evidenceIds: ["EV-A-1188"], label: "Measured" },
    ] },
  { ...I, id: "inv-2", title: "Light parts on cavity 2", lotIds: ["lot-b-7711"], runIds: ["run-b-678", "run-b-679"], openedBy: "Quality head A.", status: "closed", conclusion: "Hold pressure raised by Process; holding",
    entries: [{ at: at(-14), type: "conclusion", text: "Correction accepted by Process, verdict improved", evidenceIds: ["EV-B-1902"], label: "Measured" }], proofRecordId: "proof-2" },
  { ...I, id: "inv-3", title: "Low tensile on ductile iron housing", lotIds: ["lot-d-8913"], runIds: ["run-d-8826", "run-d-8827"], openedBy: "Quality head A.", status: "open",
    entries: [
      { at: at(-2), type: "evidence", text: "Tensile strength predicted at the lower spec on two heats", evidenceIds: ["EV-D-3101"], label: "Estimated" },
      { at: at(-1), type: "link", text: "Lot 8913 linked to heat 8826", evidenceIds: ["EV-D-3104"], label: "Estimated" },
      { at: at(0, -6), type: "note", text: "Carbon equivalent at the low end of its range on both heats; pour temperature in band", evidenceIds: ["EV-D-3108"], label: "Measured" },
    ] },
];
export const corrections: T.Correction[] = [
  { ...I, id: "corr-1", lotId: "lot-a-3307", toLineId: "line-a", param: "coil-power", direction: "lower", estimate: { low: -0.08, high: -0.02, unit: "mm" }, label: "Modelled", sentBy: "Quality head A.", status: "sent", proposalId: "prop-102", reason: "Bring lot 3307 back inside the decarb band" },
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
  { ...I, id: "gap-1", sourceId: "ds-lims", from: at(0, -9), to: at(0, -5), affects: "Decarb depth anchors for lots 3301 to 3305" },
  { ...I, id: "gap-2", sourceId: "ds-hist", from: at(-2, -3), to: at(-2, -2), affects: "Coil power on the Forge line, 52 minutes" },
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
  { ...I, scope: "line-a", primary: "Operator A.", backup: "Operator C.", skills: ["Induction heating", "Die changes"] },
  { ...I, scope: "line-c", primary: "Operator E.", backup: "Operator C.", skills: ["Furnace loading", "Quench control"] },
  { ...I, scope: "line-d", primary: "Operator F.", backup: "Operator D.", skills: ["Melting", "Spectrometer checks"] },
  { ...I, scope: "line-e", primary: "Operator G.", backup: "Operator B.", skills: ["Machining", "Tool changes"] },
  { ...I, scope: "line-b", primary: "Operator B.", backup: "Operator D.", skills: ["Moulding", "Tool change"] },
  { ...I, scope: "area-forge", primary: "Process engineer A.", backup: "Shift lead A.", skills: ["Trials"] },
  { ...I, scope: "area-heat", primary: "Process engineer A.", backup: "Shift lead A.", skills: ["Trials"] },
  { ...I, scope: "area-foundry", primary: "Process engineer A.", backup: "Shift lead A.", skills: ["Trials"] },
  { ...I, scope: "area-machining", primary: "Process engineer A.", backup: "Shift lead A.", skills: ["Trials"] },
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
  { ...I, id: "ask-1", title: "Why is decarb depth drifting on the Forge line?", objectRef: "drift-1", updatedAt: at(0, -1),
    messages: [
      { from: "person", text: "Why is decarb depth drifting up on the Forge line this week?" },
      { from: "stamped", claims: [
        { text: "Decarb depth rose 0.07 mm over the last 9 shift runs.", evidenceIds: ["EV-A-1180"], label: "Measured" },
        { text: "Billet exit temperature rose with it on the same shift runs.", evidenceIds: ["EV-A-1188"], label: "Measured" },
        { text: "A small cut in coil power would bring it back inside the band.", evidenceIds: ["EV-A-1191"], label: "Modelled" },
      ], cardRef: "prop-102" },
    ] },
  { ...I, id: "ask-2", title: "What did the cycle time change earn?", updatedAt: at(-1),
    messages: [{ from: "person", text: "What did the Tool T3 cycle change earn last month?" }, { from: "stamped", claims: [{ text: "Parts per shift rose 2.6%, interval 1.9 to 3.3%.", evidenceIds: ["EV-B-2101"], label: "Measured" }], cardRef: "proof-3" }] },
  { ...I, id: "ask-3", title: "Will lot 3307 meet spec?", updatedAt: at(-1, -3),
    messages: [{ from: "person", text: "Will lot 3307 meet spec?" }, { from: "stamped", abstain: "I cannot say yet. The lab result for lot 3307 is missing, so the decarb depth band is unanchored." }] },
  { ...I, id: "ask-4", title: "Handover for Shift 2", updatedAt: at(0, 0, -5),
    messages: [{ from: "person", text: "Summarise Shift 1 for handover." }, { from: "stamped", claims: [{ text: "Two proposals accepted on Moulding, one waiting on the Forge line.", evidenceIds: ["EV-B-2214"], label: "Measured" }] }] },
];
/** Short conversations started from an asset or a line (Ask opened in context). */
const scoped = (id: string, title: string, scope: { assetId?: string; lineId: string }, q: string, claims: T.AskClaim[], confidence: { label: T.EvidenceLabel; band?: string }, refs: string[], ago: number): T.AskThread =>
  ({ ...I, id, title, scope, confidence, refs, updatedAt: at(0, -ago), messages: [{ from: "person", text: q }, { from: "stamped", claims }] });
askThreads.push(
  scoped("ask-m1", "Screw press P1 die temperature", { assetId: "a-press", lineId: "line-a" }, "Why is die temperature on screw press P1 higher at the end of the shift run?",
    [{ text: "Die temperature ends the shift run about 6% above the best runs of this part number.", evidenceIds: ["EV-A-1188"], label: "Measured" },
     { text: "It rises with billet exit temperature on the same runs; a small cut in coil power is modelled to bring overheating scrap back inside the band.", evidenceIds: ["EV-A-1191"], label: "Modelled" }],
    { label: "Modelled", band: "overheating scrap 0.7 to 1.2% after the change" }, ["prop-102", "drift-1", "a-press"], 1),
  scoped("ask-h1", "Heater H1 settings", { assetId: "a-heater", lineId: "line-a" }, "What is heater H1 running at, and why?",
    [{ text: "Billet exit temperature is 1205 °C as the trial arm of the current trial; pusher rate stays at 75 billets per hour.", evidenceIds: ["EV-A-1102"], label: "Measured" },
     { text: "Pressing Stop restores 1215 °C from the next shift run.", evidenceIds: ["EV-A-1131"], label: "Measured" }],
    { label: "Measured", band: "signed 1170 to 1250 °C, narrowed to 1180 to 1240 °C" }, ["trial-1", "win-a-1", "a-heater"], 2),
  scoped("ask-q1", "Quench tank Q1 oil temperature", { assetId: "c-quench", lineId: "line-c" }, "Is it safe to cool the quench oil on tank Q1?",
    [{ text: "The proposed 67 °C sits inside the narrowed band of 60 to 80 °C and the oil flash margin holds.", evidenceIds: ["EV-C-2102"], label: "Measured" },
     { text: "Hardness is expected to move toward the middle of the spec.", evidenceIds: ["EV-C-2104"], label: "Estimated" }],
    { label: "Estimated", band: "hardness 59.2 to 60.8 HRC" }, ["prop-111", "win-c-2", "c-quench"], 1),
  scoped("ask-p3", "Press P3 hold pressure", { assetId: "b-press", lineId: "line-b" }, "Is it safe to raise hold pressure on Press P3?",
    [{ text: "The proposed value sits inside the narrowed band of 640 to 820 bar and passes the clamp force check.", evidenceIds: ["EV-B-2207"], label: "Measured" },
     { text: "Scrap is expected to fall slightly with the higher pressure.", evidenceIds: ["EV-B-2214"], label: "Estimated" }],
    { label: "Estimated", band: "scrap rate 2.4 to 3.3%" }, ["prop-101", "win-b-2", "b-press"], 1),
  scoped("ask-t3", "Tool T3 cycle time", { assetId: "b-tool", lineId: "line-b" }, "Has the shorter cycle on Tool T3 held up?",
    [{ text: "Parts per shift are up 2.6% on the same tool and resin lot.", evidenceIds: ["EV-B-2101"], label: "Measured" },
     { text: "Part weight has not drifted since the change.", evidenceIds: ["EV-B-2101"], label: "Measured" }],
    { label: "Measured", band: "1.9 to 3.3% more parts per shift" }, ["proof-3", "sa-1", "b-tool"], 3),
  scoped("ask-la", "Forge line today", { lineId: "line-a" }, "What needs attention on the Forge line today?",
    [{ text: "One proposal is waiting on coil power, and the billet temperature trial is on shift run 10 of 16.", evidenceIds: ["EV-A-1131"], label: "Measured" },
     { text: "One lot is at risk on decarb depth; its band is unanchored until the lab result arrives.", evidenceIds: ["EV-A-1188"], label: "Estimated" }],
    { label: "Estimated", band: "lot decarb depth 0.70 to 0.82 mm" }, ["prop-102", "trial-1", "lot-a-3307"], 1),
  scoped("ask-lb", "Moulding today", { lineId: "line-b" }, "How is Moulding doing this shift?",
    [{ text: "1,840 parts so far with scrap at 3.2%, inside the 4% limit.", evidenceIds: ["EV-B-2214"], label: "Measured" },
     { text: "Two proposals are waiting: hold pressure on Press P3 and melt temperature for the new resin lot.", evidenceIds: ["EV-B-2190"], label: "Measured" }],
    { label: "Measured", band: "scrap 3.0 to 4.2% over the last 40 shift runs" }, ["prop-101", "prop-103", "line-b"], 0),
);
/** Ask panel chips (the panel shows the first three). Each must be a key of SUGGESTED in askRich.ts; tests/ask-copy.test.ts checks that. */
export const suggestedQuestions: string[] = ["Why are cold billets rising after stops?", "Is quench oil holding hardness in spec?", "Should we hold the next moulds from heat 8836?", "Which lots are at risk today?"];
export const savedAnswers: T.SavedAnswer[] = [
  { ...I, id: "sa-ans-1", threadId: "ask-2", title: "Tool T3 cycle change, value", savedBy: "Owner A.", at: at(-1), lineId: "line-b", topic: "Process",
    summary: "Parts per shift rose 2.6% after the cycle change; the value at the plant's prices is on the owner's Home.", confidence: { label: "Measured", band: "1.9 to 3.3% parts per shift" }, refs: ["proof-3", "val-1", "prop-105"] },
  { ...I, id: "sa-ans-2", threadId: "ask-1", title: "Forge line decarb depth drift", savedBy: "Quality head A.", at: at(0, -1), lineId: "line-a", topic: "Quality",
    summary: "Decarb depth rose 0.07 mm over 9 shift runs with billet exit temperature; a small cut in coil power is modelled to bring it back.", confidence: { label: "Modelled", band: "overheating scrap 0.7 to 1.2% after the change" }, refs: ["drift-1", "prop-102", "inv-1"] },
  { ...I, id: "sa-ans-3", threadId: "ask-1", title: "Will a faster pusher work on axle shaft 4140?", savedBy: "Process engineer A.", at: at(-9), lineId: "line-a", topic: "Process",
    summary: "A pusher rate of 82 billets per hour was predicted to keep overheating scrap inside spec.", confidence: { label: "Modelled", band: "1.1 to 1.9% overheating scrap" }, refs: ["prop-106", "model-a"],
    stale: { since: at(-3), reason: "Model of the heater recalibrated to a-2.2 and its fit is no longer accepted; the safety filter has since withheld this change." } },
  { ...I, id: "sa-ans-4", threadId: "ask-3", title: "Lot 3307 outlook", savedBy: "Shift lead A.", at: at(-2), lineId: "line-a", topic: "Quality",
    summary: "Predicted decarb depth sat near the upper spec; the band was unanchored at the time.", confidence: { label: "Estimated", band: "0.70 to 0.82 mm" }, refs: ["lot-a-3307", "corr-1"],
    stale: { since: at(-1), reason: "A correction was sent to Process after this was saved, and lab results for the lot are still missing." } },
  { ...I, id: "sa-ans-5", threadId: "ask-2", title: "Hold pressure 720 bar, did it hold?", savedBy: "Plant head A.", at: at(-6), lineId: "line-b", topic: "Process",
    summary: "Scrap fell 0.6 points and was still holding at the last check.", confidence: { label: "Measured", band: "0.3 to 0.9 points less scrap" }, refs: ["proof-2", "trial-2", "val-2"] },
  { ...I, id: "sa-ans-6", threadId: "ask-4", title: "Light parts on cavity 2", savedBy: "Quality head A.", at: at(-13), lineId: "line-b", topic: "Quality",
    summary: "Part weight on cavity 2 recovered after Process raised hold pressure.", confidence: { label: "Measured", band: "48.0 to 48.4 g" }, refs: ["inv-2", "corr-2", "lot-b-7711"] },
];
export const notes: T.Note[] = [
  { ...I, id: "note-1", kind: "handover", title: "Shift 1 to Shift 2", at: at(0, 0, -5), lineId: "line-a", topic: "Process", claims: [{ text: "Billet temperature trial on shift run 10 of 16.", evidenceIds: ["EV-A-1131"], label: "Measured" }, { text: "Lot 3307 at risk, correction sent to Process.", evidenceIds: ["EV-A-1188"], label: "Estimated" }] },
  { ...I, id: "note-2", kind: "weekly", title: "Week 42 note", at: at(-1), claims: [{ text: "Three changes verified this quarter, two indicative.", evidenceIds: ["EV-B-2101"], label: "Measured" }] },
  { ...I, id: "note-3", kind: "handover", title: "Shift 3 to Shift 1", at: at(0, -8), lineId: "line-b", topic: "Process", claims: [
    { text: "Cycle time 33.2 s running under the standing approval; 23 uses so far.", evidenceIds: ["EV-B-2101"], label: "Measured" },
    { text: "Resin lot R-77 on the dryer; first parts sat at the low edge of part weight.", evidenceIds: ["EV-B-2190"], label: "Measured" },
  ] },
  { ...I, id: "note-4", kind: "handover", title: "Shift 2 to Shift 3, yesterday", at: at(-1, -6), lineId: "line-a", topic: "Quality", claims: [
    { text: "Decarb depth drifting up over the last 9 shift runs.", evidenceIds: ["EV-A-1180"], label: "Measured" },
    { text: "Lab system late; four lots unanchored until results arrive.", evidenceIds: ["EV-A-1185"], label: "Unknown" },
  ] },
  { ...I, id: "note-5", kind: "weekly", title: "Week 41 note", at: at(-8), topic: "Process", claims: [
    { text: "Hold pressure 720 bar on Tool T3 verified at R3, with less scrap holding at both checks.", evidenceIds: ["EV-B-1902"], label: "Measured" },
    { text: "Billet temperature trial on the Forge line signed and started.", evidenceIds: ["EV-A-1102"], label: "Measured" },
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
    before: action === "Narrowed limit" ? "1170 to 1250 °C" : undefined, after: action === "Narrowed limit" ? "1180 to 1240 °C" : undefined,
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
  { ...I, id: "in-2", kind: "proposal", ref: "prop-102", bucket: "waiting", owner: "operator", due: at(0, 3), title: "Cut coil power to 455 kW on heater H1" },
  { ...I, id: "in-3", kind: "proposal", ref: "prop-103", bucket: "waiting", owner: "operator", due: at(0, 1), title: "Raise melt temperature to 239 °C for resin lot R-77" },
  { ...I, id: "in-4", kind: "trial-signature", ref: "trial-3", bucket: "waiting", owner: "plant-head", due: at(1), title: "Sign trial: tool temperature 58 °C on Tool T3" },
  { ...I, id: "in-5", kind: "correction", ref: "corr-1", bucket: "waiting", owner: "process-engineer", due: at(0, 4), title: "Correction from Quality: lot 3307 decarb depth" },
  { ...I, id: "in-6", kind: "lot-link", ref: "link-lot-a-3292-0", bucket: "task", owner: "quality-head", due: at(0, 6), title: "Confirm link: lot 3292 to its shift run" },
  { ...I, id: "in-7", kind: "lot-link", ref: "link-lot-b-7715-1", bucket: "task", owner: "quality-head", due: at(0, 8), title: "Confirm link: lot 7715 to its shift run" },
  { ...I, id: "in-8", kind: "data-gap", ref: "gap-1", bucket: "task", owner: "stamped-engineer", due: at(1), title: "Lab results missing for lots 3301 to 3305" },
  { ...I, id: "in-9", kind: "proposal", ref: "prop-110", bucket: "task", owner: "process-engineer", title: "Model fit below accepted for axle shaft 4340" },
  { ...I, id: "in-10", kind: "proposal", ref: "prop-105", bucket: "decided", owner: "operator", title: "Cycle time 33.2 s accepted" },
  { ...I, id: "in-11", kind: "proposal", ref: "prop-107", bucket: "decided", owner: "shift-lead", title: "Melt temperature 232 °C declined" },
  { ...I, id: "in-12", kind: "proposal", ref: "prop-104", bucket: "decided", owner: "plant-head", title: "Billet temperature trial signed" },
  { ...I, id: "in-13", kind: "proposal", ref: "prop-108", bucket: "decided", owner: "operator", title: "Coil power 462 kW expired" },
  { ...I, id: "in-14", kind: "proposal", ref: "prop-106", bucket: "decided", owner: "process-engineer", title: "Pusher rate 82 billets/h withheld by safety filter" },
  { ...I, id: "in-15", kind: "proposal", ref: "prop-111", bucket: "waiting", owner: "operator", due: at(0, 2), title: "Cool the quench oil to 67 °C on tank Q1" },
  { ...I, id: "in-16", kind: "proposal", ref: "prop-112", bucket: "waiting", owner: "operator", due: at(0, 1), title: "Raise pour temperature to 1428 °C on melt furnace M1" },
  { ...I, id: "in-17", kind: "trial-signature", ref: "trial-4", bucket: "waiting", owner: "plant-head", due: at(1), title: "Sign trial: soak time 100 min on furnace F1" },
  { ...I, id: "in-18", kind: "proposal", ref: "prop-113", bucket: "decided", owner: "process-engineer", title: "Tool life limit 430 parts withheld by safety filter" },
];
export const shiftEvents: T.ShiftEvent[] = [
  { ...I, at: at(0, -7, -50), lineId: "line-a", text: "Shift 1 started, handover read by Shift lead A.", kind: "handover" },
  { ...I, at: at(0, -6, -20), lineId: "line-a", text: "Withheld proposal for axle shaft 4340: model fit not accepted", kind: "proposal", ref: "prop-110" },
  { ...I, at: at(0, -5), lineId: "line-b", text: "Cycle time 33.2 s accepted by Operator B. under standing approval", kind: "accepted", ref: "prop-105" },
  { ...I, at: at(0, -4, -15), lineId: "line-a", text: "Lab results late from the lab system; 4 lots unanchored", kind: "data", ref: "gap-1" },
  { ...I, at: at(0, -3), lineId: "line-a", text: "Shift run 2417 written at 1205 °C (trial arm B)", kind: "accepted", ref: "trial-1" },
  { ...I, at: at(0, -2, -20), lineId: "line-c", text: "Quench oil proposal on tank Q1", kind: "proposal", ref: "prop-111" },
  { ...I, at: at(0, -2), lineId: "line-b", text: "Melt temperature proposal for resin lot R-77", kind: "proposal", ref: "prop-103" },
  { ...I, at: at(0, -1, -50), lineId: "line-d", text: "Pour temperature proposal on melt furnace M1", kind: "proposal", ref: "prop-112" },
  { ...I, at: at(0, -1, -30), lineId: "line-a", text: "Lot 3307 flagged at risk on decarb depth", kind: "lot", ref: "lot-a-3307" },
  { ...I, at: at(0, -1, -10), lineId: "line-b", text: "Hold pressure proposal on Press P3", kind: "proposal", ref: "prop-101" },
  { ...I, at: at(0, 0, -40), lineId: "line-a", text: "Coil power proposal on heater H1", kind: "proposal", ref: "prop-102" },
];

/* ---------------- Lookups ---------------- */
export const byId = {
  line: (id: string) => lines.find((l) => l.id === id),
  linePack: (id: string) => linePacks.find((p) => p.id === id),
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
