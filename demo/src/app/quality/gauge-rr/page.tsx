import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import { gaugeRrCards } from "@/lib/demo/capabilityScreens";
import { gaugeRrVerdict } from "@/lib/demo/verdicts";

export const metadata = { title: "Gauge R&R" };

export default function GaugeRrPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Gauge R&R" })} askContext="Gauge R&R">
      <PageHeader
        eyebrow={qualityEyebrow("/quality/gauge-rr")}
        title="Gauge R&R"
        meta="Fit under 10% GRR, fit with care from 10 to 30%, not fit above 30%. ndc at least 5."
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
              render: (r) => <span className="truncate" style={{ display: "block" }}>{r.characteristic}</span>,
            },
            { key: "g", label: "%GRR", render: (r) => <span className="mono">{r.grrPct.toFixed(1)}%</span> },
            { key: "ndc", label: "ndc", render: (r) => <span className="mono">{r.ndc.toFixed(1)}</span> },
            {
              key: "ok",
              label: "Verdict",
              render: (r) => {
                const v = gaugeRrVerdict(r.grrPct, r.ndc);
                return <Tag tone={v.tone}>{v.word}</Tag>;
              },
            },
            {
              key: "ev",
              label: "Detail · EV / AV / PV",
              render: (r) => (
                <span className="mono muted" style={{ overflowWrap: "anywhere", fontSize: 12 }}>
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
