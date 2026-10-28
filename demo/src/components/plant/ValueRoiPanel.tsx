/** D157 Value ROI panel: rejection and scrap rates lead; money only when unit costs are set. */
"use client";

import { useState } from "react";
import { Illustrative, KpiRow, Section, Tag } from "@/components/ui/primitives";
import { UnitCostsForm } from "@/components/plant/UnitCostsForm";
import {
  EMPTY_UNIT_COSTS,
  applyUnitCosts,
  moneyFmt,
  pct,
  ratesSourceLabel,
  type UnitCostsDraft,
  type ValueRoi,
} from "@/lib/value-roi";

export function ValueRoiPanel({
  roi,
  title = "Value ROI",
  meta,
  illustrative = false,
  allowSetCosts = true,
}: {
  roi: ValueRoi;
  title?: string;
  meta?: string;
  illustrative?: boolean;
  /** When true, show empty required unit-cost fields until the plant enters them. */
  allowSetCosts?: boolean;
}) {
  const [draft, setDraft] = useState<UnitCostsDraft>(EMPTY_UNIT_COSTS);
  const [applied, setApplied] = useState(false);
  const display = applied ? applyUnitCosts(roi, draft) : roi;

  const ratesOk = display.rates_status === "ok";
  const money = display.money;
  const moneyOk = money.status === "ok";
  const rateItems = ratesOk
    ? [
        {
          label: "1. Rejection rate",
          value: pct(display.rejection_rate.current),
          foot: (
            <span>
              Was {pct(display.rejection_rate.baseline)} · Δ {pct(display.rejection_rate.delta)}
            </span>
          ),
        },
        {
          label: "2. Scrap rate",
          value: pct(display.scrap_rate.current),
          foot: (
            <span>
              Was {pct(display.scrap_rate.baseline)} · Δ {pct(display.scrap_rate.delta)}
            </span>
          ),
        },
      ]
    : [];

  return (
    <Section
      title={title}
      meta={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {meta ?? "Rates lead; money only when the plant has set unit costs (D157)"}
          {illustrative ? <Illustrative /> : null}
          <Tag tone={ratesOk ? "success" : "warning"}>
            {ratesOk ? ratesSourceLabel(display.rates_source) : "Rates abstain"}
          </Tag>
          <Tag tone={moneyOk ? "success" : "warning"}>
            {moneyOk ? "Unit costs set" : "Set unit costs"}
          </Tag>
        </span>
      }
    >
      {ratesOk ? (
        <KpiRow label="Rejection and scrap rates" items={rateItems} />
      ) : (
        <div className="empty" role="status">
          <h3>Rates abstain</h3>
          <p>{display.rates_abstain_reason}</p>
        </div>
      )}
      {moneyOk ? (
        <div style={{ marginTop: 16 }}>
          <KpiRow
            label="3. Savings in money (from plant unit costs)"
            items={[
              {
                label: "Rejection savings",
                value: moneyFmt(money.rejection_savings, money.currency),
              },
              {
                label: "Scrap savings",
                value: moneyFmt(money.scrap_savings, money.currency),
              },
              {
                label: "Total savings",
                value: moneyFmt(money.total_savings, money.currency),
              },
            ]}
          />
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
      ) : (
        <div style={{ marginTop: 16 }}>
          <Section title="3. Money ROI" meta="Unit costs required" flush>
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
                  {money.status === "abstain" ? money.abstain_reason : ""}
                </p>
              </div>
            ) : (
              <div className="empty" role="status" style={{ margin: 0 }}>
                <h3>Set unit costs</h3>
                <p>{money.status === "abstain" ? money.abstain_reason : ""}</p>
              </div>
            )}
          </Section>
        </div>
      )}
    </Section>
  );
}
