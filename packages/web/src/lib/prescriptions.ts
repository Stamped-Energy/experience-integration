import type {
  Prescription,
  PrescriptionFeedback,
  PrescriptionLane,
} from "@/lib/types";

export type RxAction = "assign" | "ack" | "defer" | "reject" | "done";

/** Client inbox sections - maps backend lanes without inventing a second product. */
export type InboxSection = "needs_attention" | "acknowledged";

/** Optional facet over decision_class. */
export type ClassFacet = "all" | "maintenance" | "management";

export function sortPrescriptions(rows: readonly Prescription[]): Prescription[] {
  return [...rows].sort((a, b) => {
    const score =
      b.impactInrPerMonth * b.confidence - a.impactInrPerMonth * a.confidence;
    if (score !== 0) return score;
    return Date.parse(a.dueAt) - Date.parse(b.dueAt);
  });
}

export function requiresReason(action: RxAction): boolean {
  return action === "defer" || action === "reject";
}

export function applyRxAction(
  rx: Prescription,
  action: RxAction,
): Prescription {
  switch (action) {
    case "assign":
    case "ack":
      return { ...rx, lane: "active" };
    case "defer":
      return { ...rx, lane: "closed" };
    case "reject":
      return { ...rx, lane: "closed" };
    case "done":
      return { ...rx, lane: "verifying", verificationStatus: "pending" };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Optimistic update with rollback snapshot. */
export function optimisticRxUpdate(
  rows: readonly Prescription[],
  id: string,
  action: RxAction,
): { next: Prescription[]; rollback: Prescription[] } {
  const rollback = rows.map((r) => ({ ...r }));
  const next = rows.map((r) => (r.id === id ? applyRxAction(r, action) : r));
  return { next, rollback };
}

export function filterLane(
  rows: readonly Prescription[],
  lane: PrescriptionLane,
): Prescription[] {
  return sortPrescriptions(rows.filter((r) => r.lane === lane));
}

export function inboxSectionOf(rx: Prescription): InboxSection {
  return rx.lane === "needs_review" ? "needs_attention" : "acknowledged";
}

export function isManagementClass(rx: Prescription): boolean {
  return Boolean(rx.decisionClass?.startsWith("mgmt_"));
}

export function classLabel(rx: Prescription): "Management" | "Maintenance" {
  return isManagementClass(rx) ? "Management" : "Maintenance";
}

export function matchesClassFacet(rx: Prescription, facet: ClassFacet): boolean {
  if (facet === "all") return true;
  if (facet === "management") return isManagementClass(rx);
  return !isManagementClass(rx);
}

/**
 * Needs attention = needs_review.
 * Acknowledged = active + verifying; closed only when includeDone.
 */
export function filterInbox(
  rows: readonly Prescription[],
  section: InboxSection,
  facet: ClassFacet = "all",
  opts?: { includeDone?: boolean },
): Prescription[] {
  const includeDone = opts?.includeDone ?? false;
  return sortPrescriptions(
    rows.filter((r) => {
      if (!matchesClassFacet(r, facet)) return false;
      if (section === "needs_attention") return r.lane === "needs_review";
      if (r.lane === "active" || r.lane === "verifying") return true;
      return includeDone && r.lane === "closed";
    }),
  );
}

export function applyRxFeedback(
  rx: Prescription,
  feedback: PrescriptionFeedback,
): Prescription {
  return { ...rx, feedback };
}

export function optimisticRxFeedback(
  rows: readonly Prescription[],
  id: string,
  feedback: PrescriptionFeedback,
): { next: Prescription[]; rollback: Prescription[] } {
  const rollback = rows.map((r) => ({ ...r }));
  const next = rows.map((r) => (r.id === id ? applyRxFeedback(r, feedback) : r));
  return { next, rollback };
}

export function neighborsInList(
  orderedIds: readonly string[],
  currentId: string,
): { prevId: string | null; nextId: string | null; index: number; total: number } {
  const index = orderedIds.indexOf(currentId);
  if (index < 0) {
    return { prevId: null, nextId: null, index: -1, total: orderedIds.length };
  }
  return {
    prevId: index > 0 ? orderedIds[index - 1]! : null,
    nextId: index < orderedIds.length - 1 ? orderedIds[index + 1]! : null,
    index,
    total: orderedIds.length,
  };
}

/** L3 waste category labels for pillar badges. */
export const WASTE_CATEGORY_LABELS: Record<number, string> = {
  1: "MD & power quality",
  2: "Process heat",
  3: "Idle load",
  4: "Compressed air",
  5: "HVAC",
  6: "Source mix",
};

export function pillarBadges(rx: Prescription): string[] {
  const badges: string[] = [];
  if (rx.valueDomain === "energy_efficiency") badges.push("Load & energy");
  else if (rx.valueDomain === "equipment_health") badges.push("Equipment health");
  if (rx.wasteCategory && WASTE_CATEGORY_LABELS[rx.wasteCategory]) {
    badges.push(WASTE_CATEGORY_LABELS[rx.wasteCategory]!);
  }
  return badges;
}

/** Parse wire evidence refs into flip-back table rows. */
export function evidenceRowsFromRefs(
  refs: readonly string[] | undefined,
): Array<{ tag: string; value: string; window: string }> {
  if (!refs?.length) return [];
  return refs.map((ref) => {
    const colon = ref.indexOf(":");
    if (colon <= 0) return { tag: ref, value: "—", window: "—" };
    const kind = ref.slice(0, colon);
    const rest = ref.slice(colon + 1);
    const q = rest.indexOf("?");
    if (q >= 0) {
      return { tag: rest.slice(0, q), value: kind, window: rest.slice(q + 1) };
    }
    return { tag: kind, value: rest, window: "—" };
  });
}
