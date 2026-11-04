/**
 * Extra detail for action pages: charts, links, steps, risks, closed-loop status
 * and client-assurance fields (mechanism, guardrails, OEM lock, verification).
 * Illustrative; aligned with actions.ts and data.ts. No invented client results.
 */
import type { EvidenceLabel, ExampleAction } from "./types";
import * as D from "./data";
import { exampleActions, getAction } from "./actions";

/** How Stamped is acting on this recommendation today (demo posture). */
export type AssuranceMode = "shadow" | "recommend" | "plant-applied" | "record";

export interface ActionAssurance {
  /** What changes on the machine or process, and why that moves the outcome. */
  mechanism: string;
  /** Effects that stay out of scope for this action. */
  willNotChange: string[];
  /** Downstream quality / warranty / machine knock-ons to watch. */
  knockOn: string[];
  mode: AssuranceMode;
  /** Plain OEM / control-plan note. */
  oemNote: string;
  guardrails: string[];
  hardStops: string[];
  rollback: string;
  verification: string[];
  confidence: { label: EvidenceLabel; note: string };
}

export interface ActionDetailExtra {
  trend?: { label: string; values: number[]; spec?: [number, number]; unit?: string };
  spc?: {
    title: string;
    subtitle?: string;
    chartKind: "xbar_r" | "i_mr";
    primary: { label: string; values: number[]; hits?: number[] };
    cl: number;
    ucl: number;
    lcl: number;
    usl?: number;
    lsl?: number;
    targetY?: number;
    unit?: string;
    cpk?: number;
    yMin?: number;
    yMax?: number;
    specLinesOnly?: boolean;
  };
  linkedLots?: string[];
  linkedRuns?: string[];
  similarCases?: { title: string; href: string; band: string }[];
  simulation?: { title: string; href: string; summary: string };
  steps: string[];
  risks: string[];
  assurance: ActionAssurance;
  /** Present when the change is already on the line (Running or Accepted). */
  loop?: {
    written: string;
    measured: string;
    verified: string;
    /** Outcome-first status, tagged MODELLED on the page. */
    statusLine: string;
  };
}

/** Overheating scrap on the most recent Forge line shift runs, from the demo run history. */
const forgeScrap = D.runs
  .filter((r) => r.lineId === "line-a")
  .slice(-10)
  .map((r) => r.outcomes.find((o) => o.name === "Overheating scrap")?.value ?? 1);

const OEM_INSIDE =
  "Stays inside the plant's signed operating band and the control plan already on file with the customer. No approved-process change is asked for.";
const OEM_HOLD =
  "This is a quality hold or floor check on the current approved process. It does not change the process submitted to the OEM.";
const OEM_OUTSIDE =
  "The proposed setting sits outside the signed cell limits, so a named plant person must change it on the machine. If the plant treats that as a customer-notification item, Stamped helps build the evidence pack; it does not bypass OEM approval.";

function modeFor(a: ExampleAction): AssuranceMode {
  if (a.who.how === "Record only") return "record";
  if (a.who.how === "On its own, inside the signed band") return "plant-applied";
  if (a.who.how === "Recommend only") return "recommend";
  return "recommend";
}

function defaultAssurance(a: ExampleAction): ActionAssurance {
  const mode = modeFor(a);
  return {
    mechanism: a.why,
    willNotChange: [
      "Existing trips, interlocks and the plant's own controller stay as they are.",
      "Quality release stays with the plant quality lead.",
    ],
    knockOn: a.area === "Quality"
      ? ["Escaped defects and warranty returns stay with the plant's own codes; Stamped only flags early."]
      : ["Scrap, energy and rework are watched on the line after the change; freeze if they move the wrong way."],
    mode,
    oemNote: mode === "recommend" && a.who.how === "Recommend only" ? OEM_OUTSIDE : OEM_INSIDE,
    guardrails: [
      "Recommend only until a named plant person accepts.",
      "Numbers stay labelled measured, modelled or projected.",
    ],
    hardStops: [
      "Plant Stop restores the last approved setting.",
      "Stamped never releases a quality hold.",
    ],
    rollback: "Stop or decline restores the prior approved setting; the decision is recorded in Activity.",
    verification: [
      "Compare the listed outcomes on the next agreed window of shift runs.",
      "Plant quality keeps release authority on any held work.",
    ],
    confidence: {
      label: a.expected?.label ?? a.outcome.label,
      note: a.expected?.band
        ? `Illustrative demo band: ${a.expected.band}. Not a certified plant result.`
        : "Illustrative demonstration plant model. Not a certified plant result.",
    },
  };
}

