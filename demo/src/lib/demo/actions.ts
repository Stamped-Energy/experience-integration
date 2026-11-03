/**
 * Worked example actions for the Process and Quality overviews. Fictional and illustrative, on the demonstration plant.
 * Figures are MODELLED demo values. Line A is forging, Line C heat treatment, Line D the foundry, Line E machining, Line B moulding.
 * None is a customer result.
 */
import type * as T from "./types";
import { at } from "./data";

const I = { illustrative: true } as const;
const M = "Modelled" as const;

export const exampleActions: T.ExampleAction[] = [
  /* ---------------- Process ---------------- */
  {
    ...I, id: "ex-p1", area: "Process", lineId: "line-a", steps: ["Detect", "Trial"],
    mechanism: "Trim the hot spell at the induction heater",
    outcome: { metric: "Overheating scrap", before: "1.2%", after: "0.8%", label: M },
    title: "Trial a lower billet exit target when heater H1 runs hot",
    seen: "When the press stops for a die check, billets wait in heater H1 and leave the coil hotter than the middle of the band. Those hot billets are where most overheating scrap starts.",
    evidence: [
      { text: "Billet exit temperature after press stops, last 12 shift runs", label: "Measured", id: "EV-A-1301" },
      { text: "Overheating scrap coded to billets above 1230 °C", label: "Measured", id: "EV-A-1302" },
      { text: "Measurement plan locked before the first switch", label: "Measured" },
    ],
    action: "Trial a billet exit target of 1205 °C on alternate shift runs on the Forge line. Stop restores 1215 °C straight away.",
    who: {
      how: "A person decides",
      roles: ["plant-head"],
      note: "The Plant head signed the trial. Operators can stop it at any time.",
    },
    expected: { label: M, band: "overheating scrap 0.7 to 1.1%; heats per 100 parts 103 to 105" },
    why: "Billets that leave the coil nearer the middle of the band scale and overheat less, with no loss of forgeability.",
    href: "/process/trials/trial-1",
    hrefLabel: "Open the trial",
  },
  {
    ...I, id: "ex-p2", area: "Process", lineId: "line-a", steps: ["Detect", "Propose"],
    mechanism: "Hold the coil warm through short press stops",
    outcome: { metric: "Heats per 100 parts", before: "109", after: "104", label: M, measuredAfter: "104" },
    title: "Hold the coil warm through short press stops",
    seen: "When the press stops for under ten minutes, heater H1 either runs the billets in it too hot or lets the line empty out cold. A warm idle level avoids both.",
    evidence: [
      { text: "Coil power and billet temperature through the last 20 short stops", label: "Measured", id: "EV-A-1311" },
      { text: "Heats lost to cold restarts after short stops", label: "Measured", id: "EV-A-1312" },
    ],
    action: "Drop heater H1 to a warm idle level during press stops under ten minutes, and return to run power when the press restarts. Stays inside the signed coil-power band.",
    who: {
      how: "On its own, inside the signed band",
      roles: ["plant-head"],
      note: "Written under the standing approval the Plant head signed. Any operator can press Stop and the prior coil power comes back.",
    },
    expected: { label: M, band: "heats per 100 parts 104; overheating scrap 0.9%; coil energy 4% lower per 100 parts" },
    why: "A warm idle keeps billets ready without cooking them, so fewer heats are wasted around stops.",
  },
  {
    ...I, id: "ex-p3", area: "Process", lineId: "line-a", steps: ["Detect", "Explain", "Propose"],
    mechanism: "Pace the pusher to the press",
    outcome: { metric: "Billets waiting at a stop", before: "13", after: "5", label: M },
    title: "Pace the pusher to the press on heater H1",
    seen: "The pusher feeds billets at a fixed rate while screw press P1 slows for die changes and checks. The coil fills with billets that then overheat while they wait.",
    evidence: [
      { text: "Pusher rate against press stroke rate, last 12 shift runs", label: "Measured", id: "EV-A-1321" },
      { text: "Billets in the coil at each press stop", label: "Measured", id: "EV-A-1322" },
    ],
    action: "Link the pusher rate to the press stroke rate so heater H1 never holds more than six billets ahead of the press. Stays inside the signed pusher-rate band.",
    who: {
      how: "A person decides",
      roles: ["process-engineer", "shift-lead", "plant-head"],
      note: "The Process engineer, Shift lead or Plant head accepts the pusher change before the next shift run.",
    },
    options: [
      { id: "accept", label: "Pace the pusher to the press", primary: true, done: "Pusher pacing accepted for heater H1." },
      { id: "keep", label: "Keep the fixed pusher rate", done: "Kept the fixed pusher rate. The reason is recorded." },
    ],
    expected: { label: M, band: "billets waiting 5; overheating scrap 0.9%; heats per 100 parts 105" },
    why: "Feeding the coil at the pace the press can take keeps billets from sitting hot.",
  },
  {
    ...I, id: "ex-p4", area: "Process", lineId: "line-d", steps: ["Detect", "Explain", "Propose"],
    mechanism: "Ease melt power while the mould line is stopped",
    outcome: { metric: "Melt energy per tonne", before: "612 kWh", after: "574 kWh", label: M },
    title: "Ease melt power on furnace M1 while the mould line is stopped",
    seen: "When mould line ML1 stops for a pattern change or a jam, furnace M1 keeps melting at full power. The metal overheats while it waits, which costs energy and burns off carbon equivalent.",
    evidence: [
      { text: "Melt power and metal temperature through the last 15 mould-line stops", label: "Measured", id: "EV-D-1301" },
      { text: "Carbon equivalent lost between tap and pour on long waits", label: "Measured", id: "EV-D-1302" },
    ],
    action: "Step melt power down to a holding level while the mould line is stopped, and bring it back ahead of the next pour. Stays inside the signed melt-power band.",
    who: {
      how: "A person decides",
      roles: ["process-engineer", "shift-lead", "plant-head"],
      note: "The Process engineer, Shift lead or Plant head accepts the melt-power change before the next heat is tapped.",
    },
    options: [
      { id: "accept", label: "Ease melt power during stops", primary: true, done: "Melt-power easing accepted for furnace M1." },
      { id: "keep", label: "Keep full power", done: "Kept full melt power. The reason is recorded." },
    ],
    expected: { label: M, band: "melt energy per tonne 574 kWh; pour temperature inside 1400 to 1440 °C; casting scrap 2.7%" },
    why: "Holding the metal instead of overheating it saves energy and keeps the chemistry where the lab set it.",
  },
  {
    ...I, id: "ex-p5", area: "Process", lineId: "line-e", steps: ["Explain", "Propose"],
    mechanism: "Try a feed change on the twin before the machine",
    outcome: { metric: "Cycle time", before: "108 s", after: "103 s", label: M },
    title: "Raise the finish-pass feed on VMC-2, tried on the twin first",
    seen: "The finish pass on VMC-2 runs well under the spindle load the tool can take. A higher feed shortens the cycle, but tool life and bore size need checking before anyone touches the machine.",
    evidence: [
      { text: "Spindle load by pass on VMC-2, last 12 shift runs", label: "Measured", id: "EV-E-1301" },
      { text: "Tool life count at each change on VMC-2", label: "Measured", id: "EV-E-1302" },
    ],
    action: "Run a higher finish-pass feed on VMC-2 on the twin, and read tool life, spindle load and bore size from it before the machine is changed.",
    who: {
      how: "Recommend only",
      roles: ["process-engineer", "plant-head"],
      note: "The feed is outside the signed limits for this cell, so the Process engineer or Plant head decides and changes it on the machine.",
    },
    options: [
      { id: "accept", label: "Plan the feed change", primary: true, done: "Feed change planned for VMC-2 after the twin run." },
      { id: "decline", label: "Decline with reason", done: "Declined. The reason is recorded and the agent learns from it." },
    ],
    expected: { label: M, band: "cycle 103 s; spindle load 68%; tool life 380 parts" },
    why: "The twin shows what a faster feed costs in tool life before the machine takes the risk.",
    href: "/process/simulate",
    hrefLabel: "Open the twin",
  },
  {
    ...I, id: "ex-p6", area: "Process", lineId: "line-b", steps: ["Detect", "Propose"],
    mechanism: "More shots from less cool time",
    outcome: { metric: "Cycle time", before: "33.2 s", after: "32.4 s", label: M },
    title: "Tighten the cooling time on Tool T3",
    seen: "Parts from Tool T3 are stable at ejection before the cooling timer ends. Cutting the cool time gives more shots per shift.",
    evidence: [
      { text: "Part temperature at ejection, last 12 shift runs", label: "Measured", id: "EV-B-2401" },
      { text: "Ejection force and warp checks after early open trials", label: "Measured", id: "EV-B-2402" },
    ],
    action: "Reduce Tool T3 cooling time so cycle time moves from 33.2 s to 32.4 s, inside the signed cycle-time band.",
    who: {
      how: "A person decides",
      roles: ["process-engineer", "shift-lead", "plant-head"],
      note: "The Process engineer, Shift lead or Plant head accepts the cooling cut before the next tool run.",
    },
    options: [
      { id: "accept", label: "Tighten cooling time", primary: true, done: "Cooling time cut accepted for Tool T3." },
      { id: "keep", label: "Keep current cool time", done: "Kept the current cool time. The reason is recorded." },
    ],
    expected: { label: M, band: "cycle 32.4 s; energy per good part 0.40 kWh; scrap 3.0%" },
    why: "Cooling only as long as the part needs frees press time and cuts energy per good part.",
  },

  /* ---------------- Quality ---------------- */
  {
    ...I, id: "ex-q1", area: "Quality", lineId: "line-c", steps: ["Detect", "Decide"],
    mechanism: "Catch quench oil rising before hardness slips",
    outcome: { metric: "Baskets in hardness spec", before: "93%", after: "97%", label: M },
    title: "Hold the next basket while quench oil rises basket to basket",
    seen: "Quench oil on tank Q1 has warmed with every basket for the last four. The same climb came before the last low-hardness baskets, and the next basket is already staged.",
    evidence: [
      { text: "Quench oil temperature, last six baskets", label: "Measured", id: "EV-C-1320" },
      { text: "Oil climb against hardness on the last three low baskets", label: "Measured", id: "EV-C-1321" },
    ],
    action: "Hold the next basket at the quench door until the oil is back under 72 °C, then sample hardness on that basket.",
    who: {
      how: "A person decides",
      roles: ["operator", "shift-lead", "quality-head"],
      note: "The operator, Shift lead or Quality head chooses. Stamped asks; it never sets or releases a hold. A hold is set in your quality system.",
    },
    options: [
      { id: "hold", label: "Hold the next basket", primary: true, done: "Recorded: next basket held at tank Q1." },
      { id: "sample", label: "Sample now, no hold", done: "Recorded: early hardness sample only on the next basket." },
      { id: "continue", label: "Carry on, with a reason", done: "Recorded with your reason. Stamped keeps watching the quench oil." },
    ],
    expected: { label: M, band: "baskets in spec 97%; reheat loads 1 in 40" },
    why: "Catching the oil climb that came before the last low baskets keeps the next one inside spec.",
    href: "/process/runs/run-c-5119",
    hrefLabel: "Open load 5119",
  },
  {
    ...I, id: "ex-q2", area: "Quality", lineId: "line-a", steps: ["Detect", "Propose"],
    mechanism: "Pool cold billets and force outliers into one risk flag",
    outcome: { metric: "Defect escapes", before: "2.1%", after: "1.2%", label: M },
    title: "Flag the press run when cold billets and force outliers pile up",
    seen: "Billets that left heater H1 cold and press strokes with force outside the usual band show up together before laps are found at inspection. Either alone is common; together they mark a risky stretch.",
    evidence: [
      { text: "Billet exit temperature and press force by stroke, last 200 strokes", label: "Measured", id: "EV-A-1330" },
      { text: "Inspection lap codes followed the combined flag", label: "Measured", id: "EV-A-1331" },
    ],
    action: "Raise a floor flag on the run when both signals sit in the risk pool, and hold the next tray for a lap check before it moves on.",
    who: {
      how: "A person decides",
      roles: ["operator", "shift-lead", "quality-head"],
      note: "The operator, Shift lead or Quality head confirms the flag response. Stamped does not scrap parts on its own.",
    },
    options: [
      { id: "flag", label: "Flag the run and hold the tray", primary: true, done: "Recorded: press run flagged and next tray held." },
      { id: "watch", label: "Watch only this shift", done: "Recorded: watch-only on the press risk pool." },
    ],
    expected: { label: M, band: "defect escapes 1.2%; laps caught within 20 strokes" },
    why: "Two weak signals together are enough warning to stop a bad stretch moving on to inspection.",
  },
  {
    ...I, id: "ex-q3", area: "Quality", lineId: "line-d", steps: ["Detect", "Decide"],
    mechanism: "Hold moulds poured outside the good-heat window",
    outcome: { metric: "Casting scrap", before: "3.6%", after: "2.5%", label: M },
    title: "Hold the next moulds when pour temperature leaves the good-heat window",
    seen: "Heat 8836 is pouring at 1397 °C, under the 1405 to 1435 °C window that good heats on this alloy sat in. Moulds poured cold are where misruns come from.",
    evidence: [
      { text: "Pour temperature by ladle on heat 8836", label: "Measured", id: "EV-D-1340" },
      { text: "Misrun scrap against pour temperature on the last 30 heats", label: "Measured", id: "EV-D-1341" },
    ],
    action: "Hold the next moulds from the ladle until the quality system clears them, and check the first castings for misruns before they are released.",
    who: {
      how: "A person decides",
      roles: ["shift-lead", "quality-head", "plant-head"],
      note: "The Shift lead or Quality head sets the hold in your quality system, and the Quality head releases it. Stamped asks; it never sets or releases a hold.",
    },
    options: [
      { id: "hold", label: "Hold the next moulds", primary: true, done: "Recorded: moulds from the ladle held for quality." },
      { id: "continue", label: "Pour on, with a reason", done: "Recorded with your reason. Stamped keeps watching the pour temperature." },
    ],
    expected: { label: M, band: "casting scrap 2.5%; misruns caught before shakeout" },
    why: "Moulds held before shakeout cost far less than castings scrapped after machining.",
  },
  {
    ...I, id: "ex-q4", area: "Quality", lineId: "line-d", steps: ["Explain", "Verify"],
    mechanism: "Trace a bore scrap back to its heat",
    outcome: { metric: "Bore scrap", before: "2.6%", after: "1.2%", label: M, measuredAfter: "1.2%" },
    title: "Trace the bore scrap on HMC-1 back to heat 8826",
    seen: "Bores scrapped at HMC-1 for porosity all came from castings of one heat. The cause was low carbon equivalent on that heat, not the machining.",
    evidence: [
      { text: "Scrapped bores traced by casting id to their heats", label: "Measured", id: "EV-D-1350" },
      { text: "Heat 8826 carbon equivalent at the low end of its range", label: "Measured", id: "EV-D-1351" },
    ],
    action: "Raise the carbon equivalent target on melt furnace M1 to the middle of its range and keep the machining plan unchanged.",
    who: {
      how: "Record only",
      roles: ["quality-head"],
      note: "Nothing to decide. Process corrected the carbon equivalent target; the result is in the investigation record.",
    },
    closed: {
      state: "Accepted",
      changed: "Carbon equivalent target on furnace M1 raised to the middle of its range; bore scrap cause linked to heat 8826",
      by: "Quality head A.",
      at: at(-6, -2),
      result: { status: "Verified", label: M, band: "bore scrap 1.2% on the six heats since the change" },
    },
    why: "Knowing the heat was the cause stops the plant from changing a machining plan that was never the problem.",
  },
];

