/**
 * The agent as an actor on the demonstration plant: questions it asks people, what it is working on, new-part onboarding,
 * the control stack on each line, what it learned, proposals left on the table, card assignment and the week and month
 * summaries. Every record is illustrative and agrees with data.ts. No customer data.
 */
import type { EvidenceLabel, RoleId } from "./types";
import { at, prices } from "./data";

/* ---------------- Questions from the agent ---------------- */
export type QuestionType = "New part material" | "Data discrepancy" | "Mode label" | "Unlinked lot" | "Sensor looks wrong" | "After a trial" | "Shift context" | "New-part test move";
export interface QAnswer { id: string; label: string; then: string }
export interface Question {
  id: string; type: QuestionType; lineId?: string; askedAt: string; due?: string;
  /** Who it is sent to. Plant-wide questions are also visible to leads (never to operators unless routed to them). */
  routedTo: RoleId; plantWide: boolean; urgency: "High" | "Medium" | "Low"; abnormal?: boolean;
  title: string; why: string; evidence: { text: string; label: EvidenceLabel; id?: string }[];
  waits: { text: string; href: string }; meanwhile: string;
  answers: QAnswer[]; photo?: string; askedBy?: number;
  answered?: { by: RoleId; person: string; at: string; answer: string; changed: string; unblocked: { text: string; href: string } };
  assignee?: string;
}

