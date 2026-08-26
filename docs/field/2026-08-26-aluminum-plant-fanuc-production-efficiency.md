# LNM Faridabad walk — FANUC underuse + production efficiency (thinking)

**Date:** 2026-08-26 (demo-week site walk, Sector 59)  
**Account:** LNM Auto Faridabad — not a new aluminum prospect. Machine shop is CNC on aluminum / precision parts; campus is forge + HT + machine + surface.  
**Systems seen:** FANUC MT-LINKi Web Client (`192.168.10.106` / `192.168.10.10`), ForgeLink MES tab open, in-house ERP / scheduling claimed, cameras available  
**Sample machine:** `CNC_14_S2` · product `1774*P/M` · fleet footer **31 machines**  
**Field lock:** Shop-floor people are **not living in FANUC**. MT-LINKi is collected and under-used. IT is the main human interface (daily report).  
**Status:** Field thinking for the 27/29 demo. Does **not** reopen ADR-026 or start the parked production-efficiency Rx track.

---

## Verdict (read this first)

LNM already **paid** for a production IIoT stack. They are not **operating** it.

MT-LINKi is recording state, named alarms, part count, disconnects, and a 24-hour Gantt. Almost nobody on the floor is in that UI. The utilisation we saw is roughly: collector PC on → IT pulls **Report Output** → next-day production discussion. That is ~10% of what FANUC sold them (real-time Alarm Monitoring, Overlook, Signal/Macro history, Power Consumption, plan vs actual).

So this is **not** “they already know who is idle.” That was our **wrong** pre-walk pitch line.

Two stacked gaps:

1. **FANUC last mile** — data exists; setters, supervisors, and maintenance do not see it in time (or at all).
2. **Action latency** — even the people who see the daily report act after the shift is gone. Micro-stops (`2019` / `2029` in 0–2 min) never make the meeting.

Stamped’s job is not a second FANUC screen. It is: take the data they already bought, put it in front of the **named owner**, with ₹ and a close loop — energy **and** lost machine-hours.

> FANUC is already collecting. Your people are not using it. We do not replace FANUC. We make the collector reach the setter and the DHBVN bill in the same action.

That still is **not** “become their MES.” ForgeLink and ERP stay. We ride the unused northbound feed.

---

## What the screens already prove

Captured from MT-LINKi equipment monitoring on `CNC_14_S2` (two snapshots the same afternoon).

| Signal they already have | What we saw | Why it matters |
|---|---|---|
| Machine state | OPERATE / STOP plus binary flags: OPERATE, DISCONNECT, ALARM, EMERGENCY, SUSPEND | Real-time “is it making parts?” exists. No need to infer from cameras first. |
| Timeline / Gantt | Green operate, yellow idle/standby, grey **DISCONNECT** ~16:57–19:56 on 08/25 (~3 hours) | Long stops are visible. Tomorrow’s report will see this. The meeting will still be late. |
| Production result | **206–208** pcs of `1774*P/M` | Output is live. |
| Plans / rate | **Plans = 0 · Rate = 0.00%** | FANUC is **not joined to the schedule**. Utilisation vs plan is broken until ERP feeds planned qty. |
| Alarm history | Cluster of **OPR** alarms, spans **0.00–1.95 min** | The real leak is **micro-stoppages**, not one big breakdown. Daily averages hide them. |
| Named codes | **2019 JOB NOT CLAMPED** (operator/setup) · **2029 LUB PRESSURE FAIL** (maintenance) | Cause class is already in the alarm text. Different owners. Do not ask an LLM to invent this. |
| Frequency | ~10 OPR events in ~35 minutes (15:14–15:49) on **one** machine | Naïve “alert on every alarm” will be hated. Must **cluster + debounce**. |
| Fleet footer | ~31 machines; mixed operate / disconnect / alarm | Plant-wide state exists. Routing still does not. |
| Home menu | Monitoring, Results (incl. **Power Consumption**), Diagnosis (alarm / program / signal / **macro** history, **Report Output**), Utility | Daily report is a first-class FANUC feature. We should not rebuild Report Output. |
| Adjacent tab | **ForgeLink — Manufacturing Ex…** | A second execution/MES-like system is already in the browser. Ask what it owns vs MT-LINKi vs ERP. |

**Hottest factual insights from this visit:**

