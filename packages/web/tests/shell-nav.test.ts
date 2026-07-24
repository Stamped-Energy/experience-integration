import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import {
  canAccessRoute,
  composeNav,
  composeNavTree,
  mobileDock,
  navForRole,
  sanitizePins,
  togglePin,
} from "../src/lib/navigation.js";
import { AppShell } from "../src/components/shell/AppShell.js";

const root = dirname(fileURLToPath(import.meta.url));
const shellCss = readFileSync(
  join(root, "../src/components/shell/shell.css"),
  "utf8",
);

describe("role-aware navigation", () => {
  it("hides admin tools from operator", () => {
    const { primary, reveal } = navForRole("operator");
    assert.ok(primary.some((i) => i.key === "alarms"));
    assert.equal(
      [...primary, ...reveal].some((i) => i.key === "admin"),
      false,
    );
    assert.equal(canAccessRoute("operator", "route:admin"), false);
  });

  it("exposes integrations only to admin", () => {
    assert.equal(canAccessRoute("plant_head", "route:integrations"), false);
    assert.equal(canAccessRoute("admin", "route:integrations"), true);
    assert.ok(navForRole("admin").reveal.some((i) => i.key === "integrations"));
  });

  it("keeps Evidence out of primary and labels Overview professionally", () => {
    const { primary } = navForRole("plant_head");
    assert.equal(primary.some((i) => i.key === "evidence"), false);
    assert.ok(primary.some((i) => i.key === "today" && i.label === "Overview"));
    assert.ok(primary.some((i) => i.key === "energy" && i.label === "Energy Analytics"));
    assert.ok(
      primary.some((i) => i.key === "prescriptions" && i.label === "Prescriptions"),
    );
  });

  it("exposes Assignments to admin under reveal (Tools / Settings dock)", () => {
    assert.ok(navForRole("admin").reveal.some((i) => i.key === "assignments"));
    assert.equal(navForRole("admin").primary.some((i) => i.key === "assignments"), false);
  });

  it("keeps Plant Map as its own primary route", () => {
    const { primary } = navForRole("energy_manager");
    assert.ok(primary.some((i) => i.key === "plant_map" && i.href === "/plant-map"));
    assert.ok(primary.some((i) => i.key === "equipment" && i.label === "Machine Health"));
  });

  it("keeps mobile dock to three primary destinations", () => {
    assert.equal(mobileDock("plant_head").length, 3);
  });

  it("keeps alarms and prescriptions as ops invariants in primary", () => {
    const { primary } = composeNav("plant_head", []);
    assert.ok(primary.some((i) => i.key === "alarms"));
    assert.ok(primary.some((i) => i.key === "prescriptions"));
    assert.ok(primary.some((i) => i.key === "energy"));
    assert.deepEqual(togglePin("supervisor", [], "alarms"), []);
    assert.deepEqual(sanitizePins("cfo", ["alarms", "energy"]), []);
  });

  it("promotes sanitized pins and drops unauthorized keys", () => {
    const pins = sanitizePins("plant_head", ["evidence", "admin", "alarms", "evidence"]);
    assert.deepEqual(pins, ["evidence"]);
    const { primary, reveal } = composeNav("plant_head", pins);
    assert.ok(primary.some((i) => i.key === "evidence"));
    assert.equal(reveal.some((i) => i.key === "evidence"), false);
  });

  it("groups navigation into collapsible sections instead of a flat list", () => {
    const tree = composeNavTree("plant_head", ["evidence"], { active: "energy" });
    assert.ok(tree.standalone.some((i) => i.key === "today"));
    assert.ok(tree.standalone.some((i) => i.key === "live"));
    assert.ok(tree.standalone.some((i) => i.key === "analyst"));
    assert.equal(tree.groups.length >= 3, true);
    const insights = tree.groups.find((g) => g.id === "insights");
    assert.ok(insights?.items.some((i) => i.key === "energy"));
    assert.equal(insights?.defaultOpen, true);
    const reports = tree.groups.find((g) => g.id === "reports");
    assert.ok(reports?.items.some((i) => i.key === "evidence"));
    assert.equal(reports?.defaultOpen, true);
  });

  it("hides empty groups for restricted roles", () => {
    const tree = composeNavTree("cfo", [], { active: "reports" });
    assert.equal(tree.groups.some((g) => g.id === "operations"), false);
    assert.ok(tree.groups.some((g) => g.id === "reports"));
    assert.equal(tree.standalone.some((i) => i.key === "analyst"), true);
  });
});

describe("responsive Forge shell", () => {
  it("declares desktop breakpoint and mobile dock/sidebar rules", () => {
    assert.match(shellCss, /min-width:\s*900px/);
    assert.match(shellCss, /max-width:\s*899px/);
    assert.match(shellCss, /\.forge-shell__dock/);
    assert.match(shellCss, /\.forge-shell__nav-group/);
    assert.match(shellCss, /\.forge-shell__nav-sub/);
    assert.match(shellCss, /height:\s*100dvh/);
    assert.match(shellCss, /overflow:\s*hidden/);
  });

  it("renders landmarks, skip link, and truthful offline banner", () => {
    const html = renderToStaticMarkup(
      createElement(AppShell, {
        active: "today",
        plantName: "Jaipur Works",
        role: "cfo",
        connection: { sse: "offline" },
        screenTitle: "Today",
        contextSummary: ["Bill risk"],
        criticalAlarmCount: 0,
        children: createElement("p", null, "body"),
      }),
    );
    assert.match(html, /Skip to main content/);
    assert.match(html, /id="forge-main"/);
    assert.match(html, /data-shell="desktop-nav"/);
    assert.match(html, /data-shell="mobile-dock"/);
    assert.match(html, /Live updates offline/);
    assert.match(html, /Stamped/);
    // CFO must not see Alarms in primary nav
    assert.equal(html.includes(">Alarms<"), false);
    assert.match(html, /Reports/);
  });
});
