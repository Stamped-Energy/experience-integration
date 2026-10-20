import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { RunChart, Sparkline } from "@/components/ui/charts";
import { DataTable, EvidenceTag, Illustrative, KpiRow, LineModeTag, ModeTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { PlantSectionMap, PlantTabs, crumbs, fmt, latest, openCards, readingsOf, seriesFor, tagsOf } from "@/components/plant/common";

export const metadata = { title: "Plant" };
export default async function PlantMap({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const sp = await searchParams;
  const a = D.assets.find((x) => x.id === sp.asset) ?? D.assets[1];
  const line = D.byId.line(a.lineId)!;
  const cards = D.proposals.filter((p) => ["Proposed", "Waiting", "Withheld"].includes(p.state));
  const settings = D.runningSettings.filter((s) => s.lineId === a.lineId);
  return (
    <Workspace crumbs={crumbs({ label: "Plant map" })} askContext="Plant map">
      <PageHeader eyebrow="Plant" title="Plant map" meta={`${D.site.name} · ${D.areas.length} areas · ${D.lines.length} lines · ${D.assets.length} assets. Grey unless something needs a person.`} actions={<AskButton context="Plant map" label="Ask about the plant" />} />
      <PlantTabs active="map" />
      <KpiRow label="Plant" items={[
        ...D.lines.map((l) => ({ label: l.short, value: l.kpis[0].value, unit: l.kpis[0].unit, foot: l.kpis[0].label })),
        { label: "Open decisions", value: String(cards.length), href: "/inbox" },
        { label: "Data sources", value: `${D.dataSources.filter((s) => s.gapPct === 0).length} of ${D.dataSources.length}`, foot: "without gaps", href: "/plant/data" },
      ]} />
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="span-8 xl-span-6 stack">
          <Section title="Sections" meta="Key reading per section · last reading of the latest run" flush actions={<Illustrative />}>
            <PlantSectionMap selected={a.id} hrefFor={(x) => `/plant?asset=${x.id}`} />
          </Section>
          <Section title="Lines" flush>
            <DataTable caption="Lines" rowKey={(l) => l.id} rows={D.lines} columns={[
              { key: "n", label: "Line", render: (l) => <Link className="link" href={`/process/lines/${l.id}`}>{l.name}</Link> },
              { key: "m", label: "Mode", render: (l) => <LineModeTag mode={l.mode} /> },
              { key: "p", label: "Product", render: (l) => l.product },
              ...[0, 1, 2].map((i) => ({ key: `k${i}`, label: `Figure ${i + 1}`, align: "right" as const, render: (l: typeof D.lines[number]) => l.kpis[i] ? <>{l.kpis[i].value}{l.kpis[i].unit ? ` ${l.kpis[i].unit}` : ""}<span className="cell-sub">{l.kpis[i].label}</span></> : null })),
              { key: "pk", label: "Line pack", render: (l) => <Link className="link" href={`/plant/line-packs?pack=${l.linePackId}`}>{D.linePacks.find((p) => p.id === l.linePackId)!.equipmentClass}</Link> },
            ]} />
          </Section>
          <div className="xl-hide"><Section title="Assets" flush>
            <DataTable caption="Assets" rowKey={(x) => x.id} rows={D.assets} columns={[
              { key: "n", label: "Asset", render: (x) => <Link className="link" href={`/plant/assets/${x.id}`}>{x.name}</Link> },
              { key: "l", label: "Line", render: (x) => D.byId.line(x.lineId)!.short },
              { key: "t", label: "Tags", render: (x) => tagsOf(x).map((t) => t.name).join(", ") },
              { key: "c", label: "Open", align: "right", render: (x) => openCards(x).length || "" },
            ]} />
          </Section></div>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title={a.name} meta={line.short} actions={<Link className="btn btn-sm" href={`/plant/assets/${a.id}`}>Explore</Link>} flush>
            <DataTable caption="Tags" rowKey={(t) => t.id} rows={tagsOf(a)} columns={[
              { key: "t", label: "Tag", render: (t) => t.name },
              { key: "s", label: "Trend", render: (t) => { const v = seriesFor(t).values; return v.length > 1 ? <Sparkline values={v} width={70} height={20} label={t.name} /> : null; } },
              { key: "v", label: "Last", align: "right", render: (t) => { const v = seriesFor(t).values.at(-1); return v !== undefined ? `${fmt(v)} ${t.unit}` : "no data"; } },
            ]} />
          </Section>
          <Section title="Running settings" meta={line.short} flush>
            <div className="rows">{settings.map((s) => <div key={s.param} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{s.name}</span><span className="row-sub">{s.value} {s.unit} · band {s.band[0]} to {s.band[1]}</span></span><ModeTag mode={s.mode} /></div>)}</div>
          </Section>
          <Section title="Since this morning" flush>
            <ul className="tl" style={{ padding: "8px 16px" }}>{D.shiftEvents.slice(-6).map((e) => <li key={e.at + e.text}><span className="t">{hhmm(e.at)}</span><span className={`k ${e.kind === "stop" ? "x" : "s"}`} /><span>{e.text}</span><span /></li>)}</ul>
          </Section>
          <div className="xl-hide stack"><OpenCards cards={cards} /></div>
        </div>
        <div className="xl-only stack xl-span-3"><OpenCards cards={cards} /><PlantHealth /></div>
      </div>
    </Workspace>
  );
}

function OpenCards({ cards }: { cards: typeof D.proposals }) {
  return (
    <Section title="Open decisions" meta={`${cards.length} on assets`} flush>
      <div className="rows">{cards.slice(0, 8).map((p) => { const as = D.assets.find((x) => x.id === p.assetId); return <Link key={p.id} href={`/process/proposals/${p.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{p.param}: {p.current} to {p.proposed}</span><span className="row-sub">{as?.name} · {rel(p.createdAt)}</span></span><Tag tone="accent">{p.state}</Tag></Link>; })}</div>
    </Section>
  );
}

function PlantHealth() {
  const lease = D.leases.find((l) => l.state === "active") ?? D.leases[0];
  return (
    <>
      <Section title="Data sources" flush actions={<Link className="link" href="/plant/data">Data health</Link>}>
        <div className="rows">{D.dataSources.map((s) => <div key={s.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{s.name}</span><span className="row-sub">{s.tags} tags · last seen {rel(s.lastSeen)}</span></span>{s.gapPct ? <Tag tone="warning">{s.gapPct}% gap</Tag> : <Tag>No gaps</Tag>}</div>)}</div>
      </Section>
      <Section title="Plant Box" actions={<Link className="link" href="/plant/box">Lease</Link>}>
        <dl className="facts-grid"><dt>Lease</dt><dd>{lease.id}, {lease.offlineMin ? `offline ${lease.offlineMin} min` : "connected"}</dd><dt>Limits</dt><dd>{lease.maxOfflineH} h then recommend-only, {lease.hardCapH} h cap</dd><dt>Last sync</dt><dd>{rel(D.plantBox.lastSync)}</dd></dl>
      </Section>
    </>
  );
}