1. `JOB NOT CLAMPED` / `LUB PRESSURE FAIL` as sub-2-minute OPR events — availability death by a thousand cuts. The daily report is structurally blind to it.
2. **People are not in the FANUC client.** Under-use is the operating model, not a training footnote. `Plans = 0` is the same pattern: the module exists, nobody configured the last mile.

---

## FANUC is shelfware with a pulse (this is the LNM-specific insight)

Pre-walk we assumed: *FANUC tells you who is idle.*  
Walk evidence: the **box** knows. The **people** do not, except via a delayed IT report.

| FANUC capability (home menu) | Paid / present | Lived in by production? | Evidence |
|---|---|---|---|
| Equipment Monitoring | Yes — we opened `CNC_14_S2` | Rare | Founder observation: little interaction |
| Alarm Monitoring (real-time) | Icon on home | No | Alarms sit in history; no Andon/WhatsApp culture visible |
| Overlook / Group Monitoring | Yes | No | Fleet footer exists; nobody is routing off it |
| Production Results vs plan | Yes | Broken | **Plans = 0, Rate = 0.00%** — plan feed never set up |
| Power Consumption | Yes | Unused for ₹ | No DISCOM join; electrical still has no EMS |
| Report Output | Yes | **This is the actual product they use** | IT daily extract |
| Signal / Macro / Program history | Yes | Specialist / unused | Diagnosis row exists for RCA; not a shop habit |
| Email-on-alarm (if licensed) | Unknown | Ask | If it exists, it is probably muted or never configured |

**Why they will not “just use FANUC better”** (the real alternative to us):

- UI is a **Windows web client on a collector IP**. Setters do not open `192.168.10.106` between cycles.
- No **owner map**. 2019 and 2029 need different humans. FANUC does not know who is on shift.
- No **debounce**. Ten OPR hits/hour is unusable as raw email.
- No **₹**. FANUC Power Consumption is not a DHBVN bill.
- No **closure**. History tables are not tasks.
- Training 31-machine supervisors to live in MT-LINKi is a change-management project they have already failed (or never started). That failure is our opening, not an insult.

**Politics:** do not say “you wasted money on FANUC.” Say: *the collector is doing its job; the last mile to the person at the machine is missing.* CNC/FANUC owner stays the hero of the box. We are the last mile + rupees.

**Demo implication (27/29):** showing MT-LINKi to MD/production may itself be new. Use one screenshot (`2019` × many, `Plans = 0`) as *their* system, then Stamped as *what happens next*. Do not lead with “FANUC already tells you.”

---

## Job to be done (not a feature)

**Who:** LNM production / cell owner; maintenance for lube; IT as human ETL; MD who paid for both FANUC and a ₹22L/mo power bill.

**Why:** Recover lost machine-hours **while the shift can still act**, and put unused FANUC truth in front of people who never open the collector.

**What before:** Collector records everything → almost nobody watches it live → IT daily extract → morning discussion → maybe a TPM note. `Plans = 0`. Energy still blind (no EMS).

**How (Stamped-shaped):** Subscribe to MT-LINKi northbound (Web API / CSV / agreed export — not FOCAS, not UI scrape). Detect **state change + alarm clusters**. Map machine → owner + cause class → playbook. Message the owner. Close the loop (ack / recovered / still down). Optionally overlay ₹ energy and order due-date.

**What after:** Micro-stops and long disconnects become **named, timed tasks**. The daily meeting reviews **exceptions already worked**, not a first look at yesterday.

**Alternatives they already have:**

| Alternative | Why it is not enough |
|---|---|
| Keep MT-LINKi + daily report | Data exists; **latency and ownership** do not. |
| FANUC email-on-alarm (FIELD/MT-LINKi can notify) | Usually **unrouted, unclustered, no playbook, no closure, no ₹**. |
| ForgeLink / ERP as MES | Schedule and orders; rarely **sub-minute CNC alarm routing** to a named person with a fix class. |
| Hire more supervisors to stare at the web client | Does not scale to 31 machines. |
| Cameras / VMS | Useful only when **state is ambiguous**. Codes 2019/2029 already speak. |

---

## Types of efficiency — what we can actually move

Do not say “overall efficiency” as one blob. Split it. Sell only layers we can evidence.

