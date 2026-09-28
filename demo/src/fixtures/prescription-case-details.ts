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

  /** Vinayak Plant - cement MD stagger / prefer WHR (prescriptions-examples §6). */
  rx_v001: {
    createdAt: "2026-07-21",
    description:
      "At Vinayak Plant, Kiln 1 and Raw Mill 2 co-started into the peak TOD window while WHR sat under-used, pushing rolling MD toward the CMD headroom band. Stagger Mill 2 and prefer WHR before grind load that can wait.",
    savingsRange: "₹84k / mo · ₹10.1L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 09:40 IST",
      caption: "MD coincidence window · Vinayak",
      columns: [
        { key: "asset", header: "Asset" },
        { key: "load", header: "Load %", align: "right" },
        { key: "mdKva", header: "MD contribution (kVA)", align: "right" },
        { key: "comment", header: "Comment" },
      ],
      rows: [
        { id: "k1", asset: "Kiln 1", load: "112%", mdKva: "1,920", comment: "Above design - critical" },
        { id: "m2", asset: "Raw Mill 2", load: "74%", mdKva: "660", comment: "Co-start with Kiln 1" },
        { id: "whr", asset: "WHR export", load: "41%", mdKva: "-", comment: "Under-used vs peak grid" },
        { id: "inc", asset: "Main incomer", load: "94%", mdKva: "4,710", comment: "Rolling 15-min MD peak" },
      ],
      interpretation:
        "Two large loads entered the peak TOD band simultaneously. A Mill 2 hold until kiln settles under 95%, plus WHR-first dispatch, keeps rolling MD below the penalty threshold.",
      sanityCheck:
        "Hold Mill 2 start until Kiln 1 load settles below 95%. Monitor rolling MD for 15 min - should drop ≥120 kVA if stagger holds.",
    },
    rootCause: [
      "No interlock between Kiln 1 warm-up sequence and Mill 2 start permission.",
      "WHR preference not enforced when peak grid import is high.",
      "Peak TOD window overlaps with routine pyro + grinding ramp.",
    ],
    costBenefit: {
      wasteIdentified: "MD coincidence risk + peak grid energy premium while WHR headroom unused.",
      tariffScenarios: {
        columns: [
          { key: "scenario", header: "Scenario" },
          { key: "impact", header: "Modeled impact / mo", align: "right" },
        ],
        rows: [
          { id: "s1", scenario: "Status quo (co-start)", impact: "₹84k penalty risk" },
          { id: "s2", scenario: "10-min stagger + WHR first", impact: "₹0 – ₹12k residual" },
          { id: "s3", scenario: "Sequencer interlock (long-term)", impact: "₹0 – ₹5k residual" },
        ],
      },
      capexNote: "Immediate fix is sequence + dispatch change only. Long-term: sequencer interlock if pressure/throughput dips persist.",
      sideGains: ["MD headroom recovery", "Lower peak TOD kWh share", "Higher WHR utilisation"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Throughput dip on mill hold",
          mitigation: "Keep max hold at 10 min; escalate if kiln draft alarms.",
        },
        {
          id: "r2",
          risk: "Operator re-enables both early",
          mitigation: "Require supervisor PIN to override; log accept / override for M&V.",
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
        { id: "k1", kpi: "Co-starts in peak TOD", target: "0 / shift", alert: ">0" },
        { id: "k2", kpi: "Rolling MD headroom", target: "≥ 8%", alert: "< 6%" },
        { id: "k3", kpi: "Kiln 1 load at Mill 2 start", target: "< 95%", alert: "≥ 95%" },
      ],
    },
    commissioning: [
      "Confirm stagger + WHR-first rule in shift log for 3 consecutive shifts.",
      "Capture rolling MD before/after for savings verification.",
      "Acceptance: zero co-starts in peak TOD for 7 days; MD headroom ≥ 8%.",
    ],
    managerTakeaway:
      "A 10-minute sequence change plus WHR-first dispatch avoids ₹84k/mo MD risk with zero CAPEX at Vinayak.",
  },

  /** Vinayak - APFC / PF (prescriptions-examples power factor pattern). */
  rx_v002: {
    createdAt: "2026-07-21",
    description:
      "Cement Mill 1 PF at Vinayak drifted to 0.86 toward the penalty slab. Stage-level APFC health check and spare bank swap close the billing-window risk.",
    savingsRange: "₹33k / mo · ₹4.0L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 08:00 IST",
      caption: "PF drift · Mill 1 feeder",
      columns: [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Value", align: "right" },
        { key: "comment", header: "Comment" },
      ],
      rows: [
        { id: "pf", metric: "Mill 1 PF", value: "0.86", comment: "Approaching penalty slab" },
        { id: "s3", metric: "APFC stage 3", value: "Suspect", comment: "Contactor / bank health" },
        { id: "target", metric: "Target PF", value: "≥ 0.92", comment: "Hold for one TOD peak" },
      ],
      interpretation:
        "Reactive support on Mill 1 is soft. Confirm stage 3, swap spare if open, and re-check PF within 2 hours.",
      sanityCheck:
        "After stage work, PF should hold ≥0.92 through one TOD peak. Watch for leading PF >0.98.",
    },
    rootCause: [
      "APFC stage 3 contactor or capacitor bank degraded.",
      "No same-shift PF walk when Mill 1 load is high.",
      "Spare bank not staged for quick swap.",
    ],
    costBenefit: {
      wasteIdentified: "PF penalty exposure on the billing window if slab is crossed.",
      tariffScenarios: {
        columns: [
          { key: "scenario", header: "Scenario" },
          { key: "impact", header: "Modeled / mo", align: "right" },
        ],
        rows: [
          { id: "s1", scenario: "Status quo drift", impact: "₹33k risk" },
          { id: "s2", scenario: "Stage swap + confirm", impact: "₹0 – ₹5k residual" },
        ],
      },
      capexNote: "Spare bank swap if needed (~₹40k–₹80k typical). Inspection-first; no sequencer required.",
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Over-correction / leading PF",
          mitigation: "Trim one stage if PF >0.98 after swap.",
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
        { id: "k1", kpi: "Mill 1 PF (peak TOD)", target: "≥ 0.92", alert: "< 0.90" },
        { id: "k2", kpi: "APFC stages healthy", target: "All in", alert: "Any open >4 h" },
      ],
    },
    commissioning: [
      "Walk APFC stages; swap spare bank if stage 3 open.",
      "Re-check PF at Mill 1 feeder within 2 h.",
      "Mark confirmed only after PF holds ≥0.92 for one TOD peak.",
    ],
    managerTakeaway:
      "₹33k/mo PF risk is an inspection and stage-swap win before bill close - zero process CAPEX.",
  },

  /** Vinayak - ToD peak load shift (prescriptions-examples §2). */
  rx_v003: {
    createdAt: "2026-07-21",
    description:
      "Pause-able packing surge loads at Vinayak are still on during the 18-20 peak TOD block while buying peak-rate power. Shift non-urgent bagging 60-90 minutes off peak with one protected contractual slot.",
    savingsRange: "₹1.2L / mo · ₹14.4L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-20 18:22 IST",
      caption: "Peak TOD · packing surge",
      columns: [
        { key: "tag", header: "Tag" },
        { key: "value", header: "Value", align: "right" },
        { key: "window", header: "Window" },
      ],
      rows: [
        { id: "t1", tag: "TARIFF.TOD_BLOCK", value: "PEAK", window: "18:00–20:00" },
        { id: "t2", tag: "HT_INCOMER.kW", value: "3,420", window: "18:22" },
        { id: "t3", tag: "PACK.INTERRUPTIBLE_kW", value: "480", window: "same" },
        { id: "t4", tag: "PROC.READY_SCORE", value: "0.82", window: "18:20" },
      ],
      interpretation:
        "Process can take a cut on non-urgent packing. Ranked shift list recovers peak ₹/kWh without losing same-shift volume outside the band.",
      sanityCheck:
        "Protect one contractual truck slot; move remaining surge 60-90 min. Peak-block kWh should fall vs locked baseline week.",
    },
    rootCause: [
      "Fixed night plan misses same-day protect-list opportunities.",
      "No ranked interruptible list at peak start.",
      "Logistics ETA overrides default without logging.",
    ],
    costBenefit: {
      wasteIdentified: "Peak-rate kWh on pause-able packing while process ready score allows a shift.",
      tariffScenarios: {
        columns: [
          { key: "scenario", header: "Scenario" },
          { key: "impact", header: "Modeled / mo", align: "right" },
        ],
        rows: [
          { id: "s1", scenario: "Leave packing on peak", impact: "₹1.2L waste" },
          { id: "s2", scenario: "60–90 min shift + protect slot", impact: "₹0 – ₹20k residual" },
        ],
      },
      capexNote: "Dispatch nudge and SOP protect-list only - no new equipment.",
      sideGains: ["Lower peak TOD share", "Clearer logistics protect rules"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Customer ETA slip",
          mitigation: "Keep one protected peak slot for contractual loads only.",
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
        { id: "k1", kpi: "Interruptible kW on peak", target: "≤ protected slot", alert: ">480 kW unprotected" },
        { id: "k2", kpi: "Peak-block kWh vs baseline", target: "↓ ≥ 8%", alert: "Flat or up" },
      ],
    },
    commissioning: [
      "Publish ranked cut/shift list 15 min before peak.",
      "Supervisor accepts or protects named loads.",
      "Close on next bill ToD lines vs locked plan.",
    ],
    managerTakeaway:
      "Same-shift packing shift off 18-20 recovers ~₹1.2L/mo with one protected contractual slot - SOP only.",
  },

  /** Vinayak - night idle aux cut (prescriptions-examples §3). */
  rx_v004: {
    createdAt: "2026-07-21",
    description:
      "Raw Mill 2 at Vinayak showed production at zero while aux feeders drew elevated night idle kW for 47 minutes - 18% above the night baseline.",
    savingsRange: "₹42k / mo · ₹5.0L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 02:40 IST",
      caption: "Night idle anomaly · Vinayak",
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
          mitigation: "Keep warm-idle floor; do not hard-stop critical auxiliaries.",
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
      "Compare to 14-day baseline for savings verification.",
      "Escalate if idle returns >10% above baseline within 24 h.",
    ],
    managerTakeaway:
      "Night idle on Mill 2 is a zero-CAPEX win - ₹42k/mo recoverable with a validated setback and operator checklist.",
  },

  /** Vinayak - compressor sequencing (prescriptions-examples §8). */
  rx_v005: {
    createdAt: "2026-07-21",
    description:
      "Three 75 kW VFD compressors at Vinayak were modulating simultaneously when a two-unit strategy would have met demand, adding avoidable energy and peak kW.",
    savingsRange: "₹90k / mo · ₹10.8L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 06:30 IST",
      caption: "Event snapshot · compressor house",
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
        "Three machines stayed online while demand fit a sequenced two-unit strategy. Stop or unload the lowest-loaded unit under watch with Lag armed.",
      sanityCheck:
        "During a similar load window, shut the lowest-loaded unit under supervision. Stable pressure proves two units suffice when sequenced correctly.",
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
        "SOP sequencing first. Capex for sequencer + sensors later: ₹6L–₹8.5L ⇒ ~9-month payback at ₹8/kWh.",
      sideGains: [
        "Trimmed peak kW on shared incomer",
        "Fewer lag run-hours → extended bearing life",
        "Quieter plant floor during off-peak",
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
      ],
    },
    commissioning: [
      "Calibrate header sensor and confirm 6.5–7.3 bar band.",
      "Run two-unit trial (Lag-2 disabled) to prove stability under new rules.",
      "Acceptance (24 h): ≤5% minutes outside band, ≤10 starts/shift, ≥95% minutes with ≤2 units.",
    ],
    managerTakeaway:
      "Two 75 kW units can carry the load. Sequencing discipline recovers roughly ₹10L+/yr with SOP first and optional sequencer later.",
  },

  /** Vinayak - CMD soft-landing (prescriptions-examples §4). */
  rx_v006: {
    createdAt: "2026-07-21",
    description:
      "Rolling MD at Vinayak is nearing the CMD headroom band with two deferrable starts queued. Soft-hold those starts before the 15-minute window locks - protect kiln/critical path.",
    savingsRange: "₹1.5L / mo · ₹18.0L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 09:55 IST",
      caption: "CMD soft-landing window",
      columns: [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Value", align: "right" },
        { key: "comment", header: "Comment" },
      ],
      rows: [
        { id: "md", metric: "Rolling MD", value: "4,720 kVA", comment: "Inside 5–8% CMD headroom" },
        { id: "cmd", metric: "CMD", value: "5,000 kVA", comment: "Contract demand" },
        { id: "q1", metric: "Queued start 1", value: "Mill grind", comment: "Deferrable" },
        { id: "q2", metric: "Queued start 2", value: "Pack surge", comment: "Deferrable" },
      ],
      interpretation:
        "Projected window-end MD enters the headroom band if both starts release. Ranked soft holds on deferrable loads avoid CMD / penalty risk without tripping critical path.",
      sanityCheck:
        "Issue soft holds lowest production risk first. Release when headroom recovers above 8% or window closes.",
    },
    rootCause: [
      "No live soft-landing SOP when projected MD enters 5–8% headroom.",
      "Deferrable starts not ranked by production risk.",
      "Plant head override path not logged.",
    ],
    costBenefit: {
      wasteIdentified: "CMD / MD penalty risk if window locks with co-incident deferrable starts.",
      tariffScenarios: {
        columns: [
          { key: "scenario", header: "Scenario" },
          { key: "impact", header: "Modeled / mo", align: "right" },
        ],
        rows: [
          { id: "s1", scenario: "Release both starts", impact: "₹1.5L penalty risk" },
          { id: "s2", scenario: "Soft-hold deferrables", impact: "₹0 – ₹25k residual" },
        ],
      },
      capexNote: "Soft-hold SOP only. No trip logic; protect kiln/critical path with plant head override.",
      sideGains: ["Near-miss log for M&V", "Clearer start permission during peak MD"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "False soft-hold",
          mitigation: "Release immediately if headroom recovers above 8%.",
        },
        {
          id: "r2",
          risk: "Critical path blocked",
          mitigation: "Plant head override with logged reason.",
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
        { id: "k1", kpi: "Soft-holds when headroom <8%", target: "100% of events", alert: "Missed soft-hold" },
        { id: "k2", kpi: "CMD near-misses logged", target: "Every event", alert: "Unlogged" },
      ],
    },
    commissioning: [
      "Estimate window-end MD from trend + pending starts.",
      "Issue ranked soft holds; block new deferrable starts until recovery.",
      "Record near-miss vs breach for the billing cycle.",
    ],
    managerTakeaway:
      "Soft-landing before the MD window locks avoids ~₹1.5L/mo CMD risk - deferrables only, critical path protected.",
  },
  rx_9012: {
    createdAt: "2026-07-21",
    description:
      "Kiln 1 was still ramping when Packing Line 1 restarted. Rolling MD reached 4,820 kVA, leaving only 3.6% headroom to the 5,000 kVA contract demand. Hold the second start briefly instead of risking a peak-demand breach.",
    savingsRange: "₹96k / mo · ₹11.5L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 10:22 IST",
      caption: "MD soft-landing window",
      columns: [
        { key: "signal", header: "Signal" },
        { key: "value", header: "Value", align: "right" },
        { key: "comment", header: "What it means" },
      ],
      rows: [
        { id: "md", signal: "Rolling MD", value: "4,820 kVA", comment: "3.6% headroom to CMD" },
        { id: "kiln", signal: "Kiln 1 ramp", value: "108%", comment: "Still settling" },
        { id: "pack", signal: "Packing restart", value: "TRUE", comment: "Second large start" },
      ],
      interpretation:
        "The two starts landed in the same rolling MD window. A short hold on Packing Line 1 protects the kiln ramp and keeps the next decision reversible.",
      sanityCheck:
        "Release the packing restart when Kiln 1 is below 95% or MD headroom is above 8%. Compare the next 15-minute window.",
    },
    rootCause: [
      "No start permission between the kiln ramp and packing restart.",
      "Shift handoff protected production starts but not the incomer MD window.",
      "The second start was not ranked against the contractual packing slot.",
    ],
    costBenefit: {
      wasteIdentified: "Modeled MD and peak-demand exposure if the co-start repeats.",
      tariffScenarios: {
        columns: [
          { key: "scenario", header: "Scenario" },
          { key: "impact", header: "Modeled impact / mo", align: "right" },
        ],
        rows: [
          { id: "s1", scenario: "Release both starts", impact: "₹96k risk" },
          { id: "s2", scenario: "Hold second start", impact: "₹0–₹12k residual" },
        ],
      },
      capexNote: "Sequence change only. No equipment command or remote control is part of this recommendation.",
      sideGains: ["More MD headroom", "Protected kiln ramp", "Clearer shift handoff"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Dispatch delay",
          mitigation: "Protect one named contractual slot and release the line when headroom recovers.",
        },
        {
          id: "r2",
          risk: "Early restart override",
          mitigation: "Log the override and require supervisor confirmation before another co-start.",
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
        { id: "k1", kpi: "Co-starts in MD window", target: "0 / shift", alert: ">0" },
        { id: "k2", kpi: "Rolling MD headroom", target: "≥ 8%", alert: "< 5%" },
        { id: "k3", kpi: "Second-start hold", target: "100% when gated", alert: "Missed hold" },
      ],
    },
    commissioning: [
      "Confirm the hold rule in the shift log for three consecutive ramps.",
      "Capture rolling MD before and after the second-start hold.",
      "Close only after seven days without a co-start in the protected window.",
    ],
    managerTakeaway:
      "A short, human-approved hold protects MD headroom without changing the production plan or issuing a plant command.",
  },
  rx_9013: {
    createdAt: "2026-07-21",
    description:
      "Compressor 2 has used 14% more power than its matched specific-power baseline for nine days at normal header pressure. Inspect the inlet filter and unload valve before treating this as a set-point problem.",
    savingsRange: "₹58k / mo · ₹7.0L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 10:28 IST",
      caption: "Compressor drift · matched runs",
      columns: [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Observed", align: "right" },
        { key: "comment", header: "Comparison" },
      ],
      rows: [
        { id: "power", metric: "Specific power", value: "+14%", comment: "Above 8-week baseline" },
        { id: "pressure", metric: "Header pressure", value: "6.8 bar", comment: "Matched band" },
        { id: "duration", metric: "Drift", value: "9 days", comment: "Persistent" },
      ],
      interpretation:
        "The pressure and run-hour context match the baseline, so a filter or unload-valve inspection is a safer first step than changing the whole air-house set-point.",
      sanityCheck:
        "Confirm standby capacity and isolation permit first. After inspection, compare kW, pressure, and run hours for one matched shift.",
    },
    rootCause: [
      "Inlet filter restriction or unload valve leakage is plausible.",
      "The drift persists even when header pressure and run hours are comparable.",
      "No approved low-load window has yet been assigned for inspection.",
    ],
    costBenefit: {
      wasteIdentified: "Modeled avoidable compressor energy from the specific-power drift.",
      capexNote:
        "Inspection-first. Do not buy a sequencer or change pressure bands until the mechanical check is complete.",
      sideGains: ["Lower compressor run cost", "Earlier fault visibility", "No production schedule change"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Insufficient standby air",
          mitigation: "Do not isolate Compressor 2 until standby capacity is confirmed.",
        },
        {
          id: "r2",
          risk: "Header pressure dip",
          mitigation: "Keep the standby unit armed and stop the trial if pressure leaves the safe band.",
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
        { id: "k1", kpi: "Specific power vs matched baseline", target: "≤ +5%", alert: "> +10%" },
        { id: "k2", kpi: "Header pressure", target: "6.5–7.3 bar", alert: "Outside band" },
        { id: "k3", kpi: "Inspection evidence", target: "Filter + valve logged", alert: "Missing" },
      ],
    },
    commissioning: [
      "Confirm standby capacity, isolation permit, and the next low-load window.",
      "Inspect the inlet filter and unload valve; record the condition.",
      "Compare one matched shift after the work and decide whether a second action is needed.",
    ],
    managerTakeaway:
      "This is a specific inspection with a clear safe window, not a vague request to improve compressed-air efficiency.",
  },
  rx_9014: {
    createdAt: "2026-07-21",
    description:
      "Kiln 1 ID fan draw stayed 11% above the matched warm-up band after draft had stabilised. Narrow the warm-up band for the next start while keeping the production release time unchanged.",
    savingsRange: "₹27k / mo · ₹3.2L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 10:34 IST",
      caption: "Kiln warm-up draw",
      columns: [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Value", align: "right" },
        { key: "comment", header: "Context" },
      ],
      rows: [
        { id: "fan", metric: "ID fan draw", value: "+11%", comment: "Above matched band" },
        { id: "draft", metric: "Kiln draft", value: "Stable", comment: "Before release" },
        { id: "oxygen", metric: "O₂", value: "In band", comment: "No quality exception" },
      ],
      interpretation:
        "The fan remains in a higher warm-up band after draft is stable. The recommendation changes the warm-up set-point only; it does not change the production start.",
      sanityCheck:
        "Restore the prior set-point immediately if draft or O₂ leaves the approved band, then log the exception.",
    },
    rootCause: [
      "Warm-up band remains wider than the stable-draft condition needs.",
      "The prior shift did not compare warm-up kWh with matched starts.",
      "The production release and warm-up control are not separated in the shift checklist.",
    ],
    costBenefit: {
      wasteIdentified: "Modeled warm-up energy above the matched 14-day band.",
      capexNote: "Set-point and checklist change only; no equipment purchase.",
      sideGains: ["Repeatable warm-up", "Lower avoidable kWh", "No change to production release"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Draft or O₂ leaves the approved band",
          mitigation: "Restore the prior set-point immediately and log the event.",
        },
        {
          id: "r2",
          risk: "Production start slips",
          mitigation: "Protect the release time; tune warm-up only.",
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
        { id: "k1", kpi: "Warm-up kWh vs matched band", target: "≤ +5%", alert: "> +10%" },
        { id: "k2", kpi: "Draft and O₂", target: "In approved band", alert: "Any excursion" },
      ],
    },
    commissioning: [
      "Confirm the draft and O₂ bands with the pyro supervisor.",
      "Apply the narrower warm-up band on the next kiln start.",
      "Compare warm-up kWh with the 14-day matched baseline before closing.",
    ],
    managerTakeaway:
      "Trim the warm-up, not the production start: the plant keeps its release time while testing a bounded energy change.",
  },
  rx_9015: {
    createdAt: "2026-07-21",
    description:
      "Packing Line 1 produced nothing for 26 minutes while conveyors and idle fans stayed on. Apply the existing idle SOP after 20 minutes, with safety and dust-control loads explicitly protected.",
    savingsRange: "₹46k / mo · ₹5.5L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 10:41 IST",
      caption: "Packing idle event",
      columns: [
        { key: "signal", header: "Signal" },
        { key: "value", header: "Value", align: "right" },
        { key: "comment", header: "Context" },
      ],
      rows: [
        { id: "output", signal: "Line output", value: "0", comment: "26 minutes" },
        { id: "conveyor", signal: "Conveyor load", value: "18 kW", comment: "Still on" },
        { id: "fan", signal: "Idle fan", value: "11 kW", comment: "Still on" },
      ],
      interpretation:
        "The line is idle and the auxiliary load is visible. A 20-minute trigger is long enough to avoid normal gaps while catching an extended idle window.",
      sanityCheck:
        "Confirm no truck or batch release is due, keep protected loads on, and measure the next five idle events.",
    },
    rootCause: [
      "Output count and auxiliary feeder power are not joined in the operator routine.",
      "The idle trigger is not written into the packing shift checklist.",
      "Safety, dust-control, and quality loads need a named protect list before rollout.",
    ],
    costBenefit: {
      wasteIdentified: "Modeled auxiliary kWh during extended zero-output windows.",
      capexNote: "Idle SOP and protect list only; no automatic plant command.",
      sideGains: ["Clearer shift handoff", "Lower auxiliary run-hours", "Repeatable restart rule"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "A protected load is switched off",
          mitigation: "Stop and restore it; review the protect list with the area supervisor.",
        },
        {
          id: "r2",
          risk: "Restart delay",
          mitigation: "Keep the warm-ready floor and use the supervisor override for a committed truck slot.",
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
        { id: "k1", kpi: "Idle trigger", target: "20 min", alert: "Missed event" },
        { id: "k2", kpi: "Protected loads", target: "100% on list", alert: "Unlisted load" },
        { id: "k3", kpi: "Idle feeder kWh", target: "Down vs 5-event baseline", alert: "Flat or up" },
      ],
    },
    commissioning: [
      "Publish the protect list at the packing panel.",
      "Use the 20-minute rule on the next idle event with supervisor approval.",
      "Compare feeder kWh before and after across five events.",
    ],
    managerTakeaway:
      "This is a readable floor rule: after 20 minutes with no output, cut only the named auxiliaries and keep safety loads on.",
  },
  rx_9016: {
    createdAt: "2026-07-21",
    description:
      "Admin HVAC stayed on its occupied schedule for 38 minutes while the occupancy signal was zero in an off-peak window. Apply a setback with a visible override for late work.",
    savingsRange: "₹14k / mo · ₹1.7L / yr modeled",
    eventSnapshot: {
      timestamp: "2026-07-21 10:48 IST",
      caption: "Off-peak occupancy check",
      columns: [
        { key: "signal", header: "Signal" },
        { key: "value", header: "Value", align: "right" },
        { key: "comment", header: "Context" },
      ],
      rows: [
        { id: "occupancy", signal: "Occupancy", value: "0", comment: "38 minutes" },
        { id: "hvac", signal: "Admin HVAC", value: "ON", comment: "Occupied schedule" },
        { id: "window", signal: "Tariff window", value: "Off-peak", comment: "Setback available" },
      ],
      interpretation:
        "The HVAC schedule is active without occupancy. A setback is appropriate only with an easy override for late work and occupied rooms.",
      sanityCheck:
        "Post the override contact, test it with Facilities, and keep the setting only if comfort remains in band for five windows.",
    },
    rootCause: [
      "The occupied schedule runs past the last expected office use.",
      "The occupancy signal is available but not used in the evening checklist.",
      "Late-work exceptions are not visible at the HVAC control point.",
    ],
    costBenefit: {
      wasteIdentified: "Modeled HVAC kWh during empty off-peak windows.",
      capexNote: "Schedule change with an occupancy override; no remote control.",
      sideGains: ["Lower HVAC run-hours", "Visible late-work exception", "Simple Facilities ownership"],
    },
    risksTable: {
      columns: [
        { key: "risk", header: "Risk" },
        { key: "mitigation", header: "Mitigation" },
      ],
      rows: [
        {
          id: "r1",
          risk: "Late work or safety need",
          mitigation: "Use the posted occupancy override and never block an occupied room.",
        },
        {
          id: "r2",
          risk: "Comfort complaint",
          mitigation: "Restore the prior schedule and review the setback window with Facilities.",
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
        { id: "k1", kpi: "Empty-window HVAC runtime", target: "Down vs 5-window baseline", alert: "Flat or up" },
        { id: "k2", kpi: "Occupancy override", target: "Tested and posted", alert: "Missing" },
        { id: "k3", kpi: "Comfort", target: "In agreed band", alert: "Out of band" },
      ],
    },
    commissioning: [
      "Post and test the occupancy override with Facilities.",
      "Apply the setback for tonight's off-peak window.",
      "Review HVAC kWh and comfort across the next five windows.",
    ],
    managerTakeaway:
      "The saving comes from a visible schedule change with a human override, not from silently turning off a room.",
  },
};
