/**
 * LNM Faridabad conservation worklist — site pack only (not platform demo).
 */
import type { Prescription } from "@/lib/types";
import { LNM_EXTERNAL_PLANT_ID } from "./catalog";

/** Cap L6 worklist — historian template flood must never render here. */
export const LNM_WORKLIST_MAX = 10;

export function getLnmConservationWorklist(): Prescription[] {
  const plantId = LNM_EXTERNAL_PLANT_ID;
  const dueAt = "2026-09-18T18:00:00+05:30";
  return [
    {
      id: "rx-lnm-longstop",
      plantId,
      title: "Named owner on long stops — CNC_14_S1, CNC_23, VMC_08",
      why: "State-hours observation, not verified kWh",
      outcome: "uptime",
      valueSignal: {
        kind: "idle_minutes",
        label: "Long-stop minutes to classify",
        value: 45,
        unit: "min",
        basis: "observed",
      },
      impactInrPerMonth: 0,
      confidence: 0.9,
      lane: "needs_review",
      ownerRole: "supervisor",
      dueAt,
      verificationStatus: "pending",
    },
    {
      id: "rx-lnm-cmd",
      plantId,
      title: "File CMD 750→600 kVA",
      why: "Paperwork rupee from billed demand vs MDI",
      outcome: "dynamic_production_planning",
      valueSignal: {
        kind: "dispatch_protected",
        label: "Demand headroom protected",
        value: 1,
        unit: "planning window",
        basis: "planned",
      },
      impactInrPerMonth: 0,
      confidence: 0.8,
      lane: "needs_review",
      ownerRole: "energy_manager",
      dueAt,
      verificationStatus: "pending",
    },
    {
      id: "rx-lnm-incomer",
      plantId,
      title: "Sunday 03:00 incomer photo",
      why: "Night residual is modeled until a feeder series exists",
      outcome: "energy_waste",
      valueSignal: {
        kind: "idle_minutes",
        label: "Planned-stop load window",
        value: 60,
        unit: "min",
        basis: "modeled",
      },
      impactInrPerMonth: 0,
      confidence: 0.55,
      lane: "needs_review",
      ownerRole: "energy_manager",
      dueAt,
      verificationStatus: "modeled",
    },
    {
      id: "rx-lnm-vmc09",
      plantId,
      title: "Confirm VMC_09 mothballed or dead",
      why: "Dark from day 1 of the historian window",
      outcome: "uptime",
      valueSignal: {
        kind: "planned_hours",
        label: "Availability status to confirm",
        value: 1,
        unit: "asset",
        basis: "observed",
      },
      impactInrPerMonth: 0,
      confidence: 0.85,
      lane: "needs_review",
      ownerRole: "supervisor",
      dueAt,
      verificationStatus: "pending",
    },
    {
      id: "rx-lnm-ple",
      plantId,
      title: "Review 100% PLE exemption level",
      why: "TOD / PLE paperwork, existing money-pack TOD engine",
      outcome: "energy_waste",
      valueSignal: {
        kind: "cost_avoided",
        label: "Tariff exposure to review",
        value: 1,
        unit: "billing rule",
        basis: "modeled",
      },
      impactInrPerMonth: 0,
      confidence: 0.7,
      lane: "needs_review",
      ownerRole: "energy_manager",
      dueAt,
      verificationStatus: "pending",
    },
  ];
}
