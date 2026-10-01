import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("forge UI hygiene", () => {
  it("avoids decorative body gradients (SoT)", () => {
    const css = readFileSync(
      join(import.meta.dirname, "../src/styles/tokens.css"),
      "utf8",
    );
    assert.doesNotMatch(css, /radial-gradient/);
    assert.match(css, /prefers-reduced-motion/);
  });

  it("keeps primary coral reserved (token present)", () => {
    const css = readFileSync(
      join(import.meta.dirname, "../src/styles/tokens.css"),
      "utf8",
    );
    assert.match(css, /--forge-primary:\s*#f75440/);
    assert.match(css, /--forge-secondary:\s*#000a07/);
  });
});
