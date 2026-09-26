---
type: Company Policy
title: "Stamped — Master Company Document"
description: "Standalone company policy for Stamped: operational decisions across five domains, L1–L6 stack with L4 as the agentic brain, SaaS commercial motion, and speech rules."
tags: [stamped, company-policy]
timestamp: "2026-09-26T20:57:00+05:30"
---

# Stamped — Master Company Document

*Company policy · September 2026*  
*This file is the company narrative. The earlier Stamped Energy master document is the previous narrative.*

> **Caveat.** Stamped is pre-validation and open to iteration. Product direction is set. Pricing, packaging, and repeatable site proof are not settled. Write and speak confidently within that bound. Do not invent savings percentages, customer counts, logos, market sizes, or prices.

---

## 1. The company in one page

**Name:** Stamped

**What Stamped is.** Software that helps a manufacturing plant drive operational excellence through real-time decisions a person can act on. Stamped tells a plant operator what is costing the plant money, what change to make, and who is assigned to make that change. The useful unit is that one decision — across the plant, across sections — backed by the data the plant already has.

**How we say it.**

> Stamped tells a plant operator what is costing the plant money, what change to make, and who is assigned to make that change — so the plant can drive operational excellence from a decision, not from another dashboard.

**What Stamped is not.** An energy-only company. A monitoring dashboard. An EMS. An MES, APS, QMS, or CMMS replacement. A plant operating system. A hardware company. A silent controller of critical equipment. A verified-savings promise on a DISCOM bill. An OpEx suite sold as a category label.

**Operational excellence, here.** The next operating action, assigned to a person, checked afterward. That is the meaning of the phrase in this document.

---

## 2. The problem and the insight

Manufacturing plants already collect data: meters, machine states, production timestamps, calendars, work orders, ERP records, spreadsheets, and the judgment of people who walk the floor. The recurring failure is that operating calls are still made without the full picture — without joining what different sections already know when the costly change is still available.

The result is familiar. A furnace waits while upstream work is late. Loads stay on after a machine is idle. A handoff stalls and nobody owns the next move. Findings are ranked and then ignored. Actions are assigned and never checked. Teams debate dashboards instead of choosing a short, practical step.

**The insight.** More charts do not close that gap. The useful unit is one decision: what it is costing, what to change, who owns it, and what evidence will show whether the change worked. Plants already have data and metrics. What they lack is a call made on the whole plant, assigned to a person, and verified.

---

## 3. The product

### 3.1 The decision loop

Stamped raises the decision on its own when the plant condition warrants it. A person still accepts and carries out the work. The loop is:

1. Detect a condition that may justify action.
2. Name what it is costing — in operating terms the plant can recognize (money, time, energy, flow, or a short-horizon exception).
3. Recommend a bounded change.
4. Assign one accountable owner.
5. Record accept, edit, reject, or defer.
6. Check what happened against a named signal or human confirmation.

Later, a plant may approve a narrow reversible rule for a repeated, agreed condition. Until then, Stamped stays in recommendation and assignment. It does not silently command critical equipment, release quality, authorize maintenance, or rewrite the schedule.

### 3.2 Five domains, one card

Every meaningful condition creates **one decision card**. It carries one primary domain and optional secondary tags. Ownership is singular until it is explicitly reassigned.

| Domain | What it covers |
| --- | --- |
| **Energy** | When and how loads run; avoidable utility use and intensity where the data supports it |
| **Cost** | Operating-cost choices tied to visible levers — idle time, overtime, waits, partial loads, capacity tradeoffs |
| **Time / throughput** | Productive machine-minutes, idle or alarm time, constraint-cell output, near-term capacity |
| **Continuity / flow** | Work moving across handoffs, batches, racks, furnaces, and cells — one visible wait or batch decision at a time |
| **Exception response** | The short-horizon choice after equipment failure, cell unavailability, or a sequence slip |

A single wait can be time, energy, and cost together. Those effects stay on one card. They are not stacked into one invented savings number.

Energy is one domain and a practical way into a first conversation. It is not the company’s identity.

### 3.3 Short-horizon operating choices

When the plan breaks, Stamped helps the plant choose the next operating move for the next few hours or one shift. That is what “dynamic production planning” means in this company.

