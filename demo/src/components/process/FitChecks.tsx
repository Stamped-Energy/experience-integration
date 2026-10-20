/** Model fit card (spec §7.2, twin.md, D14): four checks, interval coverage against the 85 to 95% band. */
import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { dayMonth } from "@/lib/format";
import type { ModelFit } from "@/lib/demo/types";
import { Section, Tag } from "@/components/ui/primitives";

export function Coverage({ value }: { value: number }) {
  const L = 0.7, H = 1;
  const p = (v: number) => `${((v - L) / (H - L)) * 100}%`;
  return (
    <div>
      <div className="coverage" role="img" aria-label={`Coverage ${Math.round(value * 100)}%, accepted band 85 to 95%`}>
        <div className="axis" /><div className="ok" style={{ left: p(0.85), width: `calc(${p(0.95)} - ${p(0.85)})` }} /><div className="pt" style={{ left: p(value) }} />
      </div>
      <div className="coverage-ticks"><span>70%</span><span>85 to 95% accepted</span><span>100%</span></div>
    </div>
  );
}

export function FitChecks({ fit, compact }: { fit: ModelFit; compact?: boolean }) {
  const line = D.byId.line(fit.lineId)!;
  const failing = fit.checks.filter((c) => !c.pass);
  return (
    <Section title={`Model fit · ${line.short}`} meta={<span >{nameOf(fit.modelId)} {fit.version}</span>} actions={<Tag tone={fit.state === "accepted" ? "success" : "warning"}>{fit.state === "accepted" ? "Accepted" : "Not accepted"}</Tag>} flush>
      <div style={{ padding: "12px 16px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>90% interval coverage on {fit.heldOutN} held-out points</span><strong className="num">{Math.round(fit.coverage * 100)}%</strong></div>
        <Coverage value={fit.coverage} />
      </div>
      <ul className="checks">{[...failing, ...fit.checks.filter((c) => c.pass)].map((c) => (
        <li key={c.name}><Tag tone={c.pass ? "success" : "warning"}>{c.pass ? "Pass" : "Fail"}</Tag><span>{c.name}</span><span className="num muted">{c.value}</span></li>
      ))}</ul>
      <div className="muted" style={{ fontSize: 12, padding: "8px 16px 12px" }}>
        Calibrated {dayMonth(fit.calibratedAt)}. {fit.state === "accepted" ? "Proposals on this line may carry a number." : "Proposals on this line are withheld until all four checks pass."}{compact ? <> <Link className="link" href="/process/model-fit">Model fit</Link></> : null}
      </div>
    </Section>
  );
}