export const questions: Question[] = [
  { id: "q-1", type: "New-part test move", lineId: "line-b", askedAt: at(0, -1, -10), due: at(0, 1), routedTo: "operator", plantWide: false, urgency: "High",
    title: "Step 3 of 5: run the next 50 shots of Housing B-52 with hold pressure 740 bar. Done?",
    why: "Housing B-52 is new on Line B. The agent borrowed settings from Housing B-40 with a wider band and needs three planned moves to tune them.",
    evidence: [{ text: "Move 1 of 3 done at 720 bar, part weight 52.1 g", label: "Measured", id: "EV-B-2231" }, { text: "740 bar is inside the signed window 680 to 780 bar", label: "Measured" }],
    waits: { text: "New-part onboarding, Housing B-52, step 3", href: "/process/lines/line-b#onboarding" },
    meanwhile: "Line B stays recommend-only for Housing B-52. Housing B-40 runs as normal.",
    answers: [{ id: "done", label: "Done", then: "I record the 50 shots, refit the borrowed model and plan move 3." }, { id: "skip", label: "Skipped, with a reason", then: "I log the reason and move the test to the next B-52 order." }],
    photo: "Photo of the setting screen (optional)" },
  { id: "q-2", type: "Sensor looks wrong", lineId: "line-a", askedAt: at(0, -0, -40), due: at(0, 2), routedTo: "shift-lead", plantWide: true, urgency: "High", abnormal: true,
    title: "Jacket inlet sensor on Mixer M1 has read exactly 61.0 °C for 40 min. Is it stuck?",
    why: "A real jacket loop moves by at least 0.2 °C every few minutes. Flat for 40 min while the flow changed twice is unusual.",
    evidence: [{ text: "Jacket inlet temperature, flat at 61.0 °C since 13:20", label: "Measured", id: "EV-A-1201" }, { text: "Jacket flow changed at 13:31 and 13:48", label: "Measured", id: "EV-A-1202" }],
    waits: { text: "Hold-time proposals on Line A", href: "/process/lines/line-a" },
    meanwhile: "Anything resting on this sensor is recommend-only until someone checks it.",
    answers: [{ id: "stuck", label: "Yes, stuck", then: "I mark the tag uncertain, keep Line A hold proposals recommend-only and reopen them after the fix." }, { id: "real", label: "No, it is real", then: "I keep the readings and note that the loop was steady on purpose." }, { id: "check", label: "Checking now", then: "I wait for your photo or answer before changing anything." }],
    photo: "Photo of the local gauge", askedBy: 2 },
  { id: "q-3", type: "Data discrepancy", lineId: "line-a", askedAt: at(0, -3), due: at(0, 6), routedTo: "quality-head", plantWide: true, urgency: "Medium",
    title: "Lab says 2510 mPa·s for lot 3304, but its batch ran 4 min shorter than lot 3296 at the same value. Which is right?",
    why: "The property band for Grade A-12 uses both lots. If one record is wrong, the band is wrong for the next five lots.",
    evidence: [{ text: "Lab result lot 3304, 2510 mPa·s", label: "Measured", id: "EV-A-1170" }, { text: "Batch 2409 hold time 51 min vs 55 min for batch 2401", label: "Measured", id: "EV-A-1171" }],
    waits: { text: "Property band for Grade A-12", href: "/quality" },
    meanwhile: "Lots 3307 and 3308 keep their current band, marked Estimated.",
    answers: [{ id: "lab", label: "Lab is right", then: "I keep the result and look for what else shortened the batch." }, { id: "log", label: "Run log is right", then: "I flag the lab record, rerun the band and tell you which lots move." }, { id: "both", label: "Both, I'll explain", then: "I attach your note and keep both records with a lower weight." }] },
  { id: "q-4", type: "New part material", lineId: "line-b", askedAt: at(-1, -2), routedTo: "operator", plantWide: false, urgency: "High",
    title: "Housing B-52 arrived with no resin grade on the job card. Is it PA66-GF30 like Housing B-40?",
    why: "The agent can only borrow settings from parts with the same resin. The job card field is empty.",
    evidence: [{ text: "Job card for order B-52-001, resin field empty", label: "Unknown" }, { text: "Drawing revision C lists glass-filled polyamide", label: "Measured", id: "EV-B-2219" }],
    waits: { text: "New-part onboarding, Housing B-52, step 1", href: "/process/lines/line-b#onboarding" },
    meanwhile: "Housing B-52 runs on the operator's own settings.",
    answers: [{ id: "pa", label: "Yes, PA66-GF30", then: "I borrow settings from Housing B-40 and B-44 with a wider band." }, { id: "other", label: "Another grade", then: "I look for parts with that grade first." }],
    photo: "Photo of the bag label",
    answered: { by: "operator", person: "Operator B.", at: at(-1, -1, -20), answer: "Yes, PA66-GF30 (photo of the bag label)", changed: "Resin for Housing B-52 set to PA66-GF30, source: operator. Settings borrowed from Housing B-40 and B-44.", unblocked: { text: "Onboarding moved to step 2", href: "/process/lines/line-b#onboarding" } } },
  { id: "q-5", type: "Mode label", lineId: "line-a", askedAt: at(0, -5), routedTo: "operator", plantWide: false, urgency: "Low",
    title: "Mixer M1 sat at 70 °C with the agitator off for 12 min at 09:05. Changeover or idle?",
    why: "The line pack mode rule could not tell a changeover from an idle wait. Idle minutes count against energy per batch, changeovers do not.",
    evidence: [{ text: "Agitator speed 0 rpm, 09:05 to 09:17", label: "Measured", id: "EV-A-1188" }],
    waits: { text: "Energy per batch on Line A", href: "/process/lines/line-a" },
    meanwhile: "Those 12 minutes are left out of energy per batch.",
    answers: [{ id: "chg", label: "Changeover", then: "I label it changeover and keep it out of energy per batch." }, { id: "idle", label: "Idle", then: "I count it as idle and add it to energy per batch." }],
    answered: { by: "operator", person: "Operator A.", at: at(0, -4, -40), answer: "Changeover", changed: "Line pack mode rule now treats agitator off above 65 °C after a discharge as changeover.", unblocked: { text: "Energy per batch on Line A recalculated", href: "/process/lines/line-a" } } },
  { id: "q-6", type: "Unlinked lot", lineId: "line-b", askedAt: at(0, -2), due: at(0, 8), routedTo: "quality-head", plantWide: false, urgency: "Medium",
    title: "Lot 7744 has no shift run. It most likely came from run 1182 on Press P3. Confirm?",
    why: "Without a link the lot has no property band, so nobody can see if it is at risk.",
    evidence: [{ text: "Time proximity and part count match run 1182", label: "Estimated" }],
    waits: { text: "Property band for lot 7744", href: "/quality/links" },
    meanwhile: "Lot 7744 shows Unknown risk.",
    answers: [{ id: "yes", label: "Confirm run 1182", then: "I link the lot and draw its band." }, { id: "other", label: "Pick another run", then: "I show you the other candidates." }, { id: "not", label: "Not ours", then: "I drop the lot from the property band." }] },
  { id: "q-7", type: "After a trial", lineId: "line-b", askedAt: at(0, -6), routedTo: "operator", plantWide: false, urgency: "Low",
    title: "The cycle time trial on Tool T3 ended. Did anyone notice sticking or flash?",
    why: "The numbers say Improved. A person on the line can see things the sensors cannot.",
    evidence: [{ text: "Trial verdict Improved, 16 runs", label: "Measured", id: "EV-B-2104" }],
    waits: { text: "Trial record, cycle time 33.2 s", href: "/process/trials" },
    meanwhile: "The verdict stays Improved.",
    answers: [{ id: "no", label: "No issues", then: "I add your note to the trial record." }, { id: "yes", label: "Yes, some sticking", then: "I hold the verdict at Inconclusive and ask the process engineer." }, { id: "ns", label: "Not sure", then: "I ask the next shift." }] },
  { id: "q-8", type: "Shift context", lineId: "line-b", askedAt: at(0, -7), due: at(0, 0, 30), routedTo: "shift-lead", plantWide: true, urgency: "Low",
    title: "Night shift made 30% fewer parts on Line B. Planned, or something else?",
    why: "If it was planned, those runs should stay out of the model and the proof records.",
    evidence: [{ text: "1,290 parts vs 1,840 typical", label: "Measured", id: "EV-B-2240" }],
    waits: { text: "Handover note and Line B model refit", href: "/ask/notes" },
    meanwhile: "The runs are kept, marked for review.",
    answers: [{ id: "plan", label: "Planned stop", then: "I leave those runs out of the model and the proof." }, { id: "mat", label: "Waited for material", then: "I keep the runs and tag the wait." }, { id: "else", label: "Something else", then: "I add your words to the handover note." }],
    answered: { by: "shift-lead", person: "Shift lead A.", at: at(0, -6, -10), answer: "Waited for material, resin dryer was late", changed: "Night runs kept and tagged as a material wait. Line B model refit queued.", unblocked: { text: "Handover note updated", href: "/ask/notes" } } },
];

