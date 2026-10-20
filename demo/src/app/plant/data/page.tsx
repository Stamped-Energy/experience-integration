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
import { PlantSectionMap, PlantTabs, crumbs, fmt, latest, openCards, readingsOf, tagsOf } from "@/components/plant/common";
import type { DataGap } from "@/lib/demo/types";

export const metadata = { title: "Data health" };
const DAYS = 10;
const t0 = Date.parse(D.DEMO_NOW) - DAYS * 864e5;
const pct = (iso: string) => Math.max(0, Math.min(100, ((Date.parse(iso) - t0) / (DAYS * 864e5)) * 100));
const LOWERS: Record<string, string> = { historian: "Measured readings become Estimated across the gap", MES: "Run boundaries become Estimated", LIMS: "Lots stay unanchored; property bands cannot support a decision", "quality system": "Hold state unknown to Stamped" };

function GapStrip({ gaps, label }: { gaps: DataGap[]; label: string }) {
  return <div><div className="gap-strip" role="img" aria-label={label}>{gaps.map((g) => <i key={g.id} title={g.affects} style={{ left: `${pct(g.from)}%`, width: `${Math.max(0.8, pct(g.to) - pct(g.from))}%` }} />)}</div><div className="gap-axis"><span>{DAYS} days ago</span><span>now</span></div></div>;
}

export default async function DataHealth({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const sp = await searchParams;
  const sel = D.dataSources.find((s) => s.id === sp.source) ?? D.dataSources.find((s) => s.gapPct > 0)!;
  const gaps = D.dataGaps.filter((g) => g.sourceId === sel.id);
  return (
    <Workspace crumbs={crumbs({ label: "Data health" })} askContext="Data health">
      <PageHeader eyebrow="Plant" title="Data health" meta="Gaps and quality codes lower evidence labels. This is where a weak label usually starts." actions={<AskButton context="Data health" label="Ask about data" />} />
      <PlantTabs active="data" />
      <KpiRow label="Data" items={[
        { label: "Sources", value: String(D.dataSources.length) },
        { label: "Tags", value: String(D.dataSources.reduce((n, s) => n + s.tags, 0)) },
        { label: "Gaps, 10 days", value: String(D.dataGaps.length) },
        { label: "Worst gap rate", value: `${Math.max(...D.dataSources.map((s) => s.gapPct))}`, unit: "%" },
      ]} />
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="span-8 stack">
          <Section title="Sources" meta="Select a source to see its gaps" flush actions={<Illustrative />}>
            <DataTable caption="Sources" rowKey={(s) => s.id} rows={D.dataSources} columns={[
              { key: "n", label: "Source", render: (s) => <><Link className="link" href={`/plant/data?source=${s.id}`} scroll={false} style={s.id === sel.id ? { fontWeight: 600 } : undefined}>{s.name}</Link><span className="cell-sub">{s.kind}</span></> },
              { key: "t", label: "Tags", align: "right", render: (s) => s.tags },
              { key: "f", label: "Last seen", render: (s) => rel(s.lastSeen) },
              { key: "g", label: "Gap", align: "right", render: (s) => `${s.gapPct}%` },
              { key: "q", label: "Quality codes", render: (s) => <><span className="qc" aria-hidden><i style={{ width: `${s.qualityCodes.good}%` }} /><i style={{ width: `${s.qualityCodes.uncertain}%` }} /><i style={{ width: `${s.qualityCodes.bad}%` }} /></span><span className="cell-sub">{s.qualityCodes.good} good · {s.qualityCodes.uncertain} uncertain · {s.qualityCodes.bad} bad</span></> },
              { key: "l", label: "Lowers", render: (s) => (s.gapPct > 0 || s.qualityCodes.good < 100 ? <span style={{ fontSize: 12 }}>{LOWERS[s.kind]}</span> : <span className="muted">Nothing</span>) },
            ]} />
          </Section>
          <Section title="Coverage by source" meta="Last 10 days · gaps in amber" flush>
            <div className="stack-sm" style={{ padding: 16 }}>{D.dataSources.map((s) => <div key={s.id} style={{ display: "grid", gridTemplateColumns: "160px minmax(0,1fr)", gap: 12, alignItems: "center", fontSize: 13 }}><span>{s.name}</span><GapStrip gaps={D.dataGaps.filter((g) => g.sourceId === s.id)} label={`${s.name} coverage`} /></div>)}</div>
          </Section>
          <Section title="Tag readings with a non-good quality code" flush>
            <DataTable caption="Readings" rowKey={(r) => `${r.tagId}-${r.at}`} rows={D.tagReadings.filter((r) => r.qualityCode !== "good").slice(0, 8)} columns={[
              { key: "t", label: "Tag", render: (r) => D.tags.find((t) => t.id === r.tagId)?.name },
              { key: "a", label: "Asset", render: (r) => { const t = D.tags.find((x) => x.id === r.tagId)!; return <Link className="link" href={`/plant/assets/${t.assetId}`}>{D.assets.find((x) => x.id === t.assetId)?.name}</Link>; } },
              { key: "q", label: "Code", render: (r) => <Tag tone={r.qualityCode === "bad" ? "critical" : "warning"}>{r.qualityCode}</Tag> },
              { key: "l", label: "Label", render: (r) => <EvidenceTag label={r.label} /> },
              { key: "w", label: "At", mono: true, render: (r) => `${dayMonth(r.at)} ${hhmm(r.at)}` },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title={sel.name} meta={`${sel.kind} · last seen ${rel(sel.lastSeen)}`}>
            <GapStrip gaps={gaps} label={`${sel.name} gaps`} />
            <ul className="tl" style={{ marginTop: 12 }}>{gaps.length ? gaps.map((g) => <li key={g.id}><span className="t">{dayMonth(g.from)}</span><span className="k x" /><span>{hhmm(g.from)} to {hhmm(g.to)} · {g.affects}</span><span /></li>) : <li><span /><span /><span className="muted">No gaps in 10 days</span><span /></li>}</ul>
          </Section>
          <Section title="All gaps" flush>
            <div className="rows">{D.dataGaps.map((g) => <Link key={g.id} className="row" href={`/plant/data?source=${g.sourceId}`} scroll={false} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{g.affects}</span><span className="row-sub">{D.dataSources.find((s) => s.id === g.sourceId)?.name} · {dayMonth(g.from)} {hhmm(g.from)} to {hhmm(g.to)}</span></span><Tag tone="warning">Gap</Tag></Link>)}</div>
          </Section>
          <Section title="How labels drop">
            <dl className="facts-grid">
              <dt>Measured</dt><dd>Read from a good-quality tag with no gap</dd>
              <dt>Estimated</dt><dd>Filled across a short gap or from a linked run</dd>
              <dt>Modelled</dt><dd>From the line model, not a reading</dd>
              <dt>Assumed</dt><dd>Stated by a person; weakest label</dd>
            </dl>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
