import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSimpleDocx } from "../src/lib/docx-download.js";

describe("docx-download", () => {
  it("builds a zip with OOXML local file signature", () => {
    const bytes = buildSimpleDocx(["Hello", "World"]);
    // PK\x03\x04 local header
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
    assert.equal(bytes[2], 0x03);
    assert.equal(bytes[3], 0x04);
    assert.ok(bytes.length > 200);
  });
});
