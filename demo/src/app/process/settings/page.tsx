import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, ModeTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Running settings" };

export default async function RunningSettings() {
  const writes = D.setpointWrites.slice().reverse();
  return (
    <Workspace crumbs={crumbs({ label: "Running settings" })} askContext="Running settings">
      <PageHeader eyebrow="Process" title="Running settings" meta="Every value Stamped wrote, its mode, who signed the window and when it expires. Stamped works inside limits set beforehand."
        actions={<><Link className="btn btn-sm" href="/settings">Signed limits</Link><AskButton context="Running settings" label="Ask about settings" /></>} />
      <ProcessTabs active="settings" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          {D.lines.map((l) => (
            <Section key={l.id} title={l.name} meta={l.product} flush actions={<Link className="link" href={`/process/lines/${l.id}`}>Line detail</Link>}>
              <DataTable caption={`Running settings on ${l.short}`} rowKey={(r) => r.param} rows={D.runningSettings.filter((r) => r.lineId === l.id)} columns={[
                { key: "n", label: "Setting", render: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span> },
                { key: "v", label: "Value", align: "right", render: (r) => <strong className="num">{r.value} {r.unit}</strong> },
                { key: "b", label: "Against the signed band", width: "32%", render: (r) => { const w = D.byId.window(r.lineId, r.param)!; return <LimitsBand name={r.name} unit={r.unit} signed={[w.low, w.high]} narrowed={w.narrowedLow !== undefined ? [w.narrowedLow, w.narrowedHigh!] : undefined} current={r.value} signedBy={w.signedBy} signedAt={dayMonth(w.signedAt)} legend={false} />; } },
                { key: "m", label: "Mode", render: (r) => <ModeTag mode={r.mode} /> },
                { key: "w", label: "Written", mono: true, render: (r) => `${dayMonth(r.writtenAt)} ${hhmm(r.writtenAt)}` },
                { key: "s", label: "Signer", render: () => "Plant head" },
                { key: "x", label: "Expires", render: (r) => <span title={dayMonth(r.expiresAt)}>{rel(r.expiresAt)}</span> },
              ]} />
            </Section>
          ))}
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Last writes" meta="Line A trial batches" flush>
            <ul className="tl">{writes.map((w) => (
              <li key={w.runId}><span className="t">{dayMonth(w.at)} {hhmm(w.at)}</span><span className={`k ${w.status === "skipped" ? "s" : "w"}`} /><span>Hold temperature {w.value} °C<span className="cell-sub">{w.reason ?? `${w.source} · ${w.runId}`}</span></span><Tag tone={w.status === "skipped" ? "warning" : "neutral"}>{w.status}</Tag></li>
            ))}</ul>
          </Section>
          <Section title="Standing approvals" flush>
            <div className="rows">{D.standingApprovals.map((s) => (
              <div key={s.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span style={{ minWidth: 0 }}><span className="row-title" style={{ display: "block" }}>{D.byId.line(s.lineId)!.short} · cycle time {s.band}</span><span className="row-sub">Granted by {s.grantedBy} · used {s.uses} times · until {dayMonth(s.until)}</span></span>
                <Tag tone="success">Active</Tag>
              </div>
            ))}</div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
