import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TOD_BANDS_RJ,
  bandForHour,
  energyTrendPoints,
  intensitySnapshot,
  mdHeadroomPct,
  missingLabel,
  topConsumersFixture,
} from "../src/lib/analytics.js";

describe("analytics fixtures and calculations", () => {
  it("ranks top consumers with shares totaling ~100%", () => {
    const rows = topConsumersFixture();
    assert.ok(rows[0]!.kwh >= rows[1]!.kwh);
    const share = rows.reduce((s, r) => s + r.sharePct, 0);
    assert.ok(share > 99 && share < 101);
  });

  it("builds a dense but bounded energy trend series", () => {
    const pts = energyTrendPoints();
    assert.equal(pts.length, 10_080);
  });

  it("resolves TOD bands including midnight wrap", () => {
    assert.equal(bandForHour(23, TOD_BANDS_RJ).id, "off");
    assert.equal(bandForHour(11, TOD_BANDS_RJ).label, "Peak");
    assert.equal(bandForHour(7, TOD_BANDS_RJ).label, "Normal");
  });

  it("computes MD headroom against CMD", () => {
    assert.equal(mdHeadroomPct(4200, 5000), 16);
  });

  it("keeps intensity honest — Scope 1 always missing, no invented SEC", () => {
    const snap = intensitySnapshot({
      productionUnits: null,
      gridKwh: 1_200_000,
      renewableKwh: 80_000,
      emissionFactorTPerMwh: 0.71,
      emissionFactorRef: "cea_grid_india_2024_v1",
      cmdKva: 5000,
      peakMdKva: 4200,
    });
    assert.equal(snap.secKwhPerUnit, null);
    assert.equal(snap.scope1Tco2e, null);
    assert.ok(snap.missing.includes("production_units"));
    assert.ok(snap.missing.includes("scope1_activity_data"));
    assert.match(missingLabel("scope1_activity_data"), /not available/i);
    assert.ok(snap.scope2Tco2e != null && snap.scope2Tco2e > 0);
  });
});
