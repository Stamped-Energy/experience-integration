import type { CSSProperties, ReactNode } from "react";

export type ChartLegendItem = {
  label: string;
  color?: string;
  variant?: "line" | "dashed" | "area" | "dot";
};

export function ChartLegend({
  items,
  style,
}: {
  items: ChartLegendItem[];
  style?: CSSProperties;
}) {
  return (
    <div className="forge-chart-legend" style={style}>
      {items.map((item) => (
        <span key={item.label} className="forge-chart-legend__item">
          <LegendSwatch variant={item.variant ?? "line"} color={item.color} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function LegendSwatch({
  variant,
  color = "var(--forge-primary)",
}: {
  variant: ChartLegendItem["variant"];
  color?: string;
}) {
  if (variant === "dashed") {
    return (
      <span
        className="forge-chart-legend__swatch forge-chart-legend__swatch--dashed"
        style={{ borderTopColor: color }}
      />
    );
  }
  if (variant === "area") {
    return (
      <span
        className="forge-chart-legend__swatch forge-chart-legend__swatch--area"
        style={{ background: color }}
      />
    );
  }
  if (variant === "dot") {
    return (
      <span
        className="forge-chart-legend__swatch forge-chart-legend__swatch--dot"
        style={{ background: color }}
      />
    );
  }
  return (
    <span
      className="forge-chart-legend__swatch forge-chart-legend__swatch--line"
      style={{ background: color }}
    />
  );
}

export function ChartStatRow({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="forge-chart-stats">
      {items.map((item, index) => (
        <div
          key={item.label}
          className="forge-chart-stats__cell"
          style={{
            paddingLeft: index ? 16 : 0,
            borderLeft: index ? "1px solid var(--forge-outline-variant)" : "none",
          }}
        >
          <div className="forge-chart-stats__label">{item.label}</div>
          <div className="forge-chart-stats__value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
