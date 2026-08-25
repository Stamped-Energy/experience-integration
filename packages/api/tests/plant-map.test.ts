import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { layoutNodes } from "../src/insights/plant-map.js";

describe("plant-map layoutNodes", () => {
  it("assigns grid positions and health styles without inventing load", () => {
    const nodes = layoutNodes([
      {
        id: "a",
        name: "A",
        area: "Feeder",
        kw: 100,
        loadPct: 50,
      },
      {
        id: "b",
        name: "B",
        area: "Feeder",
        kw: 200,
        loadPct: 96,
      },
    ]);
    assert.equal(nodes.length, 2);
    assert.equal(nodes[0]!.x, 48);
    assert.equal(nodes[0]!.health, "calm");
    assert.equal(nodes[1]!.health, "hot");
    assert.ok(nodes[1]!.x > nodes[0]!.x);
  });
});
