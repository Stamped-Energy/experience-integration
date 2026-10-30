import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { supplierScores } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Supplier scorecard" };

export default function SuppliersPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Supplier scorecard" })} askContext="Supplier scorecard">
      <PageHeader
        eyebrow="Quality"
        title="Supplier scorecard"
        meta="Defect ppm and SCAR drafts · Recommend only · Illustrative until store feeds the screen"
        actions={
          <>
            <Illustrative />
            <AskButton context="Suppliers" label="Ask about suppliers" />
          </>
        }
      />
      <QualityHubTabs />
      <Section title="Suppliers" meta="Defect ppm and SCAR drafts" flush>
        <DataTable
          caption="Supplier scores"
          rows={supplierScores}
          rowKey={(r) => r.supplierId}
          columns={[
            {
              key: "n",
              label: "Supplier",
              render: (r) => (
                <span style={{ minWidth: 0, display: "block" }}>
                  <span className="truncate" style={{ display: "block" }}>{r.name}</span>
                  <span className="cell-sub mono">{r.supplierId}</span>
                </span>
              ),
            },
            { key: "l", label: "Lots", render: (r) => <span className="mono">{r.lots}</span> },
            { key: "p", label: "Defect ppm", render: (r) => <span className="mono">{r.defectPpm}</span> },
            {
              key: "d",
              label: "Top defect",
              render: (r) => (
                <span className="truncate" style={{ display: "block", minWidth: 0 }}>
                  {r.topDefect}
                </span>
              ),
            },
            {
              key: "s",
              label: "SCAR",
              render: (r) =>
                r.scarDraft ? (
                  <Tag tone="warning" title={r.scarDraft}>
                    Draft
                  </Tag>
                ) : (
                  <span className="cell-sub">None</span>
                ),
            },
          ]}
        />
        {supplierScores
          .filter((s) => s.scarDraft)
          .map((s) => (
            <div key={s.supplierId} className="cell-sub" style={{ marginTop: 8, overflowWrap: "anywhere" }}>
              {s.name}: {s.scarDraft}
            </div>
          ))}
      </Section>
    </Workspace>
  );
}
