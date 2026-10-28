/**
 * Example cycle-time breakdown. Shape mirrors stamped_process.control.cycle_time
 * (#125, on main). Shares sum to 1.0; no OEE target is invented. Live breakdown
 * waits on a read tool that feeds machine state samples into that library.
 */

export type CycleState =
  | "cutting"
  | "idle"
  | "setup"
  | "blocked"
  | "starved"
  | "alarm"
  | "unknown";

export const CYCLE_STATE_LABEL: Record<CycleState, string> = {
  cutting: "Cutting",
  idle: "Idle",
  setup: "Setup",
  blocked: "Blocked",
  starved: "Starved",
  alarm: "Alarm",
  unknown: "Unknown",
};

export const CYCLE_STATES: CycleState[] = [
  "cutting",
  "idle",
  "setup",
  "blocked",
  "starved",
  "alarm",
  "unknown",
];

export interface CycleBreakdown {
  kind: "breakdown";
  window_s: number;
  dwell_s: Record<CycleState, number>;
  share: Record<CycleState, number>;
  sample_count: number;
}

export interface CycleBreakdownAbstention {
  kind: "abstain";
  reason: string;
  detail: string;
}

export type CycleBreakdownResult = CycleBreakdown | CycleBreakdownAbstention;

export interface CycleBreakdownCard {
  asset_id: string;
  station: string;
  window_label: string;
  result: CycleBreakdownResult;
  depends_on: string;
}

export const CYCLE_TIME_PAGE_META =
  "Cycle-time dwell and share · Shares sum to 1.0 · Live get_cycle_time_breakdown when session connected (caller-supplied samples until store)";

function shares(dwell: Record<CycleState, number>): CycleBreakdown {
  const window_s = Object.values(dwell).reduce((a, b) => a + b, 0);
  const share = {} as Record<CycleState, number>;
  for (const s of CYCLE_STATES) {
    share[s] = window_s > 0 ? dwell[s] / window_s : 0;
  }
  const sample_count = 48;
  return { kind: "breakdown", window_s, dwell_s: dwell, share, sample_count };
}

const zero = (): Record<CycleState, number> =>
  Object.fromEntries(CYCLE_STATES.map((s) => [s, 0])) as Record<CycleState, number>;

export const cycleBreakdownCards: CycleBreakdownCard[] = [
  {
    asset_id: "asset-cnc-1",
    station: "CNC 1",
    window_label: "Last 4 h (illustrative)",
    depends_on: "cycle-time read tool · #125 library on main",
    result: shares({
      ...zero(),
      cutting: 9600,
      idle: 1800,
      setup: 1200,
      blocked: 600,
      starved: 400,
      alarm: 200,
      unknown: 200,
    }),
  },
  {
    asset_id: "asset-vmc-2",
    station: "VMC 2",
    window_label: "Last shift (illustrative)",
    depends_on: "cycle-time read tool · #125 library on main",
    result: shares({
      ...zero(),
      cutting: 18000,
      idle: 2400,
      setup: 3600,
      blocked: 900,
      starved: 0,
      alarm: 0,
      unknown: 300,
    }),
  },
  {
    asset_id: "asset-cnc-3",
    station: "CNC 3",
    window_label: "Insufficient samples",
    depends_on: "cycle-time read tool · #125 library on main",
    result: {
      kind: "abstain",
      reason: "insufficient_samples",
      detail: "need at least two state samples to form a window",
    },
  },
];

export const listCycleBreakdowns = () => cycleBreakdownCards;

export function formatSeconds(s: number): string {
  if (s < 60) return `${s.toFixed(0)} s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} min`;
  return `${(s / 3600).toFixed(2)} h`;
}

export function formatShare(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}
