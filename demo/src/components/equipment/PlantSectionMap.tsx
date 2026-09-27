"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { SeverityTag } from "@/components/ui/indicators";
import { ChevronLeft } from "@/components/ui/icons";
import { formatIndianNum } from "@/lib/format";
import {
  PLANT_CARD_H,
  PLANT_CARD_W,
  findNodeInLevels,
  flowLabelPoint,
  flowPathBetween,
  nodeById,
  viewBoxMetrics,
  type EquipmentKind,
  type PlantEdge,
  type PlantFeature,
  type PlantSectionLevel,
  type PlantSectionNode,
} from "@/lib/plant-map-layout";

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;
const DEFAULT_MAP_PAD = 38;

const FLOW_STYLE = {
  power: { color: "#2f6fb0", dash: "7 7", width: 2.2, label: "Power feeder" },
  process: { color: "#5f6b7a", dash: "2 9", width: 4, label: "Material flow" },
  heat: { color: "#d97706", dash: "11 6", width: 2.6, label: "Gas / steam / heat" },
} as const;

/** Supply / generation assets — their kW is throughput, not load, so it is not summed. */
const SUPPLY_KINDS = new Set<EquipmentKind>(["substation", "transformer", "capacitor", "solar", "turbine"]);

export type PlantMapLevels = Record<string, PlantSectionLevel>;

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
}

function zoomedViewBox(
  base: { viewBox: string; aspectRatio: number },
  scale: number,
): { viewBox: string; aspectRatio: number } {
  const parts = base.viewBox.split(/\s+/).map(Number);
  const [x = 0, y = 0, w = 1, h = 1] = parts;
  const zw = w / scale;
  const zh = h / scale;
  const zx = x + (w - zw) / 2;
  const zy = y + (h - zh) / 2;
  return {
    viewBox: `${zx} ${zy} ${zw} ${zh}`,
    aspectRatio: base.aspectRatio,
  };
}

function edgeStyle(edge: PlantEdge) {
  return FLOW_STYLE[edge.kind ?? "power"];
}

function edgeValue(edge: PlantEdge) {
  return `${formatIndianNum(edge.kw, 1)} ${edge.unit ?? "kW"}`;
}

function kwText(kw: number) {
  return `${formatIndianNum(kw, kw < 100 ? 1 : 0)} kW`;
}

