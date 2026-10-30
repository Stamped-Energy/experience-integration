import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { RunChart } from "@/components/ui/charts";
import { DataTable, EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { spcCharts } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Control charts" };

export default function SpcPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Control charts" })} askContext="SPC control charts">
      <PageHeader
        eyebrow="Quality"
        title="Control charts"
        meta="Western Electric / Nelson rules · Recommend only · Illustrative series until store samples exist"
        actions={
          <>
            <Illustrative />
            <AskButton context="Control charts" label="Ask about SPC" />
          </>
        }
      />
      <QualityHubTabs />
      <div className="stack">
        {spcCharts.map((c) => (
          <Section
            key={c.characteristicId}
            title={c.name}
            meta={`${c.chart} · UCL ${c.ucl} · CL ${c.cl} · LCL ${c.lcl}`}
            flush
          >
            <div style={{ padding: 16 }}>
              <RunChart values={c.values} spec={[c.lcl, c.ucl]} width={520} height={150} label={`${c.name} control chart`} />
              <div className="chart-legend"><span>{c.values.length} points</span><EvidenceTag label={c.label} /></div>
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
