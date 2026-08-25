import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  recommendAssigneesFromPeople,
  type RecommendablePerson,
} from "../src/lib/assign-recommend.js";

const sample: RecommendablePerson[] = [
  {
    id: "p1",
    name: "Imran",
    role: "operator",
    phoneMasked: "+91 •••• •• 4412",
    areas: ["Pyro", "Utilities"],
    assetIds: ["kiln_1"],
    skills: [],
    whatsappEnabled: true,
  },
  {
    id: "p2",
    name: "Neha",
    role: "supervisor",
    phoneMasked: "+91 •••• •• 8821",
    areas: ["Pyro", "Grinding"],
    assetIds: ["kiln_1"],
    skills: [],
    whatsappEnabled: true,
  },
  {
    id: "p3",
    name: "Priya",
    role: "energy_manager",
    phoneMasked: "+91 •••• •• 1033",
    areas: ["Grinding"],
    assetIds: [],
    skills: [],
    whatsappEnabled: true,
  },
  {
    id: "p4",
    name: "Off",
    role: "operator",
    phoneMasked: "+91 •••• •• 0000",
    areas: ["Pyro"],
    assetIds: [],
    skills: [],
    whatsappEnabled: false,
  },
];

describe("assignment recommendations", () => {
  it("returns 2–3 WhatsApp-enabled people for an area", () => {
    const rec = recommendAssigneesFromPeople(sample, { area: "Pyro", limit: 3 });
    assert.ok(rec.length >= 2 && rec.length <= 3);
    assert.ok(rec.every((p) => p.whatsappEnabled));
    assert.ok(
      rec.some((p) => p.areas.includes("Pyro") || p.assetIds.includes("kiln_1")),
    );
  });

  it("falls back to supervisors/operators when no area match", () => {
    const rec = recommendAssigneesFromPeople(sample, {
      area: "UnknownHall",
      limit: 3,
    });
    assert.ok(rec.length >= 1);
    assert.ok(rec.every((p) => p.role === "supervisor" || p.role === "operator"));
  });
});