function FlowPath({
  from,
  to,
  edge,
  active,
  reducedMotion,
}: {
  from: PlantSectionNode;
  to: PlantSectionNode;
  edge: PlantEdge;
  active: boolean;
  reducedMotion: boolean;
}) {
  const path = flowPathBetween(from, to, edge.via);
  const style = edgeStyle(edge);
  const idle = edge.kw === 0;

  return (
    <g opacity={idle ? 0.4 : active ? 1 : 0.8} style={{ color: style.color }}>
      <path
        d={path}
        fill="none"
        stroke={style.color}
        strokeWidth={style.width + 5}
        strokeLinejoin="round"
        opacity={active ? 0.18 : 0.08}
      />
      <path
        d={path}
        fill="none"
        stroke={style.color}
        strokeWidth={style.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={style.dash}
        className={reducedMotion || idle ? undefined : "forge-section-flow"}
        markerEnd="url(#forge-section-arrow)"
      />
      {!reducedMotion && !idle ? (
        <circle r={3} fill={style.color} opacity={0.9}>
          <animateMotion dur={edge.via ? "5s" : "3s"} repeatCount="indefinite" path={path} />
        </circle>
      ) : null}
    </g>
  );
}

function FlowLabel({
  from,
  to,
  edge,
  active,
}: {
  from: PlantSectionNode;
  to: PlantSectionNode;
  edge: PlantEdge;
  active: boolean;
}) {
  const { x, y } = flowLabelPoint(from, to, edge.via);
  const label = edgeValue(edge);
  const style = edgeStyle(edge);
  const w = 14 + label.length * 6.1;

  return (
    <g opacity={active ? 1 : 0.9} className="forge-flow-label">
      <rect
        x={x - w / 2}
        y={y - 11}
        width={w}
        height={21}
        rx={3}
        fill="#fff"
        stroke={style.color}
        strokeWidth={active ? 1.6 : 1}
      />
      <text
        x={x}
        y={y + 3.5}
        textAnchor="middle"
        fill={style.color}
        fontSize={10.5}
        fontWeight={700}
        fontFamily="var(--forge-font-body)"
      >
        {label}
      </text>
    </g>
  );
}

/** 28×28 line glyphs for common plant equipment. */
function EquipmentGlyph({ kind, color }: { kind: EquipmentKind; color: string }) {
  const s = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const glyphs: Record<EquipmentKind, ReactNode> = {
    substation: (
      <>
        <path d="M4 24h20M7 24V12h14v12M10 12V6h8v6" {...s} />
        <path d="M14 15l-2 4h4l-2 4" {...s} />
      </>
    ),
    transformer: (
      <>
        <circle cx={10} cy={14} r={6} {...s} />
        <circle cx={18} cy={14} r={6} {...s} />
        <path d="M10 3v5M18 20v5" {...s} />
      </>
    ),
    capacitor: <path d="M14 3v8M6 11h16M6 17h16M14 17v8" {...s} />,
    crusher: (
      <>
        <path d="M4 5l8 9v10M24 5l-8 9v10" {...s} />
        <circle cx={14} cy={9} r={3} {...s} />
      </>
    ),
    mill: (
      <>
        <rect x={3} y={9} width={22} height={11} rx={5.5} {...s} />
        <circle cx={9} cy={14.5} r={1.4} fill={color} />
        <circle cx={14} cy={14.5} r={1.4} fill={color} />
        <circle cx={19} cy={14.5} r={1.4} fill={color} />
      </>
    ),
    kiln: (
      <>
        <path d="M3 18l20-8M5 23l20-8M3 18l2 5M23 10l2 5" {...s} />
        <path d="M9 7c1-2 3-2 2-4M15 6c1-2 3-2 2-4" {...s} />
      </>
    ),
    tower: <path d="M8 25V5h12v20M8 11h12M8 17h12M11 5V2h6v3" {...s} />,
    fan: (
      <>
        <circle cx={14} cy={14} r={10} {...s} />
        <path d="M14 14c0-5 4-6 5-4s-2 4-5 4zM14 14c-4 3-8 1-7-1s5-2 7 1zM14 14c4 2 3 7 1 7s-3-4-1-7z" {...s} />
      </>
    ),
    cooler: <path d="M3 8h22M3 14h22M3 20h22M7 8l-2 6 2 6M15 8l-2 6 2 6M23 8l-2 6 2 6" {...s} />,
    silo: (
      <>
        <ellipse cx={14} cy={6} rx={8} ry={2.5} {...s} />
        <path d="M6 6v13l8 6 8-6V6" {...s} />
      </>
    ),
    filter: <path d="M5 4h18v12l-9 8-9-8zM10 4v11M14 4v13M18 4v11" {...s} />,
    boiler: (
      <>
        <rect x={6} y={6} width={16} height={19} rx={2} {...s} />
        <path d="M10 25V14h8v11M11 3h6" {...s} />
      </>
    ),
    turbine: (
      <>
        <path d="M3 9l12 3v6L3 21z" {...s} />
        <circle cx={21} cy={15} r={4} {...s} />
        <path d="M15 15h2" {...s} />
      </>
    ),
    solar: <path d="M3 22l4-14h18l-4 14zM5 15h18M11 8l-2 14M17 8l-2 14" {...s} />,
    compressor: (
      <>
        <rect x={4} y={10} width={14} height={12} rx={2} {...s} />
        <path d="M18 14h5v-6M11 10V6h6M4 25h16" {...s} />
      </>
    ),
    pump: (
      <>
        <circle cx={13} cy={15} r={7} {...s} />
        <path d="M13 8V3h10M6 22l-2 3h18l-2-3" {...s} />
      </>
    ),
    packer: (
      <>
        <circle cx={14} cy={12} r={8} {...s} />
        <path d="M14 4v16M6 12h16M8 24h12" {...s} />
      </>
    ),
    conveyor: (
      <>
        <path d="M3 18l22-8" {...s} />
        <circle cx={5} cy={21} r={2.5} {...s} />
        <circle cx={23} cy={13} r={2.5} {...s} />
        <path d="M9 13l3-1M15 11l3-1" {...s} />
      </>
    ),
    genset: (
      <>
        <rect x={3} y={9} width={22} height={13} rx={2} {...s} />
        <path d="M8 9V5h5M15 13l-2 3h4l-2 3" {...s} />
      </>
    ),
    building: <path d="M4 25V10l10-6 10 6v15zM10 25v-7h8v7M9 13h3M16 13h3" {...s} />,
  };
  return <g>{glyphs[kind]}</g>;
}

function statusText(node: PlantSectionNode) {
  return node.status === "standby" ? "STBY" : node.status === "tripped" ? "TRIP" : "RUN";
}

function SectionCard({
  node,
  selected,
  onSelect,
  onDrill,
  drillable,
}: {
  node: PlantSectionNode;
  selected: boolean;
  onSelect: (n: PlantSectionNode) => void;
  onDrill: (n: PlantSectionNode) => void;
  drillable: boolean;
}) {
  const w = PLANT_CARD_W;
  const h = PLANT_CARD_H;
  const barW = w - 28;
  const loadFill = (Math.min(node.loadPct, 120) / 120) * barW;
  const dot =
    node.status === "standby"
      ? "#9aa1ab"
      : node.health === "hot"
        ? "var(--forge-error)"
        : node.health === "watch"
          ? "var(--forge-warning)"
          : "var(--forge-tertiary)";
  const meta = [node.tag, node.area].filter(Boolean).join(" · ");
  const footer = [node.voltage, node.runHours ? `${formatIndianNum(node.runHours)} h` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={selected ? "forge-plant-node forge-plant-node--selected" : "forge-plant-node"}
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(node)}
    >
      <title>{`${node.name} — ${node.area}`}</title>
      <rect
        width={w}
        height={h}
        rx={4}
        fill="#fff"
        stroke={selected ? node.accent : "rgba(40,36,32,0.16)"}
        strokeWidth={selected ? 2.4 : 1}
        filter="url(#plant-card-shadow)"
      />
      <rect width={w} height={4} fill={node.accent} />
      <rect x={12} y={14} width={34} height={34} rx={3} fill={node.surface} stroke={node.accent} strokeOpacity={0.35} />
      {node.kind ? (
        <g transform="translate(15, 17)">
          <EquipmentGlyph kind={node.kind} color={node.accent} />
        </g>
      ) : null}
      <text
        x={56}
        y={30}
        fill="var(--forge-on-surface)"
        fontSize={14.5}
        fontWeight={750}
        fontFamily="var(--forge-font-display)"
      >
        {node.name.length > 22 ? `${node.name.slice(0, 21)}…` : node.name}
      </text>
      <text x={56} y={45} fill="var(--forge-on-surface-variant)" fontSize={10} fontFamily="var(--forge-font-body)">
        {meta.length > 34 ? `${meta.slice(0, 33)}…` : meta}
      </text>
      <line x1={12} y1={58} x2={w - 12} y2={58} stroke="rgba(40,36,32,0.08)" />

      {[
        { label: "LOAD", value: `${node.loadPct}%`, x: 14, hot: node.loadPct > 100 },
        { label: "POWER", value: kwText(node.kw), x: 92, hot: false },
        { label: "PF", value: node.pf ? node.pf.toFixed(2) : "—", x: 186, hot: (node.pf ?? 1) < 0.9 },
      ].map((m) => (
        <g key={m.label}>
          <text x={m.x} y={74} fill="var(--forge-on-surface-variant)" fontSize={8.5} fontWeight={700} letterSpacing={0.6}>
            {m.label}
          </text>
          <text
            x={m.x}
            y={93}
            fill={m.hot ? "var(--forge-error)" : "var(--forge-on-surface)"}
            fontSize={16}
            fontWeight={800}
            fontFamily="var(--forge-font-display)"
          >
            {m.value}
          </text>
        </g>
      ))}

      <rect x={14} y={103} width={barW} height={5} rx={1} fill="rgba(40,36,32,0.08)" />
      <rect x={14} y={103} width={loadFill} height={5} rx={1} fill={node.loadPct > 100 ? "var(--forge-error)" : node.accent} />
      <line x1={14 + (100 / 120) * barW} y1={100} x2={14 + (100 / 120) * barW} y2={111} stroke="rgba(40,36,32,0.45)" strokeWidth={1} />

      <circle cx={18} cy={129.5} r={4} fill={dot}>
        {node.health === "hot" && node.status !== "standby" ? (
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        ) : null}
      </circle>
      <text x={27} y={133} fill="var(--forge-on-surface-variant)" fontSize={10} fontFamily="var(--forge-font-body)">
        <tspan fontWeight={750} letterSpacing={0.5}>{statusText(node)}</tspan>
        {footer ? ` · ${footer}` : ""}
      </text>
      {drillable ? (
        <g
          className="forge-plant-node__explore"
          role="button"
          aria-label={`Explore ${node.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDrill(node);
          }}
        >
          <rect
            x={w - 88}
            y={118}
            width={74}
            height={22}
            rx={3}
            fill={selected ? node.accent : "#fff"}
            stroke={node.accent}
            strokeWidth={1.1}
          />
          <text
            x={w - 51}
            y={133}
            textAnchor="middle"
            fill={selected ? "#fff" : node.accent}
            fontSize={10}
            fontWeight={750}
            fontFamily="var(--forge-font-body)"
          >
            Explore →
          </text>
        </g>
      ) : null}
    </g>
  );
}

function FeatureShape({ f }: { f: PlantFeature }) {
  const ink = "rgba(71,64,58,0.34)";
  const fill = "rgba(71,64,58,0.05)";
  const text = (x: number, y: number, anchor: "start" | "middle" = "middle", rotate?: number) =>
    f.label ? (
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fill="rgba(71,64,58,0.62)"
        fontSize={10.5}
        fontWeight={650}
        letterSpacing={0.4}
        transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      >
        {f.label}
      </text>
    ) : null;
  const w = f.w ?? 0;
  const h = f.h ?? 0;

  switch (f.kind) {
    case "fence":
      return (
        <g>
          <rect x={f.x} y={f.y} width={w} height={h} fill="none" stroke={ink} strokeWidth={1.2} strokeDasharray="14 5 2 5" />
          {text(f.x + 14, f.y + 18, "start")}
        </g>
      );
    case "road":
      return (
        <g>
          <rect x={f.x} y={f.y} width={w} height={h} fill="rgba(71,64,58,0.08)" />
          <line x1={f.x + w / 2} y1={f.y} x2={f.x + w / 2} y2={f.y + h} stroke="#fff" strokeWidth={2} strokeDasharray="16 12" />
          {text(f.x + w / 2 + 4, f.y + h / 2, "middle", -90)}
        </g>
      );
    case "rail": {
      const ties = Array.from({ length: Math.floor(w / 18) }, (_, i) => f.x + i * 18 + 6);
      return (
        <g>
          {ties.map((x) => (
            <line key={x} x1={x} y1={f.y - 3} x2={x} y2={f.y + h + 3} stroke={ink} strokeWidth={2} />
          ))}
          <line x1={f.x} y1={f.y} x2={f.x + w} y2={f.y} stroke={ink} strokeWidth={2} />
          <line x1={f.x} y1={f.y + h} x2={f.x + w} y2={f.y + h} stroke={ink} strokeWidth={2} />
          {text(f.x + 8, f.y + h + 20, "start")}
        </g>
      );
    }
    case "stockpile":
      return (
        <g>
          <path
            d={`M ${f.x} ${f.y + h} Q ${f.x + w * 0.18} ${f.y + h * 0.1} ${f.x + w / 2} ${f.y} Q ${f.x + w * 0.82} ${f.y + h * 0.1} ${f.x + w} ${f.y + h} Z`}
            fill="rgba(166,134,90,0.14)"
            stroke="rgba(166,134,90,0.5)"
          />
          {text(f.x + w / 2, f.y + h + 16)}
        </g>
      );
    case "stack":
      return (
        <g>
          <path d={`M ${f.x} ${f.y + h} L ${f.x + 4} ${f.y} L ${f.x + 14} ${f.y} L ${f.x + 18} ${f.y + h} Z`} fill={fill} stroke={ink} />
          <rect x={f.x + 3} y={f.y + 14} width={12} height={5} fill="rgba(214,69,58,0.35)" />
          <rect x={f.x + 3} y={f.y + 34} width={12} height={5} fill="rgba(214,69,58,0.35)" />
          {text(f.x + 9, f.y + h + 16)}
        </g>
      );
    case "cooling_tower":
      return (
        <g>
          <path
            d={`M ${f.x + w * 0.15} ${f.y} Q ${f.x + w * 0.34} ${f.y + h * 0.55} ${f.x} ${f.y + h} L ${f.x + w} ${f.y + h} Q ${f.x + w * 0.66} ${f.y + h * 0.55} ${f.x + w * 0.85} ${f.y} Z`}
            fill={fill}
            stroke={ink}
          />
          {text(f.x + w / 2, f.y + h + 16)}
        </g>
      );
    case "silo":
      return (
        <g>
          <rect x={f.x} y={f.y + 8} width={w} height={h - 8} fill={fill} stroke={ink} />
          <ellipse cx={f.x + w / 2} cy={f.y + 8} rx={w / 2} ry={8} fill="rgba(255,255,255,0.8)" stroke={ink} />
          {text(f.x + w / 2, f.y + h + 16)}
        </g>
      );
    case "pv": {
      const cols = Math.max(1, Math.floor(w / 46));
      return (
        <g>
          {Array.from({ length: cols * 2 }, (_, i) => (
            <rect
              key={i}
              x={f.x + (i % cols) * 46}
              y={f.y + Math.floor(i / cols) * (h / 2)}
              width={40}
              height={h / 2 - 8}
              fill="rgba(14,143,163,0.1)"
              stroke="rgba(14,143,163,0.4)"
            />
          ))}
          {text(f.x, f.y + h + 12, "start")}
        </g>
      );
    }
  }
}

function Backdrop({ level }: { level: PlantSectionLevel }) {
  return (
    <g aria-hidden="true">
      {level.features?.map((f, i) => <FeatureShape key={`f-${i}`} f={f} />)}
      {level.zones?.map((z) => (
        <g key={z.label}>
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx={2}
            fill="rgba(255,255,255,0.55)"
            stroke="rgba(71,64,58,0.22)"
            strokeDasharray="5 4"
          />
          <text x={z.x + 12} y={z.y + 17} fill="rgba(71,64,58,0.7)" fontSize={10} fontWeight={750} letterSpacing={0.9}>
            {z.label.toUpperCase()}
          </text>
        </g>
      ))}
    </g>
  );
}

function LevelKpis({ level }: { level: PlantSectionLevel }) {
  const running = level.nodes.filter((n) => n.status !== "standby");
  const consumers = running.filter((n) => !n.kind || !SUPPLY_KINDS.has(n.kind));
  const load = consumers.length
    ? consumers.reduce((s, n) => s + n.kw, 0)
    : Math.max(0, ...running.map((n) => n.kw));
  const critical = level.nodes.filter((n) => n.health === "hot" && n.status !== "standby").length;
  const warning = level.nodes.filter((n) => n.health === "watch" && n.status !== "standby").length;
  const pfs = running.map((n) => n.pf).filter((p): p is number => typeof p === "number");
  const pf = pfs.length ? pfs.reduce((s, p) => s + p, 0) / pfs.length : null;
  const items = [
    { label: "Assets", value: String(level.nodes.length) },
    { label: "Running", value: `${running.length}/${level.nodes.length}` },
    { label: "Metered load", value: kwText(load) },
    { label: "Avg PF", value: pf ? pf.toFixed(2) : "—" },
    { label: "Critical", value: String(critical), tone: critical ? "hot" : undefined },
    { label: "Warning", value: String(warning), tone: warning ? "watch" : undefined },
  ];
  return (
    <div className="plant-map-kpis" aria-label="Level summary">
      {items.map((k) => (
        <div key={k.label} className={`plant-map-kpis__item${k.tone ? ` plant-map-kpis__item--${k.tone}` : ""}`}>
          <span className="plant-map-kpis__label">{k.label}</span>
          <span className="plant-map-kpis__value tabular">{k.value}</span>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="plant-map-legend" aria-label="Map legend">
      {Object.entries(FLOW_STYLE).map(([key, s]) => (
        <span key={key} className="plant-map-legend__item">
          <svg width={26} height={8} aria-hidden="true">
            <line x1={1} y1={4} x2={25} y2={4} stroke={s.color} strokeWidth={Math.min(s.width, 3)} strokeDasharray={s.dash} strokeLinecap="round" />
          </svg>
          {s.label}
        </span>
      ))}
      <span className="plant-map-legend__item">
        <i style={{ background: "var(--forge-tertiary)" }} /> Normal
      </span>
      <span className="plant-map-legend__item">
        <i style={{ background: "var(--forge-warning)" }} /> ≥ 90 %
      </span>
      <span className="plant-map-legend__item">
        <i style={{ background: "var(--forge-error)" }} /> ≥ 105 %
      </span>
      <span className="plant-map-legend__item">
        <i style={{ background: "#9aa1ab" }} /> Standby
      </span>
    </div>
  );
}

function FlowStrip({
  level,
  selectedId,
}: {
  level: PlantSectionLevel;
  selectedId: string | null;
}) {
  if (level.edges.length === 0) return null;

  return (
    <div className="plant-map-flowstrip" aria-label="Energy and material flows at this level">
      <span className="plant-map-flowstrip__heading">
        <span className="plant-map-flowstrip__live-dot" />
        Live routes
      </span>
      {level.edges.map((edge) => {
        const from = nodeById(level, edge.from);
        const to = nodeById(level, edge.to);
        const active = selectedId === edge.from || selectedId === edge.to;
        return (
          <span
            key={`${edge.from}-${edge.to}`}
            className={`plant-map-flowstrip__item${active ? " plant-map-flowstrip__item--active" : ""}`}
            style={{ "--flow-accent": edgeStyle(edge).color } as CSSProperties}
          >
            <span className="plant-map-flowstrip__from">{from?.name}</span>
            <span className="plant-map-flowstrip__arrow">→</span>
            <span className="plant-map-flowstrip__to">{to?.name}</span>
            <span className="plant-map-flowstrip__kw tabular">{edgeValue(edge)}</span>
          </span>
        );
      })}
    </div>
  );
}

function healthLabel(h: PlantSectionNode["health"]) {
  return h === "hot" ? "Critical" : h === "watch" ? "Warning" : "Good";
}

function healthStatus(h: PlantSectionNode["health"]) {
  return h === "hot" ? "CRITICAL" : h === "watch" ? "WARNING" : "GOOD";
}

function DetailRows({ node }: { node: PlantSectionNode }) {
  const rows: Array<{ label: string; value: ReactNode; hot?: boolean }> = [
    { label: "Tag", value: node.tag ?? "—" },
    { label: "Description", value: node.area },
    { label: "Status", value: node.status === "standby" ? "Standby" : node.status === "tripped" ? "Tripped" : "Running" },
    { label: "Supply", value: node.voltage ?? "—" },
    { label: "Load", value: kwText(node.kw) },
    { label: "Load index", value: `${node.loadPct}%`, hot: node.loadPct > 100 },
    { label: "Power factor", value: node.pf ? node.pf.toFixed(2) : "—", hot: (node.pf ?? 1) < 0.9 },
  ];
  if (node.runHours) rows.push({ label: "Run hours (FY)", value: `${formatIndianNum(node.runHours)} h` });
  if (node.children?.length) rows.push({ label: "Sub-assets", value: String(node.children.length) });

  return (
    <div className="forge-detail-rows">
      {rows.map((r) => (
        <div key={r.label} className="forge-detail-row">
          <span className="forge-detail-row__label">{r.label}</span>
          <span
            className="forge-detail-row__value tabular"
            style={{ color: r.hot ? "var(--forge-error)" : undefined }}
          >
            {r.value}
          </span>
        </div>
      ))}
      <div className="forge-detail-row">
        <span className="forge-detail-row__label">Health</span>
        <SeverityTag status={healthStatus(node.health)} label={healthLabel(node.health)} />
      </div>
    </div>
  );
}

/** Plant section map — process + single-line view with drill-down. */
export function PlantSectionMap({
  levels,
  rootLevelId = "root",
  notes,
}: {
  levels: PlantMapLevels;
  rootLevelId?: string;
  notes?: string[];
}) {
  const [drillStack, setDrillStack] = useState<string[]>([rootLevelId]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animKey, setAnimKey] = useState(rootLevelId);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setDrillStack([rootLevelId]);
    setSelectedId(null);
    setZoom(1);
    setAnimKey(rootLevelId);
  }, [rootLevelId, levels]);

  const currentId = drillStack[drillStack.length - 1] ?? rootLevelId;
  const level = levels[currentId] ?? levels[rootLevelId];
  const canGoBack = drillStack.length > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!level) return;
    setAnimKey(level.id);
    setSelectedId(null);
    setZoom(1);
  }, [level?.id]);

  const nodeMap = useMemo(
    () => Object.fromEntries((level?.nodes ?? []).map((n) => [n.id, n])),
    [level?.nodes],
  );
  const baseVb = useMemo(
    () =>
      level
        ? viewBoxMetrics(level, DEFAULT_MAP_PAD)
        : { viewBox: "0 0 400 300", aspectRatio: 4 / 3 },
    [level],
  );
  const vb = useMemo(() => zoomedViewBox(baseVb, zoom), [baseVb, zoom]);

  const focusNode = selectedId
    ? (level ? nodeById(level, selectedId) : undefined) ??
      findNodeInLevels(levels, selectedId)
    : null;

  if (!level) {
    return (
      <p className="forge-page-lede">No map levels available for this plant.</p>
    );
  }

  function drillInto(node: PlantSectionNode) {
    if (levels[node.id]) {
      setDrillStack((stack) => [...stack, node.id]);
    }
  }

  function goBack(toId: string) {
    setDrillStack((stack) => {
      const idx = stack.indexOf(toId);
      if (idx < 0) return stack;
      return stack.slice(0, idx + 1);
    });
  }

  function goUp() {
    setDrillStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }

  function nudgeZoom(delta: number) {
    setZoom((z) => clampZoom(z + delta));
  }

  const edgesWithNodes = level.edges.flatMap((e) => {
    const a = nodeMap[e.from];
    const b = nodeMap[e.to];
    return a && b ? [{ e, a, b, active: selectedId === e.from || selectedId === e.to }] : [];
  });

  return (
    <div data-plant-section-map className="forge-page-stack">
      {notes?.length ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          {notes.join(" · ")}
        </p>
      ) : null}
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div className="forge-panel-header forge-panel-header--inset">
          <div className="forge-panel-header__toolbar">
            {canGoBack ? (
              <button
                type="button"
                className="forge-plant-map-back"
                onClick={goUp}
                style={{ marginBottom: 0 }}
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
                Back
              </button>
            ) : null}
            <nav
              aria-label="Plant map breadcrumb"
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              {drillStack.map((id, i) => {
                const label =
                  id === rootLevelId
                    ? levels[rootLevelId]?.title ?? "Plant"
                    : findNodeInLevels(levels, id)?.name ?? id;
                const isLast = i === drillStack.length - 1;
                return (
                  <span
                    key={`${id}-${i}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {i > 0 ? (
                      <span style={{ color: "var(--forge-on-surface-variant)" }}>/</span>
                    ) : null}
                    {isLast ? (
                      <strong>{label}</strong>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goBack(id)}
                        className="forge-breadcrumb-link"
                      >
                        {label}
                      </button>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>
          <PanelHeader title={level.title} subtitle={level.subtitle} />
        </div>

        <LevelKpis level={level} />

        <div className="forge-section-stage">
          <div className="forge-section-zoom" role="group" aria-label="Map zoom">
            <button
              type="button"
              className="forge-section-zoom__btn"
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => nudgeZoom(ZOOM_STEP)}
            >
              +
            </button>
            <button
              type="button"
              className="forge-section-zoom__btn"
              aria-label="Zoom out"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => nudgeZoom(-ZOOM_STEP)}
            >
              −
            </button>
            <button
              type="button"
              className="forge-section-zoom__btn forge-section-zoom__btn--reset"
              aria-label="Reset zoom"
              disabled={zoom === 1}
              onClick={() => setZoom(1)}
            >
              Reset
            </button>
          </div>
          <svg
            key={animKey}
            viewBox={vb.viewBox}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            className="forge-section-stage__svg"
            style={{ aspectRatio: vb.aspectRatio, minHeight: 560 }}
            role="img"
            aria-label={`${level.title} section map`}
          >
            <defs>
              <filter id="plant-card-shadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#473b35" floodOpacity="0.1" />
              </filter>
              <marker
                id="forge-section-arrow"
                viewBox="0 0 10 10"
                refX={8}
                refY={5}
                markerWidth={4}
                markerHeight={4}
                orient="auto"
              >
                <path d="M 0 1 L 9 5 L 0 9 Z" fill="currentColor" />
              </marker>
              <pattern id="forge-section-grid" width={40} height={40} patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(71,64,58,0.06)" strokeWidth={1} />
              </pattern>
            </defs>
            <rect x="-9999" y="-9999" width="99999" height="99999" fill="url(#forge-section-grid)" />

            <Backdrop level={level} />

            {edgesWithNodes.map(({ e, a, b, active }) => (
              <FlowPath
                key={`path-${e.from}-${e.to}`}
                from={a}
                to={b}
                edge={e}
                active={active}
                reducedMotion={reducedMotion}
              />
            ))}

            {level.nodes.map((node) => (
              <SectionCard
                key={node.id}
                node={node}
                selected={selectedId === node.id}
                onSelect={(n) => setSelectedId(n.id)}
                onDrill={drillInto}
                drillable={Boolean(levels[node.id])}
              />
            ))}

            {edgesWithNodes.map(({ e, a, b, active }) => (
              <FlowLabel key={`label-${e.from}-${e.to}`} from={a} to={b} edge={e} active={active} />
            ))}
          </svg>
          <Legend />
          <FlowStrip level={level} selectedId={selectedId} />
        </div>
      </Panel>

      <div className="forge-grid-60-40">
        <Panel>
          <PanelHeader eyebrow="Asset detail" title={focusNode?.name ?? level.title} />
          {focusNode ? (
            <DetailRows node={focusNode} />
          ) : (
            <p className="forge-page-lede" style={{ marginTop: 12 }}>
              Select an asset to view its tag, supply, load and power factor. Click{" "}
              <strong>Explore →</strong> to drill into equipment and sub-flows.
            </p>
          )}
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Connections at this level" title="Flow paths" />
          {level.edges.length === 0 ? (
            <p className="forge-page-lede" style={{ marginTop: 12 }}>
              No inter-section flows at this level.
            </p>
          ) : (
            <ul className="forge-flow-list">
              {level.edges.map((e) => {
                const a = nodeById(level, e.from);
                const b = nodeById(level, e.to);
                return (
                  <li key={`${e.from}-${e.to}`} className="forge-flow-list__item">
                    <span
                      className="forge-flow-list__dot"
                      style={{ background: edgeStyle(e).color }}
                    />
                    <span className="forge-flow-list__path">
                      <span>{a?.name}</span>
                      <span style={{ color: "var(--forge-on-surface-variant)" }}>→</span>
                      <span>{b?.name}</span>
                    </span>
                    <span className="forge-flow-list__kw tabular">{edgeValue(e)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
