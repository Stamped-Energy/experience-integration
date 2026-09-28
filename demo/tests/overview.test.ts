import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { getDemoOverview } from "../src/lib/demo-data.js";

const boardSource = readFileSync(
  join(__dirname, "../src/components/today/OverviewBoard.tsx"),
  "utf8",
);
const overviewStyles = readFileSync(
  join(__dirname, "../src/styles/forge-ui.css"),
  "utf8",
);

test("overview fixture includes trend, consumer, and exception context", () => {
  const overview = getDemoOverview();

  assert.equal(overview.energyTrend30d.length, 30);
  assert.ok(overview.topConsumers.length > 0);
  assert.ok(overview.alerts.length > 0);
  assert.ok(overview.alerts.some((alert) => alert.severity === "CRITICAL"));
});

test("overview composition preserves seven linked signal slots", () => {
  assert.equal((boardSource.match(/id: "/g) ?? []).length, 7);
  assert.match(boardSource, /data-overview-board/);
  assert.match(boardSource, /forge-overview__decision/);
  assert.match(boardSource, /AlertFeedPanel/);
});

test("overview has responsive styling and a chart data alternative", () => {
  assert.match(overviewStyles, /\.forge-overview/);
  assert.match(overviewStyles, /\.forge-chart-data/);
  assert.match(overviewStyles, /@media \(max-width: 420px\)/);
});
