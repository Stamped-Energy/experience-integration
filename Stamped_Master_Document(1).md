---
type: Company Policy
title: "Stamped — Master Company Document"
description: "Standalone company policy for Stamped: quality and yield, energy and waste, uptime, and dynamic scheduling as owned decisions; L1–L6 stack with L4 as the agentic brain; SaaS commercial motion; and speech rules."
tags: [stamped, company-policy]
timestamp: "2026-09-26T23:55:00+05:30"
---

# Stamped — Master Company Document

*Company policy · September 2026*  
*This file is the company narrative. The earlier Stamped Energy master document is the previous narrative.*

> **Caveat.** Stamped is pre-validation and open to iteration. Product direction is set. Pricing, packaging, and repeatable site proof are not settled. Write and speak confidently within that bound. Do not invent savings percentages, customer counts, logos, market sizes, or prices.

---

## 1. The company in one page

**Name:** Stamped

**What Stamped is.** Software that helps a manufacturing plant drive operational excellence through operating decisions a person can act on. Stamped watches quality and yield, energy and waste, uptime, and the near-term schedule. It names what a condition is costing, the change to make, and the person assigned to make it. The useful unit is that one decision, backed by the data the plant already has.

**How we say it.**

> Stamped helps a plant team choose, assign, and verify the next operating action across quality and yield, energy and waste, uptime, and dynamic scheduling — so the plant improves from a decision, not from another dashboard.

**What Stamped is not.** An energy-only company. A monitoring dashboard. An EMS. An MES, APS, QMS, or CMMS replacement. A plant operating system. A hardware company. A silent controller of critical equipment. A verified-savings promise on a DISCOM bill. An OpEx suite sold as a category label.

**Operational excellence, here.** The next operating action, assigned to a person, checked afterward. That is the meaning of the phrase in this document.

---

## 2. The problem and the insight

Manufacturing plants already collect data: meters, machine states, quality records, production timestamps, calendars, work orders, ERP records, spreadsheets, and the judgment of people who walk the floor. The recurring failure is that operating calls are still made without the full picture — without joining what different sections already know when the costly change is still available.

The result is familiar. Quality drifts and becomes a defect before anyone correlates batch, shift, and machine state. Energy stays high after output has dropped. A line stops or runs slow and the cause sits across upstream and downstream signals. The schedule breaks and the next sequence is rebuilt in a meeting. Findings are ranked and then ignored. Actions are assigned and never checked. Teams debate dashboards instead of choosing a short, practical step.

**The insight.** More charts do not close that gap. The useful unit is one decision: what it is costing, what to change, who owns it, and what evidence will show whether the change worked. Plants already have data and metrics. What they lack is a call made on the whole plant, assigned to a person, and verified.

---

## 3. The product

### 3.1 The decision loop

Stamped raises the decision on its own when the plant condition warrants it. A person still accepts and carries out the work. The loop is:

1. Detect a condition that may justify action.
2. Name what it is costing — in operating terms the plant can recognize (yield, energy, waste, lost time, flow, or a broken near-term sequence).
3. Recommend a bounded change. When the plan has broken, that change may be a constraint-aware sequence for the next few hours or one shift.
4. Assign one accountable owner.
5. Record accept, edit, reject, or defer.
6. Check what happened against a named signal or human confirmation.

Later, a plant may approve a narrow reversible rule for a repeated, agreed condition. Until then, Stamped stays in recommendation and assignment. It does not command critical equipment, release a quality hold, authorize maintenance, or silently publish a schedule, promise date, or dispatch sequence.

### 3.2 Four outcomes, one card

Every meaningful condition creates **one decision card**. It carries one primary outcome and optional effect tags. Ownership is singular until it is explicitly reassigned.

| Outcome | What it covers |
| --- | --- |
| **Quality and yield** | Drift in quality or yield before it becomes a defect. A specific correction a person accepts — a process adjustment or a parameter change — with the evidence that will show whether it held. |
| **Energy and waste** | Energy and material waste against good output. When use rises without a matching rise in output, the equipment state or operating condition that drove it, and the change to make. |
| **Uptime** | Stops, micro-stops, and slow running. One next action grounded in the plant’s procedures, then a check that the action held. |
| **Dynamic scheduling** | A constraint-aware sequence for the next few hours or one shift when supply, demand, downtime, or a rush job changes what the plant can run. Changeover, line order, material, and crew stay inside what the plant can actually do. |

Cost, continuity / flow, and time sit on the card as effects of that outcome. They are not outcomes of their own. A quality drift can be money and lost throughput. A schedule change can be energy and flow. Those effects stay on one card. They are not stacked into one invented savings number.

