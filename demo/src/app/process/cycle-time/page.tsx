import Link from "next/link";
import * as D from "@/lib/demo/data";
import { cycleTimeStates, cycleTimeWindow } from "@/lib/demo/cycleTime";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, EvidenceTag, Illustrative, KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Cycle time" };

export default function CycleTimePage() {
  const line = D.byId.line(cycleTimeWindow.lineId)!;
  const totalMin = cycleTimeStates.reduce((a, s) => a + s.dwellMin, 0);
  return (
    <Workspace crumbs={crumbs({ label: "Cycle time" })} askContext="Process cycle time">
      <PageHeader
        eyebrow="Process"
        title="Cycle time by state"
        meta="Dwell minutes and share of the window for each machine state on the last completed shift. Stamped works inside limits set beforehand."
        actions={<AskButton context="Cycle time breakdown Line B" label="Ask about cycle time" />}
      />
      <ProcessTabs active="cycle-time" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <KpiRow
            label="Shift window"
            items={[
              { label: "Mean cycle", value: String(cycleTimeWindow.cycleMeanSec), unit: "s", tags: <Tag>Measured</Tag> },
              { label: "Parts", value: String(cycleTimeWindow.parts), tags: <Tag>Measured</Tag> },
              { label: "Window", value: `${hhmm(cycleTimeWindow.from)} to ${hhmm(cycleTimeWindow.to)}`, tags: <Tag tone="neutral">Illustrative</Tag> },
            ]}
          />
          <Section title={`State dwell and share · ${line.short}`} meta={line.product} actions={<Link className="link" href={`/process/lines/${line.id}`}>Line detail</Link>} flush>
            <div className="share-rows" style={{ padding: "12px 16px" }}>
              {cycleTimeStates.map((s) => (
                <div key={s.id} className="share-row">
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{s.state}</span>
                    {s.note ? <span className="cell-sub">{s.note}</span> : null}
                  </span>
                  <span className="num" style={{ textAlign: "right" }}>{s.dwellMin} min · {s.sharePct}%</span>
                  <div className="share-bar" aria-hidden><i style={{ width: `${s.sharePct}%` }} /></div>
                </div>
              ))}
            </div>
            <DataTable
              caption="State breakdown"
              rowKey={(r) => r.id}
              rows={cycleTimeStates}
              columns={[
                { key: "st", label: "State", render: (r) => r.state },
                { key: "d", label: "Dwell", align: "right", mono: true, render: (r) => `${r.dwellMin} min` },
                { key: "sh", label: "Share", align: "right", mono: true, render: (r) => `${r.sharePct}%` },
                { key: "ev", label: "Evidence", render: (r) => <EvidenceTag label={r.label} /> },
              ]}
            />
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Window total" actions={<Illustrative />}>
            <p style={{ fontSize: 13, margin: 0 }}>Summed dwell <strong className="num">{totalMin}</strong> min matches the shift window after idle gaps are included.</p>
            <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>From {dayMonth(cycleTimeWindow.from)} {hhmm(cycleTimeWindow.from)} to {hhmm(cycleTimeWindow.to)} IST.</p>
          </Section>
          <Section title="Uses in Process">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>Proposals name a state when suggesting cycle-time changes.</li>
              <li>SMED steps target internal time that shows up here as open and eject.</li>
              <li>Simulate compares rates only, not rupee outcomes.</li>
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
