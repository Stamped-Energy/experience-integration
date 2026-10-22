"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { RunChart, Sparkline } from "@/components/ui/charts";
import { DataTable, EvidenceTag, Illustrative, KpiRow, LineModeTag, ModeTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { PlantSectionMap, PlantTabs, crumbs, fmt, latest, openCards, readingsOf, tagsOf } from "@/components/plant/common";

export default function LinePacks() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const p = D.linePacks.find((x) => x.id === sp.pack) ?? D.linePacks[0];
  const lines = D.lines.filter((l) => l.linePackId === p.id);
  return (
    <Workspace crumbs={crumbs({ label: "Line packs" })} askContext="Line packs">
      <PageHeader eyebrow="Plant" title="Line packs" meta="One pack per equipment class: what a run is, which series and setpoints matter, the model, the limits and the words the UI uses." actions={<AskButton context="Line packs" label="Ask about line packs" />} />
      <PlantTabs active="packs" />
      <div className="grid">
        <div className="span-4 xl-span-3 stack">
          <Section title="Packs" flush>
            <div className="rows pack-list">{D.linePacks.map((x) => <Link key={x.id} href={`/plant/line-packs?pack=${x.id}`} scroll={false} className={`row${x.id === p.id ? " on" : ""}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{x.equipmentClass}</span><span className="row-sub">{x.runDefinition}</span></span><span className="mono muted">{nameOf(x.id)}</span></Link>)}</div>
          </Section>
          <Section title="Words this pack sets">
            <dl className="facts-grid">
              <dt>A run</dt><dd>{p.labels.run}</dd><dt>Runs</dt><dd>{p.labels.runs}</dd><dt>Unit</dt><dd>{p.labels.unit}</dd><dt>Outcome</dt><dd>{p.labels.outcome}</dd>
            </dl>
          </Section>
          <Section title="Running settings on these lines" flush>
            <div className="rows">{D.runningSettings.filter((r) => lines.some((l) => l.id === r.lineId)).map((r) => <div key={r.lineId + r.param} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{r.name}</span><span className="row-sub">{r.value} {r.unit} · band {r.band[0]} to {r.band[1]}</span></span><ModeTag mode={r.mode} /></div>)}</div>
          </Section>
        </div>
        <div className="span-8 xl-span-6 stack">
          <Section title={p.equipmentClass} actions={<Illustrative />}>
            <dl className="facts-grid">
              <dt>Run definition</dt><dd>{p.runDefinition}</dd>
              <dt>Model</dt><dd><Link className="link" href="/process/model-fit">{nameOf(p.modelId)}</Link></dd>
              <dt>Window template</dt><dd>{p.windowTemplate}</dd>
              <dt>Link threshold</dt><dd>{p.linkThreshold} · lot links below it wait for a person</dd>
            </dl>
          </Section>
          <div className="split">
            <Section title="Series" meta={`${p.series.length} read each run`}><div className="chips">{p.series.map((s) => <span key={s}>{s}</span>)}</div></Section>
            <Section title="Setpoints" meta={`${p.setpoints.length} Stamped may propose`}><div className="chips">{p.setpoints.map((s) => <span key={s}>{s}</span>)}</div></Section>
          </div>
          <Section title="Constraints" meta="Checked by the safety filter before any proposal" flush>
            <div className="rows">{p.constraints.map((c, i) => <div key={c} className="row" style={{ gridTemplateColumns: "28px minmax(0,1fr)" }}><span className="mono muted">{i + 1}</span><span className="row-title">{c}</span></div>)}</div>
          </Section>
          <Section title="Signed windows from this pack" flush>
            <DataTable caption="Windows" rowKey={(w) => `${w.lineId}-${w.param}`} rows={D.signedWindows.filter((w) => lines.some((l) => l.id === w.lineId))} columns={[
              { key: "n", label: "Setting", render: (w) => w.name },
              { key: "l", label: "Line", render: (w) => D.byId.line(w.lineId)!.short },
              { key: "b", label: "Window", align: "right", render: (w) => `${w.low} to ${w.high} ${w.unit}` },
            ]} />
          </Section>
        </div>
        <div className="span-12 xl-span-3 stack">
          <Section title="Lines using it" flush>
            <div className="rows">{lines.map((l) => <Link key={l.id} className="row" href={`/process/lines/${l.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{l.name}</span><span className="row-sub">{l.product}</span></span><LineModeTag mode={l.mode} /></Link>)}</div>
          </Section>
          <Section title="Assets in those lines" flush>
            <div className="rows">{D.assets.filter((a) => lines.some((l) => l.id === a.lineId)).map((a) => <Link key={a.id} className="row" href={`/plant/assets/${a.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{a.name}</span><span className="muted">{tagsOf(a).length} tags</span></Link>)}</div>
          </Section>
          <Section title="Recent setpoint writes" flush>
            <DataTable caption="Writes" rowKey={(w) => `${nameOf(w.runId)}-${w.param}`} rows={D.setpointWrites.filter((w) => lines.some((l) => l.id === D.runs.find((r) => r.id === w.runId)?.lineId)).slice(-6).reverse()} columns={[
              { key: "p", label: "Setting", render: (w) => w.param },
              { key: "v", label: "Value", align: "right", render: (w) => w.value },
              { key: "s", label: "Source", render: (w) => w.source },
            ]} />
          </Section>
        </div>
        <div className="span-12">
          <Section title="Packs side by side" flush>
            <DataTable caption="Packs" rowKey={(x) => x.id} rows={D.linePacks} columns={[
              { key: "c", label: "Equipment class", render: (x) => <Link className="link" href={`/plant/line-packs?pack=${x.id}`} scroll={false}>{x.equipmentClass}</Link> },
              { key: "r", label: "Run", render: (x) => x.runDefinition },
              { key: "s", label: "Series", render: (x) => x.series.join(", ") },
              { key: "p", label: "Setpoints", render: (x) => x.setpoints.join(", ") },
              { key: "m", label: "Model", render: (x) => nameOf(x.modelId) },
              { key: "w", label: "Windows", render: (x) => x.windowTemplate },
              { key: "t", label: "Link threshold", align: "right", render: (x) => x.linkThreshold },
              { key: "l", label: "Lines", render: (x) => D.lines.filter((l) => l.linePackId === x.id).map((l) => l.short).join(", ") },
            ]} />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
