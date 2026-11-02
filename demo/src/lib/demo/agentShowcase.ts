/**
 * Curated "Agent at work" showcase for plant visitors.
 * Caps: Working on now ≤3, Waiting on you ≤3, Tried on the model ≤3, Learned ≤4.
 * No campaign ids, loop chips, or ADR codes in visible copy.
 */
import type { EvidenceLabel } from "./types";
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

function ageFromAsked(askedAt: string): string {
  // askedAt is an ISO-like demo timestamp; show a short relative label from the fixture text pattern
  if (askedAt.includes("T")) {
    const h = askedAt.slice(11, 13);
    if (h) return `${Number(h) || 1} h ago`;
  }
  return "Earlier today";
}

function nowFromWork(
  items: { id: string; status: AgentNowStatus; lineId: string; title: string; step: string; waits?: string; href: string }[],
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
      href: w.href.startsWith("/quality/simulations") || w.href.includes("optimisation") || w.href.includes("loop=")
        ? w.status === "Onboarding"
          ? "/process/lines/line-b?tab=agent"
          : w.lineId === "line-a"
            ? "/quality/investigations"
            : "/process/proposals"
        : w.href,
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
    compared: "Three hold-pressure bands on Press P3 against scrap and cycle time",
    picked: "720 bar hold for the current resin lot",
    expectedBand: "0.4 to 0.8 pp less scrap",
    evidenceLabel: "Modelled",
    openHref: "/process/proposals",
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
    compared: "Jacket path during heat-up with and without a supervisory layer",
    picked: "Keep today's path; bring the layer to a signed trial later",
    expectedBand: "Energy per batch unchanged this week",
    evidenceLabel: "Modelled",
    openHref: "/process/proposals",
    engineeringHref: "/process/optimisation",
  },
];

const QUALITY_TRIED: AgentTriedStory[] = [
  {
    id: "try-q1",
    compared: "Borrowed part-weight band for Housing B-52 against 120 held-back parts",
    picked: "Keep the wide band until six mid-run lab results land",
    expectedBand: "Watch risk until the quality head approves",
    evidenceLabel: "Estimated",
    openHref: "/quality/lots",
    engineeringHref: "/quality/simulations",
  },
  {
    id: "try-q2",
    compared: "End-of-hold torque vs resin lot as the lead for lot 3307 drift",
    picked: "Sample early when torque rises; leave discharge timing alone",
    expectedBand: "Catch the lot before discharge",
    evidenceLabel: "Measured",
    openHref: "/quality/investigations",
  },
  {
    id: "try-q3",
    compared: "Lab viscosity for lot 3304 against its shorter batch hold",
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
    now: nowFromWork(nowSource),
    waiting,
    tried: (area === "quality" ? QUALITY_TRIED : PROCESS_TRIED).slice(0, CAP_TRIED),
    learned: learnedLines(area),
    seeAllActionsHref: area === "quality" ? "/quality" : "/process/actions",
    seeAllProposalsHref: area === "quality" ? "/quality/investigations" : "/process/proposals",
  };
}

export const AGENT_SHOWCASE_CAPS = { now: CAP_NOW, waiting: CAP_WAITING, tried: CAP_TRIED, learned: CAP_LEARNED } as const;

export const AGENT_AUTHORITY_LINE =
  "Stamped works inside limits set beforehand. Nothing is written until a named role accepts.";
