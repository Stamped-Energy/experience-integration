import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createL2ClientFromOptions } from "../src/l2/routes.js";
import { orgIdForExternalPlantId } from "../src/upstream/mappings.js";

describe("createL2ClientFromOptions", () => {
  it("returns null when live is off or service key missing", () => {
    assert.equal(
      createL2ClientFromOptions(
        {
          baseUrl: "http://127.0.0.1:8091",
          timeoutMs: 5000,
          serviceKey: undefined,
          live: true,
          features: { ledgerEntries: false, baselines: false },
        },
        "org_acme",
      ),
      null,
    );
    assert.equal(
      createL2ClientFromOptions(
        {
          baseUrl: "http://127.0.0.1:8091",
          timeoutMs: 5000,
          serviceKey: "svc",
          live: false,
          features: { ledgerEntries: false, baselines: false },
        },
        "org_acme",
      ),
      null,
    );
  });

  it("builds a client when live and key are set", () => {
    const client = createL2ClientFromOptions(
      {
        baseUrl: "http://127.0.0.1:8091",
        timeoutMs: 5000,
        serviceKey: "svc-test-key",
        live: true,
        features: { ledgerEntries: false, baselines: false },
      },
      "org_acme",
    );
    assert.ok(client);
  });
});

describe("orgIdForExternalPlantId LNM", () => {
  it("maps LNM Factory 1 to org_acme", () => {
    assert.equal(orgIdForExternalPlantId("plant_lnm_faridabad_1"), "org_acme");
    assert.equal(orgIdForExternalPlantId("plant_vinayak_1"), "org_acme");
    assert.equal(orgIdForExternalPlantId("plant_jaipur_01"), "org_demo");
  });
});
