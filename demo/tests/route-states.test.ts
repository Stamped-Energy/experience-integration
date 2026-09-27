import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import {
  ROUTE_STATES,
  resolveRouteState,
} from "../src/lib/route-state.js";
import { RouteStateView } from "../src/components/states/RouteStateView.js";

describe("route state contract", () => {
  it("covers the full FR-010 matrix", () => {
    assert.deepEqual(
      [...ROUTE_STATES].sort(),
      ["default", "empty", "error", "forbidden", "loading", "partial", "stale"].sort(),
    );
  });

  it("resolves precedence: forbidden > loading > error > empty > partial > stale > default", () => {
    assert.equal(
      resolveRouteState({
        forbidden: true,
        loading: true,
        error: "x",
        empty: true,
        stale: true,
        missing: ["ledger"],
      }).kind,
      "forbidden",
    );
    assert.equal(resolveRouteState({ loading: true, error: "x" }).kind, "loading");
    assert.equal(resolveRouteState({ error: "boom" }).kind, "error");
    assert.equal(resolveRouteState({ empty: true }).kind, "empty");
    assert.equal(resolveRouteState({ missing: ["baseline"] }).kind, "partial");
    assert.equal(resolveRouteState({ stale: true }).kind, "stale");
    assert.equal(resolveRouteState({}).kind, "default");
  });

  it("renders distinct surfaces for each non-default state", () => {
    const cases = [
      resolveRouteState({ loading: true }),
      resolveRouteState({ empty: true }),
      resolveRouteState({ error: "Upstream timeout" }),
      resolveRouteState({ stale: true }),
      resolveRouteState({ forbidden: true }),
      resolveRouteState({ missing: ["L2 ledger"] }),
    ];

    for (const state of cases) {
      const html = renderToStaticMarkup(
        createElement(RouteStateView, {
          state,
          onRetry: () => undefined,
          children: createElement("p", null, "content"),
        }),
      );
      assert.ok(html.length > 20, `expected markup for ${state.kind}`);
      if (state.kind === "error") assert.match(html, /role="alert"/);
      if (state.kind === "forbidden") assert.match(html, /don.t have access/i);
      if (state.kind === "partial") assert.match(html, /L2 ledger/);
      if (state.kind === "stale") assert.match(html, /content/);
      if (state.kind === "loading") assert.match(html, /aria-busy/);
    }
  });
});
