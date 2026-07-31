import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  claimBadgeLabel,
  formatInr,
  formatIstCompactDateTime,
  formatIstCompactDateTimeRange,
} from "../src/lib/format";
import {
  assertTenantMatch,
  visibleContextChips,
} from "../src/lib/analyst-context";
import type { AnalystContextEnvelope } from "../src/lib/types";

describe("formatInr", () => {
  it("uses en-IN grouping", () => {
    const s = formatInr(214000);
    assert.match(s, /2,14,000|214,000/);
  });
});

describe("claimBadgeLabel", () => {
  it("labels ops_confirmed distinctly", () => {
    assert.equal(claimBadgeLabel("ops_confirmed").label, "Confirmed by operations");
  });
  it("labels modeled with bill disclaimer", () => {
    assert.match(claimBadgeLabel("modeled").label, /pending bill check/i);
  });
});

describe("compact IST stamps", () => {
  it("shortens datetime without weekday or IST suffix", () => {
    const stamp = formatIstCompactDateTime("2026-07-21T10:08:00+05:30");
    assert.match(stamp, /21/);
    assert.match(stamp, /Jul/i);
    assert.match(stamp, /10:08/i);
    assert.doesNotMatch(stamp, /IST/);
  });

  it("collapses same-day ranges to time on the end", () => {
    const range = formatIstCompactDateTimeRange(
      "2026-07-21T10:08:00+05:30",
      "2026-07-21T14:30:00+05:30",
    );
    assert.match(range, /→/);
    assert.match(range, /2:30|14:30/i);
  });
});

describe("analyst context", () => {
  const base: AnalystContextEnvelope = {
    orgId: "org_demo",
    plantId: "plant_a",
    userId: "u1",
    role: "supervisor",
    routeId: "alarms",
    screenTitle: "Alarm console",
    focusEntity: { type: "alarm", id: "alm_1" },
    visibleSummary: ["critical open"],
  };

  it("builds removable chips", () => {
    const chips = visibleContextChips(base);
    assert.ok(chips.some((c) => c.value === "Alarm console"));
    assert.ok(chips.some((c) => c.value === "Alarm in focus"));
  });

  it("honours excludeKeys", () => {
    const chips = visibleContextChips({ ...base, excludeKeys: ["focus", "summary:0"] });
    assert.ok(!chips.some((c) => c.key === "focus"));
    assert.ok(!chips.some((c) => c.value === "critical open"));
  });

  it("rejects cross-tenant focus plant", () => {
    assert.equal(assertTenantMatch(base, "plant_other"), false);
    assert.equal(assertTenantMatch(base, "plant_a"), true);
  });
});
