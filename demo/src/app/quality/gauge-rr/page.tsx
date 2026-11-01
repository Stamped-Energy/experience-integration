import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { gaugeRrCards } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Gauge R&R" };

export default function GaugeRrPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Gauge R&R" })} askContext="Gauge R&R">
      <PageHeader
        eyebrow="Quality"
        title="Gauge R&R"
        meta="%GRR and ndc · Recommend only · Illustrative until MSA store exists"
        actions={
          <>
            <Illustrative />
            <AskButton context="Gauge R&R" label="Ask about gauge R&R" />
          </>
        }
      />
      <QualityHubTabs />
      <Section title="Studies" meta="%GRR and ndc" flush>
        <DataTable
          caption="Gauge R&R studies"
          rows={gaugeRrCards}
          rowKey={(r) => r.studyId}
          columns={[
            {
              key: "c",
              label: "Characteristic",
              render: (r) => (
                <span style={{ minWidth: 0, display: "block" }}>
                  <span className="truncate" style={{ display: "block" }}>{r.characteristic}</span>
                  <span className="cell-sub mono">{r.studyId}</span>
                </span>
              ),
            },
            { key: "g", label: "%GRR", render: (r) => <span className="mono">{r.grrPct.toFixed(1)}%</span> },
            { key: "ndc", label: "ndc", render: (r) => <span className="mono">{r.ndc.toFixed(1)}</span> },
            {
              key: "ok",
              label: "Claim",
              render: (r) =>
                r.supportsClaim ? <Tag tone="success">Supports</Tag> : <Tag tone="warning">Does not support</Tag>,
            },
            {
              key: "ev",
              label: "EV / AV / PV",
              render: (r) => (
                <span className="mono" style={{ overflowWrap: "anywhere" }}>
                  {r.ev} / {r.av} / {r.pv}
                </span>
              ),
            },
          ]}
        />
      </Section>
    </Workspace>
  );
}
