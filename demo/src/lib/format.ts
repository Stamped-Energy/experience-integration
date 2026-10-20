import { DEMO_NOW } from "@/lib/demo/data";

const NOW = Date.parse(DEMO_NOW);
/** "14:05" in IST. */
export const hhmm = (iso: string) => iso.slice(11, 16);
/** "20 Oct" */
export const dayMonth = (iso: string) => {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};
/** Relative to demo now: "in 2 h", "40 min ago", "3 d ago". */
export function rel(iso: string): string {
  const m = Math.round((Date.parse(iso) - NOW) / 60000);
  const a = Math.abs(m);
  const s = a < 60 ? `${a} min` : a < 48 * 60 ? `${Math.round(a / 60)} h` : `${Math.round(a / 1440)} d`;
  return m >= 0 ? `in ${s}` : `${s} ago`;
}
/** Indian grouping, rupees. 214000 -> "₹2,14,000"; lakh form for big values. */
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const lakh = (n: number) => `₹${(n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`;
export const num = (n: number, d = 0) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
