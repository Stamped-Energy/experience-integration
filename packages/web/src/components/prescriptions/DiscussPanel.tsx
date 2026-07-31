"use client";

import { useState } from "react";
import { ForgeButton, ForgeButtonGroup, Panel } from "@/components/ui/primitives";
import { formatInr } from "@/lib/format";
import type { Prescription, PrescriptionTradeoff } from "@/lib/types";
import { bffUrl } from "@/lib/bff";

type ChipKey = "exclude_line_2" | "protect_po8842" | "no_stagger_until";

const CHIP_DEFS: Array<{ key: ChipKey; label: string }> = [
  { key: "exclude_line_2", label: "Exclude Line 2" },
  { key: "protect_po8842", label: "Protect PO-8842" },
  { key: "no_stagger_until", label: "No stagger until 14:00" },
];

function chipsToConstraints(active: Set<ChipKey>) {
  const constraints: Record<string, unknown> = { reason_code: "order_deadline" };
  if (active.has("exclude_line_2")) constraints.exclude_line_ids = ["line_2"];
  if (active.has("protect_po8842")) constraints.order_ids_protected = ["PO-8842"];
  if (active.has("no_stagger_until")) {
    constraints.no_stagger_until_utc = "2026-07-30T14:00:00+05:30";
  }
  return constraints;
}

export function isManagementRx(rx: Prescription): boolean {
  return Boolean(rx.decisionClass?.startsWith("mgmt_"));
}

export function TradeoffBlock({ tradeoff }: { tradeoff: PrescriptionTradeoff }) {
  // Field order: ₹ hero before co-benefit / risk prose (L6-U1).
  const ordered = {
    energyBenefitInrMonthly: tradeoff.energyBenefitInrMonthly,
    throughputRisk: tradeoff.throughputRisk,
    oeeImpact: tradeoff.oeeImpact,
    recommendedWindow: tradeoff.recommendedWindow,
    alternatives: tradeoff.alternatives,
    departmentOwners: tradeoff.departmentOwners,
    orderContext: tradeoff.orderContext,
    orderIds: tradeoff.orderIds,
  };
  return (
    <div className="rx-tradeoff" data-testid="rx-tradeoff">
      <p className="rx-tradeoff__hero tabular" data-testid="rx-tradeoff-inr">
        Energy benefit {formatInr(ordered.energyBenefitInrMonthly)}/mo
      </p>
      <p className="rx-tradeoff__risk">{ordered.throughputRisk}</p>
      {ordered.oeeImpact ? <p className="rx-tradeoff__oee">{ordered.oeeImpact}</p> : null}
      <p className="rx-tradeoff__window">{ordered.recommendedWindow}</p>
      {ordered.alternatives?.length ? (
        <ul className="rx-tradeoff__alts">
          {ordered.alternatives.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DiscussPanel({
  rx,
  orgId,
  plantId,
}: {
  rx: Prescription;
  orgId: string;
  plantId: string;
}) {
  const [open, setOpen] = useState(false);
  const [chips, setChips] = useState<Set<ChipKey>>(
    () => new Set<ChipKey>(["exclude_line_2", "protect_po8842", "no_stagger_until"]),
  );
  const [summary, setSummary] = useState("Cannot stagger Line 2 — order PO-8842 due 14:00");
  const [revision, setRevision] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!isManagementRx(rx)) return null;

  function toggleChip(key: ChipKey) {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function propose() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(bffUrl(`/api/prescriptions/${rx.id}/negotiation/revise`), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `revise-${rx.id}-${Date.now()}`,
        },
        body: JSON.stringify({
          orgId,
          plantId,
          prescriptionId: rx.id,
          constraintSummary: summary,
          constraints: chipsToConstraints(chips),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRevision(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Propose failed");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!revision) return;
    setBusy(true);
    setError(null);
    try {
      const threadId =
        (revision.negotiation_thread_id as string) ||
        (revision.negotiationThreadId as string) ||
        "neg-fixture";
      const res = await fetch(
        bffUrl(`/api/prescriptions/${rx.id}/negotiation/accept`),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `accept-${threadId}`,
          },
          body: JSON.stringify({
            orgId,
            plantId,
            threadId,
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setDone("Revision accepted — original prescription superseded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setBusy(false);
    }
  }

  async function keepOriginal() {
    if (!revision) return;
    setBusy(true);
    setError(null);
    try {
      const threadId =
        (revision.negotiation_thread_id as string) ||
        (revision.negotiationThreadId as string) ||
        "neg-fixture";
      const res = await fetch(
        bffUrl(`/api/prescriptions/${rx.id}/negotiation/reject`),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `reject-${threadId}`,
          },
          body: JSON.stringify({
            orgId,
            plantId,
            threadId,
            reasonCode: "production_constraint",
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setDone("Kept original prescription.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="rx-full-case__panel" data-testid="discuss-panel">
      <div className="rx-discuss__header">
        <h3 className="rx-full-case__block-title">Discuss this prescription</h3>
        {!open ? (
          <ForgeButton
            type="button"
            data-testid="discuss-open"
            onClick={() => setOpen(true)}
          >
            Discuss
          </ForgeButton>
        ) : null}
      </div>
      {open ? (
        <div className="rx-discuss__body">
          <p className="rx-full-case__prose">
            Structured constraints only — not a free rewrite of What. Propose ≠ commit.
          </p>
          <div className="rx-discuss__chips" data-testid="discuss-chips">
            {CHIP_DEFS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={chips.has(c.key) ? "rx-discuss__chip is-on" : "rx-discuss__chip"}
                onClick={() => toggleChip(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label className="rx-discuss__summary">
            Constraint summary
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
            />
          </label>
          <ForgeButtonGroup>
            <ForgeButton type="button" data-testid="discuss-propose" disabled={busy} onClick={propose}>
              Propose revision
            </ForgeButton>
          </ForgeButtonGroup>
          {revision ? (
            <div className="rx-discuss__diff" data-testid="discuss-diff">
              <p>
                <strong>Diff:</strong> {String(revision.diff_summary ?? revision.diffSummary ?? "")}
              </p>
              <ForgeButtonGroup>
                <ForgeButton
                  type="button"
                  data-testid="discuss-accept"
                  disabled={busy || !revision}
                  onClick={accept}
                >
                  Accept revision
                </ForgeButton>
                <ForgeButton
                  type="button"
                  data-testid="discuss-keep"
                  disabled={busy || !revision}
                  onClick={keepOriginal}
                >
                  Keep original
                </ForgeButton>
              </ForgeButtonGroup>
            </div>
          ) : (
            <p className="rx-full-case__prose" data-testid="discuss-accept-disabled">
              Accept stays disabled until a revision is proposed.
            </p>
          )}
          {error ? <p className="rx-discuss__error">{error}</p> : null}
          {done ? <p className="rx-discuss__done">{done}</p> : null}
        </div>
      ) : null}
    </Panel>
  );
}
