/** Lean client showcase: proof the agent keeps working. Caps enforced. No campaign consoles. */
"use client";

import Link from "next/link";
import * as D from "@/lib/demo/data";
import { type AgentShowcaseBundle } from "@/lib/demo/agentShowcase";
import type { RoleId } from "@/lib/demo/types";
import { useRole } from "@/lib/role.client";
import { EvidenceTag, Section, Tag, type Tone } from "@/components/ui/primitives";

const STATUS_TONE: Record<string, Tone> = {
  Investigating: "neutral",
  Simulating: "info",
  "Waiting on you": "accent",
  Onboarding: "neutral",
};

export function AgentAtWork({
  data,
  role: roleProp,
}: {
  data: AgentShowcaseBundle;
  role?: RoleId;
}) {
  const liveRole = useRole();
  const role = roleProp ?? liveRole;
  const isEngineer = role === "stamped-engineer";
  const strip = `${data.now.length} now · ${data.waiting.length} waiting on you · ${data.tried.length} tried this shift`;

  return (
    <div className="aaw stack">
      <p className="aaw-strip" aria-label="Agent status">
        {strip}
      </p>

      <section className="working aaw-now" aria-labelledby="aaw-now-h">
        <div className="working-head">
          <span className="pulse" aria-hidden />
          <h2 id="aaw-now-h" className="aaw-now-title">Working on now</h2>
          <span className="muted">{data.now.length}</span>
        </div>
        {data.now.length ? (
          <div className="working-items">
            {data.now.map((w) => (
              <Link key={w.id} href={w.href} className="work">
                <span className="work-top">
                  <Tag tone={STATUS_TONE[w.status] ?? "neutral"}>{w.status}</Tag>
                  <span className="muted">{D.byId.line(w.lineId)?.short ?? w.lineId}</span>
                </span>
                <span className="work-t">{w.title}</span>
                <span className="work-s">{w.nextStep}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="aaw-empty muted">Nothing in flight right now.</p>
        )}
      </section>

      <Section title="Waiting on you" meta={`${data.waiting.length}`} id="aaw-waiting" flush>
        {data.waiting.length ? (
          <ul className="aaw-wait">
            {data.waiting.map((w) => (
              <li key={w.id} className="aaw-wait-row">
                <div className="aaw-wait-copy">
                  <b>{w.decision}</b>
                  <span className="secondary">
                    {w.whoDecides} · {w.ageLabel}
                  </span>
                </div>
                <Link className="btn btn-sm btn-primary" href={w.href}>
                  Open
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="aaw-empty muted">No decisions waiting.</p>
        )}
        <p className="aaw-more">
          <Link className="link" href={data.seeAllActionsHref}>
            See all actions
          </Link>
        </p>
      </Section>

      <Section title="Tried on the model" meta={`${data.tried.length}`} id="aaw-tried">
        <div className="aaw-tried">
          {data.tried.map((t) => (
            <article key={t.id} className="aaw-story">
              <p className="aaw-story-compared">{t.compared}</p>
              <p className="aaw-story-picked">
                <b>Picked:</b> {t.picked}
              </p>
              <p className="aaw-story-band muted">
                Expected · {t.expectedBand} <EvidenceTag label={t.evidenceLabel} />
              </p>
              <div className="aaw-story-actions">
                <Link className="link" href={t.openHref}>
                  Open
                </Link>
                {isEngineer && t.engineeringHref ? (
                  <Link className="link muted" href={t.engineeringHref}>
                    Open in Engineering
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <p className="aaw-more">
          <Link className="link" href={data.seeAllProposalsHref}>
            See all proposals
          </Link>
        </p>
      </Section>

      <Section title="Learned this week" meta={`${data.learned.length}`} id="aaw-learned" flush>
        <ul className="aaw-learned">
          {data.learned.map((l) => (
            <li key={l.id}>{l.text}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