export const byActionId = Object.fromEntries(exampleActions.map((a) => [a.id, a])) as Record<string, T.ExampleAction>;

export function getAction(id: string) {
  return byActionId[id];
}

export function actionHref(a: Pick<T.ExampleAction, "id" | "area">) {
  return `${a.area === "Process" ? "/process" : "/quality"}/actions/${a.id}`;
}

/** Plain-text outcome for tests and search. */
export function actionOutcomeLine(o: T.ExampleAction["outcome"]) {
  return `${o.metric} ${o.before} → ${o.after} (${o.label.toLowerCase()})`;
}

const SHORT_TITLE: Record<string, string> = {
  "ex-p1": "Trial a lower billet exit target",
  "ex-p2": "Hold the coil warm through press stops",
  "ex-p3": "Pace the pusher to the press",
  "ex-p4": "Ease melt power during a mould-line stop",
  "ex-p5": "Feed change on VMC-2, tried on the twin",
  "ex-p6": "Tighten cooling on Tool T3",
  "ex-q1": "Hold the next basket as quench oil rises",
  "ex-q2": "Flag the press run on cold billets and force",
  "ex-q3": "Hold moulds poured outside the good-heat window",
  "ex-q4": "Bore scrap traced back to heat 8826",
};

export function actionShortTitle(a: T.ExampleAction) {
  return SHORT_TITLE[a.id] ?? a.title;
}