export const WORKER_ROLES: RoleId[] = ["operator", "shift-lead", "process-engineer", "quality-head", "plant-head"];
/** Operators see only questions routed to them; leads see theirs plus plant-wide ones. */
export function questionsFor(role: RoleId) {
  const mine = questions.filter((q) => q.routedTo === role);
  const wide = role === "operator" || !WORKER_ROLES.concat("stamped-engineer").includes(role) ? [] : questions.filter((q) => q.plantWide && q.routedTo !== role);
  return { mine, wide, held: role === "operator" ? 1 : 0 };
}

/* ---------------- Working on ---------------- */
export interface WorkItem { id: string; status: "Investigating" | "Simulating" | "Waiting on you" | "Onboarding"; lineId: string; title: string; step: string; waits?: string; href: string }
export const workingOn: WorkItem[] = [
  { id: "w-1", status: "Simulating", lineId: "line-b", title: "An MPC layer over the barrel loops on Press P3", step: "240 simulated shifts done, comparing against the current stack", href: "/process/lines/line-b#control" },
  { id: "w-2", status: "Onboarding", lineId: "line-b", title: "New part Housing B-52", step: "Step 3 of 5, planned test moves", waits: "Operator, next 50 shots", href: "/process/lines/line-b#onboarding" },
  { id: "w-3", status: "Investigating", lineId: "line-a", title: "Why lot 3307 viscosity is drifting up", step: "4 of 6 likely causes ruled out", href: "/quality/investigations" },
  { id: "w-4", status: "Waiting on you", lineId: "line-a", title: "Jacket inlet sensor on Mixer M1", step: "Asked if it is stuck", waits: "Shift lead", href: "/inbox?tab=questions" },
];

/* ---------------- New-part onboarding (five steps, the internal approval is never shown to plant workers) ---------------- */
export const onboarding = {
  part: "Housing B-52", lineId: "line-b", started: at(-1, -2), current: 3,
  steps: [
    { n: 1, title: "Find similar parts", detail: "Housing B-40 and B-44: same resin, wall within 0.3 mm, same tool family.", state: "done" as const, answeredBy: "Operator B." },
    { n: 2, title: "Borrow their settings", detail: "Hold pressure, melt and tool temperature borrowed with a band twice as wide.", state: "done" as const },
    { n: 3, title: "Planned test moves", detail: "1 of 3 moves done inside the signed window. Next: 740 bar for 50 shots.", state: "live" as const },
    { n: 4, title: "Try it on the twin", detail: "Checks the tuned settings against scrap and cycle time before the line sees them.", state: "next" as const },
    { n: 5, title: "Ready for you to promote", detail: "The process engineer promotes Housing B-52 to normal proposals.", state: "next" as const },
  ],
};