Energy and waste is one outcome and a practical way into a first conversation. It is not the company’s identity.

### 3.3 Dynamic scheduling

When the plan breaks, Stamped recommends the next sequence the plant can run for the next few hours or one shift. The recommendation respects known constraints: changeover time, line order, material availability, and crew. A named person accepts, edits, rejects, or defers it.

The plant’s planning system remains the system of record. Stamped does not silently publish that sequence, reorder the full dispatch sequence, rewrite MRP, change customer promise dates, customer priority, routing, or master data, or replace APS. Any write-back follows section 7: human-confirmed, narrow, allow-listed, and auditable.

---

## 4. How it is built: L1 to L6

Stamped is a six-layer stack. **L3 and L4 are the core.** L3 turns the plant’s volume of data into evidence. L4 is the agentic brain that investigates, decides, and answers.

```text
Plant → L1 connect → L2 remember → L3 signal → L4 decide / answer → L5 close → L6 show
```

| Layer | Role |
| --- | --- |
| **L1 — Connect** | Read-only intake. Edge reads meters, machines, and CNCs. A separate path reads utility bills, quality and production records, and plant documents, and checks money before it is trusted. Cloud validates and forwards. Nothing here commands equipment. |
| **L2 — Remember** | One store for the plant’s time-series and the context later layers read: assets, production and quality events, downtime, constraints, and owners. Later layers query it. They do not open the database themselves. |
| **L3 — Signal** | **Core.** Converts that volume into findings L4 is allowed to use: quality drift, energy and waste against output, fault and slow-running patterns, and departures from the near-term plan. Machine learning and detection live here. |
| **L4 — Decide and answer** | **Core. The brain.** Uses L3 evidence and the plant model, investigates across upstream and downstream steps, batch, shift, and machine state, proposes the next action, and answers queries from that same context. |
| **L5 — Close** | Puts the action with a person, tracks it, and checks the result against evidence. Closed outcomes — including rejection and no measurable change — are the feedback for improvement. |
| **L6 — Show** | What the operator uses: the decision, the live picture, and the place to ask. |

L4 is one brain with two jobs: raise a decision when the plant condition warrants it, and answer when a person asks. Chat is not a separate product. The proactive decision loop is not a separate product. Both run through L4 on plant context.

---

## 5. Machine learning, the agentic brain, and how it improves

**Machine learning sits in L3.** The plant produces more data than a person can watch. L3 learns what normal looks like for a load, a line, a quality measure, or a machine, and emits evidence when the plant departs from it: the condition, the evidence, and the impact. Only findings that clear the gate are handed to L4. The rest stays internal. Models that only watch in the background are not customer decisions.

**Agentic AI sits in L4.** L4 is the main agentic system. It does not invent a speech by scanning raw history with no model behind it. It takes L3 evidence plus the plant model — assets, events, state, owners, constraints — and investigates across upstream and downstream steps, batch, shift, and machine state. From that it proposes the next action or answers a question. It can withhold or abstain when the context is not good enough.

**Self-improving, with a person on the rule change.** L5 records what was assigned, what was done, and what the evidence showed. That record is what the agentic system learns from: which findings were worth raising, which were refused, which actions closed. A change to a threshold or a rule is proposed and accepted by a named owner. The system does not quietly rewrite how the plant is controlled.

---

## 6. What people use

### 6.1 Queries — the plant brain

An operator or plant engineer can ask L4 about the plant: what is drifting, what is wasting energy, what is stopped or slow, what the next sequence should be, who owns the action. L4 answers from plant context. When a question warrants action, the answer can become a decision with an owner and a way to check what happened. Free query and the proactive loop remain two surfaces of the same brain.

### 6.2 Live insight

Live insight over the data the plant already has is a real product surface. Operators and engineers need a current picture of quality, energy, uptime, and the near-term schedule. Insight that never becomes an assigned action is not the whole product. The company still sells the closed decision loop.

### 6.3 Category modules

The shared core is the same decision loop, the same four outcomes, and the same L1–L6 stack. On top of that, Stamped adds **modules by manufacturing category** — packs that specialize evidence and decisions for a plant type.

**First worked example: precision manufacturing.** Analysis on CNC machines, including tool-life decisions: when to change, who owns the change, and what evidence closes it. That is a quality-and-yield decision family, not silent machine control and not a separate consulting product.

Other plant categories get their own modules as the company earns them. Modules extend the core. They do not replace it.

---

## 7. Boundaries

These are hard stops, not ranking preferences.

