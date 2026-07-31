"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Circle,
  Clock,
  Heart,
  Info,
  IndianRupee,
  Leaf,
  Shield,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Zap,
  type IconProps,
} from "@/components/ui/icons";
import type { StatusTone } from "@/components/ui/primitives";
import { STATUS_LABELS } from "@/components/ui/primitives";

type IconComponent = (p: IconProps) => React.JSX.Element;

const TONE_COLOR: Record<StatusTone, string> = {
  critical: "var(--forge-error)",
  warning: "var(--forge-warning)",
  good: "var(--forge-tertiary)",
  neutral: "var(--forge-on-surface-variant)",
  info: "var(--forge-info)",
};

const TONE_BG: Record<StatusTone, string> = {
  critical: "rgba(186, 26, 26, 0.1)",
  warning: "rgba(201, 122, 0, 0.12)",
  good: "rgba(0, 102, 107, 0.1)",
  neutral: "rgba(143, 112, 107, 0.12)",
  info: "rgba(0, 102, 107, 0.1)",
};

const TONE_ICON: Record<StatusTone, IconComponent> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  good: CheckCircle,
  neutral: Circle,
  info: Info,
};

/** Machine / alert status strings → tone */
const MACHINE_STATUS_TONE: Record<string, StatusTone> = {
  CRITICAL: "critical",
  WARNING: "warning",
  GOOD: "good",
  OPTIMIZED: "good",
  OFFLINE: "neutral",
  INFO: "info",
  RESOLVED: "good",
  ROUTINE: "good",
  HIGH: "critical",
  MEDIUM: "warning",
  LOW: "info",
  "OVER LIMIT": "critical",
  NORMAL: "good",
};

export function statusToTone(status: string): StatusTone {
  return MACHINE_STATUS_TONE[status] ?? "neutral";
}

export function StatusDot({ tone, size = 8, pulse }: { tone: StatusTone; size?: number; pulse?: boolean }) {
  return (
    <span
      className={pulse ? "forge-pulse-dot" : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: TONE_COLOR[tone],
        display: "inline-block",
        flexShrink: 0,
      }}
      aria-hidden
    />
  );
}

export function StatusDotByStatus({ status, size = 8, pulse }: { status: string; size?: number; pulse?: boolean }) {
  const tone = statusToTone(status);
  return <StatusDot tone={tone} size={size} pulse={pulse || status === "CRITICAL"} />;
}

export function IconBadge({
  icon: Icon,
  tone = "neutral",
  size = 36,
  iconSize = 18,
  style,
}: {
  icon: IconComponent;
  tone?: StatusTone | "primary";
  size?: number;
  iconSize?: number;
  style?: CSSProperties;
}) {
  const color = tone === "primary" ? "var(--forge-primary)" : TONE_COLOR[tone];
  const bg = tone === "primary" ? "var(--forge-primary-dim)" : TONE_BG[tone];
  return (
    <span
      className="forge-icon-badge"
      style={{
        width: size,
        height: size,
        borderRadius: size <= 28 ? 8 : 10,
        background: bg,
        color,
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden
    >
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  );
}

/** Compact status - dot-only, inline label, or subtle pill */
export function StatusBadge({
  tone,
  label,
  children,
  variant,
  compact,
}: {
  tone: StatusTone;
  label?: string;
  children?: ReactNode;
  /** dot = indicator only · inline = dot + text · pill = soft tag background */
  variant?: "dot" | "inline" | "pill";
  /** @deprecated use variant="dot" */
  compact?: boolean;
}) {
  const text = children ?? label;
  const mode = variant ?? (compact ? "dot" : text ? "inline" : "dot");

  if (mode === "dot") {
    return (
      <span role="status" title={STATUS_LABELS[tone]} className="forge-status-dot-wrap">
        <StatusDot tone={tone} size={7} pulse={tone === "critical"} />
        <span className="sr-only">{STATUS_LABELS[tone]}</span>
      </span>
    );
  }

  if (mode === "inline") {
    const visible = typeof text === "string" ? text : STATUS_LABELS[tone];
    return (
      <span role="status" className="forge-status-inline" style={{ color: TONE_COLOR[tone] }}>
        <StatusDot tone={tone} size={6} />
        <span>{visible}</span>
      </span>
    );
  }

  const visible = typeof text === "string" ? text : STATUS_LABELS[tone];
  return (
    <span
      role="status"
      className="forge-status-pill"
      style={{ color: TONE_COLOR[tone], background: TONE_BG[tone] }}
    >
      <StatusDot tone={tone} size={6} />
      <span>{visible}</span>
    </span>
  );
}

export function StatusBadgeByStatus({ status, compact, variant }: { status: string; compact?: boolean; variant?: "dot" | "inline" | "pill" }) {
  const tone = statusToTone(status);
  const short =
    status === "CRITICAL" ? "Critical"
    : status === "WARNING" ? "Warning"
    : status === "GOOD" || status === "NORMAL" ? "Good"
    : status === "OPTIMIZED" ? "Optimized"
    : status === "OVER LIMIT" ? "Over limit"
    : status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <StatusBadge
      tone={tone}
      label={short}
      variant={variant ?? (compact ? "dot" : "inline")}
    />
  );
}

/** Inline metric - icon badge + label + value, no heavy box */
export function MetricInline({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  bad,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  tone?: StatusTone | "primary";
  bad?: boolean;
}) {
  const effectiveTone = bad ? "critical" : tone;
  return (
    <div className="forge-metric-inline">
      <IconBadge icon={Icon} tone={effectiveTone === "primary" ? "primary" : (effectiveTone as StatusTone)} size={32} iconSize={16} />
      <div className="forge-metric-inline__body">
        <div className="forge-metric-inline__label">{label}</div>
        <div className="forge-metric-inline__value" style={{ color: bad ? "var(--forge-error)" : undefined }}>{value}</div>
      </div>
    </div>
  );
}

/** Compact KPI tile with icon header */
export function KpiTile({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  good,
  tone = "neutral",
}: {
  icon: IconComponent;
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  good?: boolean;
  tone?: StatusTone | "primary";
}) {
  const deltaColor =
    good == null ? "var(--forge-on-surface-variant)" : good ? "var(--forge-tertiary)" : "var(--forge-error)";
  const DeltaIcon = delta != null && delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="forge-kpi-tile">
      <div className="forge-kpi-tile__head">
        <IconBadge icon={Icon} tone={tone === "primary" ? "primary" : (tone as StatusTone)} size={32} iconSize={16} />
        <p className="forge-kpi-tile__label">{label}</p>
      </div>
      <div className="forge-kpi-tile__value tabular">
        {value}
        {unit ? <span className="forge-kpi-tile__unit">{unit}</span> : null}
      </div>
      {delta != null ? (
        <div className="forge-kpi-tile__delta" style={{ color: deltaColor }}>
          <DeltaIcon size={12} strokeWidth={2.5} />
          {delta > 0 ? "+" : ""}{delta}{unit === "%" ? "pp" : unit === "d" ? " d" : ""}
        </div>
      ) : null}
    </div>
  );
}

