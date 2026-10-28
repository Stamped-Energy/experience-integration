/**
 * Quality monitor settings: SECOM public-data alarm tuning.
 * Ported from Stamped ui/app/lib/data/evidence/secomAlarmTune.ts @ 0f77288.
 * EXAMPLE DATA for the showcase until a plant profile is signed in.
 */

export const SECOM_PUBLIC_LABEL = "Tuned on public SECOM data";

export type MonitorRuleId = "nelson1" | "nelson2" | "nelson3" | "nelson4";

export type SecomAlarmTuneView = {
  evidenceId: string;
  attribution: string;
  publicLabel: typeof SECOM_PUBLIC_LABEL;
  sourceLabel: string;
  requestedFarTarget: number;
  chosenName: string;
  chosenFamily: string;
  enabledRules: MonitorRuleId[];
  rule4Run: number;
  valFar: number;
  heldOutFar: number;
  heldOutFarDisplay: string;
  detectionDelaySamples: number;
  hitFarTargetOnValidation: boolean;
  selectionRule: string;
};

export const SECOM_ALARM_TUNE: SecomAlarmTuneView = {
  evidenceId: "public-data:UCI-SECOM-CC-BY-4.0",
  attribution: "McCann & Johnston, SECOM, UCI ML Repository, DOI 10.24432/C54305, CC BY 4.0",
  publicLabel: SECOM_PUBLIC_LABEL,
  sourceLabel: "public-data tuned, retune per plant",
  requestedFarTarget: 0.05,
  chosenName: "rules:nelson1..4|rule4_run10",
  chosenFamily: "rules",
  enabledRules: ["nelson1", "nelson2", "nelson3", "nelson4"],
  rule4Run: 10,
  valFar: 0.04794520547945205,
  heldOutFar: 0.05102040816326531,
  heldOutFarDisplay: "0.0510",
  detectionDelaySamples: 45,
  hitFarTargetOnValidation: true,
  selectionRule: "lowest val_delay among configs with val_far <= requested_far_target",
};

export const FATIGUE_GUARD_STATUS = {
  state: "off" as const,
  reason: "Off until the plant sets debounce, suppression and shift-budget limits.",
};

export type SecomWatchTierView = {
  state: "hint";
  label: "Watch tier";
  isHintNotAlarm: true;
  publicLabel: typeof SECOM_PUBLIC_LABEL;
  family: "spe";
  chosenName: string;
  speAlpha: number;
  nComponents: number;
  heldOutCaught: string;
  heldOutNWatch: number;
  heldOutNPrecise: number;
  medianLeadSamples: number;
  inControlHintRateDisplay: string;
  inControlHintRate: number;
  smallSampleNote: string;
  evidenceId: string;
};

export const SECOM_WATCH_TIER: SecomWatchTierView = {
  state: "hint",
  label: "Watch tier",
  isHintNotAlarm: true,
  publicLabel: SECOM_PUBLIC_LABEL,
  family: "spe",
  chosenName: "watch_spe:alpha=0.1|n_comp=5",
  speAlpha: 0.1,
  nComponents: 5,
  heldOutCaught: "6/6",
  heldOutNWatch: 6,
  heldOutNPrecise: 6,
  medianLeadSamples: 21,
  inControlHintRate: 0.1564625850340136,
  inControlHintRateDisplay: "15.6%",
  smallSampleNote: "Held-out watch sample is 6 cases - a small sample; retune per plant before production use.",
  evidenceId: "public-data:UCI-SECOM-CC-BY-4.0",
};
