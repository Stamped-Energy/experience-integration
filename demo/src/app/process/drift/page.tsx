import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Process drift" };

export default function ProcessDriftPage() {
  const processDrift = D.driftSignals.filter((d) => d.lineId === "line-a");
  return (
    <Workspace crumbs={crumbs({ label: "Drift" })} askContext="Process parameter drift">
      <PageHeader
        eyebrow="Process"
        title="Parameter drift"
        meta="Slow movement in a process outcome before Quality opens a lot-level signal. Quality drift is separate."
        actions={<><Link className="btn btn-sm" href="/quality/drift">Quality drift</Link><AskButton context="Process drift" label="Ask about drift" /></>}
      />
      <ProcessTabs active="drift" />
      <div className="grid">
        <div className="span-8 stack">
          {processDrift.length ? processDrift.map((d) => {
            const line = D.byId.line(d.lineId)!;
            return (
              <Section key={d.id} title={`${d.property} drifting ${d.direction} on ${line.name}`} meta={<>{d.magnitude} · since {dayMonth(d.startedAt)} <EvidenceTag label={d.label} /></>} actions={<Tag tone="neutral">Illustrative</Tag>}>
                <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>Process engineers review here first. Quality drift links lots and spec; this view stays on the line outcome.</p>
              </Section>
            );
          }) : (
            <Section title="No active process drift signals" actions={<Illustrative />}>
              <p style={{ fontSize: 13, margin: 0 }}>When a property moves across runs on Line A or Line B, a signal appears here with magnitude and direction.</p>
            </Section>
          )}
        </div>
        <div className="span-4 stack ctx">
          <Section title="Boundary">
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>Quality owns lot risk and investigations. Process owns the line outcome and corrections sent as proposals.</p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
