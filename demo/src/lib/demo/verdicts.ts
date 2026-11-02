/** Plain-language verdict helpers for plant-facing numbers. */

export function oeePartVerdict(value: number, target = 0.85): { word: string; tone: "success" | "warning" | "critical" } {
  if (value >= target) return { word: "On target", tone: "success" };
  if (value >= target - 0.1) return { word: "Below target", tone: "warning" };
  return { word: "Well below", tone: "critical" };
}

export function gaugeRrVerdict(grrPct: number, ndc: number): { word: string; tone: "success" | "warning" | "critical" } {
  if (grrPct < 10 && ndc >= 5) return { word: "Fit for decisions", tone: "success" };
  if (grrPct <= 30 && ndc >= 5) return { word: "Fit with care", tone: "warning" };
  return { word: "Not fit for decisions", tone: "critical" };
}

const SUPPLIER_PPM_TARGET = 1000;

export function supplierPpmVerdict(ppm: number): { word: string; tone: "success" | "warning" | "critical"; target: number } {
  if (ppm <= SUPPLIER_PPM_TARGET) return { word: "Inside target", tone: "success", target: SUPPLIER_PPM_TARGET };
  if (ppm <= SUPPLIER_PPM_TARGET * 3) return { word: "Above target", tone: "warning", target: SUPPLIER_PPM_TARGET };
  return { word: "Far above target", tone: "critical", target: SUPPLIER_PPM_TARGET };
}