/** Closed cards show a measured result line; open cards use the modelled or estimated outcome. */
export function actionOutcomeForDisplay(a: T.ExampleAction): T.ActionOutcome {
  if (a.closed) {
    return { ...a.outcome, label: a.closed.result.label, after: a.outcome.after };
  }
  return a.outcome;
}

const WHO_SHORT: Record<T.ExampleAction["who"]["how"], string> = {
  "On its own, inside the signed band": "On its own",
  "A person decides": "Person decides",
  "Recommend only": "Recommend only",
  "Record only": "Record only",
};

export function whoDecidesShort(how: T.ExampleAction["who"]["how"]) {
  return WHO_SHORT[how];
}

/** Display parts for the outcome line: metric, "47.9 g", "48.0 g". Before has no trailing "now". */
export function outcomePhrase(o: T.ActionOutcome) {
  const now = o.before.trim().replace(/\s+now\s*$/i, "");
  const after = o.after.trim().replace(/\s*target\s+band\b/i, "").replace(/\s*,?\s*band\s+.*/i, "").replace(/\btarget\b/gi, "").trim();
  return { metric: o.metric, now, after };
}

const OPTION_SHORT: Record<string, Record<string, string>> = {
  "ex-p3": { accept: "Pace the pusher", keep: "Keep fixed rate" },
  "ex-p4": { accept: "Ease melt power", keep: "Keep full power" },
  "ex-p5": { accept: "Plan feed change", decline: "Decline with reason" },
  "ex-p6": { accept: "Tighten cooling", keep: "Keep cool time" },
  "ex-q1": { hold: "Hold next basket", sample: "Sample only", continue: "Keep running" },
  "ex-q2": { flag: "Flag and hold tray", watch: "Watch only" },
  "ex-q3": { hold: "Hold next moulds", continue: "Pour on" },
};

export function optionShortLabel(actionId: string, optionId: string, fallback: string) {
  return OPTION_SHORT[actionId]?.[optionId] ?? fallback;
}

/** Primary and secondary options for card and detail bars (consistent order). */
export function decisionOptionPair(a: T.ExampleAction) {
  if (!a.options?.length) return { primary: undefined, secondary: undefined };
  const primary = a.options.find((o) => o.primary) ?? a.options[0];
  const secondary =
    a.options.find((o) => o.id !== primary.id && /continue|keep|decline|normal|reject|watch|release|sample/i.test(o.id)) ??
    a.options.find((o) => o.id !== primary.id);
  return { primary, secondary };
}
