import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const root = join(import.meta.dirname);
const disclosureCss = readFileSync(
  join(root, "../src/styles/forge-disclosure.css"),
  "utf8",
);
const rxSrc = readFileSync(
  join(root, "../src/components/prescriptions/PrescriptionFullCase.tsx"),
  "utf8",
);
const almSrc = readFileSync(
  join(root, "../src/components/alarms/AlarmFullCase.tsx"),
  "utf8",
);
const evdSrc = readFileSync(
  join(root, "../src/components/evidence/EvidenceDetail.tsx"),
  "utf8",
);

describe("mobile essentials disclosures", () => {
  it("hides desktop stacks and shows disclosure stacks at 899px", () => {
    assert.match(disclosureCss, /max-width:\s*899px/);
    assert.match(disclosureCss, /\.forge-disclosure-stack/);
    assert.match(disclosureCss, /\.forge-mobile-always/);
    assert.match(disclosureCss, /\.forge-desktop-stack/);
    assert.match(disclosureCss, /display:\s*none\s*!important/);
    assert.match(disclosureCss, /min-height:\s*48px/);
  });

  it("wires prescription mobile always-on and disclosure stack", () => {
    assert.match(rxSrc, /rx-mobile-always/);
    assert.match(rxSrc, /rx-mobile-disclosures/);
    assert.match(rxSrc, /forge-desktop-stack/);
    assert.match(rxSrc, /Root-cause analysis/);
    assert.match(rxSrc, /Signal proof/);
    assert.match(rxSrc, /Event snapshot/);
    assert.match(rxSrc, /Cost, risk, KPIs/);
  });

  it("wires alarm mobile always-on and disclosure stack", () => {
    assert.match(almSrc, /alm-mobile-always/);
    assert.match(almSrc, /alm-mobile-disclosures/);
    assert.match(almSrc, /Signal snapshot/);
    assert.match(almSrc, /Signal proof/);
  });

  it("wires evidence mobile always-on and disclosure stack", () => {
    assert.match(evdSrc, /evd-mobile-always/);
    assert.match(evdSrc, /evd-mobile-disclosures/);
    assert.match(evdSrc, /Case context/);
    assert.match(evdSrc, /More detail/);
    assert.match(evdSrc, /Prescriptions/);
  });
});
