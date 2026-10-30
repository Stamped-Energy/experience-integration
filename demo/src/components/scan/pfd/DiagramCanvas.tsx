/**
 * Diagram canvas (ported from PlantCraft DiagramCanvas.tsx, Apache-2.0). View-only subset.
 */
"use client";

import { memo, type RefObject } from "react";
import type { ViewBox } from "./zoom";
import {
  formatValue,
  labelSpot,
  lineDrawing,
  linePath,
  mediumColor,
  symbolBox,
  type DiagramDraft,
  type Element,
  type LineElement,
  type Point,
  type Shown,
  type Shows,
  type Slot,
  type SymbolDef,
  type SymbolElement,
  type TextElement,
  type ValueElement,
} from "./model";

export interface CanvasProps {
  diagram: DiagramDraft;
  symbols: Map<string, SymbolDef>;
  shows?: Shows;
  selectedId?: string | null;
  onOpen?: (element: Element) => void;
  className?: string;
  view?: ViewBox | null;
  svgRef?: RefObject<SVGSVGElement | null>;
}

function tooltip(parts: Array<Shown | undefined>, fallback: string): string {
  const lines = parts.filter((part): part is Shown => Boolean(part)).map((part) => {
    if (part.error) return `${part.label}: ${part.error}`;
    const value = `${part.label}: ${formatValue(part.value)}${part.unit ? ` ${part.unit}` : ""}`;
    return value;
  });
  return [fallback, ...lines].filter(Boolean).join("\n");
}

const SymbolView = memo(function SymbolView({
  element,
  def,
  show,
  onOpen,
  picked,
}: {
  element: SymbolElement;
  def?: SymbolDef;
  show?: Partial<Record<Slot, Shown>>;
  onOpen?: (element: Element) => void;
  picked?: boolean;
}) {
  const box = symbolBox(element, def);
  const state = show?.state?.state ?? "unknown";
  const on = show?.running?.on;
  const flip = element.flip ? `translate(${element.w} 0) scale(-1 1)` : "";
  const turn = element.rotate ? `rotate(${element.rotate} ${element.w / 2} ${element.h / 2})` : "";
  const label = element.label_position === "none" ? "" : element.label;
  const fit = def?.stretch ? "none" : "xMidYMid meet";
  const gap = 20;
  const ringPad = 8;
  const labelAt: Record<string, [number, number, "start" | "middle" | "end", "auto" | "central" | "hanging"]> = {
    below: [box.x + box.w / 2, box.y + box.h + gap, "middle", "hanging"],
    above: [box.x + box.w / 2, box.y - gap, "middle", "auto"],
    left: [box.x - gap, box.y + box.h / 2, "end", "central"],
    right: [box.x + box.w + gap, box.y + box.h / 2, "start", "central"],
    inside: [box.x + box.w / 2, box.y + box.h / 2, "middle", "central"],
  };
  const [lx, ly, anchor, baseline] = labelAt[element.label_position] ?? labelAt.below;
  const clickable = Boolean(onOpen && element.asset_id);
  return (
    <g
      className={`dg-el dg-sym${clickable ? " dg-clickable" : ""}${picked ? " dg-picked" : ""}`}
      data-state={state}
      data-on={on === true ? "true" : on === false ? "false" : undefined}
      data-element={element.id}
      onClick={clickable ? () => onOpen?.(element) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(element); } } : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <title>{tooltip([show?.state, show?.running], element.label || def?.title || element.symbol)}</title>
      {def?.id !== "shape.panel" && def?.id !== "forge.pump" ? (
        <rect
          className="dg-status-ring"
          x={box.x - ringPad}
          y={box.y - ringPad}
          width={box.w + ringPad * 2}
          height={box.h + ringPad * 2}
          rx={10}
        />
      ) : null}
      <g transform={`translate(${element.x} ${element.y}) ${turn} ${flip}`}>
        {def?.id === "shape.panel" ? (
          <rect className="dg-drawing pc-state dg-panel" width={element.w} height={element.h} rx={8} />
        ) : def ? (
          <svg width={element.w} height={element.h} viewBox={`0 0 ${def.w} ${def.h}`} preserveAspectRatio={fit} overflow="visible" className="dg-drawing" dangerouslySetInnerHTML={{ __html: def.svg }} />
        ) : (
          <>
            <rect className="dg-missing" width={element.w} height={element.h} rx={4} />
            <text className="dg-missing-text" x={element.w / 2} y={element.h / 2 + 4} textAnchor="middle">
              {element.symbol}
            </text>
          </>
        )}
      </g>
      {label ? (
        <text className="dg-label" x={lx} y={ly} textAnchor={anchor} dominantBaseline={baseline}>
          {label}
        </text>
      ) : null}
    </g>
  );
});

