/** Rich overview demo datasets - ported from stamped-energy-dashboard, aligned with Jaipur Works. */

export const OVERVIEW_TARIFF = 6.32;

const MONTH = "Jul";

function buildTrend30d() {
  const seed = [
    0, -0.3, 0.5, 0.8, 0.2, -0.5, -1.2, -2.4, -2.1, -1.8, -2.0, -1.6, -2.2,
    1.5, 0.4, -1.0, -1.4, -1.9, -3.2, -2.8, -2.5, -3.0, -4.6, -2.2, -1.5,
    -2.0, -2.4, -2.8, -3.1, -3.4,
  ];
  const rows = [];
  for (let i = 0; i < 30; i++) {
    const day = i + 1;
    const baseBaseline = 10200 + i * 38;
    const baseline = Math.round(baseBaseline + Math.sin(i / 2.3) * 320);
    const reductionPct = 6 + seed[i]! * 1.4 + Math.sin(i / 3.1) * 1.1;
    const actual = Math.round(baseline * (1 - reductionPct / 100));
    const savedKwh = baseline - actual;
    rows.push({
      day,
      date: `${MONTH} ${day}`,
      actual,
      baseline,
      savedKwh,
      savings: Math.round(savedKwh * OVERVIEW_TARIFF),
      co2Actual: +(actual * 0.00071).toFixed(2),
      co2Baseline: +(baseline * 0.00071).toFixed(2),
      costActual: Math.round(actual * OVERVIEW_TARIFF),
      costBaseline: Math.round(baseline * OVERVIEW_TARIFF),
    });
  }
  return rows;
}

export const OVERVIEW_TREND_30D = buildTrend30d();

export const OVERVIEW_TREND_STATS = {
  avgDailySaving: "₹32,467",
  peakExcess: "Jul 14 (+12.4%)",
  bestDay: "Jul 22 (−18.1%)",
};

export const OVERVIEW_CHART_ANNOTATIONS = [
  { day: 7, label: "Compressor stagger optimization applied" },
  { day: 18, label: "Chiller scheduling updated" },
];

export const OVERVIEW_TODAY_DAY = 21;

export const OVERVIEW_KPIS = {
  savings: {
    value: 974_000,
    trendPct: 18.4,
    note: "Confirmed by operations",
  },
  energy: {
    value: 1_200_000,
    lastMonth: 1_312_000,
    reductionPct: 8.5,
  },
  score: { value: 84, benchmark: 61, grade: "A" },
  anomalies: {
    total: 7,
    critical: 3,
    warning: 2,
    info: 2,
    lastTriggered: "4 min ago",
  },
  carbon: { value: 852, delta: -74, gridFactor: 0.71 },
};

export type MachineStatus =
  | "CRITICAL"
  | "WARNING"
  | "GOOD"
  | "OPTIMIZED"
  | "OFFLINE"
  | "INFO";

export type OverviewMachine = {
  name: string;
  status: MachineStatus;
  load: number;
  kwh: number | null;
  reason: string;
};

export const OVERVIEW_MACHINES: OverviewMachine[] = [
  { name: "Kiln 1", status: "CRITICAL", load: 108, kwh: 4820, reason: "Specific energy 12.4% above target; MD coincidence risk." },
  { name: "Kiln 2", status: "GOOD", load: 91, kwh: 4210, reason: "Operating within design spec." },
  { name: "Raw Mill A", status: "WARNING", load: 97, kwh: 1840, reason: "Bearing vibration anomaly (Z-axis 4.2mm/s)." },
  { name: "Raw Mill 2", status: "GOOD", load: 72, kwh: 1690, reason: "Nominal." },
  { name: "Cement Mill 1", status: "CRITICAL", load: 112, kwh: 3940, reason: "Overload sustained >35 min. PF 0.84." },
  { name: "Cement Mill 2", status: "GOOD", load: 84, kwh: 3560, reason: "Nominal." },
  { name: "Compressor 1", status: "GOOD", load: 79, kwh: 890, reason: "Nominal." },
  { name: "Compressor 2", status: "OPTIMIZED", load: 54, kwh: 740, reason: "AI load reduction applied, saving ₹1,800/day." },
  { name: "Chiller Unit 1", status: "WARNING", load: 96, kwh: 1120, reason: "COP dropped 4.1 → 3.3, possible fouling." },
  { name: "Chiller Unit 2", status: "GOOD", load: 82, kwh: 980, reason: "Nominal." },
  { name: "Conveyor B1", status: "INFO", load: 93, kwh: 210, reason: "Idle draw detected during break window." },
  { name: "Conveyor B2", status: "GOOD", load: 88, kwh: 195, reason: "Nominal." },
  { name: "Packing Line 1", status: "GOOD", load: 41, kwh: 460, reason: "Nominal." },
  { name: "Packing Line 2", status: "OFFLINE", load: 0, kwh: 0, reason: "Planned maintenance window active." },
  { name: "HV Transformer", status: "GOOD", load: 77, kwh: null, reason: "Within thermal limits." },
  { name: "Admin HVAC", status: "WARNING", load: 38, kwh: 380, reason: "Off-peak schedule drift into morning peak." },
];

export const OVERVIEW_MACHINE_SUMMARY =
  "2 Critical · 3 Warning · 8 Good · 1 Offline · 2 Info · 1 Optimized";

export const OVERVIEW_DIALS = [
  { name: "Kiln 1", load: 108, sub: "4,820 kWh/h" },
  { name: "Cement Mill 1", load: 112, sub: "PF 0.84" },
  { name: "Raw Mill A", load: 97, sub: "Vib 4.2mm/s" },
  { name: "Chiller Unit 1", load: 96, sub: "COP 3.3" },
  { name: "Compressor 2", load: 54, sub: "AI optimized" },
];

