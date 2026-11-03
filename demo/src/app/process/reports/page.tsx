import Link from "next/link";
import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ExportAsMenu } from "@/components/view/export-as";
import { PLANT_REPORTS, type DemoReport } from "@/lib/demo/plantReport";
import { crumbs, processEyebrow } from "@/components/process/common";

export const metadata = { title: "Reports" };

function statusTag(r: DemoReport) {
  return r.status === "ready" ? (
    <Tag tone="success" dot>
      Ready
    </Tag>
  ) : (
    <Tag tone="warning" dot>
      Draft
    </Tag>
  );
}

export default function ProcessReportsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Reports" })} askContext="Process reports">
      <PageHeader
        eyebrow={processEyebrow("/process/reports")}
        title="Reports"
        meta="Shift notes, trial verdicts, and MIS packs"
        actions={<AskButton context="Process reports" label="Ask about reports" />}
      />
      <ProcessHubTabs />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Plant reports" meta={`${PLANT_REPORTS.length} reports`} flush>
            <DataTable
              caption="Plant reports"
              rowKey={(r) => r.id}
              rows={PLANT_REPORTS}
              columns={[
                {
                  key: "r",
                  label: "Report",
                  render: (r) => (
                    <Link className="link" href={`/process/reports/${r.id}`}>
                      {r.name}
                      <span className="cell-sub">
                        {r.kind} · {r.periodLabel}
                      </span>
                    </Link>
                  ),
                },
                {
                  key: "l",
                  label: "Line",
                  render: (r) => (
                    <>
                      {r.lineLabel}
                      <span className="cell-sub">{r.industry}</span>
                    </>
                  ),
                },
                { key: "s", label: "Status", render: statusTag },
                { key: "u", label: "Updated", render: (r) => r.updatedLabel },
                {
                  key: "e",
                  label: "Export",
                  render: (r) => (
                    <ExportAsMenu
                      reportName={r.name}
                      formats={r.formats}
                      ready={r.status === "ready"}
                      blockedReason="Draft until the process engineer signs"
                    />
                  ),
                },
              ]}
            />
          </Section>
          <Section title="What these reports are for" flush>
            <dl className="facts-grid" style={{ padding: "12px 16px" }}>
              <dt>Shift handover</dt>
              <dd>What ran, what moved, and what the next shift should check.</dd>
              <dt>Weekly ops / scrap</dt>
              <dd>Line scrap, cavity weight, and bounded changes for the week.</dd>
              <dt>Trial verdict</dt>
              <dd>Signed trial effect, interval, and proof links for the plant pack.</dd>
              <dt>MIS / OEE</dt>
              <dd>Plant availability, performance, and quality for the weekly MIS sheet.</dd>
              <dt>Holding check</dt>
              <dd>Measurement plans that are holding, faded, or inconclusive.</dd>
            </dl>
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="Export rules">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>Ready reports export as PDF, Excel, CSV, or Word.</li>
              <li>Drafts stay inside the plant until signed.</li>
              <li>Evidence labels travel with each figure.</li>
              <li>Each export is written to the audit log in a live plant.</li>
            </ul>
          </Section>
          <Section title="By industry" flush>
            <div className="rows">
              {["Discrete moulding", "Forging and heat treatment", "Plant MIS", "Process measurement"].map((industry) => {
                const n = PLANT_REPORTS.filter((r) => r.industry === industry).length;
                return (
                  <div key={industry} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <span className="row-title">{industry}</span>
                    <span className="row-sub num">{n}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
