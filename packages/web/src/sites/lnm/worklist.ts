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
      impactInrPerMonth: 0,
      confidence: 0.7,
      lane: "needs_review",
      ownerRole: "energy_manager",
      dueAt,
      verificationStatus: "pending",
    },
  ];
}
