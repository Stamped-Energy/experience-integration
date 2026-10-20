/** Shared helpers for the Plant area: sub-navigation, crumbs, readings and the section map. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { Asset, Tag as TagT } from "@/lib/demo/types";
import type { Crumb } from "@/components/shell/Shell";
import { LineModeTag, Tabs } from "@/components/ui/primitives";

export type PlantTab = "map" | "assets" | "data" | "box" | "packs";
export function PlantTabs({ active }: { active: PlantTab }) {
  const items = [
    { key: "map", href: "/plant", label: "Plant map" },
    { key: "assets", href: `/plant/assets/${D.assets[1].id}`, label: "Assets", count: D.assets.length },
    { key: "data", href: "/plant/data", label: "Data health", count: D.dataGaps.length },
    { key: "box", href: "/plant/box", label: "Plant Box and lease" },
    { key: "packs", href: "/plant/line-packs", label: "Line packs", count: D.linePacks.length },
  ];
  return <Tabs label="Plant" items={items.map((i) => ({ ...i, active: i.key === active }))} />;
}
export const crumbs = (...rest: Crumb[]): Crumb[] => [{ label: "Demonstration plant", href: "/" }, { label: "Plant", href: "/plant" }, ...rest];

export const tagsOf = (a: Asset) => D.tags.filter((t) => t.assetId === a.id);
export const readingsOf = (t: TagT) => D.tagReadings.filter((r) => r.tagId === t.id).sort((a, b) => a.at.localeCompare(b.at));
export const latest = (t: TagT) => readingsOf(t).at(-1);
export const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(Math.abs(v) >= 10 ? 1 : 2));
/** A proposal on this asset that still waits for a person. */
export const openCards = (a: Asset) => D.proposals.filter((p) => p.assetId === a.id && ["Proposed", "Waiting", "Withheld"].includes(p.state));

/** Section map: each line drawn on an 8 by 4 grid from asset section geometry. Grey by default; colour only for abnormal readings and open decisions (ISA-101). */
export function PlantSectionMap({ selected, hrefFor }: { selected?: string; hrefFor: (a: Asset) => string }) {
  return (
    <div className="pmap">
      {D.lines.map((line) => (
        <div key={line.id} className="pmap-line">
          <div className="pmap-head"><b>{line.name}</b><span className="muted">{line.product}</span><LineModeTag mode={line.mode} /><span className="muted pmap-status">{line.status}</span></div>
          <div className="pmap-grid">
            {D.assets.filter((a) => a.lineId === line.id).map((a) => {
              const key = D.tags.find((t) => t.id === a.keyReadingTagId);
              const r = key ? latest(key) : undefined;
              const sv = key ? seriesFor(key).values.at(-1) : undefined;
              const bad = r && r.qualityCode !== "good";
              const cards = openCards(a).length;
              return (
                <Link key={a.id} href={hrefFor(a)} scroll={false} className={`pmap-sec${selected === a.id ? " on" : ""}${bad ? " bad" : ""}${cards ? " dec" : ""}`}
                  style={{ gridColumn: `${a.section.x + 1} / span ${a.section.w}`, gridRow: `${a.section.y + 1} / span ${a.section.h}` }}>
                  <span className="pmap-name">{a.name}</span>
                  {key ? <span className="pmap-read">{r ? fmt(r.value) : sv !== undefined ? fmt(sv) : "no data"}<small>{key.unit}</small></span> : null}
                  {key ? <span className="pmap-tag">{key.name}{bad ? `, ${r!.qualityCode}` : ""}</span> : null}
                  {cards ? <span className="pmap-cards">{cards} open</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A tag's recent values: historian readings where the demo has them, else the setpoint written each run, else the run outcome of the same name. */
export function seriesFor(t: TagT): { values: number[]; source: string } {
  const r = readingsOf(t);
  if (r.length) return { values: r.map((x) => x.value), source: "historian readings" };
  const runs = D.runs.filter((x) => x.lineId === t.lineId).sort((a, b) => a.end.localeCompare(b.end)).slice(-24);
  const set = D.runningSettings.find((s) => s.lineId === t.lineId && s.name === t.name);
  if (set) {
    const v = runs.map((run) => D.setpointWrites.find((w) => w.runId === run.id && w.param === set.param)?.value).filter((x): x is number => x !== undefined);
    if (v.length) return { values: v, source: "setpoint written per run" };
  }
  const o = runs.map((run) => run.outcomes.find((x) => x.name === t.name)?.value).filter((x): x is number => x !== undefined);
  if (o.length) return { values: o, source: "run outcome" };
  return { values: [], source: "no series in the demonstration data" };
}