export const ACTION_DETAIL: Record<string, Omit<ActionDetailExtra, "assurance"> & { assurance?: ActionAssurance }> = {
  "ex-p1": {
    trend: { label: "Overheating scrap, Forge line shift runs", values: forgeScrap, unit: "%" },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    simulation: {
      title: "Switchback trial on the Forge line",
      href: "/process/trials/trial-1",
      summary: "Alternate shift runs on the lower billet exit target; measurement plan locked before the first switch.",
    },
    similarCases: [{ title: "Hold the coil warm through press stops", href: "/process/actions/ex-p2", band: "heats per 100 parts 109 to 104" }],
    steps: [
      "Run the 1205 °C billet exit target on alternate shift runs.",
      "Compare overheating scrap and heats per 100 parts with the prior target.",
      "Stop restores 1215 °C straight away.",
    ],
    risks: ["Billets that leave too cool can load the press; Stop restores the prior target."],
    assurance: {
      mechanism:
        "Heater H1's billet exit target moves from 1215 °C to 1205 °C on the trial arm only. The PI loop and upper trip stay. The change shortens the hot spell after a press stop so fewer billets cross the overheat scrap code, without asking the coil to run outside its signed band.",
      willNotChange: [
        "Heater interlocks, trip temperature and the plant's own PI controller.",
        "Die recipe, press force band and lubrication plan.",
        "Any OEM-submitted process parameter outside this signed billet-exit band.",
      ],
      knockOn: [
        "Cooler billets that leave too far below the band can raise underfill risk at the press; the trial watches forgeability alongside scrap.",
        "Internal forging defects and field / warranty codes stay owned by plant quality; the trial freezes if scrap or hardness moves the wrong way against the agreed stop rule.",
        "The machine is not rewired; only the exit target the existing controller already accepts is trimmed.",
      ],
      mode: "recommend",
      oemNote: OEM_INSIDE,
      guardrails: [
        "Trial on alternate shift runs only; measurement plan locked before the first switch.",
        "Target stays inside the signed billet-exit band.",
        "Shadow / replay of the same window is available before live trial acceptance.",
      ],
      hardStops: [
        "Any operator can press Stop; 1215 °C returns at once.",
        "Recommendations freeze if overheating scrap or underfill rises against the trial stop rule.",
        "Stamped does not write the PLC unless the plant later earns a write path under its own policy.",
      ],
      rollback: "Stop restores 1215 °C immediately. Decline or end-of-trial keeps the prior target and records the reason.",
      verification: [
        "Overheating scrap ÷ parts forged on trial arm B against prior arm A.",
        "Heats per 100 parts and billet exit temperature distribution on the same window.",
        "Plant quality reviews any held trays before release.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: overheating scrap 0.7 to 1.1%; heats per 100 parts 103 to 105. Not a certified plant or lab uniformity result.",
      },
    },
  },
  "ex-p2": {
    trend: { label: "Heats per 100 parts, Forge line", values: [109, 108, 108, 107, 106, 105, 105, 104], unit: "heats" },
    linkedRuns: ["run-a-2417", "run-a-2418"],
    similarCases: [{ title: "Pace the pusher to the press", href: "/process/actions/ex-p3", band: "billets waiting 13 to 5" }],
    steps: [
      "Detect a press stop under ten minutes.",
      "Drop heater H1 to the warm idle level inside the signed coil-power band.",
      "Return to run power when the press restarts; watch heats per 100 parts for the next forty shift runs.",
    ],
    risks: ["If the idle level runs too cool, the first billets after a restart wait; Stop restores the prior coil power."],
    loop: {
      written: "Heater H1 held at a warm idle level during press stops under ten minutes, inside the signed coil-power band.",
      measured: "Heats per 100 parts 104 over the last forty shift runs; overheating scrap 0.9%; coil energy 4% lower per 100 parts.",
      verified: "Billet exit temperature stayed inside its band; Stop unused; prior coil power ready to restore.",
      statusLine: "Measured on the line: heats per 100 parts down 5 over 40 shift runs",
    },
    assurance: {
      mechanism:
        "When screw press P1 stops for under ten minutes, heater H1 steps to a warm idle coil-power level inside the signed band, then returns to run power on restart. That avoids cooking billets in the coil and avoids emptying the line cold, so fewer heats are wasted around stops.",
      willNotChange: [
        "Coil trip, interlocks and the heater's own controller.",
        "Press stop logic and die-check procedures.",
        "The signed coil-power envelope itself.",
      ],
      knockOn: [
        "If idle runs too cool, the first billets after restart wait; heats and exit temperature catch that.",
        "Overheating scrap and coil energy per 100 parts are the watched outcomes; warranty codes stay with plant quality.",
      ],
      mode: "plant-applied",
      oemNote: OEM_INSIDE,
      guardrails: [
        "Standing approval from the Plant head; writes only inside the signed coil-power band.",
        "Writer path, if enabled later, starts off after reboot and stays allow-listed.",
      ],
      hardStops: [
        "Any operator can press Stop; prior coil power returns.",
        "Filter or Plant Box failure leaves the heater on its own control.",
      ],
      rollback: "Stop restores the prior coil power. Standing approval can be revoked; the change then reverts to recommend-only.",
      verification: [
        "Heats per 100 parts over the next forty shift runs.",
        "Overheating scrap and coil energy per 100 parts on the same window.",
        "Billet exit temperature stays inside its band through short stops.",
      ],
      confidence: {
        label: "Modelled",
        note: "Line figures on this card are demonstration-modelled, including the measured-after chips. Not a certified energy claim; client materials use upwards of 10% electricity only where measured on that plant.",
      },
    },
  },
  "ex-p3": {
    trend: { label: "Billets waiting in heater H1 at press stops", values: [13, 12, 12, 10, 9, 8, 6, 5], unit: "billets" },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Trial a lower billet exit target", href: "/process/actions/ex-p1", band: "overheating scrap 1.2 to 0.8%" }],
    steps: [
      "Link the pusher rate to the press stroke rate.",
      "Cap the billets held ahead of the press at six.",
      "Watch overheating scrap and heats per 100 parts for the next eight shift runs.",
    ],
    risks: ["A press that restarts faster than the pusher can feed will starve; revert to the fixed rate if it does."],
    assurance: {
      mechanism:
        "Pusher rate on heater H1 is linked to screw press P1 stroke rate, with a cap of six billets held ahead of the press. Fewer billets sit hot in the coil when the press slows, which cuts overheating scrap without changing billet chemistry or die set.",
      willNotChange: [
        "Billet cut length, steel grade and heater trip settings.",
        "Press tonnage band and die recipe.",
      ],
      knockOn: [
        "A press that restarts faster than the pusher can feed may starve briefly; revert to the fixed rate if it does.",
        "Underfill and lap codes stay on plant quality's watch list alongside overheating scrap.",
      ],
      mode: "recommend",
      oemNote: OEM_INSIDE,
      guardrails: [
        "Change accepted by Process engineer, Shift lead or Plant head before the next shift run.",
        "Pusher rate stays inside the signed band.",
      ],
      hardStops: [
        "Revert to the fixed pusher rate if the press starves after restart.",
        "Stop / decline restores the prior fixed rate.",
      ],
      rollback: "Keep the fixed pusher rate records the reason and leaves the line unchanged.",
      verification: [
        "Mean billets in the coil at each press stop.",
        "Overheating scrap and heats per 100 parts over the next eight shift runs.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: billets waiting 5; overheating scrap 0.9%; heats per 100 parts 105.",
      },
    },
  },
  "ex-p4": {
    trend: { label: "Melt energy per tonne, furnace M1", values: [612, 606, 598, 592, 586, 580, 576, 574], unit: "kWh" },
    linkedRuns: ["run-d-8826", "run-d-8827"],
    similarCases: [{ title: "Pour temperature outside the good-heat window", href: "/quality/actions/ex-q3", band: "casting scrap 3.6 to 2.5%" }],
    steps: [
      "Detect a mould-line stop from the line signal.",
      "Step melt power to the holding level inside the signed melt-power band.",
      "Bring power back ahead of the next pour; watch pour temperature and casting scrap for the next ten heats.",
    ],
    risks: ["A short stop can leave the metal below the pour window; Stop restores the prior melt power."],
    assurance: {
      mechanism:
        "While mould line ML1 is stopped, furnace M1 steps melt power to a holding level inside the signed band, then ramps back ahead of the next pour. Metal is not held at full melt power, so energy and carbon-equivalent burn-off both fall.",
      willNotChange: [
        "Furnace interlocks, refractory limits and the melt shop's own power controller.",
        "Pour recipe and moulding process submitted to the customer.",
      ],
      knockOn: [
        "A short stop can leave metal below the pour window; pour temperature and casting scrap are watched.",
        "Chemistry drift stays a plant lab concern; Stamped does not release heats.",
      ],
      mode: "recommend",
      oemNote: OEM_INSIDE,
      guardrails: [
        "Accepted by Process engineer, Shift lead or Plant head before the next tap.",
        "Holding level stays inside the signed melt-power band.",
      ],
      hardStops: [
        "Stop restores the prior melt power.",
        "Recommendations freeze if pour temperature leaves the good-heat window against the stop rule.",
      ],
      rollback: "Keep full power leaves the furnace unchanged and records the reason.",
      verification: [
        "Melt energy per tonne and hold energy per stop on the next ten heats.",
        "Pour temperature inside 1400 to 1440 °C and casting scrap on the same window.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: melt energy per tonne 574 kWh; pour temperature inside 1400 to 1440 °C; casting scrap 2.7%.",
      },
    },
  },
  "ex-p5": {
    trend: { label: "Cycle time, VMC-2", values: [108, 108, 107, 106, 105, 104, 103.5, 103], unit: "s" },
    linkedRuns: ["run-e-3328", "run-e-3329"],
    simulation: {
      title: "Finish-pass feed on the twin",
      href: "/process/simulate",
      summary: "The higher feed is run on the twin first; tool life, spindle load and bore size are read before the machine is changed.",
    },
    similarCases: [{ title: "Tighten the cooling time on Tool T3", href: "/process/actions/ex-p6", band: "cycle 33.2 to 32.4 s" }],
    steps: [
      "Run the higher finish-pass feed on the twin.",
      "Read tool life, spindle load and bore size from the twin run.",
      "The Process engineer or Plant head decides whether to change the feed on the machine.",
    ],
    risks: ["A higher feed shortens tool life; the twin shows by how much before the machine takes the risk."],
    assurance: {
      mechanism:
        "A higher finish-pass feed is run on the VMC-2 twin first. Tool life, spindle load and bore size are read from the twin. Only after a named person accepts does anyone change the machine. That keeps innovation (trying a faster feed) behind a no-touch rehearsal.",
      willNotChange: [
        "The live machine until a person changes it.",
        "Fixture, tool number and inspection plan until the plant decides otherwise.",
      ],
      knockOn: [
        "Higher feed shortens tool life and raises spindle load; the twin shows both before risk reaches the cell.",
        "Bore size and scrap stay on the verification list if the plant later applies the feed.",
      ],
      mode: "recommend",
      oemNote: OEM_OUTSIDE,
      guardrails: [
        "Twin-only until Process engineer or Plant head plans the machine change.",
        "No PLC write from Stamped on this cell for the feed change.",
      ],
      hardStops: [
        "Decline leaves the machine untouched.",
        "If applied later, plant Stop and the prior CNC programme remain the rollback.",
      ],
      rollback: "Decline with reason records learning and changes nothing on VMC-2.",
      verification: [
        "Twin: cycle time, spindle load and tool life at the higher feed.",
        "If applied on the machine: bore size and scrap on the next agreed shift runs.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative twin projection: cycle 103 s; spindle load 68%; tool life 380 parts. Not a measured plant result until applied.",
      },
    },
  },
  "ex-p6": {
    trend: { label: "Cycle time, Tool T3", values: [34.1, 34.0, 33.6, 33.4, 33.2, 33.0, 32.7, 32.4], unit: "s" },
    linkedRuns: ["run-b-678", "run-b-679"],
    similarCases: [{ title: "Feed change on VMC-2, tried on the twin", href: "/process/actions/ex-p5", band: "cycle 108 to 103 s" }],
    steps: [
      "Confirm part temperature and warp checks after early open.",
      "Cut cool time so cycle moves from 33.2 s to 32.4 s.",
      "Watch scrap and energy per good part for two shift runs.",
    ],
    risks: ["Opening too early raises warp; Stop restores the prior cool time."],
    assurance: {
      mechanism:
        "Tool T3 cool time is cut so cycle moves from 33.2 s to 32.4 s, inside the signed cycle-time band. Parts are already stable at ejection; the cut frees press time and lowers energy per good part.",
      willNotChange: [
        "Mould tool, resin and cavity pressure recipe outside this cool-time trim.",
        "Vision scrap definitions and the press's own safety interlocks.",
      ],
      knockOn: [
        "Opening too early can raise warp; early-open temperature and warp checks stay on the plan.",
        "Customer dimensional complaints stay owned by plant quality.",
      ],
      mode: "recommend",
      oemNote: OEM_INSIDE,
      guardrails: [
        "Accepted by Process engineer, Shift lead or Plant head before the next tool run.",
        "Cool time stays inside the signed cycle-time band.",
      ],
      hardStops: [
        "Stop restores the prior cool time.",
        "Freeze the recommendation if warp or scrap rises against the stop rule.",
      ],
      rollback: "Keep current cool time leaves Tool T3 unchanged and records the reason.",
      verification: [
        "Cycle time, energy per good part and scrap rate over two shift runs.",
        "Part temperature at ejection and warp checks after early open.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: cycle 32.4 s; energy per good part 0.40 kWh; scrap 3.0%.",
      },
    },
  },
  "ex-q1": {
    trend: { label: "Quench oil temperature by basket, tank Q1", values: [66, 67, 68, 70, 71, 73], unit: "°C" },
    linkedLots: ["lot-c-5212"],
    linkedRuns: ["run-c-5118", "run-c-5119"],
    similarCases: [{ title: "Quench oil proposal on tank Q1", href: "/process/proposals/prop-111", band: "hardness 59.2 to 60.8 HRC" }],
    steps: [
      "Confirm the next basket has not been charged to the furnace.",
      "Hold it at the quench door until the oil is back under 72 °C.",
      "Sample hardness on that basket; do not release from Stamped.",
    ],
    risks: ["Quenching in warm oil risks a basket below the hardness spec."],
    assurance: {
      mechanism:
        "When quench oil on tank Q1 climbs basket to basket the same way it did before the last low-hardness baskets, Stamped asks to hold the next basket at the quench door until oil is under 72 °C, then sample hardness. The furnace recipe is not changed; only the hold decision is.",
      willNotChange: [
        "Hardening recipe, soak time and the furnace's own controller.",
        "Who may release a quality hold (plant quality system only).",
      ],
      knockOn: [
        "Quenching in warm oil risks hardness below spec and later field failures; the hold is meant to stop that basket leaving.",
        "Reheat loads and warranty hardness complaints stay on plant quality's register.",
      ],
      mode: "recommend",
      oemNote: OEM_HOLD,
      guardrails: [
        "Stamped asks; it never sets or releases a hold.",
        "Operator, Shift lead or Quality head chooses in the plant system.",
      ],
      hardStops: [
        "Quality head keeps release authority.",
        "Carry on with a reason is recorded; Stamped keeps watching oil temperature.",
      ],
      rollback: "Sample now or Carry on leaves the process recipe unchanged; only the hold decision differs.",
      verification: [
        "Hardness on the held basket before release.",
        "Baskets in hardness spec and reheat loads on the next forty loads.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: baskets in spec 97%; reheat loads 1 in 40. Not a CQI-9 pyrometry claim; plant SAT/TUS stay with the plant.",
      },
    },
  },
  "ex-q2": {
    trend: { label: "Press force, screw press P1", values: [4620, 4650, 4710, 4790, 4880, 4960, 5040, 5100], unit: "kN" },
    spc: {
      title: "Press force by stroke, screw press P1",
      subtitle: "Force outliers cluster with cold billets",
      chartKind: "i_mr",
      primary: { label: "Press force", values: [4620, 4650, 4710, 4790, 4880, 4960, 5040, 5100], hits: [6, 7] },
      cl: 4800,
      ucl: 5000,
      lcl: 4600,
      unit: "kN",
      cpk: 1.1,
    },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Trial a lower billet exit target", href: "/process/actions/ex-p1", band: "overheating scrap 1.2 to 0.8%" }],
    steps: [
      "Arm the floor flag when cold billets and force outliers coincide.",
      "Hold the next tray for a lap check before it moves on.",
      "Record the decision; Stamped does not scrap parts on its own.",
    ],
    risks: ["Ignoring the flag lets laps reach inspection, about twenty strokes later."],
    assurance: {
      mechanism:
        "When cold billets from heater H1 and press-force outliers on screw press P1 sit in the risk pool together, Stamped raises a floor flag and asks to hold the next tray for a lap check. Either signal alone is common; together they mark a stretch that later shows laps at inspection.",
      willNotChange: [
        "Heater and press setpoints on this action (flag and hold only).",
        "Scrap decisions; Stamped does not scrap parts on its own.",
      ],
      knockOn: [
        "Ignoring the flag lets internal forging defects (laps) reach inspection about twenty strokes later, and raises warranty escape risk.",
        "Machine damage is out of scope here; the action does not raise press force or rewrite the heater.",
      ],
      mode: "recommend",
      oemNote: OEM_HOLD,
      guardrails: [
        "Operator, Shift lead or Quality head confirms the flag response.",
        "Hold is set in the plant's own quality system.",
      ],
      hardStops: [
        "Stamped never scraps a part.",
        "Watch-only records the choice and keeps the risk pool visible.",
      ],
      rollback: "Watch only this shift changes nothing on the press; the flag history remains for learning.",
      verification: [
        "Lap codes on the held tray before it moves on.",
        "Defect escapes and weekly laps found at inspection after the flag is armed.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: defect escapes 1.2%; laps caught within 20 strokes.",
      },
    },
  },
  "ex-q3": {
    trend: { label: "Pour temperature by ladle, heat 8836", values: [1421, 1418, 1412, 1406, 1401, 1397], unit: "°C" },
    spc: {
      title: "Pour temperature by ladle, heat 8836",
      subtitle: "Cold pour leads misruns",
      chartKind: "i_mr",
      primary: { label: "Pour temperature", values: [1421, 1418, 1412, 1406, 1401, 1397, 1396], hits: [5, 6] },
      cl: 1420,
      ucl: 1435,
      lcl: 1405,
      unit: "°C",
      cpk: 0.98,
    },
    linkedLots: ["lot-d-8913"],
    linkedRuns: ["run-d-8826", "run-d-8827"],
    similarCases: [{ title: "Low tensile on ductile iron housing", href: "/quality/investigations/inv-3", band: "carbon equivalent low on the same heats" }],
    steps: [
      "Confirm the pour temperature is under the good-heat window.",
      "Hold the next moulds from the ladle in your quality system.",
      "Check the first castings for misruns; the Quality head releases the hold.",
    ],
    risks: ["Pouring on risks misruns that only show after shakeout."],
    assurance: {
      mechanism:
        "When pour temperature on heat 8836 leaves the 1405 to 1435 °C good-heat window, Stamped asks to hold the next moulds from the ladle and check the first castings for misruns before release. The melt recipe is not rewritten by this action.",
      willNotChange: [
        "Furnace chemistry target and moulding process on file with the customer.",
        "Who may release a hold (Quality head in the plant system).",
      ],
      knockOn: [
        "Pouring on risks misruns that only show after shakeout, then machining scrap and possible field porosity escapes.",
        "Machine damage is not in play; this is a hold, not a furnace rewrite.",
      ],
      mode: "recommend",
      oemNote: OEM_HOLD,
      guardrails: [
        "Stamped asks; Shift lead or Quality head sets the hold; Quality head releases it.",
        "No silent process change.",
      ],
      hardStops: [
        "Quality head keeps release authority.",
        "Pour on with a reason is recorded; watching continues.",
      ],
      rollback: "Pour on leaves the ladle schedule unchanged; the reason feeds the next recommendation.",
      verification: [
        "Misrun checks on the first held castings before release.",
        "Casting scrap and misruns per heat on the following heats.",
      ],
      confidence: {
        label: "Modelled",
        note: "Illustrative demo band: casting scrap 2.5%; misruns caught before shakeout.",
      },
    },
  },
  "ex-q4": {
    trend: { label: "Bore scrap at HMC-1 by heat", values: [2.6, 2.7, 2.5, 2.4, 1.8, 1.4, 1.2], unit: "%" },
    linkedLots: ["lot-d-8913"],
    linkedRuns: ["run-d-8826", "run-d-8827"],
    similarCases: [{ title: "Low tensile on ductile iron housing", href: "/quality/investigations/inv-3", band: "carbon equivalent low on the same heats" }],
    steps: [
      "Keep the machining plan unchanged.",
      "Record the carbon equivalent correction against the heat and the scrapped bores.",
      "Watch bore scrap on the next six heats.",
    ],
    risks: ["None open; record only for the quality head."],
    loop: {
      written: "Carbon equivalent target on furnace M1 raised to the middle of its range; machining plan left unchanged.",
      measured: "Bore scrap 1.2% on the six heats since the change; porosity no longer follows one heat.",
      verified: "Cause linked to heat 8826; Verified on the investigation record.",
      statusLine: "Measured on the line: bore scrap down to 1.2% on the six heats since the change",
    },
    assurance: {
      mechanism:
        "Scrapped bores at HMC-1 traced by casting id to heat 8826, where carbon equivalent sat at the low end of its range. Process raised the carbon equivalent target on furnace M1 to the middle of its range; the machining plan stayed unchanged. This card records the link and the verified result.",
      willNotChange: [
        "HMC-1 tool paths, feeds and inspection plan.",
        "Who owns process acceptance (plant process and quality, not Stamped).",
      ],
      knockOn: [
        "Porosity that escapes machining becomes a warranty risk; genealogy to heat is how that risk is cut at source.",
        "No machine rewrite on the machining cell.",
      ],
      mode: "record",
      oemNote:
        "The carbon equivalent target move, if treated as a customer-notification item, travels through the plant's OEM path with the evidence pack. Stamped records the link; it does not bypass approval.",
      guardrails: [
        "Record only; nothing further to decide on this card.",
        "Evidence labelled on every figure.",
      ],
      hardStops: [
        "Plant quality keeps release and OEM-file ownership.",
        "If bore scrap rises again, open a new investigation rather than silently widening the target.",
      ],
      rollback: "Not applicable on a closed record; a new recommendation would be needed to move the target again.",
      verification: [
        "Bore scrap by heat on the six heats since the change.",
        "Investigation record links casting id, heat and carbon equivalent.",
      ],
      confidence: {
        label: "Modelled",
        note: "Demonstration modelled result with a measured-after chip on the line figure. Illustrative only; not a named customer plant.",
      },
    },
  },
};

