/** Plant map, redesigned: one swim lane per line in process order, equal tiles joined by thin connectors.
 *  ISA-101: grey by default; colour only for abnormal, trial or selection, always with a shape and a word. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { Asset, Tag as TagT } from "@/lib/demo/types";
import { hhmm } from "@/lib/format";
import { fmt, latest, openCards, readingsOf, seriesFor, tagsOf } from "@/components/plant/common";

export type Status = "normal" | "watch" | "act" | "trial";
/** Running settings belong to the asset they act on. The demo data has no asset on a running setting, so the map keeps this small table. */
const SETTING_ASSET: Record<string, string> = { "hold-temp": "a-hold", "hold-time": "a-hold", agitator: "a-mixer", "melt-temp": "b-press", "hold-pressure": "b-press", "cycle-time": "b-press" };
export const settingsOf = (a: Asset) => D.runningSettings.filter((s) => SETTING_ASSET[s.param] === a.id);

/** Sub-equipment: an asset drawn below the top row in the old section geometry hangs off the asset above it. */
export const parentOf = (a: Asset) => a.section.y === 0 ? undefined : D.assets.find((p) => p.lineId === a.lineId && p.section.y === 0 && p.section.x <= a.section.x && a.section.x < p.section.x + p.section.w);
export const mainAssets = (lineId: string) => D.assets.filter((a) => a.lineId === lineId && !parentOf(a)).sort((x, y) => x.section.x - y.section.x);
export const childrenOf = (a: Asset) => D.assets.filter((c) => parentOf(c)?.id === a.id);

export function bandOf(t: TagT): [number, number] | undefined {
  const s = D.runningSettings.find((x) => x.lineId === t.lineId && x.name === t.name);
  if (s) return s.band;
  const w = D.signedWindows.find((x) => x.lineId === t.lineId && x.name === t.name);
  return w ? [w.narrowedLow ?? w.low, w.narrowedHigh ?? w.high] : undefined;
}

export function tagStatus(t: TagT): { status: Status; why?: string } {
  const r = latest(t);
  const v = seriesFor(t).values.at(-1);
  const b = bandOf(t);
  if (r?.qualityCode === "bad") return { status: "act", why: `${t.name}: bad reading` };
  if (v !== undefined && b && (v < b[0] || v > b[1])) return { status: "act", why: `${t.name} outside ${b[0]} to ${b[1]} ${t.unit}` };
  const drift = D.driftSignals.find((d) => d.lineId === t.lineId && d.property === t.name);
  if (drift) return { status: "watch", why: `${t.name} drifting ${drift.direction}, ${drift.magnitude}` };
  if (r?.qualityCode === "uncertain") return { status: "watch", why: `${t.name}: uncertain reading` };
  return { status: "normal" };
}
const RANK: Record<Status, number> = { normal: 0, trial: 1, watch: 2, act: 3 };
export function assetStatus(a: Asset, withChildren = true): { status: Status; why: string[]; trial: boolean } {
  const parts = [...tagsOf(a).map(tagStatus), ...(withChildren ? childrenOf(a).flatMap((c) => tagsOf(c).map(tagStatus)) : [])];
  const trial = settingsOf(a).some((s) => s.mode === "Trial");
  let status: Status = trial ? "trial" : "normal";
  for (const p of parts) if (RANK[p.status] > RANK[status]) status = p.status;
  return { status, why: [...parts.filter((p) => p.why).map((p) => p.why!), ...(trial ? settingsOf(a).filter((s) => s.mode === "Trial").map((s) => `${s.name} on trial at ${s.value} ${s.unit}`) : [])], trial };
}
export const needsAttention = (a: Asset) => assetStatus(a).status !== "normal" || openCards(a).length > 0;

const WORD: Record<Status, string> = { normal: "Normal", watch: "Watch", act: "Act", trial: "Trial" };
export function StatusGlyph({ s, word = true }: { s: Status; word?: boolean }) {
  if (s === "normal") return word ? <span className="isa isa-normal">Normal</span> : null;
  const shape = s === "act" ? <svg width="12" height="11" viewBox="0 0 12 11" aria-hidden><path d="M6 0.5 11.5 10.5H0.5Z" /></svg>
    : s === "watch" ? <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden><path d="M5.5 0.5 10.5 5.5 5.5 10.5 0.5 5.5Z" /></svg>
    : <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><circle cx="5" cy="5" r="4.5" /></svg>;
  return <span className={`isa isa-${s}`}>{shape}{word ? WORD[s] : <span className="sr-only">{WORD[s]}</span>}</span>;
}

