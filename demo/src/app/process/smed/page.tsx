import Link from "next/link";
import * as D from "@/lib/demo/data";
import { smedSteps } from "@/lib/demo/capabilityScreens";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "SMED" };

const line = () => D.byId.line("line-b")!;

export default function SmedPage() {
  const l = line();
  const internal = smedSteps.filter((s) => s.phase === "internal");
  const external = smedSteps.filter((s) => s.phase === "external");
  const sum = (rows: typeof smedSteps) => rows.reduce((a, r) => a + r.baselineMin, 0);
  return (
    <Workspace crumbs={crumbs({ label: "SMED" })} askContext="Process SMED">
      <PageHeader
        eyebrow="Process"
        title="SMED steps"
        meta="Internal work happens while the line is stopped; external work can happen in parallel. Targets are signed separately from baseline observations."
        actions={<AskButton context="SMED on Line B" label="Ask about SMED" />}
      />
      <ProcessTabs active="smed" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title={`Tool change on ${l.short}`} meta={l.product} actions={<><Tag tone="neutral">Illustrative</Tag><Link className="link" href={`/process/lines/${l.id}`}>Line detail</Link></>} flush>
            <DataTable
              caption="SMED step table"
              rowKey={(r) => r.id}
              rows={smedSteps}
              columns={[
                { key: "ph", label: "Phase", render: (r) => <Tag tone={r.phase === "internal" ? "warning" : "info"}>{r.phase === "internal" ? "Internal" : "External"}</Tag> },
                { key: "st", label: "Step", render: (r) => <span style={{ fontWeight: 500 }}>{r.step}</span> },
                { key: "b", label: "Baseline", align: "right", mono: true, render: (r) => `${r.baselineMin} min` },
                { key: "t", label: "Target", align: "right", mono: true, render: (r) => `${r.targetMin} min` },
                { key: "o", label: "Last observed", align: "right", mono: true, render: (r) => (r.lastObservedMin != null ? `${r.lastObservedMin} min` : "None") },
                { key: "w", label: "Owner", render: (r) => r.owner },
              ]}
            />
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Totals" actions={<Illustrative />}>
            <dl className="facts-grid">
              <dt>Internal baseline</dt><dd className="num">{sum(internal)} min</dd>
              <dt>External baseline</dt><dd className="num">{sum(external)} min</dd>
              <dt>Internal target</dt><dd className="num">{internal.reduce((a, r) => a + r.targetMin, 0)} min</dd>
              <dt>External target</dt><dd className="num">{external.reduce((a, r) => a + r.targetMin, 0)} min</dd>
            </dl>
          </Section>
          <Section title="Rules">
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>External steps may run while the press is still producing. Internal steps require a stop and a named owner on the shift log.</p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
