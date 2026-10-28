/**
 * Example machining tool-life cards. Shape mirrors stamped_process.control.tool_life
 * (Taylor V * T^n = C, recommend only). Coefficients are never invented: open
 * n/C abstain. Live list waits on a read tool wrapping #124.
 */

export type ToolLifeAbstainReason =
  | "open_taylor_exponent"
  | "open_taylor_constant"
  | "open_cutting_speed"
  | "non_positive_input"
  | "open_remaining_threshold"
  | "missing_life_used";

export interface ToolLifeEstimate {
  kind: "estimate";
  predicted_life: number;
  life_used: number;
  remaining: number;
  remaining_fraction: number | null;
  recommend_change: boolean;
  reason: string;
  basis: "taylor" | "life_limit";
}

export interface ToolLifeAbstention {
  kind: "abstain";
  reason: ToolLifeAbstainReason;
  detail: string;
}

export type ToolLifeResult = ToolLifeEstimate | ToolLifeAbstention;

export interface ToolCard {
  tool_id: string;
  asset_id: string;
  station: string;
  tool_name: string;
  /** Fitted Taylor n; null means open. */
  taylor_n: number | null;
  /** Fitted Taylor C; null means open. */
  taylor_c: number | null;
  cutting_speed: number | null;
  life_used: number | null;
  life_limit: number | null;
  remaining_threshold: number | null;
  result: ToolLifeResult;
}

export const TOOL_LIFE_PAGE_META =
  "Taylor or CNC remaining life · Recommend only · Live get_tool_life_estimate when session connected (caller-supplied inputs until store)";

/** Pure estimate matching the Process helper rules (for demo + unit tests). */
export function estimateRemaining(input: {
  cutting_speed: number | null;
  taylor_n: number | null;
  taylor_c: number | null;
  life_used: number | null;
  remaining_threshold: number | null;
  life_limit: number | null;
}): ToolLifeResult {
  const { cutting_speed, taylor_n, taylor_c, life_used, remaining_threshold, life_limit } = input;
  if (life_used == null) {
    return { kind: "abstain", reason: "missing_life_used", detail: "life_used is required" };
  }
  if (life_used < 0) {
    return { kind: "abstain", reason: "non_positive_input", detail: "life_used must be >= 0" };
  }

  let predicted: number | null = null;
  const paramsOpen = taylor_n == null || taylor_c == null;
  if (!paramsOpen && cutting_speed != null) {
    if (taylor_n! <= 0 || taylor_c! <= 0 || cutting_speed <= 0) {
      return { kind: "abstain", reason: "non_positive_input", detail: "n, C and cutting speed must be positive" };
    }
    predicted = (taylor_c! / cutting_speed) ** (1.0 / taylor_n!);
  } else if (paramsOpen && cutting_speed != null) {
    return {
      kind: "abstain",
      reason: "open_taylor_exponent",
      detail: "Taylor n and C are open; fit them before using cutting speed",
    };
  } else if (!paramsOpen && cutting_speed == null) {
    return { kind: "abstain", reason: "open_cutting_speed", detail: "cutting speed is open" };
  }

  const basis = predicted ?? life_limit;
  if (basis == null) {
    return {
      kind: "abstain",
      reason: "open_taylor_constant",
      detail: "neither Taylor C/n nor life_limit is set",
    };
  }

  const remaining = basis - life_used;
  const fraction = basis > 0 ? remaining / basis : null;
  if (remaining_threshold == null) {
    return {
      kind: "estimate",
      predicted_life: basis,
      life_used,
      remaining,
      remaining_fraction: fraction,
      recommend_change: false,
      reason: "remaining_threshold open; estimate only, no change recommendation",
      basis: predicted != null ? "taylor" : "life_limit",
    };
  }
  const recommend = remaining <= remaining_threshold;
  return {
    kind: "estimate",
    predicted_life: basis,
    life_used,
    remaining,
    remaining_fraction: fraction,
    recommend_change: recommend,
    reason: recommend
      ? "remaining life at or below remaining_threshold; recommend tool change"
      : "remaining life above remaining_threshold; no change recommended",
    basis: predicted != null ? "taylor" : "life_limit",
  };
}

function card(
  partial: Omit<ToolCard, "result"> & { result?: ToolLifeResult },
): ToolCard {
  const result =
    partial.result ??
    estimateRemaining({
      cutting_speed: partial.cutting_speed,
      taylor_n: partial.taylor_n,
      taylor_c: partial.taylor_c,
      life_used: partial.life_used,
      remaining_threshold: partial.remaining_threshold,
      life_limit: partial.life_limit,
    });
  return { ...partial, result };
}

/** Example tools: one recommend-change, one ok, one abstain (open coefficients). */
export const toolCards: ToolCard[] = [
  card({
    tool_id: "tool-endmill-12",
    asset_id: "asset-cnc-1",
    station: "CNC 1 · finish pocket",
    tool_name: "12 mm carbide end mill",
    taylor_n: 0.25,
    taylor_c: 280,
    cutting_speed: 120,
    life_used: 38,
    life_limit: null,
    remaining_threshold: 10,
  }),
  card({
    tool_id: "tool-drill-8",
    asset_id: "asset-cnc-1",
    station: "CNC 1 · pilot drill",
    tool_name: "8 mm HSS drill",
    taylor_n: null,
    taylor_c: null,
    cutting_speed: null,
    life_used: 420,
    life_limit: 800,
    remaining_threshold: 80,
  }),
  card({
    tool_id: "tool-insert-r0",
    asset_id: "asset-vmc-2",
    station: "VMC 2 · face mill",
    tool_name: "Face-mill insert set",
    taylor_n: null,
    taylor_c: null,
    cutting_speed: 180,
    life_used: 12,
    life_limit: null,
    remaining_threshold: 5,
  }),
];

export const listToolCards = () => toolCards;
export const getToolCard = (id: string) => toolCards.find((t) => t.tool_id === id);