/** Grey trend with the limit band as a pale fill. */
export function BandSpark({ values, band, width = 64, height = 22, label }: { values: number[]; band?: [number, number]; width?: number; height?: number; label: string }) {
  if (values.length < 2) return <span className="nodata" style={{ width, height }} aria-label={`${label}: no readings`} />;
  const lo = Math.min(...values, ...(band ?? [])), hi = Math.max(...values, ...(band ?? []));
  const pad = (hi - lo) * 0.08 || 1;
  const y = (v: number) => height - 1 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (height - 2);
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="bspark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {band && <rect x={0} width={width} y={y(band[1])} height={Math.max(1, y(band[0]) - y(band[1]))} className="band" />}
      <polyline points={pts} fill="none" className="line" strokeWidth={1.25} />
    </svg>
  );
}

function lastAt(t: TagT) { return readingsOf(t).at(-1)?.at; }

export function Tile({ a, selected, href, dim, noKids }: { a: Asset; selected?: boolean; href: string; dim?: boolean; noKids?: boolean }) {
  const key = D.tags.find((t) => t.id === a.keyReadingTagId);
  const s = key ? seriesFor(key) : { values: [] as number[] };
  const v = s.values.at(-1);
  const st = assetStatus(a, !noKids);
  const cards = openCards(a);
  const overdue = cards.some((c) => Date.parse(c.expiresAt) < Date.parse(D.DEMO_NOW));
  const kids = noKids ? [] : childrenOf(a);
  const recent = s.values.slice(-12);
  return (
    <div className={`ptile-wrap${dim ? " dim" : ""}`}>
      <Link href={href} scroll={false} prefetch={false} data-tile className={`ptile st-${st.status}${selected ? " on" : ""}`} aria-current={selected ? "true" : undefined}
        title={st.why.join("; ") || undefined}>
        <span className="ptile-top"><span className="ptile-name">{a.name}</span><span className="ptile-marks">{st.trial && st.status !== "trial" ? <StatusGlyph s="trial" /> : null}<StatusGlyph s={st.status} word={st.status !== "normal"} /></span></span>
        <span className="ptile-mid">
          <span className="ptile-read">{v !== undefined ? fmt(v) : "–"}<small>{key?.unit}</small></span>
          {key && <BandSpark values={s.values.slice(-24)} band={bandOf(key)} label={`${key.name} trend`} />}
        </span>
        <span className="ptile-foot"><span className="ptile-tag">{key ? (v !== undefined ? key.name : `No reading${lastAt(key) ? ` since ${hhmm(lastAt(key)!)}` : ""}`) : "No key reading"}</span>
          {cards.length ? <span className={`ptile-badge${overdue ? " overdue" : ""}`} title={overdue ? "Overdue" : "Open decisions"}>{cards.length} open{overdue ? " · late" : ""}</span> : null}</span>
        {key && <span className="ptile-hover" aria-hidden><span className="label">Last hour · band {bandOf(key)?.join(" to ") ?? "none signed"}</span><BandSpark values={recent} band={bandOf(key)} width={150} height={40} label="" /></span>}
      </Link>
      {kids.length ? <span className="ptile-kids">{kids.map((c) => { const cs = assetStatus(c, false); const ck = D.tags.find((t) => t.id === c.keyReadingTagId); const cv = ck ? seriesFor(ck).values.at(-1) : undefined;
        return <Link key={c.id} href={href.replace(a.id, c.id)} scroll={false} prefetch={false} className={`pchip st-${cs.status}`} title={cs.why.join("; ") || undefined}>{c.name}{cv !== undefined ? <b>{fmt(cv)} {ck!.unit}</b> : null}<StatusGlyph s={cs.status} word={cs.status !== "normal"} /></Link>; })}</span> : null}
    </div>
  );
}
