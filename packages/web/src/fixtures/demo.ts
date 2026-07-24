import type {
  Alarm,
  ConnectionStatus,
  LedgerEntry,
  Prescription,
  TodaySignal,
  VerificationStatus,
  Role,
} from "../lib/types";

/** Jaipur Works — coherent Auto demo plant for every Forge screen. */
export const DEMO_PLANT = {
  orgId: "org_demo",
  orgName: "Jaipur Works",
  plantId: "plant_jaipur_01",
  plantName: "Jaipur Works",
  timezone: "Asia/Kolkata",
  tariff: "Rajasthan HT industrial TOD",
  cmdKva: 5000,
  contractDemandNote: "CMD 5,000 kVA · billing window Jul 2026",
  shift: "A · 06:00–14:00 IST",
  demoAsOf: "2026-07-21T10:15:00+05:30",
};

/** Single demo role so sidebar nav is identical on every screen. */
export const DEMO_SHELL_ROLE: Role = "admin";

export const connectionFixture: ConnectionStatus = {
  sse: "live",
  lastEventAt: DEMO_PLANT.demoAsOf,
};

export type DemoAsset = {
  id: string;
  label: string;
  area: string;
  loadPct: number;
  health: "calm" | "watch" | "hot";
  kwhMtd: number;
  pf?: number;
  mdContributionKva?: number;
};

export const assetsFixture: DemoAsset[] = [
  {
    id: "kiln_1",
    label: "Kiln 1",
    area: "Pyro",
    loadPct: 108,
    health: "hot",
    kwhMtd: 412_000,
    pf: 0.91,
    mdContributionKva: 1860,
  },
  {
    id: "cm_1",
    label: "Cement Mill 1",
    area: "Grinding",
    loadPct: 86,
    health: "watch",
    kwhMtd: 268_000,
    pf: 0.84,
    mdContributionKva: 920,
  },
  {
    id: "mill_2",
    label: "Raw Mill 2",
    area: "Grinding",
    loadPct: 72,
    health: "calm",
    kwhMtd: 191_000,
    pf: 0.93,
    mdContributionKva: 640,
  },
  {
    id: "comp_2",
    label: "Compressor 2",
    area: "Utilities",
    loadPct: 54,
    health: "calm",
    kwhMtd: 84_000,
    pf: 0.95,
    mdContributionKva: 210,
  },
  {
    id: "pack_1",
    label: "Packing line 1",
    area: "Dispatch",
    loadPct: 41,
    health: "calm",
    kwhMtd: 61_000,
    pf: 0.96,
    mdContributionKva: 140,
  },
  {
    id: "hvac_admin",
    label: "Admin HVAC",
    area: "Buildings",
    loadPct: 38,
    health: "calm",
    kwhMtd: 28_000,
    pf: 0.97,
    mdContributionKva: 95,
  },
  {
    id: "incomer",
    label: "Main incomer",
    area: "Power",
    loadPct: 94,
    health: "watch",
    kwhMtd: 1_280_000,
    pf: 0.9,
    mdContributionKva: 4680,
  },
];

