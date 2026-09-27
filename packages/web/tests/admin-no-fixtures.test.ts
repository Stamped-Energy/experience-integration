import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const APP_ROOT = join(import.meta.dirname, "../src/app");
const SETTINGS = join(APP_ROOT, "settings");
const TOOLS = join(APP_ROOT, "tools");
const ASSIGNMENTS_BOARD = join(
  import.meta.dirname,
  "../src/components/assignments/AssignmentsBoard.tsx",
);
const ASSIGN_SHEET = join(
  import.meta.dirname,
  "../src/components/assignments/AssignAssigneeSheet.tsx",
);
const SEEDED_SUBSTRINGS = [
  "@/fixtures",
  "connectionFixture",
  "apiKeysFixture",
  "webhooksFixture",
  "notifyPeopleFixture",
  "alarmRouteRulesFixture",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

describe("demo admin surfaces stay seeded", () => {
  it("settings + tools + assignments expose the fixture pack", () => {
    const files = [
      ...walk(SETTINGS),
      ...walk(TOOLS),
      ASSIGNMENTS_BOARD,
      ASSIGN_SHEET,
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    const missing = SEEDED_SUBSTRINGS.filter((seed) => !source.includes(seed));
    assert.deepEqual(missing, []);
    assert.equal(source.includes("WhatsApp notification queued"), false);
  });
});
