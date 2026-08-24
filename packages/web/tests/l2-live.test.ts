import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LNM_PLANT, PLANTS, VINAYAK_PLANT, DEMO_PLANT } from "../src/fixtures/demo";
import { fixtureAssetsAsL2, liveSnapshotFromL2Assets } from "../src/lib/l2-live";

describe("LNM plant registration", () => {
  it("exposes LNM Factory 1 in the selectable plant list", () => {
    assert.equal(LNM_PLANT.plantId, "plant_lnm_faridabad_1");
    assert.equal(LNM_PLANT.orgId, "org_acme");
    assert.ok(PLANTS.some((p) => p.plantId === LNM_PLANT.plantId));
    assert.ok(PLANTS.some((p) => p.plantId === VINAYAK_PLANT.plantId));
    assert.ok(PLANTS.some((p) => p.plantId === DEMO_PLANT.plantId));
    assert.equal(PLANTS[0]?.plantId, LNM_PLANT.plantId);
  });
});

describe("l2 live overlay", () => {
  it("maps LNM fixture assets without inventing measurement values", () => {
    const assets = fixtureAssetsAsL2("plant_lnm_faridabad_1");
    assert.ok(assets.some((a) => a.asset_id === "cnc_vtl_01"));
    const snap = liveSnapshotFromL2Assets(assets);
    assert.ok(snap.machines.some((m) => m.name === "VTL-01"));
    assert.equal(
      snap.machines.find((m) => m.name === "VTL-01")?.kwh,
      null,
    );
  });
});
