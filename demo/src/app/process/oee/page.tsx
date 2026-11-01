import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";
import { oeeLossCards } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "OEE loss tree" };

export default function OeePage() {
  const cards = oeeLossCards.map((r) => ({ ...r, status: "example" as const }));
  return (
    <Workspace crumbs={crumbs({ label: "OEE loss tree" })} askContext="OEE loss tree">
      <PageHeader
        eyebrow="Process"
        title="OEE loss tree"
        meta="Availability × performance × quality · Recommend only · Store samples when present, else caller inputs"
        actions={
          <>
            <Tag tone="warning">Illustrative</Tag>
            <AskButton context="OEE loss tree" label="Ask about OEE" />
          </>
        }
      />
      <ProcessHubTabs />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Assets" meta="Availability × performance × quality" flush>
            <DataTable
              caption="OEE by asset"
              rows={cards}
              rowKey={(r) => r.assetId}
              columns={[
                {
                  key: "a",
                  label: "Asset",
                  render: (r) => (
                    <span style={{ minWidth: 0, display: "block" }}>
                      <span className="truncate" style={{ display: "block" }}>{r.assetName}</span>
                      <span className="cell-sub mono">{r.assetId}</span>
                    </span>
                  ),
                },
                { key: "o", label: "OEE", render: (r) => <span className="mono">{(r.oee * 100).toFixed(0)}%</span> },
                { key: "av", label: "A", render: (r) => <span className="mono">{(r.availability * 100).toFixed(0)}%</span> },
                { key: "p", label: "P", render: (r) => <span className="mono">{(r.performance * 100).toFixed(0)}%</span> },
                { key: "q", label: "Q", render: (r) => <span className="mono">{(r.quality * 100).toFixed(0)}%</span> },
              ]}
            />
          </Section>
          {cards.map((r) => (
            <Section key={r.assetId} title={`${r.assetName} losses`} meta="Downtime by reason · cycle share">
              <div className="grid oee-loss-grid">
                <div className="span-6">
                  <DataTable
                    caption="Downtime"
                    rows={r.downtimeByReason}
                    rowKey={(d) => d.reason}
                    columns={[
                      { key: "r", label: "Reason", render: (d) => d.reason },
                      { key: "s", label: "Seconds", render: (d) => <span className="mono">{d.seconds}</span> },
                    ]}
                  />
                </div>
                <div className="span-6">
                  <DataTable
                    caption="Cycle share"
                    rows={r.cycleShare}
                    rowKey={(c) => c.state}
                    columns={[
                      { key: "s", label: "State", render: (c) => <Tag>{c.state}</Tag> },
                      { key: "p", label: "Share", render: (c) => <span className="mono">{(c.share * 100).toFixed(0)}%</span> },
                    ]}
                  />
                </div>
              </div>
            </Section>
          ))}
        </div>
      </div>
    </Workspace>
  );
}
