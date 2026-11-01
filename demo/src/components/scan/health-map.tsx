/**
 * Health map panel (pattern from PlantCraft linkcraft health-map widget, Apache-2.0).
 * Restyled for Stamped; ISA words instead of bare percentages.
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import type { HealthArea, HealthCell, IsaState } from "@/lib/demo/healthMap";
import { StatusGlyph, BandSpark } from "@/components/plant/flow";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { Section } from "@/components/ui/primitives";
import * as D from "@/lib/demo/data";

const stClass: Record<IsaState, string> = { ok: "st-ok", watch: "st-watch", alarm: "st-alarm", unknown: "st-unknown" };

function mapIsa(s: IsaState): "normal" | "watch" | "act" | "trial" {
  if (s === "alarm") return "act";
  if (s === "watch") return "watch";
  return "normal";
}

export function HealthStatusStrip({ alarm, watch, ok, unknown }: { alarm: number; watch: number; ok: number; unknown: number }) {
  return (
    <div className="hmap-strip" role="status">
      <span><strong className="num">{alarm}</strong> in alarm</span>
      <span><strong className="num">{watch}</strong> on watch</span>
      <span><strong className="num">{ok}</strong> normal</span>
      {unknown ? <span><strong className="num">{unknown}</strong> unknown</span> : null}
    </div>
  );
}

export function HealthMapGrid({ areas, selectedId, onSelect }: { areas: HealthArea[]; selectedId?: string; onSelect?: (c: HealthCell) => void }) {
  return (
    <>
      {areas.map((area) => (
        <div key={area.id} className="hmap-area">
          <h3>{area.label}</h3>
          <div className="hmap-grid">
            {area.cells.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className={`hmap-cell ${stClass[c.state]}${selectedId === c.id ? " on" : ""}`}
                onClick={() => onSelect?.(c)}
                aria-label={`${c.label}, ${c.stateWord}${c.issue ? `, ${c.issue}` : ""}`}
              >
                <span className="hmap-name">{c.label}</span>
                {c.sublabel ? <span className="hmap-sub">{c.sublabel}</span> : null}
                <span className="hmap-state">{c.stateWord}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function WorstHealthList({ items }: { items: HealthCell[] }) {
  if (!items.length) return <p className="muted">Nothing outside normal on this scan.</p>;
  return (
    <div className="rows hmap-worst">
      {items.map((c) => (
        <Link key={c.id} href={c.href} className="row">
          <span>
            <span className="row-title">{c.label}</span>
            <span className="row-sub">{c.issue ?? c.area}</span>
          </span>
          <StatusGlyph s={mapIsa(c.state)} />
          <span className="link">Open</span>
        </Link>
      ))}
    </div>
  );
}

export function HealthCellDetail({ cell }: { cell: HealthCell | undefined }) {
  if (!cell) return <p className="muted">Select a cell to see detail.</p>;
  const tag = cell.assetId ? D.tags.find((t) => D.byId.asset(cell.assetId!)?.keyReadingTagId === t.id) : undefined;
  const band = tag ? D.runningSettings.find((s) => s.lineId === tag.lineId && s.name === tag.name)?.band : undefined;
  return (
    <div className="stack-sm">
      <p><StatusGlyph s={mapIsa(cell.state)} /> <strong>{cell.label}</strong></p>
      {cell.issue ? <p className="secondary">{cell.issue}</p> : null}
      {cell.sparkline && tag ? (
        <BandSpark values={cell.sparkline} band={band} label={`${cell.label} trend`} width={240} height={48} />
      ) : null}
      {band && tag ? (
        <LimitsBand name={tag.name} unit={tag.unit} signed={band} current={cell.sparkline?.at(-1) ?? band[0]} signedBy="Plant head" signedAt="Demonstration" legend />
      ) : null}
      <Link className="link" href={cell.href}>Open linked screen</Link>
    </div>
  );
}

export function HealthMapPageBody({ areas, worst, title }: { areas: HealthArea[]; worst: HealthCell[]; title: string }) {
  const [sel, setSel] = useState<HealthCell | undefined>(worst[0] ?? areas[0]?.cells[0]);
  return (
    <div className="grid">
      <div className="span-8 stack">
        <Section title={title} meta="One cell per machine, or per loop when the pack declares a large or critical asset">
          <HealthMapGrid areas={areas} selectedId={sel?.id} onSelect={setSel} />
        </Section>
      </div>
      <div className="span-4 stack">
        <Section title="Worst items" meta="Up to eight, alarm before watch" flush>
          <WorstHealthList items={worst} />
        </Section>
        <Section title="Selected cell" flush>
          <HealthCellDetail cell={sel} />
        </Section>
      </div>
    </div>
  );
}
