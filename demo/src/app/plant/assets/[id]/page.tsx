import Link from "next/link";
import { nameOf } from "@/lib/names";
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
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: D.assets.find((a) => a.id === id)?.name ?? "Asset" };
}
export default async function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = D.assets.find((x) => x.id === id);
  if (!a) notFound();
  const line = D.byId.line(a.lineId)!;
  const tags = tagsOf(a);
  const settings = D.runningSettings.filter((s) => s.lineId === a.lineId);
  const events = D.shiftEvents.filter((e) => e.lineId === a.lineId);
  const writes = D.setpointWrites.filter((w) => D.runs.find((r) => r.id === w.runId)?.lineId === a.lineId).slice(-8).reverse();
  const cards = openCards(a);
  const siblings = D.assets.filter((x) => x.lineId === a.lineId);
  const readings = tags.flatMap((t) => readingsOf(t).slice(-4).map((r) => ({ ...r, t })));
  return (
    <Workspace crumbs={crumbs({ label: "Assets", href: "/plant" }, { label: a.name })} askContext={a.name}>
      <PageHeader eyebrow={`Asset · ${line.name}`} title={a.name} meta={`${tags.length} tags · key reading ${D.tags.find((t) => t.id === a.keyReadingTagId)?.name ?? "none"}`} actions={<AskButton context={a.name} label="Ask about this asset" />} />
      <PlantTabs active="assets" />
      <nav className="chips" aria-label="Assets on this line" style={{ marginBottom: 16 }}>{siblings.map((s) => <Link key={s.id} href={`/plant/assets/${s.id}`} style={s.id === a.id ? { fontWeight: 600 } : undefined}><span style={s.id === a.id ? { borderColor: "var(--text-primary)" } : undefined}>{s.name}</span></Link>)}</nav>
      <div className="grid">
        <div className="span-8 xl-span-6 stack">
          <div className="xl-cols-2" style={{ display: "grid", gap: 16 }}>
            {tags.map((t) => { const sr = seriesFor(t); const v = sr.values; return (
              <Section key={t.id} title={t.name} meta={`${t.unit} · ${v.length} points · ${sr.source}`} flush>
                <div className="chart-pad">{v.length > 1 ? <RunChart values={v} width={560} height={110} label={`${t.name}, ${t.unit}`} /> : <p className="muted" style={{ fontSize: 13, margin: 0 }}>Not enough readings to draw.</p>}</div>
              </Section>
            ); })}
          </div>
          <Section title="Parameters" meta="Latest readings with quality code and evidence label" flush>
            <DataTable caption="Readings" rowKey={(r) => `${r.tagId}-${r.at}`} rows={readings} columns={[
              { key: "t", label: "Tag", render: (r) => r.t.name },
              { key: "v", label: "Value", align: "right", render: (r) => `${fmt(r.value)} ${r.t.unit}` },
              { key: "q", label: "Quality", render: (r) => <Tag tone={r.qualityCode === "good" ? "neutral" : r.qualityCode === "bad" ? "critical" : "warning"}>{r.qualityCode}</Tag> },
              { key: "l", label: "Label", render: (r) => <EvidenceTag label={r.label} /> },
              { key: "r", label: "Run", render: (r) => <Link className="link" href={`/process/runs/${r.runId}`}>{nameOf(r.runId)}</Link> },
              { key: "a", label: "At", mono: true, render: (r) => `${dayMonth(r.at)} ${hhmm(r.at)}` },
            ]} />
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Events" meta={line.short} flush>
            <ul className="tl" style={{ padding: "8px 16px" }}>{events.map((e) => <li key={e.at + e.text}><span className="t">{hhmm(e.at)}</span><span className={`k ${e.kind === "stop" ? "x" : "s"}`} /><span>{e.text}</span><span /></li>)}</ul>
          </Section>
          <Section title="Reading quality" meta="All readings on this asset" flush>
            <DataTable caption="Quality" rowKey={(t) => t.id} rows={tags} columns={[
              { key: "t", label: "Tag", render: (t) => t.name },
              { key: "g", label: "Good", align: "right", render: (t) => readingsOf(t).filter((r) => r.qualityCode === "good").length },
              { key: "u", label: "Uncertain", align: "right", render: (t) => readingsOf(t).filter((r) => r.qualityCode === "uncertain").length },
              { key: "b", label: "Bad", align: "right", render: (t) => readingsOf(t).filter((r) => r.qualityCode === "bad").length },
            ]} />
          </Section>
          <Section title="Setpoint writes" meta={line.short} flush>
            <DataTable caption="Writes" rowKey={(w) => `${nameOf(w.runId)}-${w.param}-${w.at}`} rows={writes} columns={[
              { key: "p", label: "Setting", render: (w) => w.param },
              { key: "v", label: "To", align: "right", render: (w) => `${w.value}` },
              { key: "s", label: "Source", render: (w) => w.source },
              { key: "a", label: "At", mono: true, render: (w) => `${dayMonth(w.at)} ${hhmm(w.at)}` },
            ]} />
          </Section>
        </div>
        <div className="span-12 xl-span-3 stack">
          <div className="split xl-stack">
            <Section title="Facts">
              <dl className="facts-grid">
                <dt>Line</dt><dd><Link className="link" href={`/process/lines/${line.id}`}>{line.name}</Link></dd>
                <dt>Mode</dt><dd><LineModeTag mode={line.mode} /></dd>
                <dt>Tags</dt><dd>{tags.map((t) => t.name).join(", ")}</dd>
                <dt>Section</dt><dd>{a.section.w} by {a.section.h} on the line map</dd>
                <dt>Data</dt><dd>Plant historian</dd>
              </dl>
            </Section>
            <Section title="Running settings" flush>
              <div className="rows">{settings.map((s) => <div key={s.param} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{s.name}</span><span className="row-sub">{s.value} {s.unit} · band {s.band[0]} to {s.band[1]} · until {hhmm(s.expiresAt)}</span></span><ModeTag mode={s.mode} /></div>)}</div>
            </Section>
          </div>
          <Section title="Other assets on this line" flush>
            <div className="rows">{siblings.filter((x) => x.id !== a.id).map((x) => { const k = D.tags.find((t) => t.id === x.keyReadingTagId); const v = k ? seriesFor(k).values.at(-1) : undefined; return <Link key={x.id} className="row" href={`/plant/assets/${x.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{x.name}</span><span className="row-sub">{k?.name}</span></span><span className="mono">{v !== undefined && k ? `${fmt(v)} ${k.unit}` : ""}</span></Link>; })}</div>
          </Section>
          <Section title="Recent cards" flush>
            {cards.length ? <div className="rows">{cards.map((p) => <Link key={p.id} href={`/process/proposals/${p.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{p.param}: {p.current} to {p.proposed}</span><Tag tone="accent">{p.state}</Tag></Link>)}</div> : <p className="muted" style={{ fontSize: 13, margin: 16 }}>No open cards on this asset.</p>}
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
