"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { StatusBadge } from "@/components/ui/indicators";

/** Touch / primary CTA floor — design system §7.1 */
export const TOUCH_MIN_PX = 48;

export type StatusTone = "critical" | "warning" | "good" | "neutral" | "info";

/** Charter: never color alone — every tone has a visible English label. */
export const STATUS_LABELS: Record<StatusTone, string> = {
  critical: "Critical",
  warning: "Warning",
  good: "Good",
  neutral: "Neutral",
  info: "Info",
};

export function StatusChip({
  tone,
  children,
  compact,
  variant,
}: {
  tone: StatusTone;
  children?: ReactNode;
  compact?: boolean;
  variant?: "dot" | "inline" | "pill";
}) {
  return (
    <StatusBadge tone={tone} variant={variant} compact={compact}>
      {children}
    </StatusBadge>
  );
}

export function Panel({
  children,
  style,
  className,
  as: Tag = "section",
  role,
  "aria-busy": ariaBusy,
  "aria-label": ariaLabel,
  onClick,
  "aria-expanded": ariaExpanded,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  as?: "section" | "div" | "article";
  role?: string;
  "aria-busy"?: boolean;
  "aria-label"?: string;
  onClick?: () => void;
  "aria-expanded"?: boolean;
}) {
  return (
    <Tag
      role={role}
      aria-busy={ariaBusy}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      className={className}
      style={{
        background: "var(--forge-surface-container-lowest)",
        border: "1px solid var(--forge-outline-variant)",
        borderRadius: "var(--forge-radius-card)",
        padding: 20,
        boxShadow: "var(--forge-shadow-card)",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function PageHead({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className="forge-page-head"
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-end",
        flexWrap: "wrap",
      }}
    >
      <div>
        {eyebrow ? <p className="forge-eyebrow">{eyebrow}</p> : null}
        <h1
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--forge-font-display)",
            fontSize: "var(--forge-size-headline)",
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
      </div>
      {actions}
    </header>
  );
}

/** Standard panel header — eyebrow, title, optional subtitle/meta */
export function PanelHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  className,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`forge-panel-header${className ? ` ${className}` : ""}`}>
      <div className="forge-panel-header__body">
        {eyebrow ? <p className="forge-eyebrow">{eyebrow}</p> : null}
        {title ? <h3 className="forge-card-title">{title}</h3> : null}
        {subtitle ? <p className="forge-panel-header__subtitle">{subtitle}</p> : null}
      </div>
      {meta ? <div className="forge-panel-header__meta">{meta}</div> : null}
    </div>
  );
}

const btnBase: CSSProperties = {
  minHeight: TOUCH_MIN_PX,
  minWidth: TOUCH_MIN_PX,
  padding: "0 16px",
  borderRadius: 8,
  fontFamily: "var(--forge-font-display)",
  fontWeight: 600,
  fontSize: 16,
  letterSpacing: "0.01em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  transition:
    "background 120ms ease, box-shadow 120ms ease, border-color 120ms ease, color 120ms ease",
  textDecoration: "none",
  boxSizing: "border-box",
};

/** shadcn-inspired variants mapped onto Forge tokens (no Tailwind). */
export type ForgeButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ForgeButtonSize = "default" | "sm" | "icon";

function variantStyle(
  variant: ForgeButtonVariant,
  disabled?: boolean,
): CSSProperties {
  if (disabled) {
    return {
      background: "var(--forge-outline)",
      color: "var(--forge-on-surface-variant)",
      border: "1px solid var(--forge-outline)",
      boxShadow: "none",
      opacity: 0.7,
      cursor: "not-allowed",
    };
  }
  switch (variant) {
    case "primary":
      return {
        background: "var(--forge-primary)",
        color: "var(--forge-on-primary)",
        border: "1px solid transparent",
        boxShadow: "0 1px 2px rgba(25, 28, 26, 0.12)",
        cursor: "pointer",
      };
    case "secondary":
      return {
        background: "var(--forge-surface-container-lowest)",
        color: "var(--forge-primary)",
        border: "1px solid var(--forge-primary)",
        cursor: "pointer",
      };
    case "destructive":
      return {
        background: "var(--forge-surface-container-lowest)",
        color: "var(--forge-primary)",
        border: "1px solid var(--forge-primary)",
        cursor: "pointer",
      };
    case "link":
      return {
        background: "transparent",
        color: "var(--forge-primary)",
        border: "1px solid transparent",
        boxShadow: "none",
        textDecoration: "underline",
        textUnderlineOffset: 3,
        minHeight: 40,
        padding: "0 4px",
        cursor: "pointer",
      };
    case "ghost":
    default:
      return {
        background: "var(--forge-surface-container-lowest)",
        border: "1px solid var(--forge-outline-variant)",
        color: "var(--forge-on-surface-variant)",
        cursor: "pointer",
      };
  }
}

function sizeStyle(size: ForgeButtonSize): CSSProperties {
  if (size === "sm") {
    return { minHeight: 40, minWidth: 40, padding: "0 12px", fontSize: 14 };
  }
  if (size === "icon") {
    return { minHeight: TOUCH_MIN_PX, minWidth: TOUCH_MIN_PX, padding: 0, width: TOUCH_MIN_PX };
  }
  return {};
}

/**
 * Unified Forge button — API shaped like shadcn Button (variant/size/href)
 * but styled with Forge CSS variables. Prefer this for new ops chrome.
 */
