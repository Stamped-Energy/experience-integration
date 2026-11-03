/**
 * Curated "Agent at work" showcase for plant visitors.
 * Caps: Working on now ≤3, Waiting on you ≤3, Tried on the model ≤3, Learned ≤4.
 * No campaign ids, loop chips, or ADR codes in visible copy.
 */
import type { EvidenceLabel } from "./types";
import { DEMO_NOW } from "./data";
import { learned, qualityLearned, qualityWork, questions, workingOn } from "./agent";

export type AgentArea = "process" | "quality";

export type AgentNowStatus = "Investigating" | "Simulating" | "Waiting on you" | "Onboarding";

export interface AgentNowItem {
  id: string;
  status: AgentNowStatus;
  lineId: string;
  title: string;
  nextStep: string;
  href: string;
}

export interface AgentWaitingItem {
  id: string;
  decision: string;
  whoDecides: string;
  ageLabel: string;
  href: string;
}

export interface AgentTriedStory {
  id: string;
  compared: string;
  picked: string;
  expectedBand: string;
  evidenceLabel: EvidenceLabel;
  openHref: string;
  engineeringHref?: string;
}

export interface AgentLearnedItem {
  id: string;
  text: string;
}

export interface AgentShowcaseBundle {
  area: AgentArea;
  now: AgentNowItem[];
  waiting: AgentWaitingItem[];
  tried: AgentTriedStory[];
  learned: AgentLearnedItem[];
  seeAllActionsHref: string;
  seeAllProposalsHref: string;
}

const CAP_NOW = 3;
const CAP_WAITING = 3;
const CAP_TRIED = 3;
const CAP_LEARNED = 4;

const WHO: Record<string, string> = {
  operator: "Operator",
  "shift-lead": "Shift lead",
  "process-engineer": "Process engineer",
  "quality-head": "Quality head",
  "plant-head": "Plant head",
};

