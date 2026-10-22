import { nameOf } from "@/lib/names";
/** Inbox items that are not per-run proposals use the same card shell: trial signatures, lot links, corrections, data gaps. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { InboxItem, RoleId } from "@/lib/demo/types";
import { can } from "@/lib/rbac";
import { dayMonth, rel } from "@/lib/format";
import { Confidence } from "@/components/ui/Confidence";
import { EvidenceIds, ModeTag, Tag } from "@/components/ui/primitives";
import { DecisionCard, deniedReason } from "@/components/cards/DecisionCard";
import { CardActions } from "@/components/cards/CardActions";

const PARAM: Record<string, string> = { "tool-temp": "tool temperature", "hold-temp": "hold temperature", "hold-pressure": "hold pressure" };

export function InboxCard({ item, role, link = true }: { item: InboxItem; role: RoleId; link?: boolean }) {
  const href = link ? `/inbox/${item.id}` : undefined;
  if (item.kind === "proposal") return <DecisionCard p={D.byId.proposal(item.ref)!} role={role} href={href} />;
  const Title = () => <h3 className="card-title">{href ? <Link href={href}>{item.title}</Link> : item.title}</h3>;
  const Head = ({ src, line, extra }: { src: string; line?: string; extra?: React.ReactNode }) => (
    <div className="card-head">
      <span className="src">{src}</span>{line ? <><span className="dotsep">·</span><span>{line}</span></> : null}
      <span className="dotsep">·</span><span className="mono">{nameOf(item.ref)}</span>
      <span className="right">{extra}{item.bucket === "waiting" ? <Tag tone="accent">Needs a decision</Tag> : item.bucket === "task" ? <Tag>Task</Tag> : <Tag>Decided</Tag>}{item.bucket === "waiting" && item.due ? <span className="muted">expires {rel(item.due)}, then nothing changes</span> : item.due ? <span className="muted">due {rel(item.due)}</span> : null}</span>
    </div>
  );
  if (item.kind === "trial-signature") {
    const t = D.byId.trial(item.ref)!;
    const plan = D.measurementPlans.find((m) => m.id === t.measurementPlanId)!;
    return (
      <article className="card decision">
        <Head src="Process agent" line={D.byId.line(t.lineId)!.short} extra={<ModeTag mode="Trial" />} />
        <div className="card-body">
          <div className="card-block"><Title /><p className="card-obs">{t.change}. Drafted by {t.draftedBy}. {t.schedule.join(". ")}.</p></div>
          <div className="card-cols">
            <div className="card-block"><span className="label">Measurement plan</span><span className="secondary">{nameOf(plan.id)} v{plan.version} · hash <span className="mono">{plan.hash}</span> · locked {dayMonth(plan.lockedAt)} · at least {plan.minBatches} runs</span></div>
            <div className="card-block"><span className="label">Confidence</span><Confidence kind="label" label="Unknown" note="No result yet. The verdict comes from the locked plan after the trial." method="Switchback trial, verdict per locked measurement plan" /></div>
          </div>
          <div className="mode-line"><span className="label" style={{ paddingTop: 2 }}>If stopped</span><span>Stop restores the checked prior value, {Object.entries(t.restoreTarget).map(([k, v]) => `${PARAM[k] ?? k} ${v}`).join(", ")}. If restore fails the line goes recommend-only.</span></div>
        </div>
        <CardActions actions={[
          { id: "sign", label: "Sign trial order", primary: true, allowed: can(role, "sign-trial"), reason: deniedReason("sign-trial", "sign"), done: "Signed." },
          { id: "back", label: "Send back with a note", allowed: can(role, "sign-trial"), reason: deniedReason("sign-trial", "sign"), done: "Sent back to Process engineer A." },
        ]} />
      </article>
    );
  }
  if (item.kind === "lot-link") {
    const l = D.byId.link(item.ref)!;
    const lot = D.byId.lot(l.lotId)!;
    return (
      <article className="card">
        <Head src="Quality agent" line={D.byId.line(lot.lineIds[0])!.short} />
        <div className="card-body">
          <div className="card-block"><Title /><p className="card-obs">Lot {lot.id.replace("lot-", "").toUpperCase()} could come from {nameOf(l.runId)}{l.candidates.length ? ` or ${l.candidates.map((c) => nameOf(c).toLowerCase()).join(", ")}` : ""}. Below the pack threshold, so it is a task and gates nothing.</p></div>
          <Confidence kind="link" label={l.label} score={l.link_confidence} threshold={0.8} status={l.status}
            drivers={[`time proximity ${l.parts.timeProximity}`, `recipe match ${l.parts.recipeMatch}`, `scanned id ${l.parts.scannedIdAgreement}`, `several candidates ${l.parts.multiCandidatePenalty}`]}
            method="Link confidence from weights fitted on a verification sample" />
        </div>
        <CardActions actions={[
          { id: "ok", label: `Confirm ${nameOf(l.runId).toLowerCase()}`, primary: true, allowed: can(role, "confirm-lot-link"), reason: deniedReason("confirm-lot-link", "confirm links"), done: "Link confirmed. The join label becomes verified." },
          { id: "no", label: "Pick another run", allowed: can(role, "confirm-lot-link"), reason: deniedReason("confirm-lot-link", "confirm links"), done: "Candidate list opened." },
        ]} />
      </article>
    );
  }
  if (item.kind === "correction") {
    const c = D.byId.correction(item.ref)!;
    return (
      <article className="card decision">
        <Head src="Quality agent" line={D.byId.line(c.toLineId)!.short} extra={<Tag>Recommendation</Tag>} />
        <div className="card-body">
          <div className="card-block"><Title /><p className="card-obs">{c.sentBy} asks Process to {c.direction} {c.param.replace("-", " ")}: {c.reason.toLowerCase()}. Quality sends recommendations only; Process decides.</p><EvidenceIds ids={["EV-A-1188"]} /></div>
          <Confidence kind="label" label={c.label} note={`Expected effect ${c.estimate.low} to ${c.estimate.high} ${c.estimate.unit}`} method="Estimate behind the correction, carried with its label and band (D45)" />
        </div>
        <CardActions actions={[
          { id: "acc", label: "Fold into a proposal", primary: true, allowed: can(role, "accept-correction"), reason: deniedReason("accept-correction", "accept corrections"), done: `Folded into ${nameOf(c.proposalId)}.` },
          { id: "dec", label: "Decline with reason", allowed: can(role, "accept-correction"), reason: deniedReason("accept-correction", "accept corrections"), done: "Declined. Quality sees the reason." },
        ]} />
      </article>
    );
  }
  const g = D.byId.gap(item.ref)!;
  const src = D.dataSources.find((s) => s.id === g.sourceId)!;
  return (
    <article className="card">
      <Head src="Plant agent" extra={<Tag tone="warning">Data gap</Tag>} />
      <div className="card-body">
        <div className="card-block"><Title /><p className="card-obs">{src.name} sent nothing from {g.from.slice(11, 16)} to {g.to.slice(11, 16)}. Affects: {g.affects}. Cards resting on these values show Unknown until it is filled.</p></div>
        <Confidence kind="label" label="Unknown" note="Missing input; dependent claims abstain" method="Weakest load-bearing input sets the claim (evidence.md)" />
      </div>
    </article>
  );
}
