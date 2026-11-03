import Link from "next/link";
import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { crumbs, processEyebrow } from "@/components/process/common";
import { oeeLossCards } from "@/lib/demo/capabilityScreens";
import { oeePartVerdict } from "@/lib/demo/verdicts";
import * as D from "@/lib/demo/data";

export const metadata = { title: "OEE" };

const OEE_TARGET = 0.85;

function partCell(value: number, label: string) {
  const v = oeePartVerdict(value, OEE_TARGET);
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="mono">
        {(value * 100).toFixed(0)}% <span className="muted">/ {(OEE_TARGET * 100).toFixed(0)}%</span>
      </span>
      <Tag tone={v.tone}>{label}: {v.word}</Tag>
    </span>
  );
}

export default function OeePage() {
  const cards = oeeLossCards;
  return (
    <Workspace crumbs={crumbs({ label: "OEE" })} askContext="OEE">
      <PageHeader
        eyebrow={processEyebrow("/process/oee")}
        title="OEE"
        meta="Availability, performance and quality vs an 85% target. Recommend only."
        actions={
          <>
            
            <AskButton context="OEE" label="Ask about OEE" />
          </>
        }
      />
      <ProcessHubTabs />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Assets" meta="Each part vs target 85%" flush>
            <DataTable
              caption="OEE by asset"
              rows={cards}
              rowKey={(r) => r.assetId}
              columns={[
                {
                  key: "a",
                  label: "Asset",
                  render: (r) => {
                    const line = D.byId.line(r.lineId);
                    return (
                      <span style={{ minWidth: 0, display: "block" }}>
                        <span className="truncate" style={{ display: "block" }}>{r.assetName}</span>
                        <Link className="link cell-sub" href={`/process/lines/${r.lineId}`}>
                          {line?.short ?? r.lineId}
                        </Link>
                      </span>
                    );
                  },
                },
                { key: "o", label: "OEE", render: (r) => partCell(r.oee, "OEE") },
                { key: "av", label: "A", render: (r) => partCell(r.availability, "A") },
                { key: "p", label: "P", render: (r) => partCell(r.performance, "P") },
                { key: "q", label: "Q", render: (r) => partCell(r.quality, "Q") },
                {
                  key: "top",
                  label: "Top loss",
                  render: (r) => {
                    const top = [...r.downtimeByReason].sort((a, b) => b.seconds - a.seconds)[0];
                    return top ? <span>{top.reason}</span> : <span className="cell-sub">-</span>;
                  },
                },
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
