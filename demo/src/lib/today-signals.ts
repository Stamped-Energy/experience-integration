import type { Role, TodaySignal } from "@/lib/types";
import { canAccessRoute } from "@/lib/navigation";

/** Hard charter cap - Today is a decision strip, not a dashboard. */
export const TODAY_SIGNAL_CAP = 7;

/** Phone Overview: triage essentials only (≤899px). */
export const MOBILE_ESSENTIAL_SIGNAL_IDS = ["alarms", "rx", "savings"] as const;

/** Keep role order but drop non-essential signals for narrow viewports. */
export function filterMobileEssentialSignals(
  signals: readonly TodaySignal[],
): TodaySignal[] {
  const allow = new Set<string>(MOBILE_ESSENTIAL_SIGNAL_IDS);
  return signals.filter((s) => allow.has(s.id));
}

/**
 * Role priority for signal ids - first match wins until cap.
 * Signals whose href route the role cannot access are dropped.
 */
const ROLE_SIGNAL_ORDER: Record<Role, readonly string[]> = {
  operator: ["alarms", "rx", "stale", "deviation", "closure"],
  supervisor: ["rx", "alarms", "closure", "deviation", "stale", "savings"],
  plant_head: ["savings", "closure", "alarms", "rx", "md", "deviation", "stale"],
  energy_manager: ["md", "deviation", "closure", "alarms", "rx", "savings", "stale"],
  sustainability: ["savings", "closure", "deviation", "stale"],
  cfo: ["savings", "closure", "rx"],
  admin: ["alarms", "rx", "savings", "closure", "deviation", "stale"],
};

function hrefPermission(href: string): string | null {
  if (href.startsWith("/alarms")) return "route:alarms";
  if (href.startsWith("/prescriptions")) return "route:prescriptions";
  if (href.startsWith("/evidence")) return "route:evidence";
  if (href.startsWith("/reports")) return "route:reports";
  if (href.startsWith("/energy")) return "route:energy";
  if (href.startsWith("/intensity")) return "route:intensity";
  if (href === "/" || href.startsWith("/?")) return "route:today";
  return null;
}

export function selectTodaySignals(
  role: Role,
  catalog: readonly TodaySignal[],
  cap = TODAY_SIGNAL_CAP,
): TodaySignal[] {
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const ordered: TodaySignal[] = [];
  for (const id of ROLE_SIGNAL_ORDER[role] ?? []) {
    const signal = byId.get(id);
    if (!signal) continue;
    const perm = hrefPermission(signal.href);
    if (perm && !canAccessRoute(role, perm)) continue;
    ordered.push(signal);
    if (ordered.length >= cap) return ordered;
  }
  // Fill remaining from catalog order if under cap
  for (const signal of catalog) {
    if (ordered.some((s) => s.id === signal.id)) continue;
    const perm = hrefPermission(signal.href);
    if (perm && !canAccessRoute(role, perm)) continue;
    ordered.push(signal);
    if (ordered.length >= cap) break;
  }
  return ordered.slice(0, cap);
}
