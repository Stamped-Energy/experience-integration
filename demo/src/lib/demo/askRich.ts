/**
 * Rich Ask answers: structured blocks (headings, trends with the spec band, before and after bands, flows, tables),
 * the evidence used, what the agent proposes next and follow-ups. Plant records only; rupees only for the Owner.
 */
import type { EvidenceLabel, RoleId } from "./types";
import { at, runs } from "./data";

export type Block =
  | { k: "h"; t: string }
  | { k: "p"; t: string }
  | { k: "ul"; items: string[] }
  | { k: "trend"; title: string; values: number[]; spec: [number, number]; unit: string; from?: number }
  | { k: "compare"; title: string; rows: { m: string; unit: string; before: [number, number]; after: [number, number]; scale: [number, number] }[] }
  | { k: "flow"; nodes: { t: string; sub?: string; href?: string; flag?: boolean }[] }
  | { k: "table"; head: string[]; rows: (string | { t: string; href: string })[][] };
export interface Ev { label: EvidenceLabel; id: string; what: string; href: string }
export interface RichTurn { q: string; blocks: Block[]; label: EvidenceLabel; band?: string; ev: Ev[]; next?: { title: string; sub: string; href: string; cta: string; assignable?: boolean }; follow: string[] }
export interface RichConv { id: string; title: string; role: RoleId; area: string; updatedAt: string; turns: RichTurn[] }

const viscA = runs.filter((r) => r.lineId === "line-a").slice(-20).map((r) => r.outcomes.find((o) => o.name === "Viscosity")?.value ?? 0);
const scrapB = runs.filter((r) => r.lineId === "line-b").slice(-20).map((r) => r.outcomes.find((o) => /scrap/i.test(o.name))?.value ?? 0);

/* Suggested questions: each has its own answer. */
export const SUGGESTED = [
  "Which lots are at risk today?",
  "What is waiting for my decision?",
  "How is the hold temperature trial doing?",
  "What did the agent get done this week?",
  "Which proposals are left on the table?",
  "Should I trust the Line B MPC layer?",
  "Why is Line A viscosity drifting?",
] as const;

