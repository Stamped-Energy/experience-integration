/** Empty required unit-cost fields. Money stays abstained until the plant enters all three. */
"use client";

import { EMPTY_UNIT_COSTS, parseUnitCosts, type UnitCostsDraft } from "@/lib/value-roi";

export function UnitCostsForm({
  value,
  onChange,
  onApply,
  applied,
}: {
  value: UnitCostsDraft;
  onChange: (next: UnitCostsDraft) => void;
  onApply: () => void;
  applied: boolean;
}) {
  const parsed = parseUnitCosts(value);
  const canApply = parsed.ok;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="empty" role="status" style={{ margin: 0 }}>
        <h3>Set unit costs</h3>
        <p>
          Rejection and scrap rates are shown above. Money figures wait until this plant enters
          cost per rejection, cost per scrap, and units in the period. Fields start empty; Stamped
          never invents a default price (D157).
        </p>
      </div>
      <div className="field-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label className="field">
          Currency (ISO 4217)
          <input
            required
            name="currency"
            value={value.currency}
            onChange={(e) => onChange({ ...value, currency: e.target.value.toUpperCase() })}
            maxLength={3}
            placeholder="e.g. INR"
            autoComplete="off"
          />
        </label>
        <label className="field">
          Cost per rejection
          <input
            required
            name="cost_per_rejection"
            type="number"
            min={0}
            step="any"
            value={value.cost_per_rejection}
            onChange={(e) => onChange({ ...value, cost_per_rejection: e.target.value })}
            placeholder="Required · no default"
            autoComplete="off"
          />
        </label>
        <label className="field">
          Cost per scrap
          <input
            required
            name="cost_per_scrap"
            type="number"
            min={0}
            step="any"
            value={value.cost_per_scrap}
            onChange={(e) => onChange({ ...value, cost_per_scrap: e.target.value })}
            placeholder="Required · no default"
            autoComplete="off"
          />
        </label>
        <label className="field">
          Units in period
          <input
            required
            name="units_in_period"
            type="number"
            min={1}
            step="any"
            value={value.units_in_period}
            onChange={(e) => onChange({ ...value, units_in_period: e.target.value })}
            placeholder="Required · no default"
            autoComplete="off"
          />
        </label>
      </div>
      {!parsed.ok ? (
        <p className="secondary" style={{ margin: 0, fontSize: 12 }}>
          Required and still empty: {parsed.missing.map((m) => m.replace(/_/g, " ")).join(", ")}.
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-sm" disabled={!canApply} onClick={onApply}>
          {applied ? "Update unit costs" : "Set unit costs"}
        </button>
        {applied ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              onChange({ ...EMPTY_UNIT_COSTS });
            }}
          >
            Clear unit costs
          </button>
        ) : null}
      </div>
    </div>
  );
}
