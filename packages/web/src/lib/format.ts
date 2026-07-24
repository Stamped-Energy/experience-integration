/** Indian-locale formatters for client-facing surfaces. */

const IST = "Asia/Kolkata";
const MISSING = "—";

function parseIso(iso: string): Date | null {
  if (!iso || iso === MISSING || iso === "-") return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWithTimeZone(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...options }).format(date);
}

/** e.g. "Mon, 21 Jul 2026, 10:08 am IST" */
export function formatIstDateTime(iso: string): string {
  const date = parseIso(iso);
  if (!date) return iso || MISSING;
  const formatted = formatWithTimeZone(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatted} IST`;
}

/** e.g. "21 Jul 2026" */
export function formatIstDate(iso: string): string {
  const date = parseIso(iso);
  if (!date) return iso || MISSING;
  return formatWithTimeZone(date, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** e.g. "10:08 am IST" */
export function formatIstTime(iso: string): string {
  const date = parseIso(iso);
  if (!date) return iso || MISSING;
  const formatted = formatWithTimeZone(date, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatted} IST`;
}

/** e.g. "21 Jul → 31 Jul 2026" */
export function formatIstDateRange(from: string, to: string): string {
  const fromDate = parseIso(from);
  const toDate = parseIso(to);
  if (!fromDate || !toDate) return MISSING;
  const sameYear =
    fromDate.toLocaleString("en-IN", { timeZone: IST, year: "numeric" }) ===
    toDate.toLocaleString("en-IN", { timeZone: IST, year: "numeric" });
  const fromFmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(fromDate);
  const toFmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(toDate);
  return `${fromFmt} → ${toFmt}`;
}

/** Human label for alarm lifecycle states. */
export function formatAlarmState(state: string): string {
  return state.replaceAll("_", " ");
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIndianNum(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(n);
}

export function signedPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

export function claimBadgeLabel(
  status: string | undefined,
): { label: string; tone: "good" | "warning" | "neutral" | "critical" } {
  switch (status) {
    case "ops_confirmed":
      return { label: "Confirmed by operations", tone: "good" };
    case "modeled":
      return { label: "Estimated — pending bill check", tone: "warning" };
    case "pending":
      return { label: "Pending", tone: "neutral" };
    case "disputed":
      return { label: "Disputed", tone: "critical" };
    case "verified":
      return { label: "Verified on utility bill", tone: "good" };
    default:
      return { label: "Unknown", tone: "neutral" };
  }
}

export function citationPathLabel(path?: "H" | "W"): string {
  return path === "W" ? "Data" : "Rule";
}

export function formatRuleLabel(ruleId?: string): string {
  if (!ruleId) return "—";
  const base = ruleId.split("@")[0] ?? ruleId;
  const segment = base.split("/").pop() ?? base;
  return segment.replaceAll("_", " ");
}

export function formatMetricLabel(metric: string): string {
  return metric.replaceAll("_", " ");
}

export function formatBaselineLabel(baselineId?: string | null): string {
  if (!baselineId) return "—";
  return baselineId.replace(/^bl_/, "").replaceAll("_", " ");
}

export function formatEmissionFactorRef(ref?: string): string {
  if (!ref || ref === "not_measured_by_stamped") return "Not measured";
  if (ref.startsWith("cea_grid")) return "CEA grid factor 2024";
  return ref.replaceAll("_", " ");
}

export function liveConnectionLabel(sse: string): string {
  if (sse === "live") return "Live";
  if (sse === "reconnecting") return "Reconnecting";
  return "Offline";
}
