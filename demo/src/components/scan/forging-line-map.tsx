"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { DiagramCanvas } from "@/components/scan/pfd/DiagramCanvas";
import { FORGING_EQUIPMENT, forgingLineDiagram, forgingLineShows, type EquipmentDetail } from "@/components/scan/pfd/forgingFixture";
import { forgingSymbolMap } from "@/components/scan/pfd/symbols";
import type { Element, SymbolElement } from "@/components/scan/pfd/model";
import { Section, Tag } from "@/components/ui/primitives";
import { StatusGlyph } from "@/components/plant/flow";

const stateGlyph = (s: string) => (s === "alarm" ? "act" : s === "watch" || s === "warning" ? "watch" : "normal");

export function ForgingLineMap() {
  const [selected, setSelected] = useState<EquipmentDetail | undefined>(FORGING_EQUIPMENT["eq-press"]);
  const symbols = forgingSymbolMap();
  const shows = forgingLineShows();

  const onOpen = useCallback((el: Element) => {
    if (el.type !== "symbol" || !el.asset_id) return;
    const detail = FORGING_EQUIPMENT[(el as SymbolElement).asset_id ?? el.id];
    if (detail) setSelected(detail);
  }, []);

  return (
    <div className="grid">
      <div className="span-8 stack">
        <p className="pfd-demo-banner">Demonstration data · PFD-style flow (equipment, live values, utility lines). Click a unit for detail.</p>
        <div className="pfd-legend" aria-hidden>
          <span><i className="ok" /> Normal</span>
          <span><i className="watch" /> Watch</span>
          <span><i className="alarm" /> Alarm</span>
          <span>Animated arrows · live flow (demo)</span>
        </div>
        <Section title="Press line B · forging PFD" meta="Click equipment for loops and tags" flush>
          <div className="dg-stage" aria-label="Forging process line diagram">
            <DiagramCanvas diagram={forgingLineDiagram} symbols={symbols} shows={shows} selectedId={selected?.id} onOpen={onOpen} />
          </div>
        </Section>
        <Section title="Utility loops (demo)" meta="Compressed air and cooling water" flush>
          <div className="rows">
            <Link className="row" href="/process/optimisation?loop=loop-util-compressed-air">
              <span><span className="row-title">Plant compressed air</span><span className="row-sub">Press line B · 18 optimisation runs on file</span></span>
              <Tag tone="neutral">Normal</Tag>
            </Link>
            <Link className="row" href="/process/optimisation?loop=loop-util-cooling-water">
              <span><span className="row-title">Cooling water return</span><span className="row-sub">HT and machining · watch on delta-T</span></span>
              <Tag tone="warning">Watch</Tag>
            </Link>
          </div>
        </Section>
      </div>
      <div className="span-4 stack ctx">
        <Section title="Equipment detail" meta={selected ? selected.title : "Select equipment on the map"} flush>
          {selected ? (
            <div className="pfd-detail stack-sm">
              <p><StatusGlyph s={stateGlyph(selected.tags.some((t) => t.state === "alarm") ? "act" : selected.tags.some((t) => t.state === "warning") ? "watch" : "normal")} /> <strong>{selected.title}</strong></p>
              <p className="secondary" style={{ fontSize: 13, margin: 0 }}>{selected.summary}</p>
              <div className="tag-row">
                {selected.tags.map((t) => (
                  <Tag key={t.label} tone={t.state === "alarm" ? "critical" : t.state === "warning" ? "warning" : "success"}>
                    {t.label} {t.value}{t.unit ? ` ${t.unit}` : ""}
                  </Tag>
                ))}
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, marginTop: 12 }}>Control loops</p>
              <div className="rows">
                {selected.loops.map((l) => (
                  <Link key={l.id} className="row" href={l.href} style={{ padding: "6px 12px" }}>
                    <span className="row-title">{l.label}</span>
                    <span className="link">Open</span>
                  </Link>
                ))}
              </div>
              <Link className="link" href={selected.assetHref}>Open plant asset</Link>
            </div>
          ) : (
            <p className="muted">Click press, furnace, machining, or inspection on the diagram.</p>
          )}
        </Section>
        <Section title="Batch line A (compact)" meta="Mixer and hold · demo" flush>
          <Link className="row" href="/process/lines/line-a">
            <span><span className="row-title">Batch line A</span><span className="row-sub">Mixer M1 hold torque on watch</span></span>
            <Tag tone="warning">Watch</Tag>
          </Link>
        </Section>
      </div>
    </div>
  );
}