/** Compact INR for Today tiles — kept in sync with ledger / Rx helpers below. */
function formatDemoInrCompact(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n}`;
}

// Placeholder — rebuilt after Rx / ledger fixtures so tiles match derived counts.
export let todaySignalsFixture: TodaySignal[] = [];

export const alarmsFixture: Alarm[] = [
  {
    id: "alm_1001",
    plantId: DEMO_PLANT.plantId,
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    severity: "critical",
    state: "raised",
    summary: "Load 108% — 14% above design; MD coincidence risk in 10–11 TOD peak",
    raisedAt: "2026-07-21T09:40:00+05:30",
    relatedPrescriptionId: "rx_9001",
    findingId: "fnd_4401",
  },
  {
    id: "alm_1002",
    plantId: DEMO_PLANT.plantId,
    assetId: "cm_1",
    assetLabel: "Cement Mill 1",
    severity: "warning",
    state: "acked",
    summary: "PF 0.84 drifting toward penalty slab this billing window",
    raisedAt: "2026-07-21T08:10:00+05:30",
    ownerRole: "supervisor",
    relatedPrescriptionId: "rx_9002",
    findingId: "fnd_4402",
  },
  {
    id: "alm_1005",
    plantId: DEMO_PLANT.plantId,
    assetId: "incomer",
    assetLabel: "Main incomer",
    severity: "critical",
    state: "raised",
    summary: "Rolling 15-min MD at 4,680 kVA — 6.4% headroom to CMD",
    raisedAt: "2026-07-21T10:05:00+05:30",
    relatedPrescriptionId: "rx_9001",
    findingId: "fnd_4410",
  },
  {
    id: "alm_1006",
    plantId: DEMO_PLANT.plantId,
    assetId: "mill_2",
    assetLabel: "Raw Mill 2",
    severity: "warning",
    state: "escalated",
    summary: "Idle draw 18% above night baseline for 47 minutes",
    raisedAt: "2026-07-21T07:22:00+05:30",
    ownerRole: "operator",
    relatedPrescriptionId: "rx_9005",
    findingId: "fnd_4411",
  },
  {
    id: "alm_1007",
    plantId: DEMO_PLANT.plantId,
    assetId: "pack_1",
    assetLabel: "Packing line 1",
    severity: "info",
    state: "silenced",
    summary: "Short TOD overlap with packing surge — monitoring only",
    raisedAt: "2026-07-21T06:50:00+05:30",
    ownerRole: "supervisor",
  },
  {
    id: "alm_1003",
    plantId: DEMO_PLANT.plantId,
    assetId: "comp_2",
    assetLabel: "Compressor 2",
    severity: "info",
    state: "cleared",
    summary: "Idle leak cleared after valve replace",
    raisedAt: "2026-07-20T16:00:00+05:30",
  },
  {
    id: "alm_1008",
    plantId: DEMO_PLANT.plantId,
    assetId: "hvac_admin",
    assetLabel: "Admin HVAC",
    severity: "warning",
    state: "acked",
    summary: "Off-peak schedule drift — still running into morning peak",
    raisedAt: "2026-07-21T05:15:00+05:30",
    ownerRole: "energy_manager",
    relatedPrescriptionId: "rx_9004",
  },
];

export const prescriptionsFixture: Prescription[] = [
  {
    id: "rx_9001",
    plantId: DEMO_PLANT.plantId,
    title: "Stagger Kiln 1 co-start with Mill 2 by 10 minutes",
    why: "They started together and pushed MD over the TOD peak",
    impactInrPerMonth: 84000,
    confidence: 0.86,
    lane: "needs_review",
    ownerRole: "supervisor",
    dueAt: "2026-07-22T18:00:00+05:30",
    dueLabel: "This week",
    category: "Load management",
    priority: "high",
    billLine: "MD (kVA)",
    effort: "Sequence change · no new equipment",
    ruleId: "physics/md_overlap@v2.4",
    relatedAlarmId: "alm_1001",
    actions: [
      "Immediate: hold Mill 2 start until Kiln 1 load settles below 95% (no CAPEX).",
      "Operator playbook: rotate co-starts so only one large load enters the 10–11 TOD window.",
      "Long-term: sequencer interlock + 2 m³ buffer on shared air/process header if dips persist.",
    ],
    risks: [
      "Pressure/throughput dip on step-load → add +2 min stagger before relaxing hold.",
      "Operator re-enables both early → log override and require supervisor PIN to override.",
    ],
  },
  {
    id: "rx_9005",
    plantId: DEMO_PLANT.plantId,
    title: "Cut Raw Mill 2 idle draw on night windows",
    why: "Idle draw 18% above night baseline for 47 minutes",
    impactInrPerMonth: 42000,
    confidence: 0.81,
    lane: "needs_review",
    ownerRole: "operator",
    dueAt: "2026-07-22T22:00:00+05:30",
    dueLabel: "Next idle window",
    category: "Idle cutback",
    priority: "high",
    billLine: "Energy (kWh)",
    effort: "Validated setback · no new equipment",
    ruleId: "idle/mill_night@v1.5",
    relatedAlarmId: "alm_1006",
    actions: [
      "Confirm no batch queued in next 60 min, then apply night setback band.",
      "Log kWh before/after on Mill 2 feeder for savings verification (Option B).",
      "Escalate if idle returns >10% above baseline within 24 h.",
    ],
    risks: [
      "Cold restart delay → keep warm-idle floor; do not hard-stop auxiliaries.",
    ],
  },
  {
    id: "rx_9006",
    plantId: DEMO_PLANT.plantId,
    title: "Shift packing surge outside 18–20 peak TOD",
    why: "Dispatch peaks overlap the evening tariff band",
    impactInrPerMonth: 31000,
    confidence: 0.74,
    lane: "needs_review",
    ownerRole: "supervisor",
    dueAt: "2026-07-24T12:00:00+05:30",
    dueLabel: "This week",
    category: "TOD shift",
    priority: "med",
    billLine: "Energy (kWh) · TOD",
    effort: "Schedule change · ops only",
    ruleId: "tod/pack_surge@v1.2",
    actions: [
      "Move non-urgent bagging slots 60–90 min earlier or later than 18–20.",
      "Coordinate with logistics so trucks do not force a peak surge.",
    ],
    risks: [
      "Customer ETA slip → keep one protected peak slot for contractual loads only.",
    ],
  },
  {
    id: "rx_9011",
    plantId: DEMO_PLANT.plantId,
    title: "Sequence three 75 kW VFD compressors — stop part-load pile-up",
    why: "All three running part-load when two units would carry the header",
    impactInrPerMonth: 108000,
    confidence: 0.88,
    lane: "needs_review",
    ownerRole: "supervisor",
    dueAt: "2026-07-23T18:00:00+05:30",
    dueLabel: "This week",
    category: "Compressed air",
    priority: "high",
    billLine: "Energy (kWh)",
    effort: "Set-point reset now · sequencer CAPEX later",
    ruleId: "air/vfd_sequence@v2.1",
    actions: [
      "Immediate set-point reset (no CAPEX): raise unload band and extend timer so only lead+lag stay online.",
      "Operator playbook: rotate lead weekly; never leave all three enabled 'to avoid dips'.",
      "Long-term: sequencer PLC + receiver buffer (~₹6–8.5L) for sub-1-year payback.",
    ],
    risks: [
      "Pressure dip on step-loads → add +2 m³ receiver before tightening unload further.",
      "KPI: minutes with 3 units ON ≤5% of any 24 h; alert if breached.",
    ],
  },
  {
    id: "rx_9002",
    plantId: DEMO_PLANT.plantId,
    title: "APFC health check — Cement Mill 1",
    why: "PF 0.84 drifting toward the penalty slab this billing window",
    impactInrPerMonth: 38000,
    confidence: 0.91,
    lane: "active",
    ownerRole: "operator",
    dueAt: "2026-07-23T12:00:00+05:30",
    dueLabel: "Before bill close",
    category: "Power factor",
    priority: "high",
    billLine: "PF penalty",
    effort: "Inspection · stage swap if needed",
    ruleId: "pf/mill_1_slab@v3.0",
    relatedAlarmId: "alm_1002",
    actions: [
      "Walk APFC stages; confirm stage 3 contactor and capacitor bank health.",
      "If stage open, swap spare bank and re-check PF at Mill 1 feeder within 2 h.",
      "Mark confirmed only after PF holds ≥0.92 for one TOD peak.",
    ],
    risks: [
      "Over-correction → watch for leading PF; trim one stage if PF >0.98.",
    ],
  },
  {
    id: "rx_9007",
    plantId: DEMO_PLANT.plantId,
    title: "Tune kiln ID fan setpoint band",
    why: "Over-draw during warm-up adds avoidable kWh",
    impactInrPerMonth: 22000,
    confidence: 0.79,
    lane: "active",
    ownerRole: "supervisor",
    dueAt: "2026-07-25T18:00:00+05:30",
    dueLabel: "Next warm-up",
    category: "Process tune",
    priority: "med",
    billLine: "Energy (kWh)",
    effort: "Setpoint change · no CAPEX",
    ruleId: "process/id_fan_band@v1.1",
    actions: [
      "Narrow ID fan band during warm-up; restore production band after kiln stable.",
      "Compare warm-up kWh to 14-day baseline before closing Rx.",
    ],
    risks: [
      "Draft shortfall → abort tune and restore prior band if O2/CO alarms fire.",
    ],
  },
  {
    id: "rx_9003",
    plantId: DEMO_PLANT.plantId,
    title: "Stagger compressor demand with packing peaks",
    why: "Simultaneous load with packing line peaks",
    impactInrPerMonth: 26000,
    confidence: 0.78,
    lane: "verifying",
    ownerRole: "supervisor",
    dueAt: "2026-07-18T18:00:00+05:30",
    dueLabel: "Verifying",
    category: "Compressed air",
    priority: "med",
    billLine: "Energy (kWh)",
    effort: "Schedule stagger · ops only",
    ruleId: "air/pack_coincidence@v1.0",
    verificationStatus: "pending",
    actions: [
      "Keep verified stagger in schedule; sample three packing peaks for verification.",
    ],
    risks: [
      "Header pressure low → allow lag unit only during verified packing surge.",
    ],
  },
  {
    id: "rx_9008",
    plantId: DEMO_PLANT.plantId,
    title: "Leak survey — instrument air loop B",
    why: "Ultrasonic hotspots mapped on night round",
    impactInrPerMonth: 15000,
    confidence: 0.72,
    lane: "verifying",
    ownerRole: "operator",
    dueAt: "2026-07-19T18:00:00+05:30",
    dueLabel: "Verifying",
    category: "Compressed air",
    priority: "low",
    billLine: "Energy (kWh)",
    effort: "Repair fittings · low CAPEX",
    ruleId: "air/leak_loop_b@v1.3",
    verificationStatus: "pending",
    actions: [
      "Close tagged fittings; re-scan loop B after 48 h.",
    ],
  },
  {
    id: "rx_9004",
    plantId: DEMO_PLANT.plantId,
    title: "Turn down admin HVAC when no occupancy",
    why: "Full HVAC with no occupancy on 4 of last 6 off-peak windows",
    impactInrPerMonth: 12000,
    confidence: 0.7,
    lane: "closed",
    ownerRole: "energy_manager",
    dueAt: "2026-07-10T18:00:00+05:30",
    dueLabel: "Closed",
    category: "HVAC idle",
    priority: "med",
    billLine: "Energy (kWh)",
    effort: "Validated setback · no new equipment",
    ruleId: "hvac/admin_idle@v1.5",
    relatedAlarmId: "alm_1008",
    verificationStatus: "ops_confirmed",
    realisedInr: 11200,
    opportunityCost: {
      delayDays: 14,
      modeledInr: 5600,
      verificationStatus: "modeled",
    },
    actions: [
      "Keep off-peak setback schedule; review occupancy overrides monthly.",
    ],
  },
  {
    id: "rx_9009",
    plantId: DEMO_PLANT.plantId,
    title: "Replace failed APFC stage 3 capacitor",
    why: "Stage outage drove PF penalty exposure in Jun",
    impactInrPerMonth: 19000,
    confidence: 0.88,
    lane: "closed",
    ownerRole: "energy_manager",
    dueAt: "2026-06-28T18:00:00+05:30",
    dueLabel: "Closed",
    category: "Power factor",
    priority: "high",
    billLine: "PF penalty",
    effort: "Spare stage swap",
    ruleId: "pf/stage3_cap@v2.0",
    verificationStatus: "ops_confirmed",
    realisedInr: 17600,
    actions: [
      "Spare bank installed; hold as operations-confirmed until PF appears on bill.",
    ],
  },
  {
    id: "rx_9010",
    plantId: DEMO_PLANT.plantId,
    title: "Defer kiln wash during evening peak",
    why: "Wash window collided with 18–20 TOD",
    impactInrPerMonth: 9000,
    confidence: 0.66,
    lane: "closed",
    ownerRole: "supervisor",
    dueAt: "2026-06-15T18:00:00+05:30",
    dueLabel: "Closed",
    category: "TOD shift",
    priority: "low",
    billLine: "Energy (kWh) · TOD",
    effort: "Schedule change",
    ruleId: "tod/kiln_wash@v1.0",
    verificationStatus: "disputed",
    realisedInr: 4200,
    actions: [
      "Re-check disputed savings against wash log and TOD meter before re-opening.",
    ],
  },
];

export const ledgerFixture: LedgerEntry[] = [
  {
    entryId: "led_1001",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9004",
    title: "Shift non-critical HVAC off peak",
    entryType: "realised_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 12000,
    realisedInr: 11200,
    verificationStatus: "ops_confirmed",
    mvMethod: "IPMVP Option B",
    baselineId: "bl_hvac_admin_7d",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1009",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9009",
    title: "Replace failed APFC stage 3 capacitor",
    entryType: "realised_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 19000,
    realisedInr: 17600,
    verificationStatus: "ops_confirmed",
    mvMethod: "IPMVP Option B",
    baselineId: "bl_mill_1_pf",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1010",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9008",
    title: "Leak survey — instrument air loop B",
    entryType: "realised_savings",
    periodStart: "2026-06-15T00:00:00+05:30",
    periodEnd: "2026-07-15T00:00:00+05:30",
    potentialInr: 15000,
    realisedInr: 12800,
    verificationStatus: "ops_confirmed",
    mvMethod: "IPMVP Option A",
    baselineId: "bl_air_loop_b",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1002",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9001",
    title: "Stagger Kiln 1 co-start with Mill 2",
    entryType: "potential_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-31T00:00:00+05:30",
    potentialInr: 84000,
    realisedInr: 0,
    verificationStatus: "pending",
    mvMethod: "IPMVP Option C",
    baselineId: "bl_kiln_1_7d",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1005",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9005",
    title: "Night idle cutback — Raw Mill 2",
    entryType: "potential_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-31T00:00:00+05:30",
    potentialInr: 42000,
    realisedInr: 0,
    verificationStatus: "pending",
    mvMethod: "IPMVP Option B",
    baselineId: "bl_mill_2_night",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1003",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9002",
    title: "APFC health check — Cement Mill 1",
    entryType: "opportunity_cost",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 38000,
    realisedInr: 0,
    verificationStatus: "modeled",
    mvMethod: "counterfactual TOD slab",
    baselineId: "bl_mill_1_pf",
    emissionFactorRef: null,
    modeledReason: "Delay cost while APFC outage continues",
  },
  {
    entryId: "led_1006",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9006",
    title: "Shift packing surge outside peak TOD",
    entryType: "opportunity_cost",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 31000,
    realisedInr: 0,
    verificationStatus: "modeled",
    mvMethod: "tariff band counterfactual",
    baselineId: "bl_pack_tod",
    emissionFactorRef: "cea_grid_india_2024_v1",
    modeledReason: "Modeled if packing stays on 18–20 peak",
  },
  {
    entryId: "led_1004",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9003",
    title: "Compressor demand stagger",
    entryType: "realised_savings",
    periodStart: "2026-06-01T00:00:00+05:30",
    periodEnd: "2026-06-30T00:00:00+05:30",
    potentialInr: 26000,
    realisedInr: 18000,
    verificationStatus: "disputed",
    mvMethod: "IPMVP Option B",
    baselineId: "bl_comp_2_30d",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1007",
    plantId: DEMO_PLANT.plantId,
    prescriptionId: "rx_9010",
    title: "Defer kiln wash during evening peak",
    entryType: "realised_savings",
    periodStart: "2026-06-01T00:00:00+05:30",
    periodEnd: "2026-06-30T00:00:00+05:30",
    potentialInr: 9000,
    realisedInr: 4200,
    verificationStatus: "disputed",
    mvMethod: "IPMVP Option A",
    baselineId: "bl_kiln_wash",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
];

export type DemoMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  lastActive: string;
};

export const membersFixture: DemoMember[] = [
  {
    id: "usr_admin",
    name: "Asha Verma",
    email: "asha.verma@demo.stamped.energy",
    role: "admin",
    status: "active",
    lastActive: "2026-07-21T09:55:00+05:30",
  },
  {
    id: "usr_ph",
    name: "Ravi Mehta",
    email: "ravi.mehta@demo.stamped.energy",
    role: "plant_head",
    status: "active",
    lastActive: "2026-07-21T10:12:00+05:30",
  },
  {
    id: "usr_sup",
    name: "Neha Singh",
    email: "neha.singh@demo.stamped.energy",
    role: "supervisor",
    status: "active",
    lastActive: "2026-07-21T10:08:00+05:30",
  },
  {
    id: "usr_op",
    name: "Imran Khan",
    email: "imran.khan@demo.stamped.energy",
    role: "operator",
    status: "active",
    lastActive: "2026-07-21T10:14:00+05:30",
  },
  {
    id: "usr_em",
    name: "Priya Nair",
    email: "priya.nair@demo.stamped.energy",
    role: "energy_manager",
    status: "active",
    lastActive: "2026-07-21T09:40:00+05:30",
  },
  {
    id: "usr_sus",
    name: "Kabir Das",
    email: "kabir.das@demo.stamped.energy",
    role: "sustainability",
    status: "invited",
    lastActive: "—",
  },
];

export type DemoApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
};

export const apiKeysFixture: DemoApiKey[] = [
  {
    id: "key_1",
    name: "Power BI pull",
    prefix: "stk_a1b2c3",
    scopes: ["ledger:read", "events:read"],
    lastUsedAt: "2026-07-21T06:00:00+05:30",
    createdAt: "2026-06-01T10:00:00+05:30",
  },
  {
    id: "key_2",
    name: "Partner data bridge",
    prefix: "stk_d4e5f6",
    scopes: ["alarms:read", "prescriptions:read"],
    lastUsedAt: null,
    createdAt: "2026-07-10T11:30:00+05:30",
  },
];

export type DemoWebhook = {
  id: string;
  url: string;
  enabled: boolean;
  eventFilters: string[];
  lastDelivery: string;
  lastStatus: "delivered" | "pending" | "dlq";
};

export const webhooksFixture: DemoWebhook[] = [
  {
    id: "wh_1",
    url: "https://hooks.example.com/stamped/jaipur",
    enabled: true,
    eventFilters: ["alarm.raised", "prescription.done"],
    lastDelivery: "2026-07-21T09:41:00+05:30",
    lastStatus: "delivered",
  },
  {
    id: "wh_2",
    url: "https://erp-middleware.example.com/energy",
    enabled: true,
    eventFilters: ["ledger.ops_confirmed"],
    lastDelivery: "2026-07-20T18:02:00+05:30",
    lastStatus: "pending",
  },
];

export type DemoReportJob = {
  id: string;
  kind: string;
  state: "pending_approval" | "approved" | "failed" | "running";
  periodLabel: string;
  createdAt: string;
};

export const reportJobsFixture: DemoReportJob[] = [
  {
    id: "rep_2026_07",
    kind: "sustainability_monthly",
    state: "pending_approval",
    periodLabel: "Jul 2026",
    createdAt: "2026-07-21T08:00:00+05:30",
  },
  {
    id: "rep_2026_06",
    kind: "sustainability_monthly",
    state: "approved",
    periodLabel: "Jun 2026",
    createdAt: "2026-07-02T09:00:00+05:30",
  },
  {
    id: "rep_brsr_q1",
    kind: "brsr_pat_adjunct",
    state: "approved",
    periodLabel: "FY26 Q1",
    createdAt: "2026-06-30T16:00:00+05:30",
  },
];

export type DemoInvestigation = {
  id: string;
  title: string;
  focus: string;
  summary: string;
  savedAt: string;
  seedMessages: Array<{ role: "user" | "assistant"; content: string }>;
};

export const investigationsFixture: DemoInvestigation[] = [
  {
    id: "inv_1",
    title: "Kiln 1 MD coincidence",
    focus: "alarm:alm_1001",
    summary: "Peak TOD overlap with Mill 2 start — ₹84k/mo addressable",
    savedAt: "2026-07-21T09:50:00+05:30",
    seedMessages: [
      {
        role: "user",
        content: "Why is Kiln 1 critical for MD right now?",
      },
      {
        role: "assistant",
        content:
          "Kiln 1 is at 108% load while Mill 2 co-starts into the 10–11 peak TOD band. Incomer rolling MD is 4,680 kVA (6.4% headroom). Staggering starts is the highest-confidence prescription.",
      },
    ],
  },
  {
    id: "inv_2",
    title: "Mill 1 PF slab",
    focus: "prescription:rx_9002",
    summary: "PF 0.84 — APFC stage health check in flight",
    savedAt: "2026-07-21T08:30:00+05:30",
    seedMessages: [
      {
        role: "user",
        content: "What proof should I open for the APFC Rx?",
      },
      {
        role: "assistant",
        content:
          "Open evidence scoped to Cement Mill 1 PF and the APFC stage status. Savings stay confirmed by operations until they appear on the utility bill.",
      },
    ],
  },
  {
    id: "inv_3",
    title: "Night idle — Raw Mill 2",
    focus: "prescription:rx_9005",
    summary: "47 minutes elevated idle vs night baseline",
    savedAt: "2026-07-21T07:40:00+05:30",
    seedMessages: [],
  },
];

export const energyKpisFixture = {
  mtdGridKwh: 1_200_000,
  mtdRenewableKwh: 80_000,
  mtdCostInr: 78_40_000,
  vsBaselinePct: 6.2,
  peakMdKva: 4680,
  cmdKva: DEMO_PLANT.cmdKva,
  avgPf: 0.9,
  todPeakSharePct: 34,
};

export const intensityDemoInput = {
  productionUnits: 42_500 as number | null,
  gridKwh: 1_200_000,
  renewableKwh: 80_000,
  emissionFactorTPerMwh: 0.71,
  emissionFactorRef: "cea_grid_india_2024_v1",
  cmdKva: DEMO_PLANT.cmdKva,
  peakMdKva: 4680,
};

export const auditEventsFixture = [
  {
    id: "aud_1",
    at: "2026-07-21T10:08:00+05:30",
    actor: "Neha Singh",
    action: "Alarm acknowledged",
    detail: "Cement Mill 1 alarm acknowledged",
  },
  {
    id: "aud_2",
    at: "2026-07-21T09:42:00+05:30",
    actor: "Imran Khan",
    action: "Prescription assigned",
    detail: "APFC health check prescription assigned",
  },
  {
    id: "aud_3",
    at: "2026-07-21T08:05:00+05:30",
    actor: "Priya Nair",
    action: "Report approved",
    detail: "Jul 2026 sustainability report approved",
  },
  {
    id: "aud_4",
    at: "2026-07-20T18:10:00+05:30",
    actor: "Asha Verma",
    action: "API key created",
    detail: "Partner data bridge API key created",
  },
];

/** Derived demo counts — keep Today / shell banners consistent. */
export function demoCriticalAlarmCount(): number {
  return alarmsFixture.filter((a) => a.severity === "critical" && a.state !== "cleared")
    .length;
}

export function demoNeedsReviewCount(): number {
  return prescriptionsFixture.filter((p) => p.lane === "needs_review").length;
}

export function demoNeedsReviewInr(): number {
  return prescriptionsFixture
    .filter((p) => p.lane === "needs_review")
    .reduce((s, p) => s + p.impactInrPerMonth, 0);
}

export function demoOpsConfirmedInr(): number {
  return ledgerFixture
    .filter((e) => e.verificationStatus === ("ops_confirmed" as VerificationStatus))
    .reduce((s, e) => s + e.realisedInr, 0);
}

export function demoClosurePct(): number {
  const closed = prescriptionsFixture.filter((p) => p.lane === "closed").length;
  return Math.round((closed / prescriptionsFixture.length) * 100);
}

export function assetById(id: string): DemoAsset | undefined {
  return assetsFixture.find((a) => a.id === id);
}

export function consumersFromAssets(
  assets: readonly DemoAsset[] = assetsFixture,
): Array<{
  assetId: string;
  label: string;
  kwh: number;
  sharePct: number;
  health: DemoAsset["health"];
  loadPct: number;
  area: string;
  pf?: number;
}> {
  // Exclude plant-level incomer from “top consumers” share math
  const rows = assets.filter((a) => a.id !== "incomer");
  const total = rows.reduce((s, r) => s + r.kwhMtd, 0) || 1;
  return rows
    .slice()
    .sort((a, b) => b.kwhMtd - a.kwhMtd)
    .map((r) => ({
      assetId: r.id,
      label: r.label,
      kwh: r.kwhMtd,
      sharePct: Math.round((r.kwhMtd / total) * 1000) / 10,
      health: r.health,
      loadPct: r.loadPct,
      area: r.area,
      pf: r.pf,
    }));
}

todaySignalsFixture = [
  {
    id: "alarms",
    label: "Critical alarms",
    value: `${demoCriticalAlarmCount()} open`,
    tone: "critical",
    href: "/alarms",
    hint: "Ack before shift handoff",
  },
  {
    id: "rx",
    label: "Needs review",
    value: `${formatDemoInrCompact(demoNeedsReviewInr())} / mo`,
    tone: "warning",
    href: "/prescriptions",
    hint: `${demoNeedsReviewCount()} prescriptions`,
  },
  {
    id: "savings",
    label: "Confirmed savings (MTD)",
    value: formatDemoInrCompact(demoOpsConfirmedInr()),
    tone: "good",
    href: "/reports",
    hint: "Pending utility bill verification",
  },
  {
    id: "deviation",
    label: "Vs baseline (7d)",
    value: `+${energyKpisFixture.vsBaselinePct}%`,
    tone: "warning",
    href: "/evidence",
    hint: "Kiln 1 + Mill 1 drive",
  },
  {
    id: "closure",
    label: "Closure rate (30d)",
    value: `${demoClosurePct()}%`,
    tone: "good",
    href: "/prescriptions",
  },
  {
    id: "stale",
    label: "Telemetry",
    value: "Fresh",
    tone: "neutral",
    href: "/evidence",
    hint: "Last sample 42s ago",
  },
  {
    id: "md",
    label: "MD headroom",
    value: "6.4%",
    tone: "warning",
    href: "/intensity",
    hint: `Peak ${energyKpisFixture.peakMdKva.toLocaleString("en-IN")} / CMD ${energyKpisFixture.cmdKva.toLocaleString("en-IN")} kVA`,
  },
];
