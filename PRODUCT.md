# Stamped L6 — Product Context

## Register

**Product:** task-focused operational application.
**Color strategy:** Restrained.

## Product purpose

Stamped L6 is the ops-first control room for Indian manufacturing energy
teams. It turns alarms, prescriptions, telemetry, savings, and evidence from
the lower layers into clear human decisions and defensible artifacts.

The product succeeds when a user clears the next high-value operational
decision with proof one tap away.

## Users and landings

| Role | Landing | Must see | Hidden by default |
|------|---------|----------|-------------------|
| Operator | `/alarms` | Critical alarms, assigned Rx | Ledger, integrations, admin |
| Supervisor | `/prescriptions` | Triage lanes, alarm count | API keys, enterprise settings |
| Plant head | `/` | Ops-confirmed value, closure, work rollup | Admin |
| Energy manager | `/` | Trends and advanced energy tools | Webhook admin |
| Sustainability | `/reports` | Reports, SEC, emissions | Alarm writes |
| CFO | `/reports/ledger` | Read-only value and evidence | Telemetry detail, writes |
| Admin | `/settings` | Users, plants, SSO, keys, webhooks | None |

Users may switch only among plants assigned by an L6 administrator.

## Jobs to be done

1. See no more than seven important signals and open the affected workflow.
2. Acknowledge, escalate, or silence an alarm from desktop or mobile.
3. Triage prescriptions by addressable value, confidence, and age.
4. Open pre-scoped evidence instead of searching a generic explorer.
5. Read potential, modeled, and ops-confirmed savings without mistaking them
   for bill verification.
6. Investigate trends, demand, equipment, intensity, renewable contribution,
   and applicable emissions.
7. Ask an analyst with visible context and confirm any proposed action.
8. Generate and approve repeatable sustainability PDF/XLSX artifacts.
9. Administer access and connect APIs, webhooks, Entra, and Power BI.

## Strategic principles

- Operational decisions outrank decorative metrics.
- Every number that influences a decision links to proof or its limitation.
- L5 is workflow/alarm truth, L4 is analyst runtime, and L2 is data/ledger
  truth. L6 composes; it does not recreate.
- Customer “verified” in the operational product means `ops_confirmed`.
- Progressive disclosure protects operators while preserving expert depth.
- Desktop and mobile are one product, not separate feature sets.
- Empty, stale, partial, and denied states must be more honest than the happy
  path is impressive.

## Voice and vocabulary

- Lead with operational verbs: “Acknowledge alarm”, “Mark done”. Entity links use short nouns: “Evidence”, “Prescription”, “Alarm” — never “Open …”.
- Use Indian number grouping and explicit units.
- Use “Ops-confirmed (telemetry)” where additional clarity is needed.
- Use “Modeled — not bill-verified” for counterfactual opportunity cost.
- Say what is missing: “Baseline unavailable for this period”.
- Avoid generic encouragement, inflated AI claims, and compliance promises.

## Product metrics

Capture without PII:

- time from alarm/Rx creation to first acknowledgement;
- prescription closure rate and channel;
- evidence opens before action;
- report generation, approval, and download;
- active API keys/webhook endpoints and delivery success;
- Power BI sync outcomes;
- Core Web Vitals by route and device class.

## Anti-references

- Purple SaaS gradients, glassmorphism, and hero-metric templates.
- Repeated equal card grids and nested cards.
- Fake “LIVE” pulses or counters.
- A chart gallery on Today.
- Drawer-only AI with silent page scraping.
- Bill-verified language for telemetry-only evidence.
- 3D plant maps without an operational decision.
- Direct ERP/OT writes before mature approvals and reconciliation.

## Explicit exclusions

WhatsApp magic links, Redis, native mobile, Hindi, SCIM, full BRSR filing,
multi-plant portfolio analytics, direct SAP/Tally writes, and bill-verification
claims are not part of this delivery.
