import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatIstDate,
  formatIstDateRange,
  formatIstDateTime,
  formatIstTime,
} from "../src/lib/format.js";

describe("IST datetime formatters", () => {
  const sample = "2026-07-21T10:08:00+05:30";

  it("formats full datetime readably with IST suffix", () => {
    const out = formatIstDateTime(sample);
    assert.match(out, /Jul/);
    assert.match(out, /2026/);
    assert.match(out, /IST$/);
    assert.doesNotMatch(out, /T\d{2}:/);
  });

  it("formats date without time noise", () => {
    assert.match(formatIstDate(sample), /21 Jul 2026/);
  });

  it("formats time with am/pm", () => {
    assert.match(formatIstTime(sample), /IST$/);
    assert.match(formatIstTime(sample), /am|pm/i);
  });

  it("formats date ranges compactly", () => {
    const out = formatIstDateRange(
      "2026-07-01T00:00:00+05:30",
      "2026-07-21T00:00:00+05:30",
    );
    assert.match(out, /→/);
    assert.match(out, /Jul/);
  });

  it("returns em dash for missing or invalid timestamps", () => {
    assert.equal(formatIstDateTime("-"), "-");
    assert.equal(formatIstDateTime(""), "-");
    assert.equal(formatIstDateTime("not-a-date"), "not-a-date");
  });
});