```text
Overall plant effectiveness
 ├── Equipment (OEE-like)
 │    ├── Availability   ← MT-LINKi is strongest here (state + alarms + disconnect)
 │    ├── Performance    ← possible later (cycle vs standard, feed override, idle-in-cycle)
 │    └── Quality        ← weak in FANUC; needs ERP scrap / good count
 ├── Energy              ← our hero ₹; FANUC Power Consumption is machine-estimated only
 ├── Schedule adherence  ← ERP/ForgeLink; currently Plans = 0 in FANUC
 └── Response / labour   ← MTTR of alarms; this is the real-time message idea
```

| Type | Plant language | Data already on site | Stamped move | Honesty |
|---|---|---|---|---|
| **Availability** | “Machine not running” | OPERATE/STOP/ALARM/DISCONNECT, alarm span | Cluster + route + MTTR | Highest near-term value |
| **Micro-stop loss** | “It keeps interrupting” | OPR alarms 0–2 min | Pattern: N times / hour, same code | Daily report will **never** own this |
| **Performance** | “Running slow / idle in cycle” | Feed override, spindle load, program history (FANUC Diagnosis) | Later; needs standard cycle | Do not claim week 1 |
| **Quality** | “Scrap / rework” | Not on this screen | ERP good vs machine part count | Do not invent from cameras |
| **Energy / SEC** | “kWh per good part” | FANUC Power Consumption + our meters/bills | Existing Pillar 1 | Machine kW ≠ DISCOM bill |
| **Schedule / OTIF** | “Are we on the plan?” | ERP + ForgeLink; FANUC Plans = 0 | Join planned qty / due date | **This join is the unlock** for “this stop hurts a hot order” |
| **Response efficiency** | “How fast did someone fix it?” | Nobody measures this today | Time-to-ack, time-to-OPERATE | Directly matches their process pain |

**OEE as a hero product is still a trap** — but the trap is slightly different than “they already live in FANUC.” They *paid* for FANUC Results + ForgeLink and **do not operate them as a live system**. Selling another OEE dashboard invites “we already have that” *and* “we didn’t use the last one.” Selling **last-mile + ₹ + closure** is how we win without asking them to become FANUC power users.

---

## How we would actually do it (mechanism, not a pitch slide)

### 1. Do not replace FANUC — subscribe to it

Confirm with IT (checklist already in `connectors-edge/docs/research/FANUC_CONNECTIVITY.md`):

1. Classic **MT-LINKi** vs **FIELD Basic** (successor; better REST/OPC UA out).
2. Northbound: **Web API**, scheduled **CSV** (they already use Report Output), or last-resort Mongo replica. **Not** FOCAS on the CNC. **Not** scraping `index.html#monitoring_each`.
3. Asset map: `CNC_14_S2` → feeder meter / cell kW if we want ₹ on the same card.
4. Owner map: machine (or cell) → production owner + maintenance owner + shift calendar.

### 2. Detect events, not screenshots

| Event | Rule of thumb | Owner class |
|---|---|---|
| Long STOP / DISCONNECT | State ≠ OPERATE for **> N minutes** (agree N: 5? 10?) | Supervisor first |
| Alarm cluster | Same `alarm_number` **≥ k times in T minutes** (e.g. 2019 × 4 in 15 min) | Operator (clamp) vs maintenance (lube) |
| Chronic code | Top codes by **lost minutes** over rolling 4h / shift | TPM / process |
| Plan miss | Only after ERP planned qty is joined | Production planning |
| Energy-while-down | STOP/ALARM × kW still high | Energy + production (aux left on) |

**Debounce is the product.** Ten OPR lines in 35 minutes must become **one** message: “CNC_14_S2: JOB NOT CLAMPED ×8 in 35 min, 4.1 lost minutes. Owner: setter. Playbook: re-clamp / check fixture.” Not eight WhatsApps.

### 3. Perception = cause *class* + playbook, not a generated repair novel

FANUC already printed the diagnosis:

- `2019 JOB NOT CLAMPED` → **setup / operator**. Fix class: secure job, check clamp pressure, fixture.
- `2029 LUB PRESSURE FAIL` → **maintenance**. Fix class: lube pump, filter, leak, pressure switch.