export function detailFor(action: ExampleAction): ActionDetailExtra {
  const base = ACTION_DETAIL[action.id];
  const fallback: Omit<ActionDetailExtra, "assurance"> & { assurance?: ActionAssurance } = {
    steps: [action.action],
    risks: ["Illustrative demo only; a real plant validates each step against its quality system."],
  };
  const merged = base ?? fallback;
  return {
    steps: merged.steps,
    risks: merged.risks,
    trend: merged.trend,
    spc: merged.spc,
    linkedLots: merged.linkedLots,
    linkedRuns: merged.linkedRuns,
    similarCases: merged.similarCases,
    simulation: merged.simulation,
    loop: merged.loop,
    assurance: merged.assurance ?? defaultAssurance(action),
  };
}

export function actionIds() {
  return exampleActions.map((a) => ({ id: a.id }));
}

export function assertAction(id: string): ExampleAction {
  const a = getAction(id);
  if (!a) throw new Error(`Unknown action ${id}`);
  return a;
}

/** Actions already applied on the line: Running on its own, or Accepted and closed. */
export function actionIsApplied(a: ExampleAction) {
  return Boolean(a.closed) || a.who.how === "On its own, inside the signed band" || a.who.how === "Record only";
}

export function assuranceModeLabel(mode: AssuranceMode): string {
  switch (mode) {
    case "shadow":
      return "Shadow / read-only";
    case "recommend":
      return "Recommend only";
    case "plant-applied":
      return "Plant-applied inside signed band";
    case "record":
      return "Record only";
  }
}
