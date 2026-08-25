"use client";

import type { Prescription } from "@/lib/types";
import { formatInr, formatIstDate } from "@/lib/format";
import { emphasizeNumbers } from "@/components/prescriptions/prescription-formatting";
import { pillarBadges } from "@/lib/prescriptions";

function ownerDisplay(rx: Prescription): string {
  const who = rx.whoLabel ?? rx.ownerRole.replaceAll("_", " ");
  return who;
}

function whenDisplay(rx: Prescription): string {
  return rx.dueLabel ?? formatIstDate(rx.dueAt);
}

/** Static decision summary for the queue. Evidence opens via the Evidence button only. */
export function PrescriptionDecisionCard({ rx }: { rx: Prescription }) {
  const pillars = pillarBadges(rx);
  const priority = rx.priority ?? "med";

  return (
    <article className="rx-decision" aria-label={rx.title}>
      <div className="rx-decision__head">
        <div className="rx-decision__badges">
          {pillars.map((label) => (
            <span key={label} className="rx-decision__badge">
              {label}
            </span>
          ))}
          {rx.category && !pillars.includes(rx.category) ? (
            <span className="rx-decision__badge">{rx.category}</span>
          ) : null}
        </div>
        <span
          className={[
            "rx-decision__priority",
            priority === "med" ? "rx-decision__priority--med" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {priority === "med"
            ? "Med priority"
            : `${priority[0]!.toUpperCase()}${priority.slice(1)} priority`}
        </span>
      </div>
      <div className="rx-decision__body">
        <p className="rx-decision__what">{rx.title}</p>
        <dl className="rx-decision__fields">
          <div className="rx-decision__field">
            <dt>Why</dt>
            <dd>{emphasizeNumbers(rx.why)}</dd>
          </div>
          <div className="rx-decision__field">
            <dt>Who</dt>
            <dd>{ownerDisplay(rx)}</dd>
          </div>
          <div className="rx-decision__field">
            <dt>Impact</dt>
            <dd className="tabular">{formatInr(rx.impactInrPerMonth)}/mo</dd>
          </div>
          <div className="rx-decision__field">
            <dt>Effort</dt>
            <dd>{rx.effort ?? "—"}</dd>
          </div>
          <div className="rx-decision__field">
            <dt>When</dt>
            <dd>{whenDisplay(rx)}</dd>
          </div>
        </dl>
        {rx.billLine ? (
          <p className="rx-decision__cite">
            <strong>Bill line:</strong> {rx.billLine}
          </p>
        ) : null}
      </div>
    </article>
  );
}
