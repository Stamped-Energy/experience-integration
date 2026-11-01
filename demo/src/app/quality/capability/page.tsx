import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { capabilityCards } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Capability" };

export default function CapabilityPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Capability" })} askContext="Process capability">
      <PageHeader
        eyebrow="Quality"
        title="Capability"
        meta="Cp / Cpk / Pp / Ppk · Recommend only · Illustrative until store samples exist"
        actions={
          <>
            <Illustrative />
            <AskButton context="Capability" label="Ask about capability" />
          </>
        }
      />
      <QualityHubTabs />
      <Section title="Characteristics" meta="Cp / Cpk / Pp / Ppk" flush>
        <DataTable
          caption="Capability cards"
          rows={capabilityCards}
          rowKey={(r) => r.characteristicId}
          columns={[
            {
              key: "n",
              label: "Characteristic",
              render: (r) => (
                <span style={{ minWidth: 0, display: "block" }}>
                  <span className="truncate" style={{ display: "block" }}>{r.name}</span>
                  <span className="cell-sub mono">{r.characteristicId}</span>
                </span>
              ),
            },
            { key: "count", label: "n", render: (r) => <span className="mono">{r.n}</span> },
            { key: "cp", label: "Cp", render: (r) => <span className="mono">{r.cp.toFixed(2)}</span> },
            { key: "cpk", label: "Cpk", render: (r) => <span className="mono">{r.cpk.toFixed(2)}</span> },
            { key: "pp", label: "Pp", render: (r) => <span className="mono">{r.pp.toFixed(2)}</span> },
            { key: "ppk", label: "Ppk", render: (r) => <span className="mono">{r.ppk.toFixed(2)}</span> },
            {
              key: "lim",
              label: "Limits",
              render: (r) => (
                <span className="mono" style={{ overflowWrap: "anywhere" }}>
                  {r.lsl} to {r.usl}
                </span>
              ),
            },
          ]}
        />
      </Section>
    </Workspace>
  );
}
