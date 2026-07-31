"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { SeverityTag } from "@/components/ui/indicators";
import { ChevronLeft } from "@/components/ui/icons";
import { formatIndianNum } from "@/lib/format";
import {
  PLANT_CARD_H,
  PLANT_CARD_W,
  PLANT_ROOT_LEVEL,
  findSectionNode,
  flowLabelPoint,
  flowPathBetween,
  levelForNode,
  nodeById,
  viewBoxMetrics,
  type PlantSectionLevel,
  type PlantSectionNode,
} from "@/fixtures/plant-sections";

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;
const DEFAULT_MAP_PAD = 38;

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

function FlowPath({
  from,
  to,
  accent,
  active,
  reducedMotion,
}: {
  from: PlantSectionNode;
  to: PlantSectionNode;
  accent: string;
  active: boolean;
  reducedMotion: boolean;
}) {
  const path = flowPathBetween(from, to);

  return (
    <g opacity={active ? 1 : 0.72} style={{ color: accent }}>
      <path d={path} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={0.1} />
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="6 10"
        className={reducedMotion ? undefined : "forge-section-flow"}
        markerEnd="url(#forge-section-arrow)"
      />
      {!reducedMotion ? (
        <circle r={3} fill={accent} opacity={0.9}>
          <animateMotion dur="3s" repeatCount="indefinite" path={path} />
        </circle>
      ) : null}
    </g>
  );
}

function FlowLabel({
  from,
  to,
  kw,
  accent,
  active,
}: {
  from: PlantSectionNode;
  to: PlantSectionNode;
  kw: number;
  accent: string;
  active: boolean;
}) {
  const { x, y } = flowLabelPoint(from, to);
  const label = `${formatIndianNum(kw)} kW`;

  return (
    <g className="forge-flow-label" pointerEvents="none" opacity={active ? 1 : 0.88}>
      <rect
        x={x - 40}
        y={y - 12}
        width={80}
        height={24}
        rx={12}
        fill="rgba(255,255,255,0.96)"
        stroke={accent}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fill={accent}
        fontSize={11}
        fontWeight={750}
        fontFamily="var(--forge-font-body)"
      >
        {label}
      </text>
    </g>
  );
}

function SectionCard({
  node,
  selected,
  onSelect,
  onDrill,
}: {
  node: PlantSectionNode;
  selected: boolean;
  onSelect: (node: PlantSectionNode) => void;
  onDrill: (node: PlantSectionNode) => void;
}) {
  const drillable = Boolean(node.children?.length || levelForNode(node.id));
  const w = PLANT_CARD_W;
  const h = PLANT_CARD_H;

  return (
    <g
      className={`forge-plant-node${selected ? " forge-plant-node--selected" : ""}`}
      transform={`translate(${node.x}, ${node.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${node.name}, ${node.kw} kilowatts${drillable ? ", click to select, explore to drill in" : ""}`}
      aria-pressed={selected}
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(node)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(node);
        }
      }}
    >
      {selected ? (
        <rect
          x={-5}
          y={-2}
          width={w + 10}
          height={h + 6}
          rx={19}
          fill="none"
          stroke={node.accent}
          strokeWidth={2}
          opacity={0.28}
        />
      ) : null}
      <rect
        y={3}
        width={w}
        height={h - 3}
        rx={16}
        fill={node.surface}
        stroke={`${node.accent}55`}
        strokeWidth={1.25}
        filter="url(#plant-card-shadow)"
      />
      <rect y={3} width={w} height={7} rx={3} fill={node.accent} />
      {node.health === "hot" ? (
        <circle cx={w - 22} cy={34} r={5.5} fill="var(--forge-error)" />
      ) : node.health === "watch" ? (
        <circle cx={w - 22} cy={34} r={5.5} fill="var(--forge-warning)" />
      ) : (
        <circle cx={w - 22} cy={34} r={5.5} fill="var(--forge-tertiary)" />
      )}
      <text x={18} y={42} fill="var(--forge-on-surface)" fontSize={18} fontWeight={750} fontFamily="var(--forge-font-display)">
        {node.name}
      </text>
      <text x={18} y={62} fill="var(--forge-on-surface-variant)" fontSize={12} fontFamily="var(--forge-font-body)">
        {node.area}
      </text>
      <line x1={18} y1={76} x2={w - 18} y2={76} stroke="rgba(40,36,32,0.09)" />
      <text x={18} y={98} fill="var(--forge-on-surface-variant)" fontSize={10} fontWeight={700} letterSpacing={0.5}>
        LOAD
      </text>
      <text
        x={w - 18}
        y={100}
        textAnchor="end"
        fill={node.loadPct > 100 ? "var(--forge-error)" : node.accent}
        fontSize={22}
        fontWeight={800}
        fontFamily="var(--forge-font-display)"
      >
        {node.loadPct}%
      </text>
      <text x={18} y={124} fill={node.accent} fontSize={14} fontWeight={700} fontFamily="var(--forge-font-body)">
        {formatIndianNum(node.kw)} kW
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
          <rect x={w - 92} y={112} width={74} height={24} rx={12} fill={selected ? node.accent : "#fff"} stroke={node.accent} strokeWidth={1.25} />
          <text x={w - 55} y={128} textAnchor="middle" fill={selected ? "#fff" : node.accent} fontSize={10.5} fontWeight={750} fontFamily="var(--forge-font-body)">
            Explore →
          </text>
        </g>
      ) : null}
    </g>
  );
}

