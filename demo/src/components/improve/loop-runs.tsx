"use client";

/**
 * Loop campaign runs table and compare (layout from PlantCraft Compare.tsx, Apache-2.0).
 * Approval only through DecisionCard elsewhere.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LoopCampaign, LoopCampaignKind, LoopRunResult } from "@/lib/demo/loopRuns";
import { RUN_TYPE_LABEL, RUN_TYPE_SOON, runsForCampaign } from "@/lib/demo/loopRuns";
import { inr } from "@/lib/format";
import { grant } from "@/lib/rbac";
import { demoRole } from "@/lib/role";
import { DataTable, Illustrative, Section, Tag } from "@/components/ui/primitives";
import { DecisionCard } from "@/components/cards/DecisionCard";
import { proposals } from "@/lib/demo/data";

const MAX_COMPARE = 4;

export function RunTypeFilters({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = ["all", "pid", "mpc", "rl"] as const;
  return (
    <div className="chips filter-row" role="group" aria-label="Run type">
      {types.map((t) => {
        const soon = t !== "all" && RUN_TYPE_SOON.includes(t as "mpc" | "rl");
        return (
          <button
            key={t}
            type="button"
            className={`chip${value === t ? " on" : ""}${soon ? " run-type-soon" : ""}`}
            disabled={soon}
            title={soon ? "Coming soon when the deploy freeze lifts" : undefined}
            onClick={() => onChange(t)}
          >
            {t === "all" ? "All types" : RUN_TYPE_LABEL[t as keyof typeof RUN_TYPE_LABEL]}
            {soon ? " · coming soon" : null}
          </button>
        );
      })}
    </div>
  );
}

export function LoopCampaignTable({ rows, showOwner }: { rows: LoopCampaign[]; showOwner: boolean }) {
  return (
    <DataTable
      caption="Loop campaigns"
      rowKey={(r) => r.id}
      rows={rows}
      columns={[
        { key: "l", label: "Campaign", render: (r) => <><span style={{ fontWeight: 600 }}>{r.label}</span><span className="cell-sub">{r.loopFamily}</span></> },
        { key: "t", label: "Type", render: (r) => <Tag tone={r.runType === "pid" ? "neutral" : "info"}>{RUN_TYPE_LABEL[r.runType]}</Tag> },
        { key: "n", label: "Configs tried", align: "right", mono: true, render: (r) => String(r.configsTried) },
        { key: "s", label: "Status", render: (r) => <Tag tone={r.status === "chosen" ? "accent" : r.status === "running" ? "warning" : "neutral"}>{r.status}</Tag> },
        ...(showOwner
          ? [{
              key: "o",
              label: "Illustrative INR / month",
              align: "right" as const,
              render: (r: LoopCampaign) => (r.ownerInrPerMonth != null ? <><span className="num">{inr(r.ownerInrPerMonth)}</span><Illustrative /></> : "n/a"),
            }]
          : []),
        { key: "k", label: "", align: "right", render: (r) => <Link className="link" href={`?campaign=${r.id}`}>Open</Link> },
      ]}
    />
  );
}

export function CompareRunsPanel({ runs, chosenId }: { runs: LoopRunResult[]; chosenId?: string }) {
  const [picked, setPicked] = useState<string[]>(() => runs.slice(0, Math.min(3, runs.length)).map((r) => r.id));
  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };
  const cols = runs.filter((r) => picked.includes(r.id));
  return (
    <Section title="Compare runs" meta={`Select up to ${MAX_COMPARE} configurations side by side`}>
      <div className="compare-tray" role="group" aria-label="Runs to compare">
        {runs.map((r) => (
          <label key={r.id} className={picked.includes(r.id) ? "on" : undefined}>
            <input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} disabled={!picked.includes(r.id) && picked.length >= MAX_COMPARE} />
            {r.label}
            {r.id === chosenId ? " · chosen" : null}
          </label>
        ))}
      </div>
      {cols.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                {cols.map((c) => (
                  <th key={c.id} scope="col" className={c.id === chosenId ? "run-chosen" : undefined}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Scrap delta, pp</th>{cols.map((c) => <td key={c.id} className="num">{c.scrapDelta.toFixed(2)}</td>)}</tr>
              <tr><th scope="row">Cycle delta, s</th>{cols.map((c) => <td key={c.id} className="num">{c.cycleDeltaS.toFixed(2)}</td>)}</tr>
              <tr><th scope="row">Inside signed limits</th>{cols.map((c) => <td key={c.id}>{c.constraintOk ? "Yes" : "No"}</td>)}</tr>
              <tr><th scope="row">Score</th>{cols.map((c) => <td key={c.id} className="num">{c.score.toFixed(2)}</td>)}</tr>
            </tbody>
          </table>
        </div>
      ) : <p className="muted">Pick at least one run to compare.</p>}
    </Section>
  );
}

export function ChosenRunDecision({ campaign }: { campaign: LoopCampaign }) {
  const role = demoRole();
  const p = campaign.proposalId ? proposals.find((x) => x.id === campaign.proposalId) : undefined;
  if (!p) return <p className="muted">When a run is chosen, the recommendation appears on a DecisionCard. Nothing writes until a person accepts inside the signed band.</p>;
  return (
    <Section title="Chosen run → decision" meta="Accept checks the pre-signed limits on the card">
      <DecisionCard p={p} role={role} href={`/process/proposals/${p.id}`} />
    </Section>
  );
}

export function SimulationsWorkspace({ campaigns, kind, area }: { campaigns: LoopCampaign[]; kind: LoopCampaignKind; area: "process" | "quality" }) {
  const role = demoRole();
  const showOwner = grant(role, "see-plant-value") !== "hidden";
  const [typeFilter, setTypeFilter] = useState("all");
  const sp = useSearchParams();
  const campaignParam = sp.get("campaign");
  const filtered = useMemo(
    () => campaigns.filter((c) => c.area === area && c.kind === kind && (typeFilter === "all" || c.runType === typeFilter)),
    [campaigns, area, kind, typeFilter],
  );
  const active = filtered.find((c) => c.id === campaignParam) ?? filtered[0];
  const runs = active ? runsForCampaign(active.id) : [];
  return (
    <div className="stack">
      <RunTypeFilters value={typeFilter} onChange={setTypeFilter} />
      <LoopCampaignTable rows={filtered} showOwner={showOwner} />
      {active ? (
        <>
          <CompareRunsPanel runs={runs} chosenId={active.chosenRunId} />
          {active.status === "chosen" ? <ChosenRunDecision campaign={active} /> : null}
        </>
      ) : null}
    </div>
  );
}
