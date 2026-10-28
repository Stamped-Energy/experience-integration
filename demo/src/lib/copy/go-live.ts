/**
 * First-plant go-live checklist (D117).
 * Each gate names how it is proven on the plant emulator (M1E) before a real plant signs off.
 * There is no hardware revoke switch (D115).
 */

export type GoLiveProvenance = "emulator" | "product" | "plant" | "policy";

export type GoLiveStatus = "proven" | "ready" | "needs-plant" | "policy";

export type GoLiveItem = {
  id: string;
  title: string;
  detail: string;
  /** Who signs this gate at a real plant. */
  owner: string;
  /** How M1E / product proves the gate before plant sign-off. */
  m1e: string;
  /** Related decision or milestone. */
  decision: string;
  provenance: GoLiveProvenance;
  /** Demo / demonstration-plant status for the UI. */
  status: GoLiveStatus;
  href?: string;
};

export const GO_LIVE_PAGE_META =
  "Before the first plant goes live, every row on this checklist is signed. " +
  "Where a row can be proven on the plant emulator (M1E), that evidence is named here; " +
  "plant people still sign the plant gates. There is no hardware revoke switch (D115).";

export const GO_LIVE_ITEMS: readonly GoLiveItem[] = [
  {
    id: "feature-update-window",
    title: "Feature update window or security-update path",
    detail:
      "Agree a maintenance window for feature updates with the plant, or confirm the security-update path: every asset to recommend-only, update, health check, return to prior mode (D125).",
    owner: "Plant head with Stamped",
    m1e: "Security-update path is exercised on the emulator write sink and box restart checks; a real plant still agrees the window or confirms the path.",
    decision: "D125 / M7.11",
    provenance: "plant",
    status: "needs-plant",
  },
  {
    id: "restart-reconnect",
    title: "Restart rule and reconnect sync tested on the box",
    detail:
      "Box services restart after exit; after a power cut or WAN outage the buffer drains and reconnect sync catches up with no gaps.",
    owner: "Stamped engineer with plant IT",
    m1e: "Plant Box commissioning checks 2, 3 and 8 (restart, power cut, WAN outage) plus emulator buffer-drain paths. Record date, name and evidence on the commissioning sheet.",
    decision: "D117 · commissioning",
    provenance: "emulator",
    status: "ready",
    href: "/plant/box",
  },
  {
    id: "offline-local-stop",
    title: "Offline local stop tested",
    detail:
      "Offline, local stop is the only action on the box: it stops every Stamped write. It always works with or without a signed-in person (D105).",
    owner: "Shift lead / plant head",
    m1e: "UI local-stop copy and control (W3.5); plant-emulator write sink refuses new writes after a stop. Rehearse on the box screen before go-live.",
    decision: "D105",
    provenance: "product",
    status: "proven",
    href: "/plant/box",
  },
  {
    id: "trial-restore",
    title: "Trial restore tested",
    detail:
      "Stop on a running trial restores the checked prior settings, filter-checked and read back. Stay stops write nothing new (D110, D52).",
    owner: "Process engineer with shift lead",
    m1e: "Trial stop restore copy and demo stop events (W3.5); emulator scenarios exercise filter-checked restores. Sign after a live trial stop on the line.",
    decision: "D110",
    provenance: "product",
    status: "proven",
    href: "/plant/box",
  },
  {
    id: "role-assignments",
    title: "Role assignments set by plant owner or plant head",
    detail:
      "People and roles for the plant are assigned in Settings by the plant owner or plant head before writes are enabled.",
    owner: "Plant owner or plant head",
    m1e: "Demonstration plant ships with seeded roles; a real plant must assign living people. Emulator personas do not count as plant sign-off.",
    decision: "D117",
    provenance: "plant",
    status: "needs-plant",
    href: "/settings/people",
  },
  {
    id: "alerts-inbox",
    title: "Alerts reaching the Inbox",
    detail:
      "The Inbox is the alerts surface. Safety and key alerts notify Vinayak at once; other alerts wait in the daily digest (D119).",
    owner: "Plant head",
    m1e: "Inbox Alerts tab and budget (W4.7); emulator safety scenarios (box offline, PLC-rejected write, injected untrusted text) feed the same classes.",
    decision: "D119 / M7.9",
    provenance: "product",
    status: "proven",
    href: "/inbox?tab=alerts",
  },
  {
    id: "strong-review-alert",
    title: "Strong-review alert in place",
    detail:
      "An alert (not a hard cap) fires when strong-review spend reaches the starter level, labelled not evidence-based. Proposals waiting for strong review expire when the order window closes (D112, D95).",
    owner: "Stamped engineer",
    m1e: "Strong-review path is covered by Ask / proposal flows; the alert lands on the Inbox alerts surface. Confirm the starter threshold before go-live.",
    decision: "D112 / M5.8",
    provenance: "product",
    status: "ready",
    href: "/inbox?tab=alerts",
  },
  {
    id: "plant-model-shadow",
    title: "Plant model in shadow with rollback tested",
    detail:
      "Plant model rollout is shadow first, then active, with automatic rollback. Fitted parameters ship as a signed data bundle without a box software release (D114, D124).",
    owner: "Process engineer with Stamped",
    m1e: "Emulator profiles are versioned (D78) and can run shadow alongside active; rollback is a profile pin. A plant still signs the first shadow window.",
    decision: "D114 / M5.9",
    provenance: "emulator",
    status: "ready",
  },
  {
    id: "legal-dpdp",
    title: "Legal review of data protection (DPDP)",
    detail:
      "Data protection review under India's DPDP Act is done for the plant's data flows before go-live.",
    owner: "Plant legal with Stamped",
    m1e: "Not an emulator gate. Seed and synthetic data stay in private repos; no customer or plant names in public docs (D82).",
    decision: "D117",
    provenance: "plant",
    status: "needs-plant",
  },
  {
    id: "no-hardware-revoke",
    title: "No hardware revoke switch",
    detail:
      "Revoke is software-only on the Plant Box lease. There is no hardware revoke switch (D115).",
    owner: "Policy (Stamped)",
    m1e: "Lease revoke UI and commissioning install without a hardware kill switch. Emulator treats revoke as a lease state change.",
    decision: "D115",
    provenance: "policy",
    status: "policy",
    href: "/plant/box",
  },
  {
    id: "m1e-full-loop",
    title: "Deterministic full loop on the plant emulator",
    detail:
      "make e2e passes on the plant emulator: ingest to proposal to approval, emulator write and read-back, and the Go writer send path. No real plant is required for this gate.",
    owner: "Stamped engineer",
    m1e: "tools/e2e_smoke.sh drives plant_emulator.env.LineEnv (nominal + plc-rejected-write) and the writer Cedar/deny/filter plant test.",
    decision: "D82 / M1E.6 / M3.4",
    provenance: "emulator",
    status: "proven",
  },
  {
    id: "m1e-staged-faults",
    title: "Staged fault catalog exercised on M1E",
    detail:
      "Named seeded scenarios (sensor drift, stuck value, dropped link, late lab, wrong lot, conflicting MES hold, furnace hot, PLC-rejected write, injected untrusted text) each emit a D78 run manifest.",
    owner: "Stamped engineer",
    m1e: "sim/plant-emulator/scenarios/ plus plant_emulator.scenarios.run_scenario_for_eval; catalog listed in ENV_API consumers.",
    decision: "D82 / M1E.5",
    provenance: "emulator",
    status: "proven",
  },
  {
    id: "m1e-plant-sim-api",
    title: "Emulator API compatible with plant-sim for RL",
    detail:
      "LineEnv reset/step/write/observe shapes match between plant-emulator and plant-sim so RL environments on plant-sim stay eval-compatible with M1E.",
    owner: "Stamped engineer",
    m1e: "sim/ENV_API.md; plant_emulator.env.LineEnv and plant_sim.env.LineEnv.",
    decision: "D82 · D151 B",
    provenance: "emulator",
    status: "proven",
  },
] as const;

export function statusLabel(status: GoLiveStatus): string {
  switch (status) {
    case "proven":
      return "Proven";
    case "ready":
      return "Ready for plant sign-off";
    case "needs-plant":
      return "Needs plant";
    case "policy":
      return "Policy";
  }
}

export function provenanceLabel(p: GoLiveProvenance): string {
  switch (p) {
    case "emulator":
      return "M1E";
    case "product":
      return "Product";
    case "plant":
      return "Plant";
    case "policy":
      return "Policy";
  }
}

/** Counts for the demonstration plant checklist panel. */
export function goLiveCounts(items: readonly GoLiveItem[] = GO_LIVE_ITEMS) {
  return {
    total: items.length,
    proven: items.filter((i) => i.status === "proven").length,
    ready: items.filter((i) => i.status === "ready").length,
    needsPlant: items.filter((i) => i.status === "needs-plant").length,
    policy: items.filter((i) => i.status === "policy").length,
  };
}

/** Go-live is blocked while any needs-plant row remains. */
export function goLiveBlocked(items: readonly GoLiveItem[] = GO_LIVE_ITEMS): boolean {
  return items.some((i) => i.status === "needs-plant");
}