/** Icon-only filter toggle for alert/feed panels */
export function FilterIconBtn({
  active,
  onClick,
  icon: Icon,
  label,
  tone = "neutral",
}: {
  active: boolean;
  onClick: () => void;
  icon: IconComponent;
  label: string;
  tone?: StatusTone;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`forge-filter-icon${active ? " forge-filter-icon--active" : ""}`}
      style={active ? undefined : { color: TONE_COLOR[tone] }}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

/** Severity count pill - icon + number */
export function CountPill({ tone, count, label }: { tone: StatusTone; count: number; label: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span className="forge-count-pill" title={`${count} ${label}`} style={{ color: TONE_COLOR[tone], background: TONE_BG[tone] }}>
      <Icon size={12} strokeWidth={2.2} />
      <span className="tabular">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Clean horizontal legend - colored swatch + readable label */
export function StatusLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <div className="forge-status-legend" role="list" aria-label="Status legend">
      {items.map((item) => (
        <span key={item.label} className="forge-status-legend__item" role="listitem">
          <span className="forge-status-legend__swatch" style={{ background: item.color }} aria-hidden />
          <span className="forge-status-legend__label">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Anomaly / severity breakdown - dot · count · label */
export function SeverityStrip({
  items,
}: {
  items: Array<{ tone: StatusTone; count: number; label: string }>;
}) {
  return (
    <div className="forge-severity-strip" role="list" aria-label="Severity breakdown">
      {items.map((item) => (
        <span
          key={item.label}
          className="forge-severity-strip__item"
          role="listitem"
          style={{ color: TONE_COLOR[item.tone] }}
        >
          <span className="forge-severity-strip__dot" style={{ background: TONE_COLOR[item.tone] }} aria-hidden />
          <span className="forge-severity-strip__count tabular">{item.count}</span>
          <span className="forge-severity-strip__label">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Inline severity tag for table rows - dot + short label */
export function SeverityTag({ status, label }: { status: string; label?: string }) {
  const tone = statusToTone(status);
  const text = label ?? status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className="forge-severity-tag" style={{ color: TONE_COLOR[tone] }}>
      <span className="forge-severity-tag__dot" style={{ background: TONE_COLOR[tone] }} aria-hidden />
      <span>{text}</span>
    </span>
  );
}

/** KPI icon presets */
export const KPI_ICONS = {
  savings: IndianRupee,
  energy: Zap,
  score: Shield,
  anomalies: AlertTriangle,
  carbon: Leaf,
  health: Heart,
  risk: AlertTriangle,
  alerts: Sparkles,
  mtbf: Clock,
  compliance: CheckCircle,
  downtime: TrendingDown,
  temp: Thermometer,
  vib: Activity,
} as const;
