import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sampleAlarms } from "./samples.js";
import {
  actionsForState,
  applyAlarmAction,
  moveSelection,
  sortAlarms,
} from "../src/lib/alarms.js";

describe("EMS alarm helpers", () => {
  it("sorts critical before warning and older first within severity", () => {
    const sorted = sortAlarms(sampleAlarms.filter((a) => a.state !== "cleared"));
    assert.equal(sorted[0]?.severity, "critical");
    assert.equal(sorted[0]?.id, "alm_1001");
    assert.equal(sorted[1]?.severity, "critical");
    assert.equal(sorted[1]?.id, "alm_1005");
    assert.equal(sorted[2]?.severity, "warning");
  });

  it("applies lifecycle actions and keyboard selection moves", () => {
    const raised = sampleAlarms.find((a) => a.id === "alm_1001")!;
    assert.ok(actionsForState(raised.state).includes("ack"));
    const acked = applyAlarmAction(raised, "ack");
    assert.equal(acked.state, "acked");
    assert.ok(actionsForState(acked.state).includes("unack"));
    assert.equal(applyAlarmAction(acked, "unack").state, "raised");
    assert.equal(applyAlarmAction(raised, "silence").state, "silenced");
    assert.equal(moveSelection(0, 1, 3), 1);
    assert.equal(moveSelection(0, -1, 3), 0);
    assert.equal(moveSelection(2, 1, 3), 2);
  });
});
