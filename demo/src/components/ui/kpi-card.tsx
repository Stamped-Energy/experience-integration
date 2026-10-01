import type { ReactNode } from "react";
import { Panel } from "@/components/ui/primitives";

/** Consistent KPI tile - no hero glow, optional left accent only. */
export function KpiCard({
  eyebrow,
  value,
  footnote,
  accent,
}: {
  eyebrow: string;
  value: ReactNode;
  footnote?: ReactNode;
  accent?: "primary" | "none";
}) {
  return (
    <Panel className={accent === "primary" ? "forge-kpi-card forge-kpi-card--accent" : "forge-kpi-card"}>
      <p className="forge-eyebrow">{eyebrow}</p>
      <div className="forge-num-display tabular">{value}</div>
      {footnote ? (
        <p className="forge-kpi-card__footnote">{footnote}</p>
      ) : null}
    </Panel>
  );
}
