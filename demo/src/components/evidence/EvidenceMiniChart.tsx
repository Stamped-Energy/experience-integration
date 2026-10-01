"use client";

import type { ReactNode } from "react";
import type { EvidenceChartSpec } from "@/fixtures/evidence-samples";

const W = 800;
const H = 280;
const PAD = { top: 28, right: 24, bottom: 40, left: 56 };

function toneColor(tone: "critical" | "good" | "warning" | "info" | "line"): string {
  switch (tone) {
    case "critical":
      return "var(--forge-error)";
    case "good":
      return "var(--forge-tertiary)";
    case "warning":
      return "var(--forge-warning)";
    case "info":
      return "var(--forge-secondary)";
    default:
      return "var(--forge-primary)";
  }
}

function ChartSvg({
  yAxisLabel,
  ariaLabel,
  children,
}: {
  yAxisLabel: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const plotH = H - PAD.top - PAD.bottom;
  const plotW = W - PAD.left - PAD.right;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD.left}
          y1={PAD.top + plotH * (1 - f)}
          x2={PAD.left + plotW}
          y2={PAD.top + plotH * (1 - f)}
          stroke="var(--forge-outline-variant)"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}
      <line
        x1={PAD.left}
        y1={PAD.top + plotH}
        x2={PAD.left + plotW}
        y2={PAD.top + plotH}
        stroke="var(--forge-outline)"
        strokeWidth={1.5}
      />
      <text
        x={PAD.left - 10}
        y={PAD.top + plotH / 2}
        fontSize={11}
        fontWeight={600}
        fill="var(--forge-on-surface-variant)"
        transform={`rotate(-90 ${PAD.left - 10} ${PAD.top + plotH / 2})`}
        textAnchor="middle"
      >
        {yAxisLabel}
      </text>
      {children}
    </svg>
  );
}

function LineChartBody({
  chart,
  accent = "critical",
}: {
  chart: Extract<EvidenceChartSpec, { kind: "line" }>;
  accent?: "critical" | "good" | "warning";
}) {
  const { points, highlight } = chart;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys) * 0.92;
  const yMax = Math.max(...ys) * 1.08;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
  const sy = (y: number) => PAD.top + plotH - ((y - yMin) / (yMax - yMin || 1)) * plotH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`).join(" ");
  const color = toneColor(accent);
  const peakIdx = ys.indexOf(Math.max(...ys));

  return (
    <>
      {highlight ? (
        <g>
          <rect
            x={Math.min(sx(highlight.from), sx(highlight.to))}
            y={PAD.top}
            width={Math.abs(sx(highlight.to) - sx(highlight.from))}
            height={plotH}
            fill={color}
            opacity={0.14}
            rx={4}
          />
          <text
            x={(sx(highlight.from) + sx(highlight.to)) / 2}
            y={PAD.top + 18}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill={color}
          >
            {highlight.label}
          </text>
        </g>
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) =>
        i === peakIdx ? (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} fill={color} stroke="#fff" strokeWidth={2} />
        ) : null,
      )}
    </>
  );
}

function BarChartBody({
  chart,
  accent = "good",
}: {
  chart: Extract<EvidenceChartSpec, { kind: "bar" }>;
  accent?: "critical" | "good" | "warning";
}) {
  const { bars, annotation } = chart;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const yMax = Math.max(...bars.map((b) => b.value)) * 1.2;
  const slot = plotW / bars.length;
  const barW = Math.min(slot * 0.62, 56);
  const color = toneColor(accent);

  return (
    <>
      {bars.map((bar, i) => {
        const h = (bar.value / yMax) * plotH;
        const x = PAD.left + i * slot + (slot - barW) / 2;
        const y = PAD.top + plotH - h;
        const fill = bar.highlight ? color : "var(--forge-outline-variant)";
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={4}
              fill={fill}
              opacity={bar.highlight ? 1 : 0.5}
            />
            <text
              x={x + barW / 2}
              y={PAD.top + plotH + 16}
              textAnchor="middle"
              fontSize={10}
              fill="var(--forge-on-surface-variant)"
            >
              {bar.label}
            </text>
            {bar.highlight && annotation ? (
              <text
                x={x + barW / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill={color}
              >
                {annotation}
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

export function EvidenceMiniChart({
  chart,
  accent = "critical",
  compact = false,
}: {
  chart: EvidenceChartSpec;
  accent?: "critical" | "good" | "warning";
  compact?: boolean;
}) {
  const ariaLabel =
    chart.kind === "line"
      ? `${chart.yAxisLabel} signal window chart`
      : `${chart.yAxisLabel} bar chart`;

  const body =
    chart.kind === "line" ? (
      <LineChartBody chart={chart} accent={accent} />
    ) : (
      <BarChartBody chart={chart} accent={accent} />
    );

  const svg = (
    <ChartSvg yAxisLabel={chart.yAxisLabel} ariaLabel={ariaLabel}>
      {body}
    </ChartSvg>
  );

  if (compact) {
    return <div className="evidence-index-card__preview">{svg}</div>;
  }

  return <div className="evidence-chart-wrap">{svg}</div>;
}
