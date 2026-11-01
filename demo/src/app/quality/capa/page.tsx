import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { capaCases } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "8D / CAPA" };

function statusTag(s: (typeof capaCases)[0]["status"]) {
  if (s === "open") return <Tag tone="warning">Open</Tag>;
  if (s === "waiting") return <Tag tone="info">Waiting</Tag>;
  return <Tag tone="success">Closed</Tag>;
}

export default function CapaPage() {
  return (
    <Workspace crumbs={crumbs({ label: "8D / CAPA" })} askContext="8D CAPA tracker">
      <PageHeader
        eyebrow="Quality"
        title="8D / CAPA"
        meta="D-step tracker · Recommend only · Illustrative lifecycle until store cards cover the screen"
        actions={
          <>
            <Illustrative />
            <AskButton context="8D CAPA" label="Ask about CAPA" />
          </>
        }
      />
      <QualityHubTabs />
      <Section title="Cases" meta="D-step tracker" flush>
        <DataTable
          caption="CAPA cases"
          rows={capaCases}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "t",
              label: "Case",
              render: (r) => (
                <span style={{ minWidth: 0, display: "block" }}>
                  <span className="truncate" style={{ display: "block" }}>{r.title}</span>
                  <span className="cell-sub mono">{r.id}</span>
                </span>
              ),
            },
            { key: "d", label: "D-step", render: (r) => <span className="mono">D{r.dStep}</span> },
            { key: "s", label: "Status", render: (r) => statusTag(r.status) },
            {
              key: "o",
              label: "Owner",
              render: (r) => (
                <span className="truncate" style={{ display: "block", minWidth: 0 }}>
                  {r.owner}
                </span>
              ),
            },
            {
              key: "l",
              label: "Lots",
              render: (r) => (
                <span className="mono" style={{ overflowWrap: "anywhere" }}>
                  {r.lotIds.length ? r.lotIds.join(", ") : "-"}
                </span>
              ),
            },
            { key: "due", label: "Due", render: (r) => <span className="mono">{r.due}</span> },
          ]}
        />
      </Section>
    </Workspace>
  );
}