- No automatic safety decision or remote command to critical equipment.
- No quality hold release, conformance sign-off, or process acceptance. A quality recommendation is allowed when a person accepts the correction.
- No maintenance authorization or bypass of a maintenance lockout. An uptime recommendation may name the next action; it does not authorize the work.
- No silent change to customer priority, promise date, routing, master data, or the full dispatch sequence. A scheduling recommendation is allowed when a named person accepts it before any write-back.
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

**Who acts.** Plant operators, plant engineers, maintenance leads, and supervisors — the people who can carry out the next operating change. Planners act on a scheduling recommendation.

**Who buys.** The economic buyer is often a plant head, operations leader, or business owner. Who signs the contract is not fully settled and stays open until commercial terms are set.

**Fit.** A plant with recurring friction in quality, energy and waste, uptime, or the near-term schedule, enough observable data to support a decision, and a person who will own the response. A buyer seeking a generic dashboard, an autonomous operator, or a full ERP / MES / APS / QMS / CMMS replacement is outside the wedge.

---

## 9. Why now

The data required for these decisions already sits in many plants — meters, machine states, quality and production records, calendars, and human confirmation. What was missing was a layer that joins those signals into one owned decision without replacing the systems of record.

Agentic software can now sit on that data, investigate across the line, propose a bounded action, assign an owner, and check the result — while the plant keeps MES, APS, maintenance, and quality systems as the systems of record. Stamped is that layer. The timing is the coincidence of available plant data and a product boundary that refuses to become the plant’s operating system.

This section is qualitative policy. It does not claim industry growth rates, tariff statistics, or market sizes.

---

## 10. How we charge and how we reach a plant

**Preferred model.** A SaaS subscription.

**Way in.** A paid proof period on a narrowly scoped site — connect, raise decisions, assign, and check — before a longer subscription. The proof exists to remove career risk from the first purchase and to show that the loop closes on real plant evidence.

**Still open.** Rupee prices. Per-site versus company packaging. Contract term. Exactly what the proof period must show before conversion. Outcome pricing and savings-share contracts are out of scope until measurement and contracting are real.

**Motion.** Founder-led discovery and plant-level conversations. The champion proves floor use. The economic buyer approves the operating or commercial value. Scaled channels are not policy yet.

---

## 11. What we are beside, and what we will not claim

Stamped sits **next to** dashboards, quality systems, energy tools, maintenance systems, and planning systems. It does not become them.

| System | What it usually owns | Stamped’s relationship |
| --- | --- | --- |
| Dashboards / monitoring | Visibility and alerts | Add the owned decision and the check |
| Quality systems | Holds, conformance, and process acceptance | Read quality context; recommend a correction a person accepts |
| Energy point solutions | Consumption, demand, tariff analysis | Start with energy and waste when useful; connect them to yield, uptime, and the schedule |
| MES | Shop-floor execution and production records | Read context; add a bounded decision and closure |
| APS | Demand, capacity, routing, and schedules | Treat the plan as context; recommend a near-term sequence a person accepts |
| CMMS | Maintenance authorization and lockout | Read history as context; recommend the next uptime action without authorizing the work |

**Speech rules — what a deck, a call, or an agent may say.**

- Stamped helps plant teams choose, assign, and verify the next operating action across quality and yield, energy and waste, uptime, and dynamic scheduling.
- Energy is one outcome and a practical entry, not the company.
- The brain is L4: decisions and answers from plant context, fed by L3 evidence.
- A person accepts the action. Write-back is human-confirmed, narrow, and recorded.
- The preferred commercial shape is SaaS with a paid proof period; prices are not set.

**Speech rules — what they may not say.**

- A savings guarantee, a fixed reduction percentage, or “verified savings on the DISCOM bill” as the product identity.
- “We replace your MES / APS / QMS / CMMS / plant OS.”
- Silent or autonomous control of critical equipment, silent quality release, or a silently published schedule.
- Market size, traction, logos, or prices that this policy has not set.
- That Stamped Energy is still the company name.

---

## 12. Stage, and what is still open

**Stage.** Pre-validation. Product direction is set: four outcomes on one owned decision, L3 evidence into an L4 agentic brain that can investigate across the line, L5 closure, L6 experience, category modules, and a SaaS commercial preference. Repeatable proof on a customer site is not yet a claim in this document.

**Still open.**

- Commercial packaging, prices, and proof exit criteria
- Exact economic-buyer title and contracting unit
- Order and timing of category modules after precision manufacturing
- Which outcome is proved first on a live plant
- Any low-risk automation rules a plant may later approve

**The test for every addition.** What decision does this help the plant make? Who acts? What evidence closes it? What will Stamped refuse to change?

If a feature cannot answer those four questions, it does not belong in the product.
)
