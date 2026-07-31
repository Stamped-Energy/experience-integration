import type { PrescriptionCaseDetail } from "@/lib/types";

/** Rich full-case overrides keyed by prescription id. */
export const prescriptionCaseDetailOverrides: Record<string, PrescriptionCaseDetail> = {
  rx_9011: {
    createdAt: "2025-08-30",
    description:
      "Three 75 kW VFD compressors were observed modulating simultaneously when a two-unit strategy would have met demand, adding ~130 MWh/year of avoidable energy.",
    savingsRange: "₹9.0L – ₹12.5L / yr",
    eventSnapshot: {
      timestamp: "2024-06-01 06:30 IST",
      caption: "Event snapshot (evidence)",
      columns: [
        { key: "unit", header: "Unit" },
        { key: "power", header: "Power (kW)", align: "right" },
        { key: "loadPct", header: "% of 75 kW", align: "right" },
        { key: "comment", header: "Comment" },
      ],
      rows: [
        { id: "u1", unit: "Unit-1", power: "43", loadPct: "57%", comment: "Part-load" },
        { id: "u2", unit: "Unit-2", power: "54", loadPct: "72%", comment: "Part-load" },
        { id: "u3", unit: "Unit-3", power: "68", loadPct: "91%", comment: "Near loaded" },
        { id: "combined", unit: "Combined", power: "165", loadPct: "-", comment: "Three online at partial load" },
      ],
      interpretation:
        "Three machines stayed online while demand fit a sequenced two-unit strategy. The third unit idling/modulating adds approximately 130 MWh/year.",
      sanityCheck:
        "During a similar load window, shut the lowest-loaded unit under supervision. Stable pressure proves two units suffice when sequenced correctly. Log header pressure, kW, and alarms for 15–30 minutes to confirm.",
    },
    rootCause: [
      "No central sequencer - each compressor obeys its own pressure switch.",
      "Overlapping set-points keep all units cutting in.",
      'Operator habit leaves all three enabled to "avoid dips," sacrificing efficiency.',
    ],
    costBenefit: {
      wasteIdentified: "≈130,000 kWh/yr from the third unit idling/modulating.",
      tariffScenarios: {
        columns: [
          { key: "tariff", header: "Tariff (₹/kWh)", align: "right" },
          { key: "saving", header: "Annual saving", align: "right" },
        ],
        rows: [
          { id: "t7", tariff: "7.00", saving: "₹9.1L" },
          { id: "t8", tariff: "8.00", saving: "₹10.4L" },
          { id: "t10", tariff: "10.00", saving: "₹13.0L" },
        ],
      },
      capexNote:
        "Capex for sequencer + sensors: ₹6L–₹8.5L ⇒ ~9-month payback at ₹8/kWh. Side gains include trimmed peak kW, fewer lag run-hours, quieter operation, and more headroom.",
      sideGains: [
        "Trimmed peak kW on shared incomer",
        "Fewer lag run-hours → extended bearing life",
        "Quieter plant floor during off-peak",
        "75 kW of peak capacity freed for process loads",
      ],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Pressure dip on step-loads",
          mitigation: "Add +2 m³ receiver and keep Lag-1 armed with 30 s delay.",
        },
        {
          id: "r2",
          risk: "Operator override",
          mitigation: "SOP at panel, weekly audit of set-points, alarm if all three online >10 min.",
        },
        {
          id: "r3",
          risk: "Sensor drift",
          mitigation: "Quarterly calibration with dual-sensor plausibility check (±0.1 bar).",
        },
      ],
    },
    kpis: {
      columns: [
        { key: "kpi", header: "KPI" },
        { key: "target", header: "Target" },
        { key: "alert", header: "Alert" },
      ],
      rows: [
        { id: "k1", kpi: "Minutes with 3 units ON", target: "≤ 5%", alert: ">5% in any 24 h" },
        { id: "k2", kpi: "Time outside 6.5–7.3 bar", target: "≤ 5%", alert: ">5%" },
        { id: "k3", kpi: "Starts per shift per unit", target: "≤ 10", alert: ">10" },
        { id: "k4", kpi: "Unloaded time per unit", target: "≤ 10% of run time", alert: ">10%" },
      ],
    },
    commissioning: [
      "Calibrate header sensor and confirm 6.5–7.3 bar band.",
      "Run two-unit trial (Lag-2 disabled) to prove stability under new rules.",
      "Acceptance (24 h): ≤5% minutes outside band, ≤10 starts/shift, ≤10% unload time, ≥95% minutes with ≤2 units.",
      "Lock in set-points, store PLC recipe, and pin SOP at panel.",
    ],
    managerTakeaway:
      "Two 75 kW units can carry the load. Sequencing discipline now plus a PLC and small receiver recovers roughly ₹10L–₹12L per year with <1-year payback and boosts reliability.",
  },

  rx_9001: {
    createdAt: "2026-07-21",
    description:
      "Kiln 1 and Raw Mill 2 co-started into the 10–11 TOD peak window, pushing rolling MD to 4,680 kVA - only 6.4% headroom below CMD 5,000 kVA. Staggering the second large load by 10 minutes avoids MD coincidence charges.",
    savingsRange: "₹84k / mo · ₹10.1L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 09:40 IST",
      caption: "MD coincidence window",
      columns: [
        { key: "asset", header: "Asset" },
        { key: "load", header: "Load %", align: "right" },
        { key: "mdKva", header: "MD contribution (kVA)", align: "right" },
        { key: "comment", header: "Comment" },
      ],
      rows: [
        { id: "k1", asset: "Kiln 1", load: "108%", mdKva: "1,860", comment: "Above design - critical" },
        { id: "m2", asset: "Raw Mill 2", load: "72%", mdKva: "640", comment: "Co-start with Kiln 1" },
        { id: "inc", asset: "Main incomer", load: "94%", mdKva: "4,680", comment: "Rolling 15-min MD peak" },
      ],
      interpretation:
        "Two large loads entered the peak TOD band simultaneously. A 10-minute stagger on Mill 2 start keeps rolling MD below the penalty threshold.",
      sanityCheck:
        "Hold Mill 2 start until Kiln 1 load settles below 95%. Monitor rolling MD for 15 min - should drop ≥120 kVA if stagger holds.",
    },
    rootCause: [
      "No interlock between Kiln 1 warm-up sequence and Mill 2 start permission.",
      "Shift handoff defaults allow simultaneous large-load starts.",
      "Peak TOD window (10–11) overlaps with routine pyro + grinding ramp.",
    ],
    costBenefit: {
      wasteIdentified: "MD coincidence risk - potential penalty exposure on CMD breach + peak TOD energy premium.",
      tariffScenarios: {
        columns: [
          { key: "scenario", header: "Scenario" },
          { key: "impact", header: "Modeled impact / mo", align: "right" },
        ],
        rows: [
          { id: "s1", scenario: "Status quo (co-start)", impact: "₹84k penalty risk" },
          { id: "s2", scenario: "10-min stagger (no CAPEX)", impact: "₹0 – ₹12k residual" },
          { id: "s3", scenario: "Sequencer interlock (long-term)", impact: "₹0 – ₹5k residual" },
        ],
      },
      capexNote: "Immediate fix is sequence change only. Long-term: sequencer interlock + buffer (~₹2L) if pressure/throughput dips persist.",
      sideGains: ["6.4% → 8%+ MD headroom", "Reduced peak TOD kWh share", "Lower transformer stress"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Pressure/throughput dip on step-load",
          mitigation: "Add +2 min stagger before relaxing hold; monitor kiln draft.",
        },
        {
          id: "r2",
          risk: "Operator re-enables both early",
          mitigation: "Log override; require supervisor PIN to override.",
        },
      ],
    },
    kpis: {
      columns: [
        { key: "kpi", header: "KPI" },
        { key: "target", header: "Target" },
        { key: "alert", header: "Alert" },
      ],
      rows: [
        { id: "k1", kpi: "Co-starts in 10–11 TOD", target: "0 / shift", alert: ">0" },
        { id: "k2", kpi: "Rolling MD headroom", target: "≥ 8%", alert: "< 6%" },
        { id: "k3", kpi: "Kiln 1 load at Mill 2 start", target: "< 95%", alert: "≥ 95%" },
      ],
    },
    commissioning: [
      "Confirm stagger rule in shift log for 3 consecutive shifts.",
      "Capture rolling MD before/after for savings verification (Option C baseline).",
      "Acceptance: zero co-starts in peak TOD for 7 days; MD headroom ≥ 8%.",
    ],
    managerTakeaway:
      "A 10-minute sequence change avoids ₹84k/mo MD risk with zero CAPEX. Long-term interlock locks in the discipline.",
  },

  rx_9005: {
    createdAt: "2026-07-21",
    description:
      "Raw Mill 2 idle draw ran 18% above the night baseline for 47 minutes - auxiliaries and feeders left in warm-idle when no batch was queued.",
    savingsRange: "₹42k / mo · ₹5.0L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 07:22 IST",
      caption: "Night idle anomaly",
      columns: [
        { key: "metric", header: "Metric" },
        { key: "baseline", header: "Baseline", align: "right" },
        { key: "observed", header: "Observed", align: "right" },
        { key: "delta", header: "Delta", align: "right" },
      ],
      rows: [
        { id: "kw", metric: "Idle kW", baseline: "142", observed: "168", delta: "+18%" },
        { id: "dur", metric: "Duration", baseline: "-", observed: "47 min", delta: "-" },
        { id: "kwh", metric: "Excess kWh (window)", baseline: "-", observed: "20.3", delta: "-" },
      ],
      interpretation:
        "Elevated idle persists beyond the warm-idle floor when no batch is scheduled. Night setback band would cut ~20 kWh per occurrence.",
      sanityCheck:
        "Confirm no batch queued in next 60 min, apply setback, log kWh for 30 min. Idle should return within 5% of baseline.",
    },
    rootCause: [
      "Night setback schedule not armed on operator panel.",
      "Warm-idle floor set too high after last production run.",
      "No auto-idle timer on feeder auxiliaries.",
    ],
    costBenefit: {
      wasteIdentified: "≈52,000 kWh/yr from repeated night idle excursions.",
      tariffScenarios: {
        columns: [
          { key: "tariff", header: "Tariff (₹/kWh)", align: "right" },
          { key: "saving", header: "Annual saving", align: "right" },
        ],
        rows: [
          { id: "t7", tariff: "7.00", saving: "₹3.6L" },
          { id: "t8", tariff: "8.00", saving: "₹4.2L" },
        ],
      },
      capexNote: "No CAPEX - validated setback only. Optional auto-timer (~₹40k) for persistent compliance.",
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Cold restart delay",
          mitigation: "Keep warm-idle floor; do not hard-stop auxiliaries.",
        },
      ],
    },
    kpis: {
      columns: [
        { key: "kpi", header: "KPI" },
        { key: "target", header: "Target" },
        { key: "alert", header: "Alert" },
      ],
      rows: [
        { id: "k1", kpi: "Night idle vs baseline", target: "≤ +5%", alert: "> +10%" },
        { id: "k2", kpi: "Idle excursions >30 min", target: "0 / week", alert: "> 2 / week" },
      ],
    },
    commissioning: [
      "Apply night setback band and log kWh before/after.",
      "Compare to 14-day baseline for savings verification (Option B).",
      "Escalate if idle returns >10% above baseline within 24 h.",
    ],
    managerTakeaway:
      "Night idle on Mill 2 is a zero-CAPEX win - ₹42k/mo recoverable with a validated setback and operator checklist.",
  },
};
