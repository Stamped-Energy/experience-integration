import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, StampedMark } from "@/components/ui/icons";

export function AgentCard({
  kind,
  tone,
  context,
  time,
  message,
  recommendation,
  href,
}: {
  kind: string;
  tone: "critical" | "primary";
  context: string;
  time?: string;
  message: ReactNode;
  recommendation: ReactNode;
  href: string;
}) {
  return (
    <article className="agent-card">
      <header className="agent-card__head">
        <span className="agent-card__mark" aria-hidden>
          <StampedMark size={14} />
        </span>
        <span className="agent-card__who">Stamped Agent</span>
        <span className={`agent-card__kind agent-card__kind--${tone}`}>{kind}</span>
        <span className="agent-card__context">{context}</span>
        {time ? <time className="agent-card__time">{time}</time> : null}
      </header>
      <p className="agent-card__message">{message}</p>
      <div className="agent-card__rec">
        <p className="agent-card__rec-label">Recommendation</p>
        <p className="agent-card__rec-body">{recommendation}</p>
      </div>
      <Link href={href} className="agent-card__cta">
        View the investigation
        <ChevronRight size={15} aria-hidden />
      </Link>
    </article>
  );
}