/* ---------------- Control stack per line ---------------- */
export interface ControlLayer { id: string; name: string; kind: "PID" | "Rule-based" | "MPC" | "RL" | "Run-to-run"; scope: string; state: "Active" | "In shadow" | "Prebuilt, not on" | "Simulating"; tuned: string }
export const controlStacks: Record<string, ControlLayer[]> = {
  "line-a": [
    { id: "a-l4", name: "Hold-time policy", kind: "RL", scope: "Hold step length per batch", state: "In shadow", tuned: "Learning from 312 batches, writes nothing" },
    { id: "a-l3", name: "Run-to-run optimiser", kind: "Run-to-run", scope: "Hold temperature, hold time, agitator speed", state: "Active", tuned: "Proposals per batch, inside the signed band" },
    { id: "a-l2", name: "Batch temperature path", kind: "MPC", scope: "Jacket setpoint during heat-up", state: "Active", tuned: "Horizon and weights tuned at integration" },
    { id: "a-l1", name: "Batch sequence", kind: "Rule-based", scope: "Charge, heat, hold, discharge", state: "Active", tuned: "Line pack rules, 2 parameters tuned" },
    { id: "a-l0", name: "Jacket and agitator loops", kind: "PID", scope: "2 loops on Mixer M1", state: "Active", tuned: "Gains tuned to this mixer" },
  ],
  "line-b": [
    { id: "b-l4", name: "Supervisory layer over barrel loops", kind: "MPC", scope: "Barrel zones and tool temperature together", state: "Simulating", tuned: "Prebuilt, weights tuned on the twin" },
    { id: "b-l3", name: "Run-to-run optimiser", kind: "Run-to-run", scope: "Hold pressure, melt temperature, cycle time", state: "Active", tuned: "Proposals per run, inside the signed band" },
    { id: "b-l2", name: "Cycle policy", kind: "RL", scope: "Cooling time per shot", state: "Prebuilt, not on", tuned: "Needs 2 more weeks of runs" },
    { id: "b-l1", name: "Moulding sequence", kind: "Rule-based", scope: "Inject, hold, cool, eject", state: "Active", tuned: "Line pack rules, 3 parameters tuned" },
    { id: "b-l0", name: "Barrel and tool loops", kind: "PID", scope: "5 barrel zones, 2 tool circuits", state: "Active", tuned: "Gains tuned to Press P3" },
  ],
};
/** The new-layer proposal, tried on the twin first. Bands only; no confidence score. */
export const layerProposal = {
  id: "layer-1", lineId: "line-b", title: "Add an MPC layer over the barrel loops on Press P3",
  summary: "Today each barrel zone and the tool circuit is held by its own loop. A supervisory MPC layer would move them together when resin moisture changes, instead of waiting for each loop to catch up.",
  sim: { runs: "240 simulated shifts on the Line B twin, replaying the last 6 weeks of resin lots", fit: "Accepted for cycle time and scrap", label: "Modelled" as EvidenceLabel },
  rows: [
    { m: "Cycle time", unit: "s", now: "33.6", with: "32.9 to 33.3" },
    { m: "Scrap rate", unit: "%", now: "3.2", with: "2.7 to 3.0" },
    { m: "Energy per part", unit: "kWh", now: "0.142", with: "0.134 to 0.139" },
    { m: "Melt temperature swing", unit: "°C", now: "±3.1", with: "±1.6 to ±2.2" },
  ],
  guard: "Every move stays inside the signed windows. The PID loops stay underneath; Stop drops the layer and the loops carry on alone.",
  next: "The process engineer drafts a switchback trial; the plant head signs it.",
};

/* ---------------- What the agent learned ---------------- */
export const learned = [
  { id: "l-1", at: at(0, -4, -40), kind: "Answer used", text: "Agitator off above 65 °C after a discharge means changeover on Line A.", from: "Operator A. answered a question", state: "In use" },
  { id: "l-2", at: at(-1, -3), kind: "Decline reason", text: "Do not propose melt temperature changes in the first hour after a resin lot change.", from: "Shift lead A. declined a proposal with a reason", state: "In shadow, waiting for the process engineer to promote" },
  { id: "l-3", at: at(-1, -1), kind: "Memory", text: "Housing B-52 uses PA66-GF30, same bag as Housing B-40.", from: "Operator B. sent a photo", state: "Saved to plant memory" },
  { id: "l-4", at: at(-3), kind: "Model refit", text: "Line B model refitted after the night shift material wait was tagged.", from: "Shift lead A. answered a question", state: "Fit accepted" },
  { id: "l-5", at: at(-5), kind: "Playbook", text: "After a cooling water changeover, check the jacket inlet before the next hold step.", from: "3 accepted hold-time changes", state: "Promoted by Process engineer A." },
];