function ValueView({ element, show, onOpen }: { element: ValueElement; show?: Shown; onOpen?: (element: Element) => void }) {
  const state = show?.state ?? "unknown";
  const text = show?.error ? "?" : formatValue(show?.value ?? null, element.decimals);
  const label = element.show_label && element.label ? `${element.label} ` : "";
  const unit = element.show_unit && show?.unit ? ` ${show.unit}` : "";
  const fontSize = Math.max(12, element.size);
  const width = Math.max(52, (label.length + text.length + unit.length) * fontSize * 0.58 + 14);
  const height = fontSize + 10;
  return (
    <g className={`dg-el dg-value${onOpen ? " dg-clickable" : ""}`} data-state={state} data-element={element.id}>
      <title>{tooltip([show], "")}</title>
      <rect className="dg-value-box" x={element.x} y={element.y} width={width} height={height} rx={3} />
      <text x={element.x + 7} y={element.y + fontSize + 1} fontSize={fontSize}>
        {label ? <tspan className="dg-value-label">{label}</tspan> : null}
        <tspan className="dg-value-number">{text}</tspan>
        {unit ? <tspan className="dg-value-unit">{unit}</tspan> : null}
      </text>
    </g>
  );
}

function LineView({ element, path, show }: { element: LineElement; path: Point[]; show?: Shown }) {
  if (path.length < 2) return null;
  const line = (points: Point[]) => points.map((point, index) => `${index ? "L" : "M"}${point[0]} ${point[1]}`).join(" ");
  const d = line(path);
  const drawing = lineDrawing(path, element.kind, element.arrow);
  const strokeColor = element.kind === "process" ? mediumColor(element.medium || "process") : mediumColor(element.medium);
  const spot = element.label ? labelSpot(path) : null;
  return (
    <g
      className={`dg-el dg-line dg-line-${element.kind}`}
      data-element={element.id}
      data-on={show?.on === true ? "true" : show?.on === false ? "false" : undefined}
      style={strokeColor ? { color: strokeColor } : undefined}
    >
      <title>{tooltip([show], element.label || element.medium)}</title>
      <path className="dg-line-hit" d={d} />
      <path className="dg-line-path" d={line(drawing.stroke)} />
      {show?.on ? <path className="dg-line-flow" d={d} /> : null}
      {drawing.heads.map((head, index) => (
        <path key={index} className="dg-arrowhead" d={`${line(head)} Z`} />
      ))}
      {drawing.flows.map((flow, index) => (
        <path key={`f${index}`} className="dg-flow-arrow" d="M-4 -4 L3 0 L-4 4 Z" transform={`translate(${flow.at[0]} ${flow.at[1]}) rotate(${flow.angle})`} />
      ))}
      {spot && element.label ? (
        <text className="dg-label dg-line-label" x={spot.at[0]} y={spot.at[1]} textAnchor={spot.anchor} dominantBaseline={spot.anchor === "start" ? "central" : "auto"}>
          {element.label}
        </text>
      ) : null}
    </g>
  );
}

function TextView({ element }: { element: TextElement }) {
  const size = Math.max(12, element.size);
  return (
    <g className="dg-el dg-text" data-element={element.id}>
      <text x={element.x} y={element.y} fontSize={size} textAnchor={element.align} fontWeight={element.bold ? 600 : 400}>
        {element.text.split("\n").map((lineText, index) => (
          <tspan key={index} x={element.x} dy={index ? size * 1.25 : 0}>
            {lineText}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export function DiagramCanvas({ diagram, symbols, shows, selectedId, onOpen, className, view, svgRef }: CanvasProps) {
  const lines = diagram.elements.filter((element): element is LineElement => element.type === "line");
  const others = diagram.elements.filter((element) => element.type !== "line");
  const vb = view ? `${view.x} ${view.y} ${view.w} ${view.h}` : `0 0 ${diagram.width} ${diagram.height}`;
  return (
    <svg
      ref={svgRef}
      className={`dg-canvas ${className ?? ""}`}
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={diagram.name}
    >
      <rect className="dg-background" width={diagram.width} height={diagram.height} />
      {lines.map((ln) => (
        <LineView key={ln.id} element={ln} path={linePath(ln)} show={shows?.get(ln.id)?.flow} />
      ))}
      {others.map((element) => {
        if (element.type === "symbol") {
          return (
            <SymbolView
              key={element.id}
              element={element}
              def={symbols.get(element.symbol)}
              show={shows?.get(element.id)}
              onOpen={onOpen}
              picked={selectedId === element.id}
            />
          );
        }
        if (element.type === "value") {
          return <ValueView key={element.id} element={element} show={shows?.get(element.id)?.value} onOpen={onOpen} />;
        }
        if (element.type === "text") return <TextView key={element.id} element={element} />;
        return null;
      })}
    </svg>
  );
}
