import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cacheHeadersForHistorical,
  ifNoneMatchMatches,
  isClosedHistoricalWindow,
  weakEtag,
} from "../src/http/cache.js";

describe("cache helpers", () => {
  it("treats past to= as closed historical", () => {
    assert.equal(isClosedHistoricalWindow("2020-01-01T00:00:00Z"), true);
    const future = new Date(Date.now() + 3_600_000).toISOString();
    assert.equal(isClosedHistoricalWindow(future), false);
  });

  it("builds stable weak etag", () => {
    const a = weakEtag({ x: 1 });
    const b = weakEtag({ x: 1 });
    assert.equal(a, b);
    assert.match(a, /^W\/"/);
  });

  it("matches If-None-Match", () => {
    const { etag } = cacheHeadersForHistorical({ ok: true });
    assert.equal(ifNoneMatchMatches(etag, etag), true);
    assert.equal(ifNoneMatchMatches("W/\"other\"", etag), false);
  });
});
