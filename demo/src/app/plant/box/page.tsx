import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { RunChart, Sparkline } from "@/components/ui/charts";
import { DataTable, EvidenceTag, Illustrative, KpiRow, LineModeTag, ModeTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { PlantSectionMap, PlantTabs, crumbs, fmt, latest, openCards, readingsOf, tagsOf } from "@/components/plant/common";

export const metadata = { title: "Plant Box and lease" };
export default async function Box() {
  const role = await currentRole();
  const box = D.plantBox;
  const lease = D.leases.find((l) => l.state === "active") ?? D.leases[0];
  const offH = lease.offlineMin / 60;
  const allowed = can(role, "revoke-lease");
  return (
    <Workspace crumbs={crumbs({ label: "Plant Box and lease" })} askContext="Plant Box and lease">
      <PageHeader eyebrow="Plant" title="Plant Box and lease" meta="The Plant Box keeps working offline under a signed lease: recommend-only after 4 hours offline, never past 8. Anyone on site with the right role can revoke it." actions={<AskButton context="Plant Box" label="Ask about the lease" />} />
      <PlantTabs active="box" />
      <div className="grid">
        <div className="span-6 stack">
          <Section title="Lease" meta={<span className="mono">{lease.id}</span>} actions={<Tag tone={lease.state === "active" ? "success" : "warning"} dot>{lease.offlineMin ? `Offline ${lease.offlineMin} min` : "Connected"}</Tag>}>
            <div className="lease">
              <div><div className="label">State</div><div style={{ fontSize: 18 }}>{lease.state === "active" ? (lease.offlineMin ? "Offline" : "Connected") : lease.state}</div><div className="cell-sub">signed lease {lease.id}</div></div>
              <div><div className="label">Offline limit</div><div style={{ fontSize: 18 }}>{lease.maxOfflineH} h</div><div className="cell-sub">then recommend-only</div></div>
              <div><div className="label">Hard cap</div><div style={{ fontSize: 18 }}>{lease.hardCapH} h</div><div className="cell-sub">then stops acting</div></div>
            </div>
            <div className="lease-bar" aria-label={`Offline ${offH.toFixed(1)} of ${lease.hardCapH} hours`}><i style={{ width: `${(offH / lease.hardCapH) * 100}%` }} /><b style={{ left: `${(lease.maxOfflineH / lease.hardCapH) * 100}%` }} /></div>
            <div className="gap-axis"><span>0 h</span><span>{lease.maxOfflineH} h recommend-only</span><span>{lease.hardCapH} h</span></div>
            <dl className="facts-grid" style={{ marginTop: 12 }}>
              <dt>Issued</dt><dd>{dayMonth(lease.issuedAt)} {hhmm(lease.issuedAt)}</dd>
              <dt>Last sync</dt><dd>{rel(box.lastSync)}</dd>
              <dt>Box</dt><dd>{box.id} · {box.version}</dd>
            </dl>
            <CardActions actions={[
              { id: "r", label: "Revoke lease", allowed, reason: deniedReason("revoke-lease", "revoke the lease"), done: "Lease revoked on site. The box is recommend-only until a new lease is signed. Illustrative." },
            ]} />
          </Section>
          <Section title="What the box does at each stage">
            <DataTable caption="Stages" rowKey={(r) => r.s} rows={[
              { s: "Connected", w: "Proposes and, where a standing approval allows, writes inside signed windows", c: "Normal" },
              { s: `Offline under ${lease.maxOfflineH} h`, w: "Keeps running settings inside their windows; no new writes outside them", c: "Watch" },
              { s: `Offline ${lease.maxOfflineH} to ${lease.hardCapH} h`, w: "Recommend-only: shows proposals, writes nothing", c: "Recommend-only" },
              { s: `Past ${lease.hardCapH} h or revoked`, w: "Stops acting; the plant runs on its own settings", c: "Stopped" },
            ]} columns={[{ key: "s", label: "Stage", render: (r) => r.s }, { key: "w", label: "Behaviour", render: (r) => r.w }, { key: "c", label: "Mode", render: (r) => <Tag>{r.c}</Tag> }]} />
          </Section>
        </div>
        <div className="span-6 stack">
          <Section title="Lease history" flush>
            <DataTable caption="Leases" rowKey={(l) => l.id} rows={D.leases} columns={[
              { key: "i", label: "Lease", mono: true, render: (l) => l.id },
              { key: "a", label: "Issued", mono: true, render: (l) => `${dayMonth(l.issuedAt)} ${hhmm(l.issuedAt)}` },
              { key: "s", label: "State", render: (l) => <Tag tone={l.state === "active" ? "success" : l.state === "revoked" ? "warning" : "neutral"}>{l.state}</Tag> },
              { key: "o", label: "Offline", align: "right", render: (l) => `${l.offlineMin} min` },
              { key: "b", label: "Revoked by", render: (l) => l.revokedBy ?? "" },
            ]} />
          </Section>
          <Section title="Stops on site" meta="Every stop restores the prior settings" flush>
            <DataTable caption="Stops" rowKey={(s) => s.id} rows={D.stopEvents} columns={[
              { key: "l", label: "Line", render: (s) => D.byId.line(s.lineId)!.short },
              { key: "b", label: "By", render: (s) => s.by },
              { key: "e", label: "Effect", render: (s) => s.effect },
              { key: "r", label: "Restore", render: (s) => s.restoreResult },
              { key: "a", label: "At", mono: true, render: (s) => `${dayMonth(s.at)} ${hhmm(s.at)}` },
            ]} />
          </Section>
          <Section title="What syncs through the box" flush>
            <DataTable caption="Sources" rowKey={(x) => x.id} rows={D.dataSources} columns={[
              { key: "n", label: "Source", render: (x) => x.name },
              { key: "t", label: "Tags", align: "right", render: (x) => x.tags },
              { key: "l", label: "Last seen", render: (x) => rel(x.lastSeen) },
              { key: "g", label: "Gap", align: "right", render: (x) => `${x.gapPct}%` },
            ]} />
          </Section>
          <Section title="Who can revoke">
            <p style={{ margin: 0, fontSize: 13 }}>Shift lead and plant head, on site. Revoking needs no network and takes effect at once. Your role: {allowed ? "can revoke" : "cannot revoke"}.</p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
