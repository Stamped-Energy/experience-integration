import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import { TodayBoard } from "../src/components/today/TodayBoard.js";
import { sampleTodaySignals } from "./samples.js";
import { resolveRouteState } from "../src/lib/route-state.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MOBILE_ESSENTIAL_SIGNAL_IDS,
  TODAY_SIGNAL_CAP,
  filterMobileEssentialSignals,
  selectTodaySignals,
} from "../src/lib/today-signals.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Today decision signals", () => {
  it("never exceeds seven signals for any role", () => {
    const bloated = [
      ...sampleTodaySignals,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `extra_${i}`,
        label: `Extra ${i}`,
        value: String(i),
        tone: "neutral" as const,
        href: "/alarms",
      })),
    ];
    for (const role of [
      "operator",
      "supervisor",
      "plant_head",
      "energy_manager",
      "sustainability",
      "cfo",
      "admin",
    ] as const) {
      const selected = selectTodaySignals(role, bloated);
      assert.ok(selected.length <= TODAY_SIGNAL_CAP, role);
      assert.ok(selected.length > 0, role);
    }
  });

  it("prioritises ops-confirmed savings for plant_head and hides alarms from cfo", () => {
    const head = selectTodaySignals("plant_head", sampleTodaySignals);
    assert.equal(head[0]?.id, "savings");
    const cfo = selectTodaySignals("cfo", sampleTodaySignals);
    assert.equal(
      cfo.some((s) => s.id === "alarms" || s.href.startsWith("/alarms")),
      false,
    );
    assert.ok(cfo.some((s) => s.id === "savings"));
  });

  it("renders loading and stale route states", () => {
    const loading = renderToStaticMarkup(
      createElement(TodayBoard, {
        signals: sampleTodaySignals,
        closurePct: 64,
        state: resolveRouteState({ loading: true }),
      }),
    );
    assert.match(loading, /aria-busy/);
    assert.equal(loading.includes("data-today-board"), false);

    const stale = renderToStaticMarkup(
      createElement(TodayBoard, {
        signals: selectTodaySignals("plant_head", sampleTodaySignals),
        closurePct: 64,
        state: resolveRouteState({ stale: true }),
      }),
    );
    assert.match(stale, /last known data/i);
    assert.match(stale, /data-today-board/);
    assert.match(stale, /data-signal-count="7"/);
  });

  it("renders partial missing slices without inventing signals", () => {
    const html = renderToStaticMarkup(
      createElement(TodayBoard, {
        signals: selectTodaySignals("operator", sampleTodaySignals),
        closurePct: 50,
        state: resolveRouteState({ missing: ["ledger"] }),
      }),
    );
    assert.match(html, /Ledger unavailable/i);
    assert.match(html, /data-today-board/);
  });

  it("phone essentials keep only alarms, rx, and savings in role order", () => {
    const head = selectTodaySignals("plant_head", sampleTodaySignals);
    const phone = filterMobileEssentialSignals(head);
    assert.deepEqual(
      phone.map((s) => s.id),
      ["savings", "alarms", "rx"],
    );
    assert.deepEqual([...MOBILE_ESSENTIAL_SIGNAL_IDS].sort(), [
      "alarms",
      "rx",
      "savings",
    ]);
    assert.equal(
      phone.some((s) =>
        ["closure", "md", "deviation", "stale"].includes(s.id),
      ),
      false,
    );
  });

  it("KPI hero strip stays 2-column at ≤899px and is not forced to 1-col at ≤700px", () => {
    const css = readFileSync(
      join(__dirname, "../src/styles/forge-ui.css"),
      "utf8",
    );
    assert.match(
      css,
      /@media \(max-width: 899px\)[\s\S]*?\.forge-kpi-hero-strip\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    const at700 = css.match(
      /@media \(max-width: 700px\)\s*\{([\s\S]*?)(?=@media|$)/,
    );
    assert.ok(at700, "expected ≤700px media query");
    assert.equal(
      /\.forge-kpi-hero-strip\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(
        at700[1] ?? "",
      ),
      false,
      "≤700px must not collapse KPI hero to a single column",
    );
  });
});