export function suggestedAnswer(q: string, role: RoleId): RichTurn | undefined {
  const s = q.trim().toLowerCase();
  const k = SUGGESTED.find((x) => x.toLowerCase() === s);
  if (!k) return undefined;
  const owner = role === "owner";
  const A: Record<(typeof SUGGESTED)[number], RichTurn> = {
    "Which lots are at risk today?": { q: k, label: "Modelled", band: "lot 3307 viscosity 2540 to 2630 mPa·s, spec up to 2600",
      blocks: [
        { k: "p", t: "Four lots are at risk: two on Line A, two on Line B. None has a lab result yet, so all four are predictions from their linked runs." },
        { k: "table", head: ["Lot", "Line", "Predicted", "Spec", "Why"], rows: [
          [{ t: "3307", href: "/quality/lots/lot-a-3307" }, "Line A", "2585 mPa·s", "2380 to 2600", "End-of-hold torque high"],
          [{ t: "3296", href: "/quality/lots/lot-a-3296" }, "Line A", "2585 mPa·s", "2600 to 2840", "Same cause as 3307"],
          [{ t: "7713", href: "/quality/lots/lot-b-7713" }, "Line B", "47.7 g", "47.6 to 48.8", "Light parts on cavity 2"],
          [{ t: "7719", href: "/quality/lots/lot-b-7719" }, "Line B", "47.7 g", "47.6 to 48.8", "Awaiting lab"],
        ] },
        { k: "h", t: "What to do first" },
        { k: "ul", items: ["Lot 3307 is closest to the limit. Sampling it at the end of hold gives the answer 40 min sooner.", "Lots 7713 and 7719 can wait for the vision check on cavity 2."] },
      ],
      ev: [{ label: "Modelled", id: "EV-A-1186", what: "Property band, lot 3307", href: "/quality/lots/lot-a-3307" }, { label: "Measured", id: "EV-A-1188", what: "End-of-hold torque, batches 2416 and 2417", href: "/quality/lots/lot-a-3307" }, { label: "Measured", id: "EV-B-2214", what: "Vision check part weight, cavity 2", href: "/quality/lots/lot-b-7713" }],
      next: { title: "Sample lot 3307 at the end of hold", sub: "Quality head, Shift lead or Plant head decides", href: "/quality?tab=actions#ex-q2", cta: "Open in Actions", assignable: true },
      follow: ["Why is Line A viscosity drifting?", "What is waiting for my decision?"] },
    "What is waiting for my decision?": { q: k, label: "Measured",
      blocks: [
        { k: "p", t: "Five items are waiting. Three are per-run proposals, one is a trial signature and one is a correction from Quality." },
        { k: "table", head: ["Item", "For", "Expires"], rows: [
          [{ t: "Melt temperature 239 °C for resin lot R-77", href: "/inbox/in-3" }, "Operator", "in 1 h"],
          [{ t: "Hold pressure 760 bar on Press P3", href: "/inbox/in-1" }, "Operator", "in 2 h"],
          [{ t: "Agitator speed 158 rpm on Mixer M1", href: "/inbox/in-2" }, "Operator", "in 3 h"],
          [{ t: "Correction from Quality: lot 3307", href: "/inbox/in-5" }, "Process engineer", "in 4 h"],
          [{ t: "Sign trial: tool temperature 58 °C", href: "/inbox/in-4" }, "Plant head", "tomorrow"],
        ] },
        { k: "p", t: "If a proposal expires, nothing changes on the line. The agent proposes again on the next run if it still helps." },
      ],
      ev: [{ label: "Measured", id: "in-3", what: "Inbox, waiting items", href: "/inbox" }],
      next: { title: "Melt temperature 239 °C expires first", sub: "Operator decides, inside the signed band", href: "/inbox/in-3", cta: "Open the card", assignable: true },
      follow: ["Which proposals are left on the table?", "Which lots are at risk today?"] },
    "How is the hold temperature trial doing?": { q: k, label: "Measured", band: "time to target 8.0 min sooner to 0.4 min later",
      blocks: [
        { k: "p", t: "Too early to call. 10 of 16 batches are done. The average says 86 °C reaches target viscosity 3.8 min sooner, but the band still crosses zero." },
        { k: "trend", title: "Viscosity per batch, Line A, trial shaded", values: viscA, spec: [2380, 2600], unit: "mPa·s", from: 14 },
        { k: "compare", title: "Time to target viscosity", rows: [{ m: "Time to target, min: before is 84 °C, after is 86 °C", unit: "min", before: [41, 47], after: [36, 46], scale: [30, 50] }] },
        { k: "p", t: "One batch was skipped after a cooling water changeover and is recorded, not dropped. Six more batches should narrow the band enough for a verdict." },
      ],
      ev: [{ label: "Measured", id: "EV-A-1102", what: "10 of 16 batches, measurement plan locked", href: "/process/trials/trial-1" }, { label: "Measured", id: "EV-A-1194", what: "Batch temperature against best path", href: "/process/lines/line-a" }],
      next: { title: "Trial on Line A, ends at batch 2426", sub: "Stop returns 84 °C straight away", href: "/process/trials/trial-1", cta: "Open the trial" },
      follow: ["What is waiting for my decision?", "What did the agent get done this week?"] },
    "What did the agent get done this week?": { q: k, label: "Measured",
      blocks: [
        { k: "h", t: "Results" },
        { k: "ul", items: ["Line B scrap rate 3.2%, down from 3.6%, mostly from cycle time 33.2 s holding through two resin changes.", "Line A right first time 91.4%, up from 89.8%, because slow batches were caught while they ran.", "4 lots caught before discharge."] },
        { k: "trend", title: "Line B scrap rate per shift run", values: scrapB, spec: [0, 4], unit: "%" },
        { k: "h", t: "People and the agent" },
        { k: "ul", items: ["6 actions accepted, 2 declined with a reason, 1 expired.", "7 of 9 questions answered. One answer taught the agent a new changeover rule on Line A.", ...(owner ? ["₹1.9 lakh a month verified this week, kept apart from Indicative."] : [])] },
        { k: "p", t: "Next it will finish onboarding Housing B-52, bring the MPC layer on Press P3 to a trial draft, and chase the four proposals left on the table." },
      ],
      ev: [{ label: "Measured", id: "EV-B-2104", what: "Cycle time trial, verdict Improved", href: "/activity/summary" }, { label: "Measured", id: "EV-A-1061", what: "Line A batches, right first time", href: "/process/lines/line-a" }],
      next: { title: "This week's summary", sub: "Outcomes, actions, answers and what it learned", href: "/activity/summary", cta: "Open summary" },
      follow: ["Which proposals are left on the table?", "How is the hold temperature trial doing?"] },
    "Which proposals are left on the table?": { q: k, label: "Estimated", band: owner ? "₹38,000 to ₹45,000 a week" : "about 730 kWh and 560 parts a week",
      blocks: [
        { k: "p", t: "Four proposals have waited five days or more with nobody deciding. Each one keeps costing while it waits." },
        { k: "table", head: ["Proposal", "Waiting", owner ? "Lost per week" : "Lost per week"], rows: [
          ["Resin dryer dew point -35 °C on dry days", "12 days", owner ? "₹3,528" : "420 kWh"],
          ["Take-out time 0.4 s shorter", "9 days", owner ? "₹11,760" : "560 parts"],
          ["Jacket setpoint 1 °C lower in hold", "7 days", owner ? "₹2,604" : "310 kWh"],
          ["Grade A-14 from its best batches", "5 days", owner ? "₹23,000" : "0.5 reworked batches"],
        ] },
        { k: "p", t: "The take-out time proposal has not been opened at all. Assigning it to a named person is usually enough to get a decision." },
      ],
      ev: [{ label: "Estimated", id: "idle-2", what: "Parts per shift with 0.4 s shorter take-out", href: "/process" }, { label: "Measured", id: "idle-3", what: "Dew point on 6 dry days", href: "/process" }],
      next: { title: "Take-out time 0.4 s shorter on the robot", sub: "Not opened since it was raised", href: "/process", cta: "Open on Process", assignable: true },
      follow: ["What is waiting for my decision?", "What did the agent get done this week?"] },
    "Should I trust the Line B MPC layer?": { q: k, label: "Modelled", band: "cycle time 32.9 to 33.3 s, scrap 2.7 to 3.0%",
      blocks: [
        { k: "p", t: "Not yet for the line, but enough to try it properly. It has only run on the twin: 240 simulated shifts replaying six weeks of resin lots." },
        { k: "compare", title: "Twin result against today", rows: [
          { m: "Cycle time, s", unit: "s", before: [33.4, 33.8], after: [32.9, 33.3], scale: [32.5, 34] },
          { m: "Scrap rate, %", unit: "%", before: [3.0, 3.4], after: [2.7, 3.0], scale: [2.4, 3.6] },
        ] },
        { k: "flow", nodes: [{ t: "MPC layer", sub: "proposed, on the twin", flag: true }, { t: "Run-to-run", sub: "active" }, { t: "Moulding sequence", sub: "rule-based" }, { t: "PID loops", sub: "barrel and tool" }] },
        { k: "p", t: "The PID loops stay underneath. Stop drops the layer and the loops carry on alone. A switchback trial would prove it on the real line." },
      ],
      ev: [{ label: "Modelled", id: "layer-1", what: "Twin run, 240 shifts", href: "/process/lines/line-b?tab=controls" }, { label: "Measured", id: "EV-B-2231", what: "Resin moisture by lot, 6 weeks", href: "/process/lines/line-b?tab=controls" }],
      next: { title: "Add an MPC layer over the barrel loops", sub: "Process engineer drafts a trial, Plant head signs", href: "/process/lines/line-b?tab=controls", cta: "Open in Controls", assignable: true },
      follow: ["How is the hold temperature trial doing?", "What did the agent get done this week?"] },
    "Why is Line A viscosity drifting?": { q: k, label: "Estimated", band: "0.6 to 1.1 mPa·s higher per batch",
      blocks: [
        { k: "p", t: "Viscosity has crept up across the last 20 batches on Grade A-12. End-of-hold torque rose with it, so the batches are thickening in hold, not in the lab." },
        { k: "trend", title: "Viscosity per batch, Line A", values: viscA, spec: [2380, 2600], unit: "mPa·s", from: 14 },
        { k: "h", t: "Likely cause" },
        { k: "flow", nodes: [{ t: "Jacket inlet cooler", sub: "since 08:40" }, { t: "Slower heat-up", sub: "4 min late" }, { t: "Longer effective hold", flag: true }, { t: "Viscosity up", sub: "lots 3307, 3296" }] },
        { k: "p", t: "The agent is shortening hold on slow batches inside the signed band. If the drift holds after the jacket sensor check, it will propose a trial." },
      ],
      ev: [{ label: "Estimated", id: "drift-1", what: "Drift on viscosity, Line A", href: "/quality/drift" }, { label: "Measured", id: "EV-A-1188", what: "End-of-hold torque", href: "/quality/lots/lot-a-3307" }],
      next: { title: "Sample lot 3307 at the end of hold", sub: "Quality head decides", href: "/quality?tab=actions#ex-q2", cta: "Open in Actions", assignable: true },
      follow: ["Which lots are at risk today?", "How is the hold temperature trial doing?"] },
  };
  return A[k];
}

