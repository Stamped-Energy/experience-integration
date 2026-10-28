import Link from "next/link";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Section, Tag } from "@/components/ui/primitives";
import { PlantTabs, crumbs } from "@/components/plant/common";
import {
  GO_LIVE_ITEMS,
  GO_LIVE_PAGE_META,
  goLiveBlocked,
  goLiveCounts,
  provenanceLabel,
  statusLabel,
  type GoLiveItem,
  type GoLiveStatus,
} from "@/lib/copy/go-live";

export const metadata = { title: "Go-live checklist" };

function toneFor(status: GoLiveStatus): "success" | "accent" | "warning" | "neutral" | undefined {
  switch (status) {
    case "proven":
      return "success";
    case "ready":
      return "accent";
    case "needs-plant":
      return "warning";
    case "policy":
      return "neutral";
  }
}

function GateRow({ item }: { item: GoLiveItem }) {
  return (
    <div className="row" style={{ gridTemplateColumns: "110px minmax(0,1fr) 88px 72px", alignItems: "start", gap: 12 }}>
      <Tag tone={toneFor(item.status)}>{statusLabel(item.status)}</Tag>
      <span style={{ minWidth: 0 }}>
        <span className="row-title" style={{ display: "block" }}>
          {item.href ? (
            <Link className="link" href={item.href}>
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </span>
        <span className="row-sub" style={{ display: "block", marginTop: 4 }}>
          {item.detail}
        </span>
        <span className="muted" style={{ display: "block", fontSize: 12, marginTop: 6 }}>
          M1E / product: {item.m1e}
        </span>
        <span className="muted" style={{ display: "block", fontSize: 12, marginTop: 2 }}>
          Owner: {item.owner} · {item.decision}
        </span>
      </span>
      <Tag>{provenanceLabel(item.provenance)}</Tag>
      <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>
        {item.id}
      </span>
    </div>
  );
}

export default function GoLivePage() {
  const counts = goLiveCounts();
  const blocked = goLiveBlocked();
  const needs = GO_LIVE_ITEMS.filter((i) => i.status === "needs-plant");
  const rest = GO_LIVE_ITEMS.filter((i) => i.status !== "needs-plant");

  return (
    <Workspace crumbs={crumbs({ label: "Go-live checklist" })} askContext="First-plant go-live checklist">
      <PageHeader
        eyebrow="Plant"
        title="Go-live checklist"
        meta={GO_LIVE_PAGE_META}
        actions={
          <Tag tone={blocked ? "warning" : "success"} dot>
            {blocked ? "Blocked on plant gates" : "Ready to go live"}
          </Tag>
        }
      />
      <PlantTabs active="go-live" />
      <div className="grid">
        <div className="span-8 stack">
          {needs.length ? (
            <Section title="Needs plant sign-off" meta={`${needs.length} gates`} flush>
              <div className="rows">{needs.map((i) => <GateRow key={i.id} item={i} />)}</div>
            </Section>
          ) : null}
          <Section title="Proven, ready, or policy" meta={`${rest.length} gates`} flush>
            <div className="rows">{rest.map((i) => <GateRow key={i.id} item={i} />)}</div>
          </Section>
          <Section title="How to use this list">
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13 }} className="secondary">
              <li>Prove what you can on the plant emulator (M1E) and in the product first.</li>
              <li>Plant people still sign every plant-owned gate before writes are enabled.</li>
              <li>Record date, name and evidence for each row. Commissioning is separate: see the Plant Box commissioning runbook.</li>
              <li>There is no hardware revoke switch (D115). Revoke is software-only on the lease.</li>
            </ul>
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="Demonstration plant" meta="D117">
            <div className="rows">
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span>Proven in product / M1E</span>
                <span className="mono">{counts.proven}</span>
              </div>
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span>Ready for plant sign-off</span>
                <span className="mono">{counts.ready}</span>
              </div>
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span>Needs plant</span>
                <span className="mono">{counts.needsPlant}</span>
              </div>
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span>Policy</span>
                <span className="mono">{counts.policy}</span>
              </div>
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <span>All gates</span>
                <span className="mono">{counts.total}</span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "12px 0 0" }}>
              {blocked
                ? "Go-live is blocked until the plant signs the remaining gates (update window or security path, role assignments, DPDP)."
                : "Every plant-owned gate is signed. Process exit still needs six weeks live with writes on (D126, D136)."}
            </p>
          </Section>
          <Section title="Related">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>
                <Link className="link" href="/plant/box">
                  Plant Box and lease
                </Link>
              </li>
              <li>
                <Link className="link" href="/inbox?tab=waiting">
                  Inbox
                </Link>
              </li>
              <li>
                <Link className="link" href="/settings/people">
                  People and roles
                </Link>
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
