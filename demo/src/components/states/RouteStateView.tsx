"use client";

import type { ReactNode } from "react";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  Skeleton,
} from "@/components/ui/primitives";
import { missingLabel } from "@/lib/analytics";
import type { RouteStateModel } from "@/lib/route-state";

export function RouteStateView({
  state,
  onRetry,
  children,
}: {
  state: RouteStateModel;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  if (state.kind === "default") {
    return <>{children}</>;
  }

  if (state.kind === "loading") {
    return (
      <Panel aria-busy={true} aria-label={state.title ?? "Loading"}>
        <div style={{ display: "grid", gap: 12 }}>
          <Skeleton height={28} width="40%" label="Loading title" />
          <Skeleton height={16} width="70%" />
          <Skeleton height={16} width="55%" />
          <Skeleton height={120} width="100%" label="Loading content" />
        </div>
      </Panel>
    );
  }

  if (state.kind === "stale") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--forge-radius-md)",
            background: "rgba(201, 122, 0, 0.14)",
            color: "var(--forge-warning)",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span>
            {state.title}: {state.detail}
          </span>
          {state.retryable && onRetry ? (
            <GhostButton onClick={onRetry}>Refresh</GhostButton>
          ) : null}
        </div>
        {children}
      </div>
    );
  }

  if (state.kind === "partial") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--forge-radius-md)",
            background: "rgba(0, 102, 107, 0.12)",
            color: "var(--forge-info)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <p style={{ margin: 0 }}>{state.title}</p>
          <p style={{ margin: "4px 0 0", fontWeight: 500 }}>{state.detail}</p>
          {state.missing?.length ? (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {state.missing.map((m) => (
                <li key={m}>{missingLabel(m)}</li>
              ))}
            </ul>
          ) : null}
        </div>
        {children}
        {state.retryable && onRetry ? (
          <GhostButton onClick={onRetry}>Retry</GhostButton>
        ) : null}
      </div>
    );
  }

  return (
    <Panel
      role={state.kind === "error" ? "alert" : "status"}
      style={{ textAlign: "left", maxWidth: 520 }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--forge-font-display)",
          fontSize: "var(--forge-size-title)",
        }}
      >
        {state.title}
      </h2>
      {state.detail ? (
        <p style={{ margin: "8px 0 0", color: "var(--forge-on-surface-variant)" }}>
          {state.detail}
        </p>
      ) : null}
      {state.retryable && onRetry ? (
        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={onRetry}>Try again</PrimaryButton>
        </div>
      ) : null}
    </Panel>
  );
}
