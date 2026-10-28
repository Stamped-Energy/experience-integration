/** D157 ROI report panel: rejection, scrap, then money only when unit costs are set. */
"use client";

import { useState } from "react";
import { DataTable, Illustrative, KpiRow, Section, Tag } from "@/components/ui/primitives";
import { UnitCostsForm } from "@/components/plant/UnitCostsForm";
import {
  d157MoneyFromUnitCosts,
  pctDelta,
  pctRate,
  type D157RoiReportOk,
} from "@/lib/d157-roi-report";
import {
  EMPTY_UNIT_COSTS,
  moneyFmt,
  parseUnitCosts,
  type UnitCostsDraft,
} from "@/lib/value-roi";

export function D157RoiReportPanel({
  report,
  title = "D157 ROI report",
  illustrative = true,
  allowSetCosts = true,
}: {
  report: D157RoiReportOk;
  title?: string;
  illustrative?: boolean;
  allowSetCosts?: boolean;
}) {
  const [draft, setDraft] = useState<UnitCostsDraft>(EMPTY_UNIT_COSTS);
  const [applied, setApplied] = useState(false);
  const parsed = parseUnitCosts(draft);
  const money =
    applied && parsed.ok
      ? d157MoneyFromUnitCosts({
          currency: parsed.currency,
          cost_per_rejection: parsed.cost_per_rejection,
          cost_per_scrap: parsed.cost_per_scrap,
          units_in_period: parsed.units_in_period,
          rejection_rate_delta: report.rejection_rate_delta,
          scrap_rate_delta: report.scrap_rate_delta,
        })
      : report.money;
  const moneyPresent = money.status === "present";
  const windows = [report.baseline, report.candidate];

  return (
    <div className="stack">
      <Section
        title={title}
        meta={
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            Order: rejection rate delta, scrap rate delta, then money (money only when unit costs are set)
            {illustrative ? <Illustrative /> : null}
            <Tag>{report.plant_id}</Tag>
            <Tag tone={moneyPresent ? "success" : "warning"}>
              {moneyPresent ? "Unit costs set" : "Set unit costs"}
            </Tag>
          </span>
        }
      >
        <p className="secondary" style={{ margin: "0 0 12px" }}>
          Physical rates lead. Stamped invents no tariffs. Money figures appear only after this plant
          enters unit costs (D157). Fields start empty; there is no default price.
        </p>
      </Section>

      <Section title="1. Rejection rate delta" meta="Candidate − baseline" flush>
        <DataTable
          caption="Rejection windows"
          rows={windows}
          rowKey={(w) => w.label}
          columns={[
            { key: "l", label: "Window", render: (w) => w.label },
            { key: "n", label: "n_total", render: (w) => <span className="mono">{w.n_total}</span> },
            { key: "r", label: "n_rejected", render: (w) => <span className="mono">{w.n_rejected}</span> },
            { key: "rr", label: "rejection_rate", render: (w) => <span className="mono">{pctRate(w.rejection_rate)}</span> },
          ]}
        />
        <div style={{ padding: "12px 16px" }}>
          <KpiRow
            label="Rejection rate delta"
            items={[
              {
                label: "rejection_rate_delta",
                value: pctDelta(report.rejection_rate_delta),
                foot: (
                  <>
                    Candidate {pctRate(report.candidate.rejection_rate)} · baseline{" "}
                    {pctRate(report.baseline.rejection_rate)}
                  </>
                ),
              },
            ]}
          />
        </div>
      </Section>

      <Section title="2. Scrap rate delta" meta="Candidate − baseline" flush>
        <DataTable
          caption="Scrap windows"
          rows={windows}
          rowKey={(w) => `scrap-${w.label}`}
          columns={[
            { key: "l", label: "Window", render: (w) => w.label },
            { key: "n", label: "n_total", render: (w) => <span className="mono">{w.n_total}</span> },
            { key: "s", label: "n_scrap", render: (w) => <span className="mono">{w.n_scrap}</span> },
            { key: "sr", label: "scrap_rate", render: (w) => <span className="mono">{pctRate(w.scrap_rate)}</span> },
          ]}
        />
        <div style={{ padding: "12px 16px" }}>
          <KpiRow
            label="Scrap rate delta"
            items={[
              {
                label: "scrap_rate_delta",
                value: pctDelta(report.scrap_rate_delta),
                foot: (
                  <>
                    Candidate {pctRate(report.candidate.scrap_rate)} · baseline{" "}
                    {pctRate(report.baseline.scrap_rate)}
                  </>
                ),
              },
            ]}
          />
        </div>
      </Section>

      {money.status === "present" ? (
        <Section title="3. Money (from plant unit costs)" meta={`Source: ${money.costs_file}`} flush>
          <div style={{ padding: "12px 16px" }}>
            <KpiRow
              label="Cost deltas (candidate − baseline)"
              items={[
                {
                  label: "Rejected cost delta",
                  value: moneyFmt(money.rejected_cost_delta, money.currency),
                },
                {
                  label: "Scrap cost delta",
                  value: moneyFmt(money.scrap_cost_delta, money.currency),
                },
                {
                  label: "Total cost delta",
                  value: moneyFmt(money.total_cost_delta, money.currency),
                },
              ]}
            />
            <p className="secondary" style={{ marginTop: 12 }}>
              All money figures come from plant-entered unit costs. Negative means lower cost under
              the candidate window.
            </p>
            {allowSetCosts ? (
              <div style={{ marginTop: 12 }}>
                <UnitCostsForm
                  value={draft}
                  onChange={(next) => {
                    setDraft(next);
                    if (!next.cost_per_rejection && !next.cost_per_scrap && !next.units_in_period) {
                      setApplied(false);
                    }
                  }}
                  onApply={() => setApplied(true)}
                  applied={applied}
                />
              </div>
            ) : null}
          </div>
        </Section>
      ) : (
        <Section title="3. Money (abstained)" meta="Unit costs required" flush>
          {allowSetCosts ? (
            <div style={{ padding: "12px 16px" }}>
              <UnitCostsForm
                value={draft}
                onChange={(next) => {
                  setDraft(next);
                  if (!next.cost_per_rejection && !next.cost_per_scrap && !next.units_in_period) {
                    setApplied(false);
                  }
                }}
                onApply={() => setApplied(true)}
                applied={applied}
              />
              <p className="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                <span className="mono">{money.reason}</span>
                {" · "}
                {money.detail}
              </p>
            </div>
          ) : (
            <div className="empty" role="status" style={{ margin: 0 }}>
              <h3>Set unit costs</h3>
              <p>
                <span className="mono">{money.reason}</span>
                {" · "}
                {money.detail}
              </p>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
