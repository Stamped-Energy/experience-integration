"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, LineModeTag, ModeTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { PlantTabs, crumbs, fmt, openCards, seriesFor, tagsOf } from "@/components/plant/common";
import { BandSpark, StatusGlyph, Tile, assetStatus, bandOf, childrenOf, mainAssets, needsAttention, parentOf, settingsOf, tagStatus } from "@/components/plant/flow";
import { TileKeys } from "@/components/plant/TileKeys";

type SP = { asset?: string; view?: string; need?: string };

export default function PlantMap() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const grid = sp.view === "grid";
  const need = sp.need === "1";
  const a = D.assets.find((x) => x.id === sp.asset) ?? D.assets.find((x) => assetStatus(x).status === "act") ?? D.assets.find(needsAttention) ?? D.assets[0];
  const line = D.byId.line(a.lineId)!;
  const q = (p: Partial<SP>) => { const o = { asset: sp.asset, view: sp.view, need: sp.need, ...p }; const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString(); return s ? `/plant?${s}` : "/plant"; };
  const hrefFor = (id: string) => q({ asset: id });
  const st = assetStatus(a);
  const parent = parentOf(a);
  const settings = settingsOf(a).length ? settingsOf(a) : D.runningSettings.filter((s) => s.lineId === a.lineId);
  const events = D.shiftEvents.filter((e) => e.lineId === a.lineId).slice(-3).reverse();
  const cards = openCards(a);
  const attention = D.assets.filter(needsAttention);
  const lease = D.leases.find((l) => l.state === "active");
  const offline = lease && lease.offlineMin > 0;

  const lanes = D.lines.map((l) => {
    const items = mainAssets(l.id).filter((x) => !need || needsAttention(x) || childrenOf(x).some(needsAttention));
    return (
      <section key={l.id} className="lane" aria-label={l.name}>
        <div className="lane-head">
          <b>{l.name}</b><span className="muted">{l.product}</span><LineModeTag mode={l.mode} />
          <span className="lane-kpis">{l.kpis.map((k) => <span key={k.label}><span className="muted">{k.label}</span> <b className="mono">{k.value}{k.unit ? ` ${k.unit}` : ""}</b></span>)}</span>
        </div>
        {offline && <div className="lane-banner">Plant Box offline {lease!.offlineMin} min; writes continue inside signed limits for up to {lease!.maxOfflineH} h.</div>}
        {items.length ? <div className="lane-tiles">{items.map((x) => <Tile key={x.id} a={x} href={hrefFor(x.id)} selected={x.id === a.id} />)}</div>
          : <p className="lane-quiet">All of {l.short} within limits.</p>}
      </section>
    );
  });
  const gridView = (
    <div className="pgrid">{D.assets.filter((x) => !need || needsAttention(x)).map((x) => <div key={x.id} className="pgrid-cell"><span className="pgrid-line">{D.byId.line(x.lineId)!.short}{parentOf(x) ? ` · on ${parentOf(x)!.name}` : ""}</span><Tile a={x} noKids href={hrefFor(x.id)} selected={x.id === a.id} /></div>)}</div>
  );

  return (
    <Workspace crumbs={crumbs({ label: "Plant map" })} askContext="Plant map">
      <PageHeader eyebrow="Plant" title="Plant map" meta={`${D.lines.length} lines in process order. Grey when normal; colour only when something is abnormal or on trial.`}
        actions={<span className="kpi-chips">{line.kpis.map((k) => <span key={k.label} className="kchip"><span className="muted">{line.short} · {k.label}</span><b className="mono">{k.value}{k.unit ? ` ${k.unit}` : ""}</b></span>)}</span>} />
      <PlantTabs active="map" />
      <div className="map-bar">
        <span className="seg" role="group" aria-label="View"><Link prefetch={false} scroll={false} className={!grid ? "on" : ""} href={q({ view: undefined })}>Flow</Link><Link prefetch={false} scroll={false} className={grid ? "on" : ""} href={q({ view: "grid" })}>Grid</Link></span>
        <Link prefetch={false} scroll={false} className={`fchip${need ? " on" : ""}`} href={q({ need: need ? undefined : "1" })} aria-pressed={need}>{need ? "✓ " : ""}Only items needing attention ({attention.length})</Link>
        <span className="spacer" />
        <span className="legend"><StatusGlyph s="act" /><StatusGlyph s="watch" /><StatusGlyph s="trial" /><span className="isa isa-normal">No mark: normal</span><span className="legend-band"><i />Signed band</span></span>
        <Illustrative />
      </div>
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <TileKeys className="canvas">{grid ? gridView : lanes}</TileKeys>
          <Section title="Needs attention" meta={`${attention.length} assets`} flush>
            <DataTable caption="Needs attention" rowKey={(x) => x.id} rows={attention} columns={[
              { key: "a", label: "Asset", render: (x) => <Link className="link" scroll={false} prefetch={false} href={hrefFor(x.id)}>{x.name}<span className="cell-sub">{D.byId.line(x.lineId)!.short}{parentOf(x) ? ` · on ${parentOf(x)!.name}` : ""}</span></Link> },
              { key: "s", label: "Status", render: (x) => <StatusGlyph s={assetStatus(x, false).status} /> },
              { key: "w", label: "Why", render: (x) => assetStatus(x, false).why.join("; ") || (openCards(x).length ? "Decision waiting" : "") },
              { key: "c", label: "Open decisions", align: "right", render: (x) => openCards(x).length || "" },
            ]} />
          </Section>
          <Section title="Running settings on all lines" meta="Written inside signed limits" flush>
            <DataTable caption="Running settings" rowKey={(s) => s.lineId + s.param} rows={D.runningSettings} columns={[
              { key: "n", label: "Setting", render: (s) => <>{s.name}<span className="cell-sub">{D.byId.line(s.lineId)!.short}</span></> },
              { key: "v", label: "Value", align: "right", render: (s) => `${s.value} ${s.unit}` },
              { key: "b", label: "Band", render: (s) => <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><BandSpark values={[s.band[0], s.value, s.value, s.band[1]].slice(1, 3)} band={s.band} width={56} height={14} label="" />{s.band[0]} to {s.band[1]}</span> },
              { key: "m", label: "Mode", render: (s) => <ModeTag mode={s.mode} /> },
              { key: "w", label: "Written", render: (s) => rel(s.writtenAt) },
            ]} />
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title={a.name} meta={`${line.short}${parent ? ` · on ${parent.name}` : ""}`} actions={<span className="ptile-marks"><StatusGlyph s={st.status} />{st.secondary.length ? <span className="isa-sec">also {st.secondary.join(", ")}</span> : null}</span>} flush>
            {st.why.length ? <ul className="why">{st.why.map((w) => <li key={w}>{w}</li>)}</ul> : <p className="muted" style={{ margin: "10px 16px", fontSize: 13 }}>All readings inside their bands.</p>}
            <div className="panel-actions"><AskButton context={a.name} label={`Ask about ${a.name}`} className="btn btn-primary btn-sm" /><Link className="btn btn-sm" href={`/plant/assets/${a.id}`}>Explore asset</Link></div>
            <DataTable caption="Tags" rowKey={(t) => t.id} rows={tagsOf(a)} columns={[
              { key: "t", label: "Tag", render: (t) => <>{t.name}<span className="cell-sub">{bandOf(t) ? `band ${bandOf(t)!.join(" to ")} ${t.unit}` : "no signed band"}</span></> },
              { key: "s", label: "Trend", render: (t) => <BandSpark values={seriesFor(t).values.slice(-24)} band={bandOf(t)} width={72} label={`${t.name} trend`} /> },
              { key: "v", label: "Last", align: "right", render: (t) => { const v = seriesFor(t).values.at(-1); const s = tagStatus(t).status; return <>{v !== undefined ? `${fmt(v)} ${t.unit}` : "No reading"}{s !== "normal" && <span className="cell-sub"><StatusGlyph s={s} /></span>}</>; } },
            ]} />
          </Section>
          <Section title="Running settings" meta={settingsOf(a).length ? a.name : `${line.short}; none on this asset`} flush>
            <div className="rows">{settings.map((s) => <div key={s.param} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{s.name}</span><span className="row-sub">{s.value} {s.unit} · band {s.band[0]} to {s.band[1]}</span></span><ModeTag mode={s.mode} /></div>)}</div>
          </Section>
          <Section title="Last 3 events" meta={line.short} flush>
            <ul className="tl" style={{ padding: "8px 16px" }}>{events.map((e) => <li key={e.at + e.text}><span className="t">{hhmm(e.at)}</span><span className={`k ${e.kind === "stop" ? "x" : "s"}`} /><span>{e.text}</span><span /></li>)}</ul>
          </Section>
          {cards.length ? <Section title="Open decisions" meta={a.name} flush>
            <div className="rows">{cards.map((p) => <Link key={p.id} href={`/process/proposals/${p.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{p.param}: {p.current} to {p.proposed}</span><span className="row-sub">{rel(p.createdAt)}</span></span><Tag>{p.state}</Tag></Link>)}</div>
          </Section> : null}
          <Section title="Since this morning" flush>
            <ul className="tl" style={{ padding: "8px 16px" }}>{D.shiftEvents.slice(-6).reverse().map((e) => <li key={e.at + e.text}><span className="t">{hhmm(e.at)}</span><span className="k s" /><span>{e.text}<span className="cell-sub">{D.byId.line(e.lineId)!.short}</span></span><span /></li>)}</ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