/* ---------------- Proposals left on the table ---------------- */
export interface IdleProposal { id: string; lineId: string; title: string; waitingDays: number; lastSeen: string; owner: RoleId; loss: { perWeek: number; unit: string; what: string }; inrPerUnit: number; expected: string }
const price = (item: string) => prices.find((p) => p.item.startsWith(item))!.value;
export const idleProposals: IdleProposal[] = [
  { id: "idle-1", lineId: "line-a", title: "Start Grade A-14 from its own best batches", waitingDays: 5, lastSeen: "Opened once by Shift lead A., 4 days ago", owner: "process-engineer", loss: { perWeek: 0.5, unit: "batches", what: "reworked" }, inrPerUnit: price("Reworked batch"), expected: "Estimated, first batch inside spec" },
  { id: "idle-2", lineId: "line-b", title: "Take-out time 0.4 s shorter on the robot", waitingDays: 9, lastSeen: "Not opened since it was raised", owner: "shift-lead", loss: { perWeek: 560, unit: "parts", what: "not made" }, inrPerUnit: price("Extra part"), expected: "Modelled, 1.1 to 1.4% more parts" },
  { id: "idle-3", lineId: "line-b", title: "Resin dryer dew point -40 to -35 °C on dry days", waitingDays: 12, lastSeen: "Assigned to Process engineer A., not opened", owner: "process-engineer", loss: { perWeek: 420, unit: "kWh", what: "extra" }, inrPerUnit: price("Electricity"), expected: "Measured on 6 dry days" },
  { id: "idle-4", lineId: "line-a", title: "Jacket setpoint 1 °C lower during the hold step", waitingDays: 7, lastSeen: "Opened by Operator C., no decision", owner: "operator", loss: { perWeek: 310, unit: "kWh", what: "extra" }, inrPerUnit: price("Electricity"), expected: "Modelled, viscosity unchanged" },
];
export const idleInr = (p: IdleProposal) => ({ perWeek: Math.round(p.loss.perWeek * p.inrPerUnit), lostSoFar: Math.round((p.loss.perWeek * p.inrPerUnit * p.waitingDays) / 7), perMonth: Math.round(p.loss.perWeek * p.inrPerUnit * 4.33) });

/* ---------------- Assignment ---------------- */
export const ASSIGNERS: RoleId[] = ["shift-lead", "process-engineer", "quality-head", "plant-head"];
/** The person a role is viewed as in the showcase. */
export const ME: Partial<Record<RoleId, string>> = { operator: "Operator A.", "shift-lead": "Shift lead A.", "process-engineer": "Process engineer A.", "quality-head": "Quality head A.", "plant-head": "Plant head A." };
export const PEOPLE = ["Operator A.", "Operator B.", "Operator C.", "Operator D.", "Shift lead A.", "Process engineer A.", "Quality head A.", "Plant head A."];
export const assigned: Record<string, { to: string; by: string; at: string }> = {
  "in-3": { to: "Operator B.", by: "Shift lead A.", at: at(0, -1) },
  "in-6": { to: "Quality head A.", by: "Plant head A.", at: at(0, -3) },
  "in-5": { to: "Process engineer A.", by: "Plant head A.", at: at(0, -2) },
  "q-3": { to: "Quality head A.", by: "Plant head A.", at: at(0, -2, -30) },
  "idle-3": { to: "Process engineer A.", by: "Plant head A.", at: at(-6) },
};
/** Assignment matrix: for each card type, the default owner role and the roles that may assign it. */
export type Cell = "owner" | "assign" | "both" | "";
export const MATRIX_ROLES: RoleId[] = ["operator", "shift-lead", "process-engineer", "quality-head", "plant-head"];
export const assignmentMatrix: { group: string; type: string; cells: Cell[] }[] = [
  { group: "Proposals", type: "Per-run proposal", cells: ["owner", "assign", "assign", "", "assign"] },
  { group: "Proposals", type: "New control layer", cells: ["", "", "owner", "", "assign"] },
  { group: "Proposals", type: "Left on the table", cells: ["", "assign", "owner", "", "assign"] },
  { group: "Trials", type: "Trial signature", cells: ["", "", "assign", "", "both"] },
  { group: "Quality", type: "Lot at risk", cells: ["", "", "", "both", "assign"] },
  { group: "Quality", type: "Lot link", cells: ["", "", "", "both", "assign"] },
  { group: "Quality", type: "Correction from Quality", cells: ["", "", "owner", "assign", "assign"] },
  { group: "Questions", type: "New part or test move", cells: ["owner", "assign", "assign", "", "assign"] },
  { group: "Questions", type: "Data discrepancy", cells: ["", "", "", "both", "assign"] },
  { group: "Questions", type: "Mode label", cells: ["owner", "assign", "assign", "", "assign"] },
  { group: "Questions", type: "Sensor looks wrong", cells: ["", "both", "", "", "assign"] },
  { group: "Questions", type: "Shift context", cells: ["", "both", "", "", "assign"] },
  { group: "Plant", type: "Data gap", cells: ["", "", "owner", "", "both"] },
];

