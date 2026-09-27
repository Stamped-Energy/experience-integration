import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLANT_ROOT_LEVEL,
  levelForNode,
  findSectionNode,
  viewBoxForLevel,
  viewBoxMetrics,
  flowLabelPoint,
  nodeById,
} from "../src/fixtures/plant-sections.js";

describe("plant section map", () => {
  it("defines root sections with drill-down levels", () => {
    assert.ok(PLANT_ROOT_LEVEL.nodes.length >= 4);
    assert.ok(PLANT_ROOT_LEVEL.edges.length >= 3);
    const pyro = findSectionNode("section_pyro");
    assert.ok(pyro?.children?.length);
    assert.ok(levelForNode("section_pyro")?.nodes.length);
    const vb = viewBoxForLevel(PLANT_ROOT_LEVEL);
    assert.match(vb, /^[\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+$/);
    const metrics = viewBoxMetrics(PLANT_ROOT_LEVEL);
    assert.ok(metrics.aspectRatio > 0);
  });

  it("places flow labels on path midpoints", () => {
    const edge = PLANT_ROOT_LEVEL.edges[0];
    assert.ok(edge);
    const from = nodeById(PLANT_ROOT_LEVEL, edge.from);
    const to = nodeById(PLANT_ROOT_LEVEL, edge.to);
    assert.ok(from && to);
    const point = flowLabelPoint(from, to);
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
  });
});
