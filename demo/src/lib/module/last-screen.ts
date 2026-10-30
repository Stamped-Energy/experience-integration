/** Remember last path per deep module (ADR-042 U2). */
import type { ModuleId } from "./types";

const KEY: Record<ModuleId, string> = {
  process: "stamped-last-process",
  quality: "stamped-last-quality",
};

export function saveLastScreen(module: ModuleId, path: string) {
  if (!path.startsWith(`/${module}`)) return;
  try {
    localStorage.setItem(KEY[module], path);
  } catch {
    /* private mode */
  }
}

export function lastScreenHref(module: ModuleId, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(KEY[module]);
    if (saved?.startsWith(`/${module}`)) return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function moduleFromPath(path: string): ModuleId | null {
  if (path === "/process" || path.startsWith("/process/")) return "process";
  if (path === "/quality" || path.startsWith("/quality/")) return "quality";
  return null;
}
