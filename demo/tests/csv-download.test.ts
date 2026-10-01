import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeCsvCell, toCsv } from "../src/lib/csv-download.js";

describe("csv formula defense", () => {
  it("guards formula-like cells", () => {
    assert.equal(escapeCsvCell("=1+1"), `"'=1+1"`);
    assert.equal(escapeCsvCell("+x"), `"'+x"`);
    const csv = toCsv(["title"], [["-1+2"]]);
    assert.match(csv, /"'-1\+2"/);
  });
});