Stamped does not publish a new plant schedule, reorder the full dispatch list, rewrite MRP, change customer promise dates, or replace APS. The plan may remain in the plant’s planning system. Any write-back is human-confirmed, limited, and recorded.

---

## 4. How it is built: L1 to L6

Stamped is a six-layer stack. **L3 and L4 are the core.** L3 turns the plant’s volume of data into signals. L4 is the agentic brain that decides and answers.

```text
Plant → L1 connect → L2 remember → L3 signal → L4 decide / answer → L5 close → L6 show
```

| Layer | Role |
| --- | --- |
| **L1 — Connect** | Read-only intake. Edge reads meters, machines, and CNCs. A separate path reads utility bills and plant documents and checks money before it is trusted. Cloud validates and forwards. Nothing here commands equipment. |
| **L2 — Remember** | One store for the plant’s time-series and the context later layers read. Later layers query it. They do not open the database themselves. |
| **L3 — Signal** | **Core.** Converts that volume into a small set of findings L4 is allowed to consume. Machine learning and detection live here. |
| **L4 — Decide and answer** | **Core. The brain.** Consumes L3 signals, holds plant context, proposes the next action, and answers queries from that same context. |
| **L5 — Close** | Puts the action with a person, tracks it, and checks the result against evidence. Closed outcomes — including rejection and no measurable change — are the feedback for improvement. |
| **L6 — Show** | What the operator uses: the decision, the live picture, and the place to ask. |

L4 is one brain with two jobs: raise a decision when a signal warrants it, and answer when a person asks. Chat is not a separate product. The proactive decision loop is not a separate product. Both run through L4 on plant context.

---

## 5. Machine learning, the agentic brain, and how it improves

**Machine learning sits in L3.** The plant produces more data than a person can watch. L3 learns what normal looks like for a load, a line, or a machine, and emits a signal when the plant departs from it: the condition, the evidence, and the impact. Only signals that clear the gate are handed to L4. The rest stays internal. Models that only watch in the background are not customer decisions.

**Agentic AI sits in L4.** L4 is the main agentic system. It does not scan raw history to invent a speech. It takes L3 signals plus plant context — assets, state, owners, constraints — and either proposes the next action or answers a question. It can withhold or abstain when the context is not good enough.

**Self-improving, with a person on the rule change.** L5 records what was assigned, what was done, and what the evidence showed. That record is what the agentic system learns from: which signals were worth raising, which were refused, which actions closed. A change to a threshold or a rule is proposed and accepted by a named owner. The system does not quietly rewrite how the plant is controlled.

---

## 6. What people use

### 6.1 Queries — the plant brain

An operator or plant engineer can ask L4 about the plant: what is idle, what is waiting, what a signal means, who owns a cell. L4 answers from plant context. When a question warrants action, the answer can become a decision with an owner and a way to check what happened. Free query and the proactive loop remain two surfaces of the same brain.

### 6.2 Live insight

Live insight over the data the company already has is a real product surface. Operators and engineers need a current picture of the plant. Insight that never becomes an assigned action is not the whole product. The company still sells the closed decision loop.

### 6.3 Category modules

The shared core is the same decision loop, the same five domains, and the same L1–L6 stack. On top of that, Stamped adds **modules by manufacturing category** — packs that specialize signals and decisions for a plant type.

**First worked example: precision manufacturing.** Analysis on CNC machines, including tool-life decisions: when to change, who owns the change, and what evidence closes it. That is a decision family, not silent machine control and not a separate consulting product.

Other plant categories get their own modules as the company earns them. Modules extend the core. They do not replace it.

---

## 7. Boundaries

These are hard stops, not ranking preferences.

- No automatic safety decision or remote command to critical equipment.
- No quality hold release, conformance sign-off, or process acceptance.
- No maintenance authorization or bypass of a maintenance lockout.
- No silent change to customer priority, promise date, routing, master data, or the full dispatch sequence.
- No recommendation that outranks a known plant constraint merely because a model predicts a benefit.
- No invented currency precision. Finance-approved inputs own the money calculation when money is shown.
- Default integration posture is ingest and read. Notification and task creation are allowed when the destination and owner are clear. Write-back is human-confirmed, narrow, allow-listed, and auditable.

