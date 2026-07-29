import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  l5AlarmsPath,
  l5PrescriptionsPath,
  toProductAlarm,
  type L5Alarm,
} from "../src/upstream/l5/client.js";

describe("L5WorkflowClient paths", () => {
  it("uses plant-scoped alarms path", () => {
    assert.equal(l5AlarmsPath("plant_vinayak_1"), "v1/plants/plant_vinayak_1/alarms");
  });

  it("uses plant-scoped prescriptions path", () => {
    assert.equal(
      l5PrescriptionsPath("plant_vinayak_1"),
      "v1/plants/plant_vinayak_1/prescriptions",
    );
  });
});

describe("toProductAlarm", () => {
  it("maps L5 wire alarm to product shape", () => {
    const wire: L5Alarm = {
      id: "al-1",
      org_id: "org_acme",
      plant_id: "plant_vinayak_1",
      asset_id: "plant",
      asset_label: "Vinayak Plant",
      severity: "critical",
      state: "raised",
      summary: "MD overlap",
      raised_at: "2026-06-15T12:00:00Z",
      related_prescription_id: "rx-1",
    };
    const product = toProductAlarm(wire);
    assert.equal(product.plantId, "plant_vinayak_1");
    assert.equal(product.id, "al-1");
    assert.equal(product.severity, "critical");
    assert.equal(product.relatedPrescriptionId, "rx-1");
  });
});
