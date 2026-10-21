/**
 * Worked example actions for the Process and Quality overviews: each card shows what Stamped saw, the evidence,
 * the change it makes or asks for, who decides, and the expected result as a label and band. Illustrative.
 */
import Link from "next/link";
import type { ActionStep, ExampleAction, RoleId } from "@/lib/demo/types";
import { byId, roles } from "@/lib/demo/data";
import { exampleActions } from "@/lib/demo/actions";
import { can } from "@/lib/rbac";
import { EvidenceTag, Illustrative, Section, Tag } from "@/components/ui/primitives";
import { CardActions } from "./CardActions";
import { deniedReason } from "./DecisionCard";

const CHAIN: { step: ActionStep; say: string }[] = [
  { step: "Detect", say: "See a drift or a loss in plant data" },
  { step: "Explain", say: "Show the cause, with evidence" },
  { step: "Propose", say: "Change a setting inside the signed limits" },
  { step: "Trial", say: "Try it on matched runs" },
  { step: "Verify", say: "Check it against the plant's own records" },
  { step: "Learn", say: "Keep what worked for next time" },
];
const STEP_WORD: Record<ActionStep, string> = { Detect: "See", Explain: "Explain", Propose: "Change", Trial: "Try", Verify: "Check", Learn: "Learn", Decide: "Decide" };
const HOW_TONE = { "On its own, inside the signed band": "success", "A person decides": "info", "Recommend only": "warning", "Record only": "neutral" } as const;
const names = (ids: RoleId[]) => { const n = ids.map((r) => roles.find((x) => x.id === r)!.name); return n.length > 1 ? `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}` : n[0]; };

export function ExampleActionCard({ a, role }: { a: ExampleAction; role: RoleId }) {
  const line = byId.line(a.lineId)!;
  const allowed = a.who.roles.includes(role);
  const stop = a.who.how === "On its own, inside the signed band" ? { effect: "Stopped. The previous setting comes back and nothing new is written.", allowed: can(role, "press-stop", a.lineId), reason: deniedReason("press-stop", "press Stop") } : undefined;
  return (
    <article className="card ex-card" aria-labelledby={`${a.id}-t`}>
      <div className="card-head">
        <span className="src">{a.area} agent</span><span className="dotsep">·</span><span>{line.short}</span>
        <span className="right">{a.steps.map((s) => <span key={s} className="ex-step" data-step={s}>{STEP_WORD[s]}</span>)}</span>
      </div>
      <div className="card-body">
        <div className="card-block">
          <span className="label">{a.mechanism}</span>
          <h3 className="card-title" id={`${a.id}-t`}>{a.title}</h3>
          <p className="card-obs">{a.seen}</p>
          <ul className="ex-ev">{a.evidence.map((e) => <li key={e.text}><EvidenceTag label={e.label} /><span>{e.text}{e.id ? <span className="mono muted"> · {e.id}</span> : null}</span></li>)}</ul>
        </div>
        <div className="ex-grid">
          <span className="label">{a.who.how === "Record only" ? "Result" : "The change"}</span><span>{a.action}</span>
          {a.expected ? <><span className="label">Expected</span><span><b>{a.expected.label}</b>, band {a.expected.band}</span></> : null}
          <span className="label">Who decides</span><span><Tag tone={HOW_TONE[a.who.how]}>{a.who.how}</Tag> {a.who.note}</span>
        </div>
        <p className="ex-why"><span className="label">Why it matters</span>{a.why}</p>
        {a.href ? <Link className="link" href={a.href} scroll={false}>{a.hrefLabel ?? "Open"}</Link> : null}
      </div>
      {a.options || stop ? <CardActions actions={(a.options ?? []).map((o) => ({ ...o, allowed, reason: `${names(a.who.roles)} can decide` }))} stop={stop} /> : null}
    </article>
  );
}

export function ExampleActions({ area, role }: { area: "Process" | "Quality"; role: RoleId }) {
  const list = exampleActions.filter((a) => a.area === area);
  return (
    <Section title="How Stamped gets the result" meta={<>Worked examples on the demonstration plant <Illustrative /></>} id={`ex-${area.toLowerCase()}`}>
      <ol className="ex-chain" aria-label="The steps Stamped runs">{CHAIN.map((c) => <li key={c.step}><b>{STEP_WORD[c.step]}</b><span>{c.say}</span></li>)}</ol>
      <div className="ex-cards">{list.map((a) => <ExampleActionCard key={a.id} a={a} role={role} />)}</div>
    </Section>
  );
}
