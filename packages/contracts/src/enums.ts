import { z } from "zod";

/** Seven L6 roles from ADR-023 / UI charter. */
export const RoleSchema = z.enum([
  "operator",
  "supervisor",
  "plant_head",
  "energy_manager",
  "sustainability",
  "cfo",
  "admin",
]);
export type Role = z.infer<typeof RoleSchema>;

export const AlarmSeveritySchema = z.enum(["critical", "warning", "info"]);
export type AlarmSeverity = z.infer<typeof AlarmSeveritySchema>;

/** L5 EMS alarm projection states (L5 §6). */
export const AlarmStateSchema = z.enum([
  "raised",
  "acked",
  "escalated",
  "silenced",
  "cleared",
]);
export type AlarmState = z.infer<typeof AlarmStateSchema>;

/**
 * Ledger / claim verification vocabulary (ADR-020).
 * `ops_confirmed` ≠ bill `verified`.
 */
export const VerificationStatusSchema = z.enum([
  "pending",
  "ops_confirmed",
  "modeled",
  "disputed",
  "verified",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/** Stamped-internal statuses — never map to customer lanes. */
export const STAMPED_INTERNAL_WORKFLOW_STATUSES = new Set([
  "pending_stamped_review",
  "withheld",
]);

/** L5 WorkflowEvent.to_status / from_status (platform schema). */
export const WorkflowStatusSchema = z.enum([
  "blocked",
  "pending_stamped_review",
  "withheld",
  "open",
  "in_progress",
  "done",
  "verified",
  "deferred",
  "rejected",
  "disputed",
]);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

/** UI prescription triage lanes (charter). */
export const PrescriptionLaneSchema = z.enum([
  "needs_review",
  "active",
  "verifying",
  "closed",
]);
export type PrescriptionLane = z.infer<typeof PrescriptionLaneSchema>;

export const WorkflowEventTypeSchema = z.enum([
  "transition",
  "notification_sent",
  "notification_delivered",
  "notification_failed",
  "reminder",
  "escalation",
  "reason_coded",
  "verification_decision",
  "ledger_append_acked",
  "duplicate_intent",
  "alarm_raised",
  "alarm_acked",
  "alarm_cleared",
  "ops_verified",
  "ops_regressed",
]);
export type WorkflowEventType = z.infer<typeof WorkflowEventTypeSchema>;
