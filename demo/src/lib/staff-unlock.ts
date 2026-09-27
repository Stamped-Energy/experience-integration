/**
 * Staff-only plant-tools unlock — sessionStorage + idle / navigation lock.
 * Not a security boundary; keeps client UX single-plant while demos switch plants.
 */

export const STAFF_PLANT_PASSWORD = "Stamped123";
export const STAFF_UNLOCK_KEY = "l6.staffToolsUnlocked";
export const STAFF_UNLOCK_AT_KEY = "l6.staffToolsUnlockedAt";
/** Auto-lock after this many ms with no re-unlock / activity on the admin tools. */
export const STAFF_IDLE_LOCK_MS = 30_000;

export function isStaffUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(STAFF_UNLOCK_KEY) !== "1") return false;
    const at = Number(window.sessionStorage.getItem(STAFF_UNLOCK_AT_KEY) ?? "0");
    if (!Number.isFinite(at) || at <= 0) return false;
    if (Date.now() - at > STAFF_IDLE_LOCK_MS) {
      lockStaffTools();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function unlockStaffTools(): void {
  if (typeof window === "undefined") return;
  try {
    const now = String(Date.now());
    window.sessionStorage.setItem(STAFF_UNLOCK_KEY, "1");
    window.sessionStorage.setItem(STAFF_UNLOCK_AT_KEY, now);
  } catch {
    /* ignore */
  }
}

/** Refresh idle timer while staff tools stay open on Admin. */
export function touchStaffUnlock(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(STAFF_UNLOCK_KEY) !== "1") return;
    window.sessionStorage.setItem(STAFF_UNLOCK_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function lockStaffTools(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STAFF_UNLOCK_KEY);
    window.sessionStorage.removeItem(STAFF_UNLOCK_AT_KEY);
  } catch {
    /* ignore */
  }
}