/* Past conversations across roles and areas. */
export const richConvs: RichConv[] = [
  { id: "rc-1", title: "Why is batch 2418 heating slowly?", role: "operator", area: "Process", updatedAt: at(0, -1, -30), turns: [
    { q: "Batch 2418 is slow to heat. Is something wrong?", label: "Measured", band: "viscosity 2460 to 2540 mPa·s at discharge",
      blocks: [
        { k: "p", t: "Nothing is broken. The jacket inlet has run 1.5 °C cool since the cooling water changeover at 08:40, so the batch reached hold temperature 4 min late." },
        { k: "flow", nodes: [{ t: "Cooling water changeover", sub: "08:40" }, { t: "Jacket inlet 1.5 °C cool", sub: "Measured", flag: true }, { t: "Batch 2418 4 min late", sub: "to hold temperature" }, { t: "Hold time 55 to 57 min", sub: "written, inside the band" }] },
        { k: "h", t: "What the agent did" },
        { k: "p", t: "It wrote hold time 57 min for this batch only, inside the standing approval of 52 to 58 min. Press Stop and 55 min comes back." },
      ],
      ev: [{ label: "Measured", id: "EV-A-1194", what: "Batch temperature against the best-batch path", href: "/process/lines/line-a" }, { label: "Measured", id: "EV-A-1195", what: "Jacket inlet temperature, last 6 h", href: "/process/lines/line-a" }],
      next: { title: "Hold time 57 min on batch 2418", sub: "Running on its own, inside the signed band", href: "/process/lines/line-a?tab=actions#ex-p1", cta: "Open in Actions" },
      follow: ["How is the hold temperature trial doing?", "Which lots are at risk today?"] } ] },
  { id: "rc-2", title: "Light parts on cavity 2, hold the lot?", role: "shift-lead", area: "Quality", updatedAt: at(0, -2, -10), turns: [
    { q: "Should we hold lot 7713 for the light parts on cavity 2?", label: "Estimated", band: "part weight 47.5 to 48.0 g, lower limit 47.6 g",
      blocks: [
        { k: "p", t: "Hold the last two hours of cavity 2 parts and weigh 32 of them. The rest of the lot is fine." },
        { k: "trend", title: "Cavity 2 part weight, last 20 shots sampled", values: [48.1, 48.0, 48.1, 48.0, 47.9, 48.0, 47.9, 47.9, 47.8, 47.9, 47.8, 47.8, 47.7, 47.8, 47.7, 47.7, 47.7, 47.6, 47.7, 47.6], spec: [47.6, 48.8], unit: "g" },
        { k: "p", t: "Weight fell 0.12 g over three shift runs after a melt temperature proposal was declined. Flash on the parting line points to the same cause." },
        { k: "p", t: "Releasing a hold happens in your quality system, not here." },
      ],
      ev: [{ label: "Measured", id: "EV-B-2214", what: "Vision check part weight, cavity 2", href: "/quality/lots/lot-b-7713" }, { label: "Estimated", id: "EV-B-2216", what: "Lot 7713 estimated band", href: "/quality/lots/lot-b-7713" }],
      next: { title: "Hold and check cavity 2 parts", sub: "Operator, Shift lead or Quality head decides", href: "/quality?tab=actions#ex-q1", cta: "Open in Actions", assignable: true },
      follow: ["Which lots are at risk today?", "What is waiting for my decision?"] } ] },
  { id: "rc-3", title: "Lot 3307: what made it?", role: "quality-head", area: "Lots", updatedAt: at(0, -3), turns: [
    { q: "Trace lot 3307 back to its batches and settings.", label: "Estimated", band: "link 0.86 to 0.93, both suggested",
      blocks: [
        { k: "flow", nodes: [{ t: "Lot 3307", sub: "at risk", href: "/quality/lots/lot-a-3307", flag: true }, { t: "Batch 2419", sub: "link 0.93", href: "/process/runs/run-a-2419" }, { t: "Batch 2418", sub: "link 0.86", href: "/process/runs/run-a-2418" }, { t: "Hold 84 °C, 55 min", sub: "agitator 150 rpm" }] },
        { k: "table", head: ["Batch", "Hold temp", "Hold time", "End torque", "Viscosity"], rows: [[{ t: "2419", href: "/process/runs/run-a-2419" }, "84 °C", "55 min", "high", "2449 mPa·s"], [{ t: "2418", href: "/process/runs/run-a-2418" }, "84 °C", "57 min", "high", "2397 mPa·s"]] },
        { k: "p", t: "Both links are below the pack threshold, so they are suggested, not confirmed. Confirming them would let the band rest on verified links." },
      ],
      ev: [{ label: "Estimated", id: "link-lot-a-3307-0", what: "Link to batch 2419", href: "/quality/lots/lot-a-3307" }, { label: "Measured", id: "EV-A-1188", what: "End-of-hold torque", href: "/quality/lots/lot-a-3307" }],
      next: { title: "Confirm the two links", sub: "Quality head confirms links", href: "/quality/links", cta: "Open link confirmations", assignable: true },
      follow: ["Which lots are at risk today?", "Why is Line A viscosity drifting?"] },
    { q: "And if I sample it early?", label: "Modelled", band: "result 40 min sooner",
      blocks: [{ k: "p", t: "Sampling at the end of hold, not after discharge, gives the lab result 40 min sooner, while the lot can still be adjusted. Nothing else changes." }],
      ev: [{ label: "Modelled", id: "EV-A-1186", what: "Lab turnaround by sample point", href: "/quality/lots/lot-a-3307" }],
      next: { title: "Sample lot 3307 at the end of hold", sub: "Quality head decides", href: "/quality?tab=actions#ex-q2", cta: "Open in Actions", assignable: true }, follow: ["Which lots are at risk today?"] } ] },
  { id: "rc-4", title: "Grade A-14 changeover settings", role: "process-engineer", area: "Process", updatedAt: at(-1, -2), turns: [
    { q: "What should batch 2421 start with when we change to Grade A-14?", label: "Estimated", band: "first batch viscosity 2650 to 2790 mPa·s",
      blocks: [
        { k: "p", t: "Start from the five best A-14 batches: hold time 58 min and agitator speed 146 rpm, both inside the A-14 band." },
        { k: "compare", title: "First batch after changeover", rows: [{ m: "Viscosity, mPa·s", unit: "mPa·s", before: [2560, 2880], after: [2650, 2790], scale: [2500, 2950] }] },
        { k: "p", t: "The last two A-14 changeovers each needed one batch reworked. Starting from its own best batches narrows the first-batch band and keeps it inside spec." },
      ],
      ev: [{ label: "Measured", id: "EV-A-1061", what: "5 best A-14 batches", href: "/process/lines/line-a" }, { label: "Measured", id: "EV-A-1064", what: "Two reworked first batches", href: "/process/lines/line-a" }],
      next: { title: "Use these settings for batch 2421", sub: "Process engineer, Shift lead or Plant head decides", href: "/process/lines/line-a?tab=actions#ex-p2", cta: "Open in Actions", assignable: true },
      follow: ["Which proposals are left on the table?", "How is the hold temperature trial doing?"] } ] },
  { id: "rc-5", title: "MPC layer on Press P3", role: "plant-head", area: "Controls", updatedAt: at(-1, -5), turns: [
    { q: "What would an MPC layer on Press P3 change?", label: "Modelled", band: "cycle time 32.9 to 33.3 s",
      blocks: [
        { k: "p", t: "It would move the barrel zones and tool temperature together when resin moisture changes, instead of each loop catching up on its own." },
        { k: "compare", title: "Twin result, 240 simulated shifts", rows: [{ m: "Cycle time, s", unit: "s", before: [33.4, 33.8], after: [32.9, 33.3], scale: [32.5, 34] }, { m: "Melt swing, °C", unit: "°C", before: [2.8, 3.4], after: [1.6, 2.2], scale: [1, 4] }] },
        { k: "p", t: "Every move stays inside the signed windows. You would sign a switchback trial before it touches the line." },
      ],
      ev: [{ label: "Modelled", id: "layer-1", what: "Twin run", href: "/process/lines/line-b?tab=controls" }],
      next: { title: "Add an MPC layer, tried on the twin first", sub: "Process engineer drafts, you sign", href: "/process/lines/line-b?tab=controls", cta: "Open in Controls" },
      follow: ["Should I trust the Line B MPC layer?", "What did the agent get done this week?"] } ] },
  { id: "rc-6", title: "Is the jacket sensor stuck?", role: "shift-lead", area: "Questions", updatedAt: at(0, -0, -35), turns: [
    { q: "The agent asked me about the jacket inlet sensor. What does it need?", label: "Measured",
      blocks: [
        { k: "p", t: "The jacket inlet sensor on Mixer M1 has read exactly 61.0 °C for 40 min while the flow changed twice. A real loop moves more than that." },
        { k: "trend", title: "Jacket inlet temperature, last 2 h", values: [61.8, 61.5, 61.9, 61.4, 61.7, 61.2, 61.0, 61.0, 61.0, 61.0, 61.0, 61.0, 61.0, 61.0], spec: [58, 64], unit: "°C" },
        { k: "h", t: "What your answer changes" },
        { k: "ul", items: ["Yes, stuck: Line A hold proposals stay recommend-only until it is fixed.", "No, it is real: the readings are kept as they are.", "Checking now: nothing changes until you answer."] },
      ],
      ev: [{ label: "Measured", id: "EV-A-1201", what: "Jacket inlet temperature", href: "/inbox?tab=questions" }, { label: "Measured", id: "EV-A-1202", what: "Jacket flow changes", href: "/inbox?tab=questions" }],
      next: { title: "Answer the question", sub: "Sent to Shift lead, plant-wide", href: "/inbox?tab=questions", cta: "Open in Inbox" },
      follow: ["What is waiting for my decision?"] } ] },
  { id: "rc-7", title: "Handover: what changed on shift 1?", role: "shift-lead", area: "Summaries", updatedAt: at(0, -0, -50), turns: [
    { q: "Give me the handover for shift 1.", label: "Measured",
      blocks: [
        { k: "h", t: "Line A" },
        { k: "ul", items: ["Trial at 86 °C continued: batch 2417 on the trial arm.", "Batch 2418 slow to heat after the cooling water changeover; hold time 57 min written.", "Lab results late; 4 lots unanchored."] },
        { k: "h", t: "Line B" },
        { k: "ul", items: ["Cycle time 33.2 s accepted by Operator B.", "Melt temperature proposal for resin lot R-77 waiting.", "1,840 parts, scrap 3.2%."] },
        { k: "h", t: "Open for shift 2" },
        { k: "ul", items: ["5 decisions waiting, first expires in 1 h.", "Jacket sensor question waiting on you."] },
      ],
      ev: [{ label: "Measured", id: "note-1", what: "Shift 1 handover note", href: "/ask/notes" }],
      next: { title: "Inbox for shift 2", sub: "5 waiting", href: "/inbox", cta: "Open Inbox" },
      follow: ["What is waiting for my decision?", "Which lots are at risk today?"] } ] },
  { id: "rc-8", title: "Value this month", role: "owner", area: "Summaries", updatedAt: at(-2), turns: [
    { q: "What has Stamped been worth this month?", label: "Measured", band: "₹4.48 lakh a month verified",
      blocks: [
        { k: "p", t: "₹4.48 lakh a month is verified on the plant's own records, from three changes. Another ₹2.64 lakh is indicative and kept apart." },
        { k: "table", head: ["Change", "Status", "Per month"], rows: [["Shorter cycle on Tool T3", "Verified R4", "₹2,14,000"], ["Hold pressure 720 bar", "Verified R3", "₹1,38,000"], ["Hold time on slow batches", "Verified R3", "₹96,000"]] },
        { k: "p", t: "About ₹1 lakh a month more is waiting in proposals nobody has decided." },
      ],
      ev: [{ label: "Measured", id: "proof-3", what: "Cycle time proof record", href: "/?view=owner" }],
      next: { title: "Value and proof", sub: "Owner view", href: "/?view=owner", cta: "Open Owner view" },
      follow: ["Which proposals are left on the table?"] } ] },
];
