/**
 * Worked example actions for the Process and Quality overviews. Fictional and illustrative, on the demonstration plant.
 * Figures are MODELLED demo values. Line A is batch mixing; Line B is moulding. None is a customer result.
 */
import type * as T from "./types";
import { at } from "./data";

const I = { illustrative: true } as const;
const M = "Modelled" as const;

export const exampleActions: T.ExampleAction[] = [
  /* ---------------- Process ---------------- */
  {
    ...I, id: "ex-p1", area: "Process", lineId: "line-a", steps: ["Detect", "Propose"],
    mechanism: "Cut wasted mixing time",
    outcome: { metric: "Energy per good batch", before: "182 kWh", after: "158 kWh", label: M, measuredAfter: "157 kWh" },
    title: "Cut the hold time on Mixer 2 batches",
    seen: "Batches on Mixer 2 already reach spec viscosity about eight minutes early. The extra mixing spends energy and time for nothing.",
    evidence: [
      { text: "Torque and viscosity path vs best Mixer 2 batches", label: "Measured", id: "EV-A-1301" },
      { text: "Hold time still at recipe end while viscosity is already in band", label: "Measured", id: "EV-A-1302" },
    ],
    action: "Shorten Mixer 2 hold by eight minutes when viscosity is already inside the Grade A-12 band. Stays inside the signed hold-time approval.",
    who: {
      how: "On its own, inside the signed band",
      roles: ["plant-head"],
      note: "Written under the standing approval the Plant head signed. Any operator can press Stop and the prior hold time comes back.",
    },
    expected: { label: M, band: "energy per good batch 158 kWh; cycle 66 min; rejection 4.6%" },
    why: "Stopping the mix when the batch is already in band saves energy and frees the mixer without risking the lab result.",
  },
  {
    ...I, id: "ex-p2", area: "Process", lineId: "line-b", steps: ["Detect", "Propose"],
    mechanism: "More shots from less cool time",
    outcome: { metric: "Cycle time", before: "38.0 s", after: "34.5 s", label: M },
    title: "Tighten the cooling time on Press 7",
    seen: "Parts on Press 7 are stable at ejection well before the timer ends. Cutting the cool time gives about 10% more shots per shift.",
    evidence: [
      { text: "Cavity temperature at ejection, last 12 shift runs", label: "Measured", id: "EV-B-2401" },
      { text: "Ejection force and warp checks after early open trials", label: "Measured", id: "EV-B-2402" },
    ],
    action: "Reduce Press 7 cooling time so cycle time moves from 38.0 s to 34.5 s inside the signed cycle-time band.",
    who: {
      how: "A person decides",
      roles: ["process-engineer", "shift-lead", "plant-head"],
      note: "The Process engineer, Shift lead or Plant head accepts the cooler cut before the next tool run.",
    },
    options: [
      { id: "accept", label: "Tighten cooling time", primary: true, done: "Cooling time cut accepted for Press 7." },
      { id: "keep", label: "Keep current cool time", done: "Kept the current cool time. The reason is recorded." },
    ],
    expected: { label: M, band: "cycle 34.5 s; energy per good part 0.38 kWh; scrap 2.9%" },
    why: "Cooling only as long as the part needs frees press time and cuts energy per good part.",
  },
  {
    ...I, id: "ex-p3", area: "Process", lineId: "line-b", steps: ["Trial"],
    mechanism: "Lower heat where the melt does not need it",
    outcome: { metric: "Energy per good part", before: "0.51 kWh", after: "0.45 kWh", label: M },
    title: "Lower the barrel temperature profile on Press 4",
    seen: "The rear zones on Press 4 run hotter than the material needs. That costs heater power and leaves burn marks on the parts.",
    evidence: [
      { text: "Zone temperatures vs material data sheet", label: "Measured", id: "EV-B-2410" },
      { text: "Burn-mark scrap coded to rear-zone over-temp", label: "Measured", id: "EV-B-2411" },
      { text: "Measurement plan locked before the first switch", label: "Measured" },
    ],
    action: "Trial a lower rear-zone profile on alternate Press 4 runs. Stop restores the prior profile straight away.",
    who: {
      how: "A person decides",
      roles: ["plant-head"],
      note: "The Plant head signed the trial. Operators can stop it at any time.",
    },
    expected: { label: M, band: "energy per good part 0.45 kWh; scrap 2.2%; cycle 40 s" },
    why: "Matching barrel heat to what the resin needs cuts heater load and burn scrap together.",
    href: "/process/trials/trial-2",
    hrefLabel: "Open the trial",
  },
  {
    ...I, id: "ex-p4", area: "Process", lineId: "line-a", steps: ["Detect", "Explain", "Propose"],
    mechanism: "Charge order that disperses faster",
    outcome: { metric: "Cycle time", before: "82 min", after: "75 min", label: M },
    title: "Order the charge additions on Mixer 1 by recipe",
    seen: "On Mixer 1, adding fines after the liquids cuts dispersion time and stops over-dosing to correct for lumps.",
    evidence: [
      { text: "Charge sequence logs vs dispersion time", label: "Measured", id: "EV-A-1310" },
      { text: "Material give-away on corrective top-ups", label: "Measured", id: "EV-A-1311" },
    ],
    action: "Lock Mixer 1 charge order to liquids first, then fines, per the Grade A-12 recipe card.",
    who: {
      how: "A person decides",
      roles: ["process-engineer", "shift-lead", "plant-head"],
      note: "The Process engineer, Shift lead or Plant head accepts the charge-order change before the next batch is charged.",
    },
    options: [
      { id: "accept", label: "Use recipe charge order", primary: true, done: "Recipe charge order accepted for Mixer 1." },
      { id: "keep", label: "Keep current order", done: "Kept the current charge order. The reason is recorded." },
    ],
    expected: { label: M, band: "cycle 75 min; material give-away 1.2%; rejection 4.1%" },
    why: "The right charge order cuts mix time and the material spent fixing lumps.",
  },
  {
    ...I, id: "ex-p5", area: "Process", lineId: "line-b", steps: ["Detect", "Propose"],
    mechanism: "Stop hot dryer idle between lots",
    outcome: { metric: "Energy per good part", before: "0.47 kWh", after: "0.43 kWh", label: M },
    title: "Keep the dryer from idling hot between lots",
    seen: "The resin dryer on Line B runs at full temperature through changeovers when the hopper is already full.",
    evidence: [
      { text: "Dryer power through the last eight changeovers", label: "Measured", id: "EV-B-2420" },
      { text: "Hopper level full while dryer stayed at set point", label: "Measured", id: "EV-B-2421" },
    ],
    action: "Drop dryer set point during changeovers once the hopper is full, and restore it before the next lot starts.",
    who: {
      how: "Recommend only",
      roles: ["process-engineer", "plant-head"],
      note: "The dryer is outside the signed limits for this line, so the Process engineer or Plant head decides and changes it.",
    },
    options: [
      { id: "accept", label: "Plan the dryer change", primary: true, done: "Dryer idle-cut planned for the next changeovers." },
      { id: "decline", label: "Decline with reason", done: "Declined. The reason is recorded and the agent learns from it." },
    ],
    expected: { label: M, band: "energy per good part 0.43 kWh; dryer energy per shift 255 kWh" },
    why: "A full hopper does not need a hot dryer; idling cool saves shift energy without wetting the resin.",
  },

  /* ---------------- Quality ---------------- */
  {
    ...I, id: "ex-q1", area: "Quality", lineId: "line-a", steps: ["Detect", "Decide"],
    mechanism: "Save the batch before the lab rejects it",
    outcome: { metric: "Rejection rate", before: "5.0%", after: "3.2%", label: M },
    title: "Save Batch 2417 before it goes out of spec",
    seen: "The torque curve on Batch 2417 is drifting the way the last three rejected batches did. A three-minute correction now saves the batch instead of scrapping it at the lab.",
    evidence: [
      { text: "Torque curve vs last three rejected Grade A-12 batches", label: "Measured", id: "EV-A-1320" },
      { text: "End-of-hold window still open for three minutes", label: "Measured", id: "EV-A-1321" },
    ],
    action: "Apply the signed agitator correction for three minutes on Batch 2417 before discharge, and sample at the end of hold.",
    who: {
      how: "A person decides",
      roles: ["operator", "shift-lead", "quality-head"],
      note: "The operator, Shift lead or Quality head chooses. Stamped asks; it never sets or releases a hold. A hold is set in your quality system.",
    },
    options: [
      { id: "correct", label: "Apply the three-minute correction", primary: true, done: "Recorded: three-minute correction on Batch 2417." },
      { id: "sample", label: "Sample now, no change", done: "Recorded: early sample only on Batch 2417." },
      { id: "continue", label: "Carry on, with a reason", done: "Recorded with your reason. Stamped keeps watching Batch 2417." },
    ],
    expected: { label: M, band: "rejection 3.2%; material per good batch 1,000 kg; energy per good batch 172 kWh" },
    why: "Catching the same torque path that sank the last rejects turns a scrap batch into a good one.",
    href: "/process/runs/run-a-2417",
    hrefLabel: "Open batch 2417",
  },
  {
    ...I, id: "ex-q2", area: "Quality", lineId: "line-b", steps: ["Detect", "Propose"],
    mechanism: "Catch short shots from the pressure trace",
    outcome: { metric: "Scrap", before: "3.4%", after: "1.9%", label: M },
    title: "Flag short shots on Press 7 from the pressure trace",
    seen: "Peak injection pressure on Press 7 drops about 40 shots before short shots show at inspection.",
    evidence: [
      { text: "Peak injection pressure, last 200 shots", label: "Measured", id: "EV-B-2430" },
      { text: "Vision short-shot codes lagged the pressure drop", label: "Measured", id: "EV-B-2431" },
    ],
    action: "Raise a floor flag when peak injection pressure drops, and hold the next tray for a weigh check before packing.",
    who: {
      how: "A person decides",
      roles: ["operator", "shift-lead", "quality-head"],
      note: "The operator, Shift lead or Quality head confirms the flag response. Stamped does not scrap parts on its own.",
    },
    options: [
      { id: "flag", label: "Flag and hold the next tray", primary: true, done: "Recorded: Press 7 short-shot flag armed." },
      { id: "watch", label: "Watch only this shift", done: "Recorded: watch-only on Press 7 pressure." },
    ],
    expected: { label: M, band: "scrap 1.9%; energy per good part 0.41 kWh" },
    why: "A pressure drop forty shots early is enough time to stop packing short shots.",
  },
  {
    ...I, id: "ex-q3", area: "Quality", lineId: "line-b", steps: ["Explain", "Verify"],
    mechanism: "Fix the circuit, not the inspection",
    outcome: { metric: "Rejection rate", before: "2.8%", after: "1.6%", label: M, measuredAfter: "1.6%" },
    title: "Link sink marks to the mould temperature on Tool 12",
    seen: "The sink mark on Tool 12 follows one cooling circuit running warm. The fix is the circuit, not more inspection.",
    evidence: [
      { text: "Sink-mark map vs circuit temperature on Tool 12", label: "Measured", id: "EV-B-2440" },
      { text: "Circuit 3 outlet 4 °C warmer than the other circuits", label: "Measured", id: "EV-B-2441" },
    ],
    action: "Clear the warm circuit on Tool 12 and keep the inspection plan unchanged.",
    who: {
      how: "Record only",
      roles: ["quality-head"],
      note: "Nothing to decide. Process cleared the circuit; the result is in the investigation record.",
    },
    closed: {
      state: "Accepted",
      changed: "Tool 12 cooling circuit 3 cleared; sink-mark cause linked to mould temperature",
      by: "Quality head A.",
      at: at(-6, -2),
      result: { status: "Verified", label: M, band: "rejection rate 1.6% on Tool 12 since the clear" },
    },
    why: "Knowing which circuit ran warm stops the plant from adding checks that would not fix the mark.",
  },
  {
    ...I, id: "ex-q4", area: "Quality", lineId: "line-b", steps: ["Detect", "Decide"],
    mechanism: "Hold wet nylon before it moulds",
    outcome: { metric: "Scrap", before: "4.1%", after: "2.4%", label: M },
    title: "Hold moisture before moulding the nylon lots",
    seen: "Lots dried for less than the set time account for most of the splay on Line B. They should be held until the dryer log clears them.",
    evidence: [
      { text: "Dryer log vs splay scrap on nylon lots", label: "Measured", id: "EV-B-2450" },
      { text: "Lots released under the set dry time in the last fortnight", label: "Measured", id: "EV-B-2451" },
    ],
    action: "Hold any nylon lot whose dryer log is short of the set time until the log clears, then release to Press 7.",
    who: {
      how: "A person decides",
      roles: ["quality-head", "shift-lead", "plant-head"],
      note: "The Quality head, Shift lead or Plant head sets the hold in your quality system. Stamped only recommends it.",
    },
    options: [
      { id: "hold", label: "Hold until dryer log clears", primary: true, done: "Recorded: nylon lots held for dryer clearance." },
      { id: "release", label: "Release with a reason", done: "Recorded with your reason. Stamped keeps watching splay." },
    ],
    expected: { label: M, band: "scrap 2.4%; material per good part 51 g" },
    why: "Wet nylon that never reaches the press does not become splay scrap.",
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
  "ex-p1": "Cut hold time on Mixer 2",
  "ex-p2": "Tighten cooling on Press 7",
  "ex-p3": "Lower barrel profile on Press 4",
  "ex-p4": "Recipe charge order on Mixer 1",
  "ex-p5": "Stop hot dryer idle between lots",
  "ex-q1": "Save Batch 2417 before it goes out of spec",
  "ex-q2": "Flag short shots on Press 7 from pressure",
  "ex-q3": "Sink marks linked to Tool 12 mould temperature",
  "ex-q4": "Hold moisture before moulding nylon lots",
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
  "ex-p2": { accept: "Tighten cooling", keep: "Keep cool time" },
  "ex-p4": { accept: "Use recipe order", keep: "Keep current order" },
  "ex-p5": { accept: "Plan dryer change", decline: "Decline with reason" },
  "ex-q1": { correct: "Apply correction", sample: "Sample only", continue: "Keep running" },
  "ex-q2": { flag: "Flag and hold tray", watch: "Watch only" },
  "ex-q4": { hold: "Hold for dryer", release: "Release with reason" },
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
