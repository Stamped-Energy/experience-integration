"use client";

import type { DataSource } from "@/lib/bff";

const LABELS: Record<DataSource, string> = {
  fixture: "Demo fixture",
  l2: "Live from L2",
  l5: "Live from L5",
  preview: "Preview · not live plant data",
  unavailable: "No upstream data",
};

type Props = {
  source: DataSource;
  loading?: boolean;
  detail?: string | null;
};

/** Consistent live-vs-fixture indicator across converted screens. */
export function SourceIndicator({ source, loading, detail }: Props) {
  const label = loading ? "Loading…" : LABELS[source];
  const tone =
    source === "l2" || source === "l5"
      ? "var(--forge-tertiary)"
      : source === "preview" || source === "unavailable"
        ? "var(--forge-warning)"
        : "var(--forge-on-surface-variant)";

  return (
    <p
      data-source-indicator
      data-source={loading ? "loading" : source}
      style={{
        margin: "0 0 12px",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: tone,
      }}
    >
      {label}
      {detail && !loading ? ` · ${detail}` : null}
    </p>
  );
}

/** Empty-state card for Class D / unavailable tiles. */
export function EmptyUpstreamState({
  title = "No upstream data",
  detail,
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div
      data-empty-upstream
      role="status"
      style={{
        padding: "24px 16px",
        border: "1px dashed var(--forge-outline-variant, #ccc)",
        borderRadius: 8,
        color: "var(--forge-on-surface-variant)",
        fontSize: 14,
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{title}</p>
      {detail ? (
        <p style={{ margin: "8px 0 0", fontSize: 12 }}>{detail}</p>
      ) : null}
    </div>
  );
}
