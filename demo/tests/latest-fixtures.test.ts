import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alarmsForPlant,
  DEMO_PLANT,
  findPrescription,
  prescriptionsForPlant,
  VINAYAK_PLANT,
} from "../src/fixtures/demo.js";
import {
  findEvidenceSample,
  resolveEvidenceIdForAlarm,
  resolveEvidenceIdForRx,
} from "../src/fixtures/evidence-samples.js";
import { getDemoCasePayload, getDemoEvidenceSamples } from "../src/lib/demo-data.js";
import type { PlantOutcome } from "../src/lib/types.js";
import { getLnmConservationWorklist } from "../src/sites/lnm/worklist.js";

const latestChains = [
  ["alm_1010", "rx_9012", "evd_4415"],
  ["alm_1011", "rx_9013", "evd_4416"],
  ["alm_1012", "rx_9014", "evd_4417"],
  ["alm_1013", "rx_9015", "evd_4418"],
  ["alm_1014", "rx_9016", "evd_4419"],
] as const;

describe("latest demo decision chains", () => {
  it("classifies every demo prescription with one outcome and value signal", () => {
    const prescriptions = [
      ...prescriptionsForPlant(DEMO_PLANT.plantId),
      ...prescriptionsForPlant(VINAYAK_PLANT.plantId),
      ...getLnmConservationWorklist(),
    ];
    const outcomes = new Set<PlantOutcome>();

    for (const prescription of prescriptions) {
      assert.ok(prescription.outcome, `${prescription.id} should have an outcome`);
      assert.ok(
        prescription.valueSignal,
        `${prescription.id} should have a primary value signal`,
      );
      outcomes.add(prescription.outcome!);
    }

    assert.deepEqual([...outcomes].sort(), [
      "dynamic_production_planning",
      "energy_waste",
      "quality_yield",
      "uptime",
    ]);
  });

  it("classifies every demo alarm, including unlinked operational signals", () => {
    for (const plantId of [DEMO_PLANT.plantId, VINAYAK_PLANT.plantId]) {
      for (const alarm of alarmsForPlant(plantId)) {
        assert.ok(alarm.outcome, `${alarm.id} should have an outcome`);
      }
    }
  });

  it("keeps every new alarm, prescription, evidence pack, and case linked", () => {
    const alarms = alarmsForPlant(DEMO_PLANT.plantId);
    const prescriptions = prescriptionsForPlant(DEMO_PLANT.plantId);

    for (const [alarmId, rxId, evidenceId] of latestChains) {
      const alarm = alarms.find((row) => row.id === alarmId);
      const rx = prescriptions.find((row) => row.id === rxId);

      assert.ok(alarm, `${alarmId} should exist`);
      assert.ok(rx, `${rxId} should exist`);
      assert.equal(alarm?.plantId, DEMO_PLANT.plantId);
      assert.equal(rx?.plantId, DEMO_PLANT.plantId);
      assert.equal(alarm?.relatedPrescriptionId, rxId);
      assert.equal(rx?.relatedAlarmId, alarmId);
      assert.equal(alarm?.outcome, rx?.outcome);
      assert.equal(resolveEvidenceIdForAlarm(alarmId), evidenceId);
      assert.equal(resolveEvidenceIdForRx(rxId), evidenceId);
      assert.equal(findEvidenceSample(evidenceId)?.outcome, rx?.outcome);

      const casePayload = getDemoCasePayload({ rxId });
      assert.equal(casePayload?.prescription?.id, rxId);
      assert.equal(casePayload?.evidence.sample?.id, evidenceId);
      assert.ok(casePayload?.prescription?.caseDetail?.eventSnapshot);
    }
  });

  it("puts the new records first without removing historical records", () => {
    assert.deepEqual(
      prescriptionsForPlant(DEMO_PLANT.plantId)
        .slice(0, 5)
        .map((row) => row.id),
      ["rx_9016", "rx_9015", "rx_9014", "rx_9013", "rx_9012"],
    );
    assert.deepEqual(
      getDemoEvidenceSamples()
        .slice(0, 5)
        .map((row) => row.id),
      ["evd_4419", "evd_4418", "evd_4417", "evd_4416", "evd_4415"],
    );
    assert.ok(findPrescription("rx_9001"));
    assert.ok(findEvidenceSample("evd_4401"));
  });
});
