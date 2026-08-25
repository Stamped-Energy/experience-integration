import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  recommendAssignees,
  routesForPerson,
  notifyPeopleFixture,
} from "../src/fixtures/assignments.js";

describe("assignment recommendations", () => {
  it("returns 2–3 WhatsApp-enabled people for an area", () => {
    const rec = recommendAssignees({ area: "Pyro", limit: 3 });
    assert.ok(rec.length >= 2 && rec.length <= 3);
    assert.ok(rec.every((p) => p.whatsappEnabled));
    assert.ok(rec.some((p) => p.areas.includes("Pyro") || p.assetIds.includes("kiln_1")));
  });

  it("lists routes for a primary contact", () => {
    const routes = routesForPerson("usr_op");
    assert.ok(routes.length >= 1);
    assert.ok(notifyPeopleFixture.length >= 5);
  });
});
