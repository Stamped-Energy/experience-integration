import type { DataSource } from "@/lib/bff";
import type { UpstreamProbe } from "@/lib/bff";

/** User-facing labels — no internal layer names (L2/L5/L6, BFF, fixture). */
export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  fixture: "Preview mode",
  l2: "Live plant data",
  l5: "Live operations",
  preview: "Preview · not connected to plant",
  unavailable: "Data unavailable",
};

export function connectionPillLabel(probe: UpstreamProbe | null): string {
  if (!probe) return "Checking connection…";
  if (probe.demoMode) return "Live plant connected";
  const live: string[] = [];
  if (probe.l2 === "live") live.push("telemetry");
  if (probe.l5 === "live") live.push("operations");
  if (probe.l4 === "live") live.push("analyst");
  if (live.length === 0) return "Offline preview";
  if (live.length === 1) return `Live ${live[0]}`;
  return "Live plant connected";
}