/** Relative age against the fixed demo clock, so the label never depends on the viewer's time of day. */
function ageFromAsked(askedAt: string): string {
  const minutes = Math.round((Date.parse(DEMO_NOW) - Date.parse(askedAt)) / 60_000);
  if (Number.isNaN(minutes) || minutes < 0) return "Earlier today";
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Engineering links (twin, optimisation loops) are swapped for plant-facing pages that exist in the same area. */
function visitorHref(w: { status: AgentNowStatus; href: string }, area: AgentArea): string {
  const isEngineeringLink = w.href.startsWith("/quality/simulations") || w.href.includes("optimisation") || w.href.includes("loop=");
  if (!isEngineeringLink) return w.href;
  if (w.status === "Onboarding") return "/process/lines/line-b?tab=agent";
  return area === "quality" ? "/quality/investigations" : "/process/proposals";
}

function nowFromWork(
  items: { id: string; status: AgentNowStatus; lineId: string; title: string; step: string; waits?: string; href: string }[],
  area: AgentArea,
): AgentNowItem[] {
  return items
    .filter((w) => w.status !== "Waiting on you")
    .slice(0, CAP_NOW)
    .map((w) => ({
      id: w.id,
      status: w.status,
      lineId: w.lineId,
      title: w.title,
      nextStep: w.waits ? `${w.step} · waits on ${w.waits}` : w.step,
      href: visitorHref(w, area),
    }));
}

function waitingFromQuestions(area: AgentArea): AgentWaitingItem[] {
  const open = questions.filter((q) => !q.answered);
  const filtered =
    area === "quality"
      ? open.filter((q) => ["Data discrepancy", "Unlinked lot", "Lab sample"].includes(q.type))
      : open.filter((q) => !["Data discrepancy", "Unlinked lot", "Lab sample"].includes(q.type) || q.type === "Sensor looks wrong");
  return filtered.slice(0, CAP_WAITING).map((q) => ({
    id: q.id,
    decision: q.title,
    whoDecides: WHO[q.routedTo] ?? "Named role",
    ageLabel: ageFromAsked(q.askedAt),
    href: q.waits.href.startsWith("/inbox") ? q.waits.href : "/inbox?tab=questions",
  }));
}

/** Hand-mapped story outcomes from loop/optimisation work. Plant language only. */
const PROCESS_TRIED: AgentTriedStory[] = [
  {
    id: "try-p1",
    compared: "Three billet exit targets on heater H1 against overheating scrap and heats per 100 parts",
    picked: "1205 °C on alternate shift runs, inside the signed trial",
    expectedBand: "overheating scrap 0.7 to 1.1%",
    evidenceLabel: "Modelled",
    openHref: "/process/trials/trial-1",
    engineeringHref: "/process/optimisation",
  },
  {
    id: "try-p2",
    compared: "Cycle time 33.2 s vs today's 33.6 s on Tool T3",
    picked: "Shorter cool with the same fill window",
    expectedBand: "2.1 to 3.0% more parts",
    evidenceLabel: "Measured",
    openHref: "/process/trials",
    engineeringHref: "/process/simulations",
  },
  {
    id: "try-p3",
    compared: "Full melt power against a holding level while mould line ML1 is stopped",
    picked: "Holding level, back to full power ahead of the next pour",
    expectedBand: "melt energy per tonne 574 kWh",
    evidenceLabel: "Modelled",
    openHref: "/process/actions/ex-p4",
    engineeringHref: "/process/optimisation",
  },
];

const QUALITY_TRIED: AgentTriedStory[] = [
  {
    id: "try-q1",
    compared: "Holding the next basket against cooling the oil to 67 °C on quench tank Q1",
    picked: "Hold the next basket until the oil is under 72 °C; a person decides",
    expectedBand: "baskets in spec 97%",
    evidenceLabel: "Estimated",
    openHref: "/quality/actions/ex-q1",
    engineeringHref: "/quality/simulations",
  },
  {
    id: "try-q2",
    compared: "Billet exit temperature against bar heat as the lead for lot 3307 decarb drift",
    picked: "Cut a decarb section early when coil power rises; leave inspection timing alone",
    expectedBand: "Catch the lot before it leaves the line",
    evidenceLabel: "Measured",
    openHref: "/quality/investigations",
  },
  {
    id: "try-q3",
    compared: "Lab decarb depth for lot 3304 against its hotter shift run",
    picked: "Waiting on which record to trust before redrawing the band",
    expectedBand: "Lots 3307 and 3308 stay Estimated",
    evidenceLabel: "Assumed",
    openHref: "/inbox?tab=questions",
  },
];

function learnedLines(area: AgentArea): AgentLearnedItem[] {
  const src = area === "quality" ? qualityLearned : learned;
  return src.slice(0, CAP_LEARNED).map((l) => ({ id: l.id, text: l.text }));
}

export function agentShowcase(area: AgentArea): AgentShowcaseBundle {
  const nowSource = area === "quality" ? qualityWork : workingOn;
  const waitingExtra =
    area === "process"
      ? workingOn
          .filter((w) => w.status === "Waiting on you")
          .slice(0, 1)
          .map((w) => ({
            id: w.id,
            decision: w.title,
            whoDecides: w.waits ?? "Shift lead",
            ageLabel: "Open now",
            href: w.href.includes("inbox") ? w.href : "/inbox?tab=questions",
          }))
      : qualityWork
          .filter((w) => w.status === "Waiting on you")
          .slice(0, 1)
          .map((w) => ({
            id: w.id,
            decision: w.title,
            whoDecides: w.waits ?? "Quality head",
            ageLabel: "Open now",
            href: w.href.includes("inbox") ? w.href : "/inbox?tab=questions",
          }));

  const fromQuestions = waitingFromQuestions(area);
  const waiting = [...waitingExtra, ...fromQuestions]
    .filter((item, i, arr) => arr.findIndex((x) => x.id === item.id || x.decision === item.decision) === i)
    .slice(0, CAP_WAITING);

  return {
    area,
    now: nowFromWork(nowSource, area),
    waiting,
    tried: (area === "quality" ? QUALITY_TRIED : PROCESS_TRIED).slice(0, CAP_TRIED),
    learned: learnedLines(area),
    seeAllActionsHref: area === "quality" ? "/quality/actions" : "/process/actions",
    seeAllProposalsHref: area === "quality" ? "/quality/investigations" : "/process/proposals",
  };
}

export const AGENT_SHOWCASE_CAPS = { now: CAP_NOW, waiting: CAP_WAITING, tried: CAP_TRIED, learned: CAP_LEARNED } as const;

export const AGENT_AUTHORITY_LINE =
  "Stamped works inside limits set beforehand. Nothing is written until a named role accepts.";
