/** Machine health demo datasets - ported from stamped-energy-dashboard pagesData. */

export type HealthAssetStatus = "CRITICAL" | "WARNING" | "GOOD" | "OPTIMIZED";

export type HealthAsset = {
  name: string;
  type: string;
  section: string;
  health: number;
  load: number;
  vib: number;
  temp: number;
  rpm: number;
  current: number;
  runtime: number;
  mtbf: number;
  status: HealthAssetStatus;
  next: string;
};

export const HEALTH_ASSETS: HealthAsset[] = [
  { name: "Kiln 1", type: "Rotary Kiln", section: "Clinkerization", health: 58, load: 108, vib: 4.8, temp: 412, rpm: 3.2, current: 685, runtime: 7820, mtbf: 142, status: "CRITICAL", next: "Overdue 3d" },
  { name: "Kiln 2", type: "Rotary Kiln", section: "Clinkerization", health: 88, load: 91, vib: 2.1, temp: 388, rpm: 3.0, current: 612, runtime: 6410, mtbf: 320, status: "GOOD", next: "in 41d" },
  { name: "Raw Mill A", type: "Vertical Mill", section: "Raw Grinding", health: 71, load: 97, vib: 4.2, temp: 96, rpm: 742, current: 268, runtime: 5120, mtbf: 198, status: "WARNING", next: "in 6d" },
  { name: "Raw Mill B", type: "Vertical Mill", section: "Raw Grinding", health: 90, load: 88, vib: 1.8, temp: 88, rpm: 738, current: 244, runtime: 4980, mtbf: 410, status: "GOOD", next: "in 52d" },
  { name: "Cement Mill 1", type: "Ball Mill", section: "Grinding", health: 52, load: 112, vib: 5.6, temp: 104, rpm: 16.4, current: 572, runtime: 8210, mtbf: 96, status: "CRITICAL", next: "Overdue 1d" },
  { name: "Cement Mill 2", type: "Ball Mill", section: "Grinding", health: 86, load: 84, vib: 2.4, temp: 92, rpm: 16.1, current: 516, runtime: 5640, mtbf: 286, status: "GOOD", next: "in 33d" },
  { name: "Compressor A1", type: "Screw Compressor", section: "Utilities", health: 82, load: 79, vib: 2.0, temp: 74, rpm: 2960, current: 128, runtime: 3120, mtbf: 240, status: "GOOD", next: "in 28d" },
  { name: "Compressor A2", type: "Screw Compressor", section: "Utilities", health: 94, load: 71, vib: 1.4, temp: 68, rpm: 2880, current: 108, runtime: 2980, mtbf: 460, status: "OPTIMIZED", next: "in 60d" },
  { name: "Chiller Unit 1", type: "Centrifugal Chiller", section: "Utilities", health: 67, load: 96, vib: 3.1, temp: 12, rpm: 1480, current: 162, runtime: 4410, mtbf: 176, status: "WARNING", next: "in 9d" },
  { name: "Air Compressor", type: "Recip Compressor", section: "Utilities", health: 64, load: 99, vib: 3.6, temp: 81, rpm: 1180, current: 96, runtime: 6720, mtbf: 158, status: "WARNING", next: "in 4d" },
];

export const VIBRATION_TREND = Array.from({ length: 24 }, (_, i) => ({
  t: `${i}:00`,
  k1: +(3.2 + Math.sin(i / 3) * 0.8 + (i > 14 ? i * 0.08 : 0)).toFixed(2),
  cm1: +(3.6 + Math.cos(i / 4) * 0.7 + (i > 10 ? i * 0.1 : 0)).toFixed(2),
}));

export const TEMP_TREND = Array.from({ length: 24 }, (_, i) => ({
  t: `${i}:00`,
  kiln: Math.round(390 + Math.sin(i / 3.5) * 18 + (i > 16 ? i : 0)),
  bearing: Math.round(72 + Math.sin(i / 4) * 6 + (i > 18 ? (i - 18) * 2 : 0)),
}));

export const VIB_SPECTRUM = Array.from({ length: 32 }, (_, i) => {
  const freq = (i + 1) * 25;
  let amp = Math.exp(-i / 14) * 4;
  if (i === 6) amp += 3.4;
  if (i === 13) amp += 1.8;
  if (i === 20) amp += 2.6;
  return { freq: `${freq}`, amp: +amp.toFixed(2) };
});

export const MAINTENANCE_SCHEDULE = [
  { date: "11 Jul", machine: "Cement Mill 1", task: "Bearing replacement (DE side)", team: "Mech-A", priority: "CRITICAL" as const, duration: "6h" },
  { date: "12 Jul", machine: "Kiln 1", task: "Refractory inspection + load re-trim", team: "Process", priority: "CRITICAL" as const, duration: "8h" },
  { date: "14 Jul", machine: "Air Compressor", task: "Valve plate + filter service", team: "Utilities", priority: "WARNING" as const, duration: "3h" },
  { date: "17 Jul", machine: "Raw Mill A", task: "Gearbox vibration analysis", team: "Predictive", priority: "WARNING" as const, duration: "2h" },
  { date: "21 Jul", machine: "Chiller Unit 1", task: "Condenser tube cleaning (anti-fouling)", team: "Utilities", priority: "WARNING" as const, duration: "4h" },
  { date: "28 Jul", machine: "Cement Mill 2", task: "Routine lubrication + alignment", team: "Mech-B", priority: "ROUTINE" as const, duration: "2h" },
];

export const HEALTH_DISTRIBUTION = [
  { name: "Healthy (80-100)", value: 71, color: "#00666b" },
  { name: "Watch (60-79)", value: 28, color: "#c97a00" },
  { name: "At Risk (<60)", value: 16, color: "#ba1a1a" },
];

export const HEALTH_KPIS = {
  fleetHealth: 74,
  fleetHealthDelta: 2.3,
  atRisk: 16,
  atRiskDelta: -12,
  predictiveAlerts: 9,
  predictiveDelta: 4,
  avgMtbf: 248,
  mtbfDelta: 6.1,
  maintCompliance: 92,
  maintDelta: 3.4,
  unplannedDowntime: 1.8,
  downtimeDelta: -0.6,
};

export function healthColor(h: number): string {
  if (h >= 80) return "var(--forge-tertiary)";
  if (h >= 60) return "var(--forge-warning)";
  return "var(--forge-error)";
}

export function statusChipClass(s: string): string {
  return (
    {
      CRITICAL: "forge-chip--critical",
      WARNING: "forge-chip--warning",
      GOOD: "forge-chip--good",
      OPTIMIZED: "forge-chip--primary",
      ROUTINE: "forge-chip--good",
    }[s] ?? "forge-chip--info"
  );
}

export function priorityBarColor(s: string): string {
  return ({ CRITICAL: "var(--forge-error)", WARNING: "var(--forge-warning)", ROUTINE: "var(--forge-tertiary)" }[s] ?? "var(--forge-outline)");
}
