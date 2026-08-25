import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { contrastRatio } from "../src/lib/contrast.js";

const root = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(join(root, "../src/styles/tokens.css"), "utf8");

function cssVar(name: string): string {
  const match = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  assert.ok(match?.[1], `missing ${name}`);
  return match[1]!;
}

describe("Forge token contrast", () => {
  it("keeps body text AA on surface (≥4.5)", () => {
    const ratio = contrastRatio(
      cssVar("--forge-on-surface"),
      cssVar("--forge-surface"),
    );
    assert.ok(ratio >= 4.5, `body contrast ${ratio}`);
  });

  it("keeps primary CTA text AA-large/UI on primary (≥3.0)", () => {
    // Design SoT locks coral #f75440 + white (~3.33). Normal-text 4.5 is impossible
    // without changing brand; CTAs must use ≥16px/700 (large text) or primary-fixed.
    const ratio = contrastRatio(
      cssVar("--forge-on-primary"),
      cssVar("--forge-primary"),
    );
    assert.ok(ratio >= 3, `primary contrast ${ratio}`);
  });

  it("keeps small text AA on primary-fixed (≥4.5)", () => {
    const ratio = contrastRatio(
      cssVar("--forge-on-primary-fixed"),
      cssVar("--forge-primary-fixed"),
    );
    assert.ok(ratio >= 4.5, `primary-fixed contrast ${ratio}`);
  });

  it("keeps topbar text AA on secondary (≥4.5)", () => {
    const ratio = contrastRatio(
      cssVar("--forge-on-secondary"),
      cssVar("--forge-secondary"),
    );
    assert.ok(ratio >= 4.5, `secondary contrast ${ratio}`);
  });

  it("snapshots core Forge brand tokens from design SoT", () => {
    assert.equal(cssVar("--forge-primary").toLowerCase(), "#f75440");
    assert.equal(cssVar("--forge-secondary").toLowerCase(), "#000a07");
    assert.equal(cssVar("--forge-surface").toLowerCase(), "#f7faf5");
    assert.equal(cssVar("--forge-tertiary").toLowerCase(), "#00666b");
  });

  it("declares display, body, and mono font stacks", () => {
    assert.match(tokens, /Space Grotesk/);
    assert.match(tokens, /Inter/);
    assert.match(tokens, /IBM Plex Mono/);
  });
});
