import type { Prescription, PrescriptionFeedback } from "@/lib/types";

const STORAGE_KEY = "stamped.l6.rxFeedback.v1";

type FeedbackMap = Record<string, PrescriptionFeedback>;

function readMap(): FeedbackMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FeedbackMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: FeedbackMap): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota / private mode - ignore
  }
}

export function loadRxFeedback(id: string): PrescriptionFeedback | undefined {
  return readMap()[id];
}

export function saveRxFeedback(id: string, feedback: PrescriptionFeedback): void {
  const map = readMap();
  map[id] = feedback;
  writeMap(map);
}

/** Merge session-stored feedback onto fixture/live rows (client-only). */
export function hydrateRxFeedback(rows: readonly Prescription[]): Prescription[] {
  const map = readMap();
  if (Object.keys(map).length === 0) return [...rows];
  return rows.map((r) => (map[r.id] ? { ...r, feedback: map[r.id] } : { ...r }));
}