Stamped’s “perception” for v1 is a **code → playbook table** (plant-editable), not an LLM inventing CNC repair steps. Hallucinated “how you will solve it” on a metal-cutting machine is a **safety and trust killer**.

LLM (if any) sits later: summarise the cluster, pick the playbook, draft the message, never invent a new mechanical procedure.

### 4. Cameras — optional, not the spine

Use only when **FANUC is mute**: STOP with no alarm, DISCONNECT vs “operator on break,” bay empty vs job loaded. Our own camera note already says: occupancy as **shared context**, not a plant brain. This floor already gives alarm text. Skip cameras for the first loop.

### 5. ERP / ForgeLink — the missing numerator

`Plans = 0` means they cannot answer “are we behind?” inside FANUC. Connecting ERP (or ForgeLink) planned qty + due date + SKU lets us say:

> CNC_14_S2 is down; order 1774 is due tonight; this cell is the constraint.

That is **shared context** (existing Stamped framing), not a new scheduler.

### 6. Close the loop (this is the actual product)

Message is worthless without:

- Acknowledge (right person saw it)
- Recovered (state back to OPERATE) or escalate
- Shift rollup: “8 clamp events on CNC_14, 22 lost minutes, 2 still open”

That rollup **replaces the IT guy’s surprise** without replacing his job: he becomes the exception reviewer, not the daily ETL.

---

## Opportunity tree (one outcome)

**Desired outcome:** Reduce lost CNC hours that the current daily-report process cannot recover (start with availability + MTTR on a pilot cell).

| Priority | Opportunity (customer words) | Why now | Solutions (pick later, don’t build yet) | Cheap test |
|---|---|---|---|---|
| **P0** | “We only find out next day that a machine sat idle / alarming.” | Confirmed on this visit | Clustered WhatsApp/SMS to named owner; dashboard of open events | Shadow 1 week on 3 machines: no messages, just log “we would have sent X.” Compare to next-day report. |
| **P0** | “Micro-stops don’t show up in the meeting.” | 2019/2029 spans | Top-N codes by lost minutes, not by count | Export alarm history CSV for one shift; rank by span-sum. Show production head. |
| **P1** | “Wrong person gets pinged.” | Clamp vs lube | Two-owner map + code class | Paper map for 31 machines before any software. |
| **P1** | “We don’t know if the stop hurts a hot order.” | Plans = 0 | ERP planned qty join | One CSV of today’s plan vs FANUC part count. |
| **P2** | “Tell us how to fix it.” | Tempting, dangerous | Playbook library only | 20 alarm codes × 1 paragraph from their own TPM, not GPT. |
| **P2** | Energy × downtime | Our wedge | ₹ while STOP | Needs meter on cell / incomer split. |
| **Later** | Full OEE / cycle / scrap hero | Category fight with ForgeLink | Do not start | — |
| **Later** | Camera perception | Ambiguous STOP only | Occupancy label | — |

---

## Value proposition (LNM this week)

**For** LNM production, maintenance, and the MD,  
**who** already bought FANUC MT-LINKi but mostly touch it as a next-day IT report,  
**Stamped** takes that unused live feed and turns alarm/state clusters into a **named action with ₹ and a closed recovery**,  
**unlike** “open the FANUC client” (nobody does), ForgeLink (execution island), or the morning meeting (too late for micro-stops).

**Positioning lines (use on the floor):**

- *Your FANUC collector already knows CNC_14 stopped and why. The setter does not. We put that in their hand, and we put the rupees against the DHBVN bill.*
- *We are not asking you to live in MT-LINKi. We are using the box you already paid for.*

**Do not say:** “You already know which machines are idle.” **Do not say:** “We replace FANUC / ForgeLink / MES.”

---

## What maximises customer value without blowing up the category

Stay on the **capability ladder we already wrote**:

| Level | Meaning | This plant | Do? |
|---|---|---|---|
| **0** | Production as **co-benefit** on energy/equipment Rx | “This idle also lost 40 pcs of 1774” | **Yes** |
| **1** | Availability from equipment stack, sold as recovery + ₹ | Alarm clusters, disconnect MTTR | **Yes if they pull us here** — still not a third pillar |
| **2** | Production-hero OEE product | Rebuild FANUC Results + ForgeLink | **No** — parked; needs explicit ADR reopen |

