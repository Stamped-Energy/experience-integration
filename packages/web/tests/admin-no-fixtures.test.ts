import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
const RX_QUEUE = join(
  import.meta.dirname,
  "../src/components/prescriptions/PrescriptionQueue.tsx",
);

const BANNED_SUBSTRINGS = [
  "@/fixtures",
  "DEMO_SHELL_ROLE",
  "connectionFixture",
  "alarmsForPlant",
  "apiKeysFixture",
  "webhooksFixture",
  "notifyPeopleFixture",
  "alarmRouteRulesFixture",
  "WhatsApp notification queued",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

describe("admin surfaces stay fixture-free", () => {
  it("settings + tools + assign/Rx surfaces ban fixtures / fake WA toast", () => {
    const files = [
      ...walk(SETTINGS),
      ...walk(TOOLS),
      ASSIGNMENTS_BOARD,
      ASSIGN_SHEET,
      RX_QUEUE,
    ];
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const ban of BANNED_SUBSTRINGS) {
        if (text.includes(ban)) {
          offenders.push(`${relative(APP_ROOT, file)} → ${ban}`);
        }
      }
    }
    assert.equal(
      offenders.length,
      0,
      `Banned fixture / demo shell usage:\n${offenders.join("\n")}`,
    );
  });
});
