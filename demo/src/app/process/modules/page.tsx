import * as D from "@/lib/demo/data";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Modules" };

const modules = [
  { id: "mod-tool", name: "Tool life", href: "/process/tool-life", note: "Taylor cards with abstain when n or C are not fitted" },
  { id: "mod-cycle", name: "Cycle time", href: "/process/cycle-time", note: "State dwell and share on the last shift" },
  { id: "mod-oee", name: "OEE", href: "/process/oee", note: "Loss trees for Mixer M1 and Press P3" },
  { id: "mod-smed", name: "SMED", href: "/process/smed", note: "Internal and external step table" },
  { id: "mod-sim", name: "Simulate", href: "/process/simulate", note: "Synthetic line trial, rates only" },
];

export default function ProcessModulesPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Modules" })} askContext="Process capability modules">
      <PageHeader eyebrow="Process" title="Modules" meta="Capability screens bundled for the demonstration plant. Each module uses illustrative data only." actions={<AskButton context="Process modules" label="Ask about modules" />} />
      <ProcessTabs active="modules" />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Available modules" actions={<Tag tone="neutral">Illustrative</Tag>} flush>
            <DataTable
              caption="Process modules"
              rowKey={(r) => r.id}
              rows={modules}
              columns={[
                { key: "n", label: "Module", render: (r) => <a className="link" href={r.href}>{r.name}</a> },
                { key: "note", label: "Summary", render: (r) => r.note },
              ]}
            />
          </Section>
        </div>
        <div className="span-4 stack ctx">
          <Section title="Lines in this plant" actions={<Illustrative />}>
            <div className="rows">{D.lines.map((l) => (
              <a key={l.id} className="row" href={`/process/lines/${l.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span><span className="row-title" style={{ display: "block" }}>{l.name}</span><span className="row-sub">{l.product}</span></span>
                <Tag>{l.short}</Tag>
              </a>
            ))}</div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