export const OVERVIEW_SECTION_BREAKDOWN = [
  { name: "Clinkerization", kwh: 412_000, color: "#f75440" },
  { name: "Grinding", kwh: 459_000, color: "#051f13" },
  { name: "Raw Grinding", kwh: 191_000, color: "#00666b" },
  { name: "Utilities", kwh: 84_000, color: "#c97a00" },
  { name: "Dispatch", kwh: 54_000, color: "#8f706b" },
];

export const OVERVIEW_DEMAND_PROFILE = Array.from({ length: 24 }, (_, h) => {
  const base = 62 + Math.sin((h - 6) / 3.5) * 22 + (h >= 18 && h <= 22 ? 14 : 0);
  const tod = h >= 18 && h <= 22 ? "peak" : h >= 6 && h <= 9 ? "shoulder" : "off";
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    mw: +Math.max(28, base).toFixed(1),
    tod: tod as "peak" | "shoulder" | "off",
  };
});

export type WasterStatus = "OVER LIMIT" | "WARNING" | "NORMAL" | "OPTIMIZED";

export const OVERVIEW_WASTERS = [
  { rank: 1, machine: "Kiln 1", section: "Clinkerization", load: 108, kwh: 412_000, cost: 2_604_000, bench: 22, status: "OVER LIMIT" as WasterStatus },
  { rank: 2, machine: "Cement Mill 1", section: "Grinding", load: 112, kwh: 268_000, cost: 1_694_000, bench: 18, status: "OVER LIMIT" as WasterStatus },
  { rank: 3, machine: "Main incomer", section: "Power", load: 94, kwh: 1_280_000, cost: 8_090_000, bench: 6, status: "WARNING" as WasterStatus },
  { rank: 4, machine: "Raw Mill 2", section: "Grinding", load: 72, kwh: 191_000, cost: 1_207_000, bench: -4, status: "NORMAL" as WasterStatus },
  { rank: 5, machine: "Cement Mill 2", section: "Grinding", load: 84, kwh: 191_000, cost: 1_207_000, bench: -8, status: "NORMAL" as WasterStatus },
  { rank: 6, machine: "Chiller Unit 1", section: "Utilities", load: 96, kwh: 84_000, cost: 531_000, bench: 14, status: "WARNING" as WasterStatus },
  { rank: 7, machine: "Compressor 1", section: "Utilities", load: 79, kwh: 84_000, cost: 531_000, bench: -6, status: "NORMAL" as WasterStatus },
  { rank: 8, machine: "Compressor 2", section: "Utilities", load: 54, kwh: 84_000, cost: 531_000, bench: -18, status: "OPTIMIZED" as WasterStatus },
];

export const OVERVIEW_WASTERS_FOOTER = {
  shown: 8,
  total: 115,
  totalKwh: 1_200_000,
  totalCost: 7_840_000,
};

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO" | "RESOLVED";

export type OverviewAlert = {
  id: string;
  time: string;
  severity: AlertSeverity;
  machine: string;
  message: string;
  action: string;
  /** Linked alarm detail when one exists; otherwise open the alarms console. */
  alarmId?: string;
};

export const OVERVIEW_ALERTS: OverviewAlert[] = [
  {
    id: "a1",
    time: "Now",
    severity: "CRITICAL",
    machine: "Kiln 1",
    message:
      "Load 108% - 14% above design. Drawing 4,820 kWh/h. MD coincidence risk in 10–11 TOD peak.",
    action: "View →",
    alarmId: "alm_1001",
  },
  {
    id: "a2",
    time: "4m ago",
    severity: "CRITICAL",
    machine: "Cement Mill 1",
    message: "PF 0.84 drifting toward penalty slab. Overload sustained >35 min.",
    action: "View →",
    alarmId: "alm_1002",
  },
  {
    id: "a3",
    time: "11m ago",
    severity: "WARNING",
    machine: "Raw Mill A",
    message: "Vibration anomaly on main bearing (Z-axis 4.2mm/s, threshold 3.5mm/s).",
    action: "View →",
    alarmId: "alm_1006",
  },
  {
    id: "a4",
    time: "18m ago",
    severity: "WARNING",
    machine: "Chiller Unit 1",
    message: "COP dropped from 4.1 to 3.3. Possible fouling on heat exchanger.",
    action: "View →",
  },
  {
    id: "a5",
    time: "23m ago",
    severity: "WARNING",
    machine: "Admin HVAC",
    message: "Off-peak schedule drift - still running into morning peak TOD.",
    action: "View →",
    alarmId: "alm_1008",
  },
  {
    id: "a6",
    time: "41m ago",
    severity: "INFO",
    machine: "Conveyor B1",
    message: "Idle energy draw during scheduled break. 93 kWh wasted.",
    action: "View →",
  },
  {
    id: "a7",
    time: "52m ago",
    severity: "RESOLVED",
    machine: "Compressor 2",
    message: "AI optimization applied. Load reduced from 84% to 54%. Saving ₹1,800/day.",
    action: "View →",
    alarmId: "alm_1003",
  },
  {
    id: "a8",
    time: "1h ago",
    severity: "INFO",
    machine: "Packing Line 2",
    message: "Equipment offline since 05:30. Planned maintenance. Expected restart: 14:00.",
    action: "View →",
    alarmId: "alm_1007",
  },
];

/** Detail page when mapped; otherwise alarms console. */
export function alertAlarmHref(alert: Pick<OverviewAlert, "alarmId">): string {
  return alert.alarmId ? `/alarms/${alert.alarmId}` : "/alarms";
}
