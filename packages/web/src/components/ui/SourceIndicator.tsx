"use client";

import type { DataSource } from "@/lib/bff";

const LABELS: Record<DataSource, string> = {
  fixture: "Demo fixture",
  l2: "Live from L2",
  l5: "Live from L5",
  preview: "Preview · not live plant data",
};

type Props = {
  source: DataSource;
  loading?: boolean;
  detail?: string | null;
};

/** Consistent live-vs-fixture indicator across converted screens (Phase E). */
export function SourceIndicator({ source, loading, detail }: Props) {
  const label = loading ? "Loading…" : LABELS[source];
  const tone =
    source === "l2" || source === "l5"
      ? "var(--forge-tertiary)"
      : source === "preview"
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
