import type { Prescription } from "@/lib/types";
import {
  type ClassFacet,
  type InboxSection,
  type OutcomeFacet,
  type PrescriptionFacet,
  filterInbox,
  inboxSectionOf,
  neighborsInList,
} from "@/lib/prescriptions";

export type { ClassFacet, InboxSection, OutcomeFacet, PrescriptionFacet };
export { outcomeLabel as getOutcomeLabel } from "@/lib/prescriptions";

export function parseClassFacet(raw: string | null | undefined): ClassFacet {
  if (raw === "maintenance" || raw === "management") return raw;
  return "all";
}

export function parseOutcomeFacet(raw: string | null | undefined): OutcomeFacet {
  if (
    raw === "dynamic_production_planning" ||
    raw === "quality_yield" ||
    raw === "energy_waste" ||
    raw === "uptime"
  ) {
    return raw;
  }
  return "all";
}

export function parseInboxSection(
  raw: string | null | undefined,
  fallbackRx?: Prescription,
): InboxSection {
  if (raw === "needs_attention" || raw === "acknowledged") return raw;
  return fallbackRx ? inboxSectionOf(fallbackRx) : "needs_attention";
}

export function prescriptionDetailHref(
  id: string,
  section: InboxSection,
  facet: PrescriptionFacet,
): string {
  const q = new URLSearchParams({
    section,
  });
  if (
    facet === "maintenance" ||
    facet === "management"
  ) {
    q.set("class", facet);
  } else {
    q.set("outcome", facet);
  }
  return `/prescriptions/${id}?${q.toString()}`;
}

export function navForPrescription(
  rows: readonly Prescription[],
  currentId: string,
  section: InboxSection,
  facet: PrescriptionFacet,
  opts?: { includeDone?: boolean },
): {
  prevHref: string | null;
  nextHref: string | null;
  label: string;
  orderedIds: string[];
} {
  const ordered = filterInbox(rows, section, facet, opts);
  const orderedIds = ordered.map((r) => r.id);
  const { prevId, nextId, index, total } = neighborsInList(orderedIds, currentId);
  const label =
    index >= 0 && total > 0 ? `${index + 1} / ${total}` : `- / ${total}`;
  return {
    prevHref: prevId ? prescriptionDetailHref(prevId, section, facet) : null,
    nextHref: nextId ? prescriptionDetailHref(nextId, section, facet) : null,
    label,
    orderedIds,
  };
}
