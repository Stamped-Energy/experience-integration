import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  alarmsFixture,
  DEMO_PLANT,
  prescriptionsFixture,
} from "../src/fixtures/demo.js";
import {
  findEvidenceSample,
  resolveEvidenceIdForAlarm,
  resolveEvidenceIdForRx,
  resolvePrimaryEvidenceId,
} from "../src/fixtures/evidence-samples.js";
import {
  buildEvidencePack,
  evidenceRouteState,
  resolveEvidenceScope,
} from "../src/lib/evidence.js";

describe("evidence scope and honesty", () => {
  it("pre-scopes from alarm and related prescription", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarmId: "alm_1001",
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    assert.equal(scope.assetId, "kiln_1");
    assert.equal(scope.alarmId, "alm_1001");
    assert.equal(scope.rxId, "rx_9001");
  });

  it("pre-scopes from prescription id alone with linked asset", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      rxId: "rx_9005",
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    assert.equal(scope.rxId, "rx_9005");
    assert.equal(scope.assetId, "mill_2");
    assert.match(scope.title, /Raw Mill 2/);
  });

  it("keeps baseline missing when gated — never invents band", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    const pack = buildEvidencePack(scope, { baselineAvailable: false });
    assert.deepEqual(pack.missing, ["baseline"]);
    assert.equal(evidenceRouteState(pack).kind, "partial");
    assert.ok(pack.lineage.ruleId);
    assert.ok(pack.lineage.tariffId);
    assert.ok(!pack.lineage.sources.includes("Baseline comparison"));
  });

  it("includes baseline source only when available", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    const pack = buildEvidencePack(scope, { baselineAvailable: true });
    assert.deepEqual(pack.missing, []);
    assert.equal(evidenceRouteState(pack).kind, "default");
    assert.ok(pack.lineage.sources.includes("Baseline comparison"));
  });
});

describe("evidence sample routing", () => {
  it("maps alarms to specific evidence ids", () => {
    assert.equal(resolveEvidenceIdForAlarm("alm_1001"), "evd_4401");
    assert.equal(resolveEvidenceIdForAlarm("alm_1006"), "evd_4411");
    assert.equal(resolveEvidenceIdForAlarm("alm_1005"), "evd_4410");
  });

  it("maps prescriptions to primary evidence ids", () => {
    assert.equal(resolveEvidenceIdForRx("rx_9001"), "evd_4401");
    assert.equal(resolveEvidenceIdForRx("rx_9005"), "evd_4411");
  });

  it("loads rich sample fixtures by id", () => {
    const sample = findEvidenceSample("evd_4411");
    assert.ok(sample);
    assert.equal(sample?.categoryBadge.label, "Idle kWh");
    assert.equal(sample?.tagRows.length, 4);
    assert.equal(sample?.chart.kind, "bar");
  });

  it("resolves primary evidence from alarm query params", () => {
    assert.equal(
      resolvePrimaryEvidenceId({ alarmId: "alm_1002" }),
      "evd_4402",
    );
  });

  it("resolves the same pack from related alarmId and rxId", () => {
    assert.equal(
      resolvePrimaryEvidenceId({ alarmId: "alm_1001" }),
      resolvePrimaryEvidenceId({ rxId: "rx_9001" }),
    );
    assert.equal(resolvePrimaryEvidenceId({ alarmId: "alm_1001" }), "evd_4401");
  });

  it("exposes alarm and prescription parent chips on evidence detail", () => {
    const sample = findEvidenceSample("evd_4401");
    assert.ok(sample?.alarmId && sample.rxId && sample.findingId);
    const src = readFileSync(
      new URL("../src/components/evidence/EvidenceDetail.tsx", import.meta.url),
      "utf8",
    );
    assert.match(src, /Alarm ·/);
    assert.match(src, /Prescription/);
    assert.match(src, /data-evidence-parents/);
  });
});