/* ---------------- Week and month summaries ---------------- */
export const summaries = {
  week: {
    label: "Week 43, 14 to 20 Oct", prev: "week 42",
    outcomes: [
      { k: "Scrap rate, Line B", v: "3.2%", d: "from 3.6%", label: "Measured" as EvidenceLabel },
      { k: "Right first time, Line A", v: "91.4%", d: "from 89.8%", label: "Measured" as EvidenceLabel },
      { k: "Energy per batch, Line A", v: "412 kWh", d: "from 421 kWh", label: "Estimated" as EvidenceLabel },
      { k: "Lots caught early", v: "4", d: "before discharge", label: "Measured" as EvidenceLabel },
    ],
    actions: [
      { t: "Cycle time 33.2 s on Tool T3", by: "Operator B.", result: "Verified", band: "2.1 to 3.0% more parts" },
      { t: "Hold time 57 min for slow batch 2418", by: "Standing approval", result: "Indicative", band: "viscosity 2460 to 2540 mPa·s" },
      { t: "Correction from Quality on lot 3307", by: "Process engineer A.", result: "Measuring", band: "result after 6 lots" },
    ],
    accepted: 6, declined: 2, expired: 1, questions: 9, answered: 7, learnedN: 4,
    reasoning: "Scrap fell on Line B mostly because cycle time 33.2 s held through two resin lot changes, and the night shift's material wait was tagged so it no longer hid the gain. Line A improved because slow batches were caught while they ran. Energy per batch moved less than modelled: the jacket inlet sensor may be stuck, so that number is Estimated until someone checks.",
    next: ["Finish onboarding Housing B-52 (step 3 of 5)", "Bring the MPC layer on Press P3 to a trial draft", "Get the four proposals left on the table decided"],
  },
  month: {
    label: "October so far, 1 to 20 Oct", prev: "September",
    outcomes: [
      { k: "Scrap rate, Line B", v: "3.3%", d: "from 3.9%", label: "Measured" as EvidenceLabel },
      { k: "Right first time, Line A", v: "90.6%", d: "from 88.1%", label: "Measured" as EvidenceLabel },
      { k: "Changes verified", v: "3", d: "2 no change, 1 inconclusive", label: "Measured" as EvidenceLabel },
      { k: "Lots caught early", v: "11", d: "before discharge", label: "Measured" as EvidenceLabel },
    ],
    actions: [
      { t: "Cycle time 33.2 s on Tool T3", by: "Operator B.", result: "Verified", band: "2.1 to 3.0% more parts" },
      { t: "Hold pressure 720 bar on Press P3", by: "Shift lead A.", result: "Verified", band: "0.4 to 0.8 pp less scrap" },
      { t: "Hold temperature trial on Line A", by: "Plant head A.", result: "Measuring", band: "10 of 16 batches" },
      { t: "Melt temperature 232 °C", by: "Shift lead A.", result: "Declined", band: "reason taught a new rule" },
    ],
    accepted: 21, declined: 6, expired: 3, questions: 31, answered: 26, learnedN: 12,
    reasoning: "Most of October's gain came from Line B, where two changes were verified on the plant's own records. Line A's gain is smaller and partly still Indicative, because the hold temperature trial is not finished. Six declines were useful: two became rules in shadow. The biggest drag is proposals left waiting, mostly on the process engineer's desk.",
    next: ["Close the Line A trial and publish its verdict", "Put the Line B MPC layer through a switchback trial", "Cut proposals waiting more than 5 days to zero"],
  },
};
