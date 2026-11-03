import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import { supplierScores } from "@/lib/demo/capabilityScreens";
import { supplierPpmVerdict } from "@/lib/demo/verdicts";

export const metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Suppliers" })} askContext="Suppliers">
      <PageHeader
        eyebrow={qualityEyebrow("/quality/suppliers")}
        title="Suppliers"
        meta="Defect ppm vs a 1,000 ppm target, plus SCAR drafts. Recommend only."
        actions={
          <>
            
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
              render: (r) => <span className="truncate" style={{ display: "block" }}>{r.name}</span>,
            },
            { key: "l", label: "Lots", render: (r) => <span className="mono">{r.lots}</span> },
            {
              key: "p",
              label: "Defect ppm",
              render: (r) => {
                const v = supplierPpmVerdict(r.defectPpm);
                return (
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className="mono">
                      {r.defectPpm} <span className="muted">/ {v.target}</span>
                    </span>
                    <Tag tone={v.tone}>{v.word}</Tag>
                  </span>
                );
              },
            },
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
