import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { SpcControlChart } from "@/components/view/spc-control-chart";
import { crumbs } from "@/components/quality/common";
import { spcCharts } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Control charts" };

export default function SpcPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Control charts" })} askContext="SPC control charts">
      <PageHeader
        eyebrow="Quality"
        title="Control charts"
        meta="X̄/R and I/MR with control and spec limits · Demonstration series only"
        actions={
          <>
            <Illustrative />
            <AskButton context="Control charts" label="Ask about SPC" />
          </>
        }
      />
      <QualityHubTabs />
      <p className="pfd-demo-banner">Demonstration SPC · Cp/Cpk illustrative · not verified savings</p>
      <div className="stack">
        {spcCharts.map((c) => (
          <Section key={c.characteristicId} title={c.name} meta={`${c.chart} · CL ${c.cl}`} flush>
            <div style={{ padding: 16 }} className="stack-sm">
              <SpcControlChart
                title={c.name}
                subtitle={`UCL ${c.ucl} · LCL ${c.lcl}${c.usl != null ? ` · USL ${c.usl}` : ""}${c.lsl != null ? ` · LSL ${c.lsl}` : ""}`}
                chartKind={c.chart}
                primary={{
                  label: c.chart === "xbar_r" ? "X̄" : "I",
                  values: c.values,
                  hits: c.hits.map((h) => h.at),
                }}
                secondary={
                  c.rangeValues?.length
                    ? { label: c.chart === "xbar_r" ? "R" : "MR", values: c.rangeValues }
                    : undefined
                }
                cl={c.cl}
                ucl={c.ucl}
                lcl={c.lcl}
                usl={c.usl}
                lsl={c.lsl}
                cp={c.cp}
                cpk={c.cpk}
              />
              <div className="chart-legend">
                <span>{c.values.length} subgroups</span>
                <EvidenceTag label={c.label} />
              </div>
            </div>
            <DataTable
              caption={`${c.name} points`}
              rows={c.values.map((v, i) => ({ i, v, hit: c.hits.find((h) => h.at === i)?.rule ?? null }))}
              rowKey={(r) => String(r.i)}
              columns={[
                { key: "i", label: "#", render: (r) => <span className="mono">{r.i + 1}</span> },
                { key: "v", label: "Value", render: (r) => <span className="mono">{r.v}</span> },
                {
                  key: "h",
                  label: "Rule",
                  render: (r) => (r.hit ? <Tag tone="critical">{r.hit}</Tag> : <span className="cell-sub">-</span>),
                },
              ]}
            />
          </Section>
        ))}
      </div>
    </Workspace>
  );
}