**FANUC features to ride, not rebuild:** Equipment Monitoring, Alarm History, Operational Results, Production Results, Power Consumption, Report Output, Signal/Macro history (later, for “why”).

**FANUC features that look like us but aren’t closure:** Overlook, Alarm Monitoring, scheduled CSV. Those *show* — and at LNM they are mostly **unopened**. We *assign and verify* without requiring a new FANUC habit.

---

## Risks (say these out loud)

1. **Alert fatigue** — one machine, 10 OPR hits/hour. Unclustered alerts get muted on day two.
2. **Wrong diagnosis confidence** — 2019 is clear; “STOP with all flags off” is not. Don’t overclaim.
3. **Safety** — never auto-generate mechanical procedures; never write to the CNC.
4. **Politics** — IT owns the daily report. Position as making that report *exception-based*, not firing them.
5. **Duplicate notify** — ask if MT-LINKi/FIELD email alerts already exist and are ignored.
6. **Category** — if we pitch OEE, ForgeLink/IT will correctly say they already have it.
7. **Plans = 0** — if ERP never joins, we can still do MTTR; we cannot honestly say “behind plan.”
8. **“Just train them on FANUC”** — real objection. Answer: they have had the client and still only use Report Output; last mile + owner + ₹ is the missing product, not another login.
9. **Insulting the FANUC owner** — never. The collector is their baby. We read northbound only.

---

## Questions to ask before leaving the plant

Copy this onto a phone. These decide whether the opportunity is real.

1. Who actually **opens** MT-LINKi today besides IT? (Confirm under-use; don’t assume.)
2. Who is the **named owner** of `CNC_14_S2` this shift (setter vs operator vs maintenance)?
3. When `2019` vs `2029` fires, who is supposed to walk to the machine **today** — and do they?
4. Does anyone already get **MT-LINKi / email / SMS** on alarm? Configured and muted, or never set up?
5. What exactly is in the **daily report** (which Report Output templates)? Who reads it before the meeting?
6. Why is **Plans = 0**? ERP/ForgeLink never wired, or nobody maintained it?
7. What is **ForgeLink** vs MT-LINKi vs in-house ERP (orders, downtime codes, OEE, dispatch)?
8. Rough **₹ or contribution per hour** of a VMC like CNC_14.
9. Yesterday’s ~3-hour DISCONNECT (16:57–19:56): planned, network, or unnoticed until the report?
10. Factory 1 pick still stands: incomer reachable **and** 5–10 machines already on this DC.

**Kill / proceed (this one site, not the old “≥3 pilots” market rule):**

- **Proceed to a shadow experiment** if they will (a) name owners for a 3–5 machine cell, (b) give alarm+state export or API, (c) admit the daily report is too late for micro-stops.
- **Stay energy-first** if production already has a live Andon / WhatsApp group that works, and they only want kWh/₹.
- **Do not promise playbook-AI or cameras** until P0 shadow is boring and useful.

---

## Mapping to existing Stamped work (for us, not the customer)

- Connect: MT-LINKi northbound — [`connectors-edge/docs/research/FANUC_CONNECTIVITY.md`](../../../connectors-edge/docs/research/FANUC_CONNECTIVITY.md)
- Signals we already have for CNC: `cnc_alarm_dwell`, idle spindle, state energy split — [`intelligence-core/docs/PRECISION_MFG_DATA_TO_SIGNALS.md`](../../../Intellience - L3/intelligence-core/docs/PRECISION_MFG_DATA_TO_SIGNALS.md)
- Policy: two pillars + shared context — ADR-026. This visit is **Level 1 availability**, not permission to build parked [`future/later/production-efficiency-prescriptions.md`](../../external/future/later/production-efficiency-prescriptions.md)
- Cameras: only if FANUC is mute — [`external/research/concepts/06-plant-camera-perception.md`](../../external/research/concepts/06-plant-camera-perception.md)
- Prior market lock (2026-08-24): don’t build production-hero Rx unless a pilot **demands** it. This visit is a **demand signal**. It is still not a build order.

---

## Photos referenced

- MT-LINKi home: Monitoring / Results / Diagnosis / Utility (`:3000`)
- `CNC_14_S2` STOP snapshot (`:8000`) — all status flags off
- `CNC_14_S2` OPERATE snapshot (`:5000`) — alarm table with 2019 / 2029