function FlowStrip({ level, selectedId }: { level: PlantSectionLevel; selectedId: string | null }) {
  if (level.edges.length === 0) return null;

  return (
    <div className="plant-map-flowstrip" aria-label="Energy flows at this level">
      <span className="plant-map-flowstrip__heading">
        <span className="plant-map-flowstrip__live-dot" />
        Live energy routes
      </span>
      {level.edges.map((edge) => {
        const from = nodeById(level, edge.from);
        const to = nodeById(level, edge.to);
        const active = selectedId === edge.from || selectedId === edge.to;
        return (
          <span
            key={`${edge.from}-${edge.to}`}
            className={`plant-map-flowstrip__item${active ? " plant-map-flowstrip__item--active" : ""}`}
            style={{ "--flow-accent": from?.accent ?? "var(--forge-tertiary)" } as CSSProperties}
          >
            <span className="plant-map-flowstrip__from">{from?.name}</span>
            <span className="plant-map-flowstrip__arrow">→</span>
            <span className="plant-map-flowstrip__to">{to?.name}</span>
            <span className="plant-map-flowstrip__kw tabular">{formatIndianNum(edge.kw)} kW</span>
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
  return (
    <div className="forge-detail-rows">
      <div className="forge-detail-row">
        <span className="forge-detail-row__label">Area</span>
        <span className="forge-detail-row__value">{node.area}</span>
      </div>
      <div className="forge-detail-row">
        <span className="forge-detail-row__label">Section load</span>
        <span className="forge-detail-row__value tabular">{formatIndianNum(node.kw)} kW</span>
      </div>
      <div className="forge-detail-row">
        <span className="forge-detail-row__label">Load index</span>
        <span className="forge-detail-row__value tabular" style={{ color: node.loadPct > 100 ? "var(--forge-error)" : undefined }}>
          {node.loadPct}%
        </span>
      </div>
      <div className="forge-detail-row">
        <span className="forge-detail-row__label">Health</span>
        <SeverityTag status={healthStatus(node.health)} label={healthLabel(node.health)} />
      </div>
    </div>
  );
}

export function PlantSectionMap() {
  const [drillStack, setDrillStack] = useState<string[]>(["root"]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animKey, setAnimKey] = useState("root");

  const currentId = drillStack[drillStack.length - 1] ?? "root";
  const level = levelForNode(currentId) ?? PLANT_ROOT_LEVEL;
  const canGoBack = drillStack.length > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setAnimKey(level.id);
    setSelectedId(null);
    setZoom(1);
  }, [level.id]);

  const nodeMap = useMemo(() => Object.fromEntries(level.nodes.map((n) => [n.id, n])), [level.nodes]);
  const baseVb = useMemo(() => viewBoxMetrics(level, DEFAULT_MAP_PAD), [level]);
  const vb = useMemo(() => zoomedViewBox(baseVb, zoom), [baseVb, zoom]);

  const focusNode = selectedId ? nodeById(level, selectedId) ?? findSectionNode(selectedId) : null;

  function drillInto(node: PlantSectionNode) {
    if (levelForNode(node.id)) {
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

  return (
    <div data-plant-section-map className="forge-page-stack">
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div className="forge-panel-header forge-panel-header--inset">
          <div className="forge-panel-header__toolbar">
            {canGoBack ? (
              <button type="button" className="forge-plant-map-back" onClick={goUp} style={{ marginBottom: 0 }}>
                <ChevronLeft size={16} strokeWidth={2.5} />
                Back
              </button>
            ) : null}
            <nav aria-label="Plant map breadcrumb" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
              {drillStack.map((id, i) => {
                const label = id === "root" ? "Plant" : findSectionNode(id)?.name ?? id;
                const isLast = i === drillStack.length - 1;
                return (
                  <span key={`${id}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {i > 0 ? <span style={{ color: "var(--forge-on-surface-variant)" }}>/</span> : null}
                    {isLast ? (
                      <strong>{label}</strong>
                    ) : (
                      <button type="button" onClick={() => goBack(id)} className="forge-breadcrumb-link">
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
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#473b35" floodOpacity="0.11" />
              </filter>
              <marker id="forge-section-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={4} markerHeight={4} orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 Z" fill="currentColor" />
              </marker>
            </defs>
            <pattern id="forge-section-dots" width={20} height={20} patternUnits="userSpaceOnUse">
              <circle cx={1} cy={1} r={0.8} fill="rgba(143,112,107,0.08)" />
            </pattern>
            <rect x="-9999" y="-9999" width="99999" height="99999" fill="url(#forge-section-dots)" />

            {level.edges.map((e) => {
              const a = nodeMap[e.from];
              const b = nodeMap[e.to];
              if (!a || !b) return null;
              return (
                <FlowPath
                  key={`path-${e.from}-${e.to}`}
                  from={a}
                  to={b}
                  accent={a.accent}
                  active={selectedId === e.from || selectedId === e.to}
                  reducedMotion={reducedMotion}
                />
              );
            })}

            {level.nodes.map((node) => (
              <SectionCard
                key={node.id}
                node={node}
                selected={selectedId === node.id}
                onSelect={(n) => setSelectedId(n.id)}
                onDrill={drillInto}
              />
            ))}

            {level.edges.map((e) => {
              const a = nodeMap[e.from];
              const b = nodeMap[e.to];
              if (!a || !b) return null;
              return (
                <FlowLabel
                  key={`label-${e.from}-${e.to}`}
                  from={a}
                  to={b}
                  kw={e.kw}
                  accent={a.accent}
                  active={selectedId === e.from || selectedId === e.to}
                />
              );
            })}
          </svg>
          <FlowStrip level={level} selectedId={selectedId} />
        </div>
      </Panel>

      <div className="forge-grid-60-40">
        <Panel>
          <PanelHeader eyebrow="Section detail" title={focusNode?.name ?? "Whole plant"} />
          {focusNode ? (
            <DetailRows node={focusNode} />
          ) : (
            <p className="forge-page-lede" style={{ marginTop: 12 }}>
              Select a section to preview load and health. Click <strong>Explore →</strong> to drill into equipment and sub-flows.
            </p>
          )}
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Connections at this level" title="Energy paths" />
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
                    <span className="forge-flow-list__dot" style={{ background: a?.accent ?? "var(--forge-tertiary)" }} />
                    <span className="forge-flow-list__path">
                      <span>{a?.name}</span>
                      <span style={{ color: "var(--forge-on-surface-variant)" }}>→</span>
                      <span>{b?.name}</span>
                    </span>
                    <span className="forge-flow-list__kw tabular">{formatIndianNum(e.kw)} kW</span>
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
