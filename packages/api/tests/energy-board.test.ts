import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  monthlyFromBills,
  weekdayFromDaily,
} from "../src/insights/energy-board.js";

describe("energy-board helpers", () => {
  it("monthlyFromBills maps kWh and cost without inventing missing bills", () => {
    const rows = monthlyFromBills(
      [
        {
          bill_month: "2026-06",
          total_kwh: 1_080_000,
          total_amount_inr: 6_825_600,
        },
        {
          bill_month: "2026-07",
          energy_kwh: 1_140_000,
          amount_inr: 7_204_800,
        },
        { bill_month: "2026-08" }, // missing kWh — skipped
      ],
      6.32,
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]!.m, "Jun");
    assert.equal(rows[0]!.actual, 1080);
    assert.ok(rows[0]!.baseline > rows[0]!.actual);
    assert.equal(rows[1]!.m, "Jul");
  });

  it("weekdayFromDaily averages Mon–Sun without fabricating days", () => {
    const profile = weekdayFromDaily([
      { date: "2026-08-24", kwh: 10_000 }, // Mon
      { date: "2026-08-25", kwh: 12_000 }, // Tue
      { date: "2026-08-24", kwh: 8_000 }, // Mon again → avg 9000
    ]);
    assert.equal(profile.length, 7);
    assert.equal(profile[0]!.d, "Mon");
    assert.equal(profile[0]!.kwh, 9000);
    assert.equal(profile[1]!.d, "Tue");
    assert.equal(profile[1]!.kwh, 12_000);
    assert.equal(profile[6]!.d, "Sun");
    assert.equal(profile[6]!.kwh, 0);
  });
});
