import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMinuteSeries,
  sampleLttb,
  sampleMinMax,
} from "../src/lib/chart-sample.js";
import { FORGE_ECHARTS_THEME_NAME } from "../src/components/charts/forgeTheme.js";

describe("dense chart sampling", () => {
  it("builds the 43,200-point 30-day minute fixture", () => {
    const series = buildMinuteSeries(43_200);
    assert.equal(series.length, 43_200);
    assert.ok(series[0]!.t < series[series.length - 1]!.t);
  });

  it("LTTB reduces to the requested budget and keeps endpoints", () => {
    const series = buildMinuteSeries(43_200);
    const sampled = sampleLttb(series, 720);
    assert.equal(sampled.length, 720);
    assert.equal(sampled[0]!.t, series[0]!.t);
    assert.equal(sampled[sampled.length - 1]!.t, series[series.length - 1]!.t);
  });

  it("min-max envelope preserves the global maximum", () => {
    const series = buildMinuteSeries(43_200);
    const globalMax = series.reduce((a, p) => (p.v > a.v ? p : a), series[0]!);
    const envelope = sampleMinMax(series, 1440);
    const kept = envelope.some(
      (p) => p.t === globalMax.t && Math.abs(p.v - globalMax.v) < 1e-9,
    );
    assert.ok(kept, "expected global max retained in min-max buckets");
    assert.ok(envelope.length < series.length);
  });

  it("pipeline stays under budget for progressive canvas options", () => {
    const series = buildMinuteSeries(43_200);
    const t0 = performance.now();
    const sampled = sampleLttb(sampleMinMax(series, 1440), 720);
    const ms = performance.now() - t0;
    assert.equal(sampled.length, 720);
    assert.ok(ms < 500, `sampling took ${ms}ms`);
  });

  it("registers Forge theme name for ECharts", () => {
    assert.equal(FORGE_ECHARTS_THEME_NAME, "forge-industrial-v2");
  });
});