export function ForgeButton({
  children,
  onClick,
  type = "button",
  disabled,
  fullWidth,
  variant = "primary",
  size = "default",
  href,
  icon,
  className,
  "aria-label": ariaLabel,
}: {
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: ForgeButtonVariant;
  size?: ForgeButtonSize;
  href?: string;
  icon?: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const cls = [
    "forge-btn",
    `forge-btn--${variant}`,
    size !== "default" ? `forge-btn--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties = {
    ...btnBase,
    ...variantStyle(variant, disabled),
    ...sizeStyle(size),
    width: fullWidth ? "100%" : undefined,
  };
  const body = (
    <>
      {icon ? <span className="forge-btn__icon" data-icon="inline-start">{icon}</span> : null}
      {children}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} style={style} aria-label={ariaLabel} onClick={onClick}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={style}
      aria-label={ariaLabel}
    >
      {body}
    </button>
  );
}

/** Action row — shadcn ButtonGroup analogue. */
export function ForgeButtonGroup({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={["forge-btn-group", "forge-btn-row", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <ForgeButton
      variant="primary"
      onClick={onClick}
      type={type}
      disabled={disabled}
      fullWidth={fullWidth}
    >
      {children}
    </ForgeButton>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <ForgeButton variant="secondary" onClick={onClick} type={type} disabled={disabled}>
      {children}
    </ForgeButton>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <ForgeButton variant="ghost" onClick={onClick} type={type} disabled={disabled}>
      {children}
    </ForgeButton>
  );
}

export function TextField({
  label,
  hint,
  error,
  id,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{label}</span>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? hintId : null, error ? errorId : null]
          .filter(Boolean)
          .join(" ") || undefined}
        {...props}
        style={{
          minHeight: TOUCH_MIN_PX,
          padding: "0 12px",
          borderRadius: "var(--forge-radius-md)",
          border: `1px solid ${error ? "var(--forge-error)" : "var(--forge-outline)"}`,
          background: "var(--forge-surface-container-lowest)",
          color: "var(--forge-on-surface)",
          fontSize: 16,
          fontWeight: 400,
          fontFamily: "var(--forge-font-body)",
          ...props.style,
        }}
      />
      {hint && !error ? (
        <span id={hintId} style={{ fontWeight: 400, color: "var(--forge-on-surface-variant)" }}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" style={{ fontWeight: 500, color: "var(--forge-error)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  id,
  children,
  ...props
}: {
  label: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{label}</span>
      <select
        id={fieldId}
        {...props}
        style={{
          minHeight: TOUCH_MIN_PX,
          padding: "0 12px",
          borderRadius: "var(--forge-radius-md)",
          border: "1px solid var(--forge-outline)",
          background: "var(--forge-surface-container-lowest)",
          color: "var(--forge-on-surface)",
          fontSize: 16,
          fontFamily: "var(--forge-font-body)",
          ...props.style,
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  id,
  ...props
}: {
  label: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{label}</span>
      <textarea
        id={fieldId}
        {...props}
        style={{
          minHeight: 96,
          padding: 12,
          borderRadius: "var(--forge-radius-md)",
          border: "1px solid var(--forge-outline)",
          background: "var(--forge-surface-container-lowest)",
          color: "var(--forge-on-surface)",
          fontSize: 16,
          fontFamily: "var(--forge-font-body)",
          resize: "vertical",
          ...props.style,
        }}
      />
    </label>
  );
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: Array<{ key: string; header: string; align?: "left" | "right" }>;
  rows: Array<Record<string, ReactNode> & { id: string }>;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--forge-font-body)",
          fontSize: 14,
        }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  textAlign: col.align ?? "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--forge-outline-variant)",
                  color: "var(--forge-on-surface-variant)",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 1 ? "rgba(5, 31, 19, 0.02)" : "transparent",
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align ?? "left",
                    padding: "12px",
                    borderBottom: "1px solid var(--forge-outline-variant)",
                    fontVariantNumeric: col.align === "right" ? "tabular-nums" : undefined,
                  }}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 16,
  label = "Loading",
}: {
  width?: number | string;
  height?: number | string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: "var(--forge-radius-sm)",
        background:
          "linear-gradient(90deg, var(--forge-surface-container) 0%, var(--forge-surface-container-high) 50%, var(--forge-surface-container) 100%)",
        backgroundSize: "200% 100%",
        animation: "forge-skeleton 1.2s ease-in-out infinite",
      }}
    />
  );
}

export function ToastRegion({
  message,
  tone = "neutral",
}: {
  message: string | null;
  tone?: StatusTone;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        minWidth: 240,
        maxWidth: "min(480px, calc(100vw - 32px))",
        padding: "12px 16px",
        borderRadius: "var(--forge-radius-md)",
        background: "var(--forge-inverse-surface)",
        color: "var(--forge-inverse-on-surface)",
        boxShadow: "var(--forge-shadow-panel)",
        fontWeight: 600,
        fontSize: 14,
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <StatusChip tone={tone} />
      <span>{message}</span>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(25, 28, 26, 0.4)",
      }}
    >
      <button
        type="button"
        aria-label="Close sheet backdrop"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, border: "none", background: "transparent" }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          height: "100%",
          background: "var(--forge-surface-container-lowest)",
          boxShadow: "var(--forge-shadow-sheet)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          animation: "forge-sheet-in var(--forge-motion-base) var(--forge-ease)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: "var(--forge-font-display)",
              fontSize: "var(--forge-size-title)",
              fontWeight: 700,
            }}
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              ...btnBase,
              background: "transparent",
              border: "1px solid var(--forge-outline-variant)",
              color: "var(--forge-secondary)",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
      </aside>
    </div>
  );
}