---

## 8. Who it is for

**Geography.** India manufacturing plants.

**Revenue band.**

| Band | Role |
| --- | --- |
| **₹100 crore → about ₹2,000–4,000 crore** | Outer addressable band |
| **₹300–1,000 crore** | Active focus |

The wider band can be split by sector later. This policy does not invent that split.

**Who acts.** Plant operators, plant engineers, maintenance leads, and supervisors — the people who can carry out the next operating change.

**Who buys.** The economic buyer is often a plant head, operations leader, or business owner. Who signs the contract is not fully settled and stays open until commercial terms are set.

**Fit.** A plant with recurring operational friction, enough observable data to support a decision, and a person who will own the response. A buyer seeking a generic dashboard, an autonomous operator, or a full ERP / MES / APS / QMS / CMMS replacement is outside the wedge.

---

## 9. Why now

The data required for a next-hours operating decision already sits in many plants — meters, machine states, production systems, calendars, and human confirmation. What was missing was a layer that joins those signals into one owned decision without replacing the systems of record.

Agentic software can now sit on that data, propose a bounded action, assign an owner, and check the result — while the plant keeps MES, APS, maintenance, and quality systems as the systems of record. Stamped is that layer. The timing is the coincidence of available plant data and a product boundary that refuses to become the plant’s operating system.

This section is qualitative policy. It does not claim industry growth rates, tariff statistics, or market sizes.

---

## 10. How we charge and how we reach a plant

**Preferred model.** A SaaS subscription.

**Way in.** A paid proof period on a narrowly scoped site — connect, raise decisions, assign, and check — before a longer subscription. The proof exists to remove career risk from the first purchase and to show that the loop closes on real plant evidence.

**Still open.** Rupee prices. Per-site versus company packaging. Contract term. Exactly what the proof period must show before conversion. Outcome pricing and savings-share contracts are out of scope until measurement and contracting are real.

**Motion.** Founder-led discovery and plant-level conversations. The champion proves floor use. The economic buyer approves the operating or commercial value. Scaled channels are not policy yet.

---

## 11. What we are beside, and what we will not claim

Stamped sits **next to** dashboards, energy tools, and planning systems. It does not become them.

| System | What it usually owns | Stamped’s relationship |
| --- | --- | --- |
| Dashboards / monitoring | Visibility and alerts | Add the owned decision and the check |
| Energy point solutions | Consumption, demand, tariff analysis | Start with energy actions when useful; connect them to time, cost, flow, and exceptions |
| MES | Shop-floor execution and production records | Read context; add a bounded decision and closure |
| APS | Demand, capacity, routing, and schedules | Treat the plan as context; respond to near-term departures |

**Speech rules — what a deck, a call, or an agent may say.**

- Stamped helps plant teams choose, assign, and verify the next operating action across five domains.
- Energy is one domain and a practical entry, not the company.
- The brain is L4: decisions and answers from plant context, fed by L3 signals.
- The preferred commercial shape is SaaS with a paid proof period; prices are not set.

**Speech rules — what they may not say.**

- A savings guarantee, a fixed bill-reduction percentage, or “verified savings on the DISCOM bill” as the product identity.
- “We replace your MES / APS / CMMS / plant OS.”
- Silent or autonomous control of critical equipment.
- Market size, traction, logos, or prices that this policy has not set.
- That Stamped Energy is still the company name.

---

## 12. Stage, and what is still open

**Stage.** Pre-validation. Product direction is set: five-domain decisions, L3 signals into an L4 agentic brain, L5 closure, L6 experience, category modules, and a SaaS commercial preference. Repeatable proof on a customer site is not yet a claim in this document.

**Still open.**

- Commercial packaging, prices, and proof exit criteria
- Exact economic-buyer title and contracting unit
- Order and timing of category modules after precision manufacturing
- Which domains expand first after the first closed decision family on a live plant
- Any low-risk automation rules a plant may later approve

**The test for every addition.** What decision does this help the plant make? Who acts? What evidence closes it? What will Stamped refuse to change?

If a feature cannot answer those four questions, it does not belong in the product.
)
