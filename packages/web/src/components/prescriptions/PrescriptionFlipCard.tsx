"use client";

import { useState } from "react";
import type { Prescription } from "@/lib/types";
import { formatInr, formatIstDate } from "@/lib/format";
import { emphasizeNumbers } from "@/components/prescriptions/prescription-formatting";
import { evidenceRowsFromRefs, pillarBadges } from "@/lib/prescriptions";

function ownerDisplay(rx: Prescription): string {
  const who = rx.whoLabel ?? rx.ownerRole.replaceAll("_", " ");
  return who;
}

function whenDisplay(rx: Prescription): string {
  return rx.dueLabel ?? formatIstDate(rx.dueAt);
}

export function PrescriptionFlipCard({ rx }: { rx: Prescription }) {
  const [flipped, setFlipped] = useState(false);
  const pillars = pillarBadges(rx);
  const evidenceRows = evidenceRowsFromRefs(rx.evidenceRefs);
  const priority = rx.priority ?? "med";

  return (
    <button
      type="button"
      className={["rx-flip", flipped ? "is-flipped" : ""].filter(Boolean).join(" ")}
      aria-pressed={flipped}
      aria-label={`${rx.title}. ${flipped ? "Show decision" : "Flip for evidence"}.`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="rx-flip__inner">
        <div className="rx-face rx-face--front">
          <div className="rx-flip__head">
            <div className="rx-flip__badges">
              {pillars.map((label) => (
                <span key={label} className="rx-flip__badge">{label}</span>
              ))}
              {rx.category && !pillars.includes(rx.category) ? (
                <span className="rx-flip__badge">{rx.category}</span>
              ) : null}
            </div>
            <span
              className={[
                "rx-flip__priority",
                priority === "med" ? "rx-flip__priority--med" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {priority === "med"
                ? "Med priority"
                : `${priority[0]!.toUpperCase()}${priority.slice(1)} priority`}
            </span>
          </div>
          <div className="rx-flip__body">
            <p className="rx-flip__what">{rx.title}</p>
            <dl className="rx-flip__fields">
              <div className="rx-flip__field">
                <dt>Why</dt>
                <dd>{emphasizeNumbers(rx.why)}</dd>
              </div>
              <div className="rx-flip__field">
                <dt>Who</dt>
                <dd>{ownerDisplay(rx)}</dd>
              </div>
              <div className="rx-flip__field">
                <dt>Impact</dt>
                <dd className="tabular">{formatInr(rx.impactInrPerMonth)}/mo</dd>
              </div>
              <div className="rx-flip__field">
                <dt>Effort</dt>
                <dd>{rx.effort ?? "—"}</dd>
              </div>
              <div className="rx-flip__field">
                <dt>When</dt>
                <dd>{whenDisplay(rx)}</dd>
              </div>
            </dl>
            <p className="rx-flip__cue">Flip for evidence →</p>
          </div>
        </div>

        <div className="rx-face rx-face--back">
          <div className="rx-flip__head">
            <span className="rx-flip__badge">Evidence</span>
            <span className="rx-flip__badge">{Math.round(rx.confidence * 100)}% conf</span>
          </div>
          <div className="rx-flip__body">
            {evidenceRows.length > 0 ? (
              <div className="rx-flip__ev-table-wrap">
                <table className="rx-flip__ev-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Kind</th>
                      <th>Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceRows.map((row) => (
                      <tr key={`${row.tag}-${row.value}`}>
                        <td><code>{row.tag}</code></td>
                        <td>{row.value}</td>
                        <td>{row.window}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rx-flip__ev-empty">
                Evidence pack loads from linked findings — open full case for charts.
              </p>
            )}
            {rx.billLine ? (
              <p className="rx-flip__cite">
                <strong>Bill line:</strong> {rx.billLine}
              </p>
            ) : null}
            <p className="rx-flip__cue">← Back to decision</p>
          </div>
        </div>
      </div>
    </button>
  );
}
