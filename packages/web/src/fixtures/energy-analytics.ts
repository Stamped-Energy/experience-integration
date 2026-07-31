/** Energy Analytics demo datasets - ported from stamped-energy-dashboard pagesData. */

const TARIFF = 6.32;

export const MONTHLY_COMPARISON = [
  { m: "Jul", actual: 318, baseline: 332, cost: 20.1 },
  { m: "Aug", actual: 309, baseline: 330, cost: 19.5 },
  { m: "Sep", actual: 301, baseline: 328, cost: 19.0 },
  { m: "Oct", actual: 312, baseline: 335, cost: 19.7 },
  { m: "Nov", actual: 298, baseline: 326, cost: 18.8 },
  { m: "Dec", actual: 305, baseline: 333, cost: 19.3 },
  { m: "Jan", actual: 296, baseline: 329, cost: 18.7 },
  { m: "Feb", actual: 289, baseline: 324, cost: 18.3 },
  { m: "Mar", actual: 294, baseline: 327, cost: 18.6 },
  { m: "Apr", actual: 291, baseline: 322, cost: 18.4 },
  { m: "May", actual: 288, baseline: 319, cost: 18.2 },
  { m: "Jun", actual: 285, baseline: 313, cost: 18.0 },
];

export const COST_BREAKDOWN = [
  { name: "Energy Charge", value: 1_264_000, color: "#f75440" },
  { name: "Demand Charge", value: 318_000, color: "#051f13" },
  { name: "TOD Penalty", value: 96_000, color: "#c97a00" },
  { name: "Power Factor Penalty", value: 64_000, color: "#ba1a1a" },
  { name: "Taxes & Duties", value: 58_000, color: "#8f706b" },
];

export const SOURCE_MIX = [
  { name: "Grid (DISCOM)", value: 62, color: "#051f13" },
  { name: "Captive Power", value: 24, color: "#f75440" },
  { name: "Solar Rooftop", value: 9, color: "#c97a00" },
  { name: "DG Backup", value: 5, color: "#8f706b" },
];

export const POWER_FACTOR_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  pf: +(0.86 + Math.sin(i / 4) * 0.05 + (i > 18 ? 0.04 : 0) + (i % 7 === 0 ? -0.06 : 0)).toFixed(3),
}));

export const SEC_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: MONTHLY_COMPARISON[i]!.m,
  sec: +(74 - i * 0.7 + Math.sin(i) * 1.2).toFixed(1),
}));

export const WEEKDAY_PROFILE = [
  { d: "Mon", kwh: 9820 },
  { d: "Tue", kwh: 10120 },
  { d: "Wed", kwh: 10260 },
  { d: "Thu", kwh: 9990 },
  { d: "Fri", kwh: 10180 },
  { d: "Sat", kwh: 8740 },
  { d: "Sun", kwh: 6210 },
];

export const FEEDER_WISE = [
  { feeder: "Feeder 11kV - A", kwh: 98400, share: 34.6, pf: 0.91 },
  { feeder: "Feeder 11kV - B", kwh: 81200, share: 28.5, pf: 0.88 },
  { feeder: "Feeder 11kV - C", kwh: 56300, share: 19.8, pf: 0.74 },
  { feeder: "Feeder LT - Utilities", kwh: 31900, share: 11.2, pf: 0.93 },
  { feeder: "Feeder LT - Lighting", kwh: 16800, share: 5.9, pf: 0.96 },
];

export const LOAD_HEATMAP = (() => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((d, di) =>
    Array.from({ length: 24 }, (_, h) => {
      const peak = h >= 6 && h <= 22 ? 1 : 0.45;
      const weekend = di >= 5 ? 0.62 : 1;
      const noise = ((di * 7 + h * 13) % 17) / 60;
      const v = Math.round(Math.min(100, 30 + 55 * peak * weekend + noise * 40));
      return { day: d, hour: h, v };
    }),
  );
})();

export const CUMULATIVE_SAVINGS = MONTHLY_COMPARISON.reduce<
  Array<{ m: string; saved: number; cum: number }>
>((acc, monthly, i) => {
  const saved = Math.round((monthly.baseline - monthly.actual) * 1000 * TARIFF);
  const prev = i ? acc[i - 1]!.cum : 0;
  acc.push({ m: monthly.m, saved, cum: prev + saved });
  return acc;
}, []);

export const ANALYTICS_KPIS = [
  { label: "Specific Energy Consumption", value: "66.2", unit: "kWh/t", delta: -8.4, good: true },
  { label: "Avg Power Factor", value: "0.89", unit: "", delta: 3.1, good: true },
  { label: "Load Factor", value: "78", unit: "%", delta: 4.2, good: true },
  { label: "Peak Demand", value: "98", unit: "MW", delta: -2.1, good: true },
  { label: "Energy Cost / Tonne", value: "₹418", unit: "", delta: -6.7, good: true },
  { label: "Renewable Share", value: "9", unit: "%", delta: 2.0, good: true },
];
