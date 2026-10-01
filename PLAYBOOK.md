# What a forge-to-finish plant loses in a shift, and the decision that wins it back

*Example times, quantities and machine names are illustrative.*

A plant like this rarely loses money in one big failure. It loses it in ordinary moments on an ordinary shift: the main CNC waiting for parts, a furnace hot with nothing in it, a machine stopped for 45 minutes that nobody walked to, a breakdown at 10 am that leaves the rest of the day's plan out of date.

Each moment has one owner and one right call. The data to see it is already in the plant: machine states from the CNC controls, furnace readings, meters, the production schedule and quality records. Stamped reads that data, makes the call, and sends it to the person who can act, with the reason and a way to check it worked. No cameras, no new hardware on the machines.

What follows are the moments that matter most on a forge-to-finish line, and exactly what Stamped would send.

## 1. How Stamped works, on one screen

1. **Notice:** Stamped reads the machine states, furnace and oven status, meters, production records, quality records and schedule already held by the plant.
2. **Say what it costs:** It states the likely effect in delivery, yield, lost machine time or energy.
3. **Recommend one bounded change:** The recommendation has one action and a clear limit. It does not alter a recipe or command equipment.
4. **Assign one owner:** One named person receives the recommendation in a phone card, in English or Hindi.
5. **Record the decision:** The owner can acknowledge, edit, reject or defer it.
6. **Check what happened:** Stamped checks the relevant signal and records whether the action worked.

> **Action:** Start batch 12 now at 70% fill.  
> **Hindi:** बैच 12 अभी 70% भराई पर शुरू करें।  
> **Why:** The main CNC runs out of heat-treated parts at 2 pm if the basket waits to fill.  
> **Owner:** Heat-treatment supervisor (production confirms)  
> **Do:** Load and start the compatible batch; keep the recipe unchanged.  
> **Check:** The main CNC does not run out of parts; the part-fill reason is recorded.  
> **Due:** 1:25 pm  
> [Acknowledge] [Done] [Escalate]

The same brain answers questions from the floor. See section 8.

## 2. The busiest machine should never wait for a half-full basket

**A one-hour wait at the busiest CNC cannot be recovered by making another machine run faster.**

**What's happening.** The busiest CNC machine is on today's urgent order and will run out of parts in 40 minutes. The next batch is at the furnace, waiting for the basket to fill. Production knows the job is needed for a fixed truck time.

**Why it matters.** If the basket waits, the main machine stands idle for about an hour. The downstream order loses that time, and nothing elsewhere in the plant can make it back. The truck time is fixed.

**What Stamped says.** Stamped sends one card to the heat-treatment supervisor after production confirms the demand: “Start batch 12 now, even though it is only 70% full. Otherwise the main CNC runs out of parts at 2 pm.” The recipe is unchanged. The supervisor accepts or rejects the call.

**The trade-off.** A part-full basket uses a little more energy per part. An idle hour on the busiest machine costs far more than that extra energy. The order ships on time if the supervisor starts the compatible batch. This is a case where Stamped recommends spending more energy because delivery comes first.

## 3. A furnace that slowly needs more energy for the same work is telling you something

**A rising energy signal is an inspection request, not permission to change the process.**

Stamped compares each run of a heat-treatment furnace only with past runs of the same recipe, similar load weight, the same temperature and the same soak. It does not compare a light load with a heavy load or one recipe with another. A single bad run is not enough to make a maintenance call.

| Week | Energy per kg (example index) | Normal band | Status |
|---|---:|---:|---|
| 1 | 100 | 96–104 | Inside |
| 2 | 101 | 96–104 | Inside |
| 3 | 103 | 96–104 | Inside |
| 4 | 105 | 96–104 | Above |
| 5 | 107 | 96–104 | Above |
| 6 | 108 | 96–104 | Above |

After the signal stays above the band across comparable runs, Stamped sends the maintenance lead a card with the heat-treatment owner copied: “Before next production week, check Furnace 2 door seals, burner air-fuel setting and air leaks or infiltration. Compare the result with the same recipe and load range.” Maintenance decides the inspection timing and records what was found.

Caught early, this is an inspection. Caught late, it can become a breakdown or uneven temperature that appears as a hardness problem. The check is complete when energy per kg returns inside the band on the same recipe while the temperature profile and quality remain the same.

Stamped never shortens soak or changes the recipe to fix an energy signal. Metallurgy and quality own those decisions.

## 4. Energy and waste

**Most wasted energy goes into equipment that is on but not working.**

### An empty furnace should not heat up without a confirmed charge

**A furnace at temperature with no charge is spending energy before the work is ready.**

**On the floor.** Furnace 1 is approaching or holding temperature, but the next charge is not confirmed ready. Material, inspection or production staging may still be unresolved.

**Why it happens.** Stamped reads the furnace controller's temperature and status, then compares them with the charge and batch plan. The furnace loses heat through its walls and door while no parts are being treated.

**The trade-off.** Delaying heat-up uses some schedule flexibility. Holding hot is the better call when the charge is genuinely next and a reheat would cost more time and energy. The heat-treatment supervisor needs production's confirmation.

**What Stamped sends.** “Furnace 1 is hot with no confirmed charge. Delay the next heat-up until the compatible charge is ready; production confirm by 3 pm.” to the heat-treatment supervisor.

**Who decides.** The supervisor and production decide whether to delay or hold.

**How we know it worked.** Minutes hot before a confirmed charge fall without creating a missed committed run.

**Never touched.** Stamped never sets back a charged furnace and never changes a recipe or soak.

### When the schedule says nothing is running, the meter should agree

**A planned stop should not look like a working hour at the plant incomer.**

**On the floor.** On Sunday at 3 am, all CNC machines are stopped and no furnace is charged, but the compressor feeder is still at 70% of a working hour's draw. The same check can find a chiller or tank-heater feeder drawing during a planned stop.

**Why it happens.** Stamped compares the plant incomer and major-equipment feeders with the production schedule and machine states. It names the feeder that is still drawing; maintenance finds the cause.

**The trade-off.** Some loads must stay on for safety, bath chemistry or another condition the plant lists. Switching off the rest requires a startup routine and can create a delayed start if done carelessly. Maintenance and the plant decide which loads are allowed to stay on.

**What Stamped sends.** “Sunday 3 am: machines off, but the compressor feeder is at 70% of a working hour's draw. Check for leaks and whether it can be switched off or unloaded during planned stops.” to maintenance and utilities.

**Who decides.** Maintenance and the plant owner decide which load may be switched off or unloaded.

**How we know it worked.** The next planned stop shows lower draw on that feeder, with allowed loads still available when production restarts.

**Never touched.** Stamped never switches anything off itself.

## 5. Dynamic scheduling

**The plan usually breaks between departments, not inside them.**

### When a machine breaks down, the rest of the shift needs a new plan in minutes, not a meeting

**A four-hour breakdown is a delivery problem immediately, not after the afternoon meeting.**

**On the floor.** At 10:05 am, VMC-07 goes into a breakdown alarm and maintenance expects about four hours. VMC-07 has three jobs left: Job A for a locked 6 pm truck, Job B due Friday and Job C due next week.

**Why it happens.** Stamped sees the breakdown from the machine's own control. It reads the schedule, due dates, material and the routing records that say which other machines and fixture families can run each job. It finds that VMC-09 can run Job A with the same fixture family and is only on a flexible job.

**The trade-off.** Moving Job A delays a flexible job and costs one setup on VMC-09. Not moving it risks missing the 6 pm truck. Job B can move to VMC-07's evening shift if repair finishes; Job C can stay for next week.

**What Stamped sends.** “VMC-07 down about 4 h. Proposed: Job A to VMC-09 now (same fixtures, 6 pm truck protected); VMC-09's flexible job to tomorrow; Job B to evening shift if repair completes. Accept or edit.” to the planner.

**Who decides.** The planner accepts or edits. The production supervisor confirms the setup. Nothing is written to the planning system, and no customer date changes, without the planner.

**How we know it worked.** Job A ships on the 6 pm truck and the moved job has a new date recorded.

**Never touched.** Stamped never commands VMC-07 or VMC-09 and never silently changes priority, promise dates or despatch sequence.

### Power trouble needs a pre-agreed keep-running list

**During a grid dip, the safest action is already agreed before the dip arrives.**

**On the floor.** Electrical reports a grid dip or genset limit while heat treatment and finishing are running. The plant needs to protect work that cannot be cut mid-process and delay work that can wait.

**Why it happens.** Stamped reads the meter's voltage or power signal with furnace, CNC and line states. A charged furnace in soak, a rack in hard-anodise, a loaded cure and a locked just-in-time job have different consequences from an empty furnace heat-up or an empty oven.

**The trade-off.** The plant may delay flexible CNC or empty-equipment starts to protect a live process. Electrical, heat treatment and finishing agree the two lists in advance; the owner makes the call at the event.

**What Stamped sends.** “Grid unstable. Furnace 2 is in soak: do not cut. Delay empty oven 1 and CNC cell 4 start by 20 minutes.” to the named production owner.

**Who decides.** The plant owner for the event decides with electrical, heat-treatment and finishing input.

**How we know it worked.** Protected live work is not interrupted and flexible starts are delayed with a recorded reason.

**Never touched.** Stamped never cuts power, changes a live process or commands a genset.

## 6. Yield

**The most expensive scrap is made at the end of the line.**

### Tool wear should be caught before forged value becomes scrap

**A rising spindle-load pattern is a setter's warning, not an automatic stop command.**

**On the floor.** Spindle load on a CNC cell is creeping up across parts on the same job. The parts already carry the cost and time of forging and heat treatment. A tool that continues to wear can push the next parts out of tolerance.

**Why it happens.** The FANUC control provides spindle load, and the job record provides the part count. Together they show a rising load across the same job before a final dimension necessarily fails. They do not decide whether the tool, fixture or material is the cause.

**The trade-off.** Changing a tool before failure uses tool life and setup time. Waiting may preserve the current tool but create value-added scrap. The setter chooses based on the job and the measurement evidence.

**What Stamped sends.** “Spindle load is rising across this job. Check the tool and first-off dimensions before the next parts are released.” to the setter.

**Who decides.** The setter decides whether to inspect, change the tool or continue.

**How we know it worked.** The next accepted parts stay within the job's dimensions and spindle load returns to its expected range for that part count.

**Never touched.** Stamped never stops the machine and never changes the CNC program or cycle time.

### Rejects at inspection should point back to where they started

**A final reject is useful only when it sends the plant back to the batch and process that made it.**

**On the floor.** Hardness or dimension rejects at final inspection are rising. Most of this week's hardness rejects trace to loads in Furnace 3 run on night shift, from the same zone. The parts are already through machining, so the plant is finding the problem late.

**Why it happens.** Stamped links inspection records to the batch or lot, then to the furnace load, CNC machine and shift. It uses the inspection records, batch and lot traceability, furnace controller logs and machine logs.

**The trade-off.** Investigating takes a heat-treatment engineer off other work. Not investigating means the same furnace keeps producing rejects that are found only after machining.

**What Stamped sends.** “Most hardness rejects this week trace to Furnace 3, night-shift loads. Check that furnace's zone temperatures and quench records before the next night load.” to the heat-treatment engineer and the inspection lead.

**Who decides.** Heat treatment and inspection decide whether to check the furnace, hold the next load or change the next production plan.

**How we know it worked.** Good parts per load from Furnace 3 recover on the next comparable night loads, and the review is recorded.

**Never touched.** Stamped never releases, holds or scraps parts itself and never changes the recipe.

## 7. Uptime

**Hundreds of short stops are not the problem. A few long ones are.**

### A long CNC stop deserves a named walk

**A machine that stops for 45 minutes may be reporting a staging problem, not a machine failure.**

**On the floor.** VMC-12 stopped for 45 minutes, for the third time this week on night shift. Stops under five minutes are normally process events; stops over 30 minutes usually have an upstream cause.

**Why it happens.** The FANUC control supplies the machine state and stop duration. The recorded stop reason can show material not issued, the tool unavailable, inspection pending or the next job not staged. The machine looks like the problem because its state is the first visible signal.

**The trade-off.** A walk uses the production supervisor's time. Leaving the stop unclassified preserves attention for running equipment but allows a repeat loss to continue.

**What Stamped sends.** “VMC-12 stopped 45 min, third time this week on night shift. Walk it: material, tool, job or inspection?” to the production supervisor.

**Who decides.** The supervisor identifies the cause and assigns stores, inspection, tool room or planning as needed.

**How we know it worked.** The reason is recorded and the next long stop has a named owner before the machine waits again.

**Never touched.** Stamped never resets the machine, changes a program or treats every short stop as a maintenance event.

### The top repeating alarm should be fixed before the longest list gets longer

**Rank repeated alarms by hours lost, then use the actual codes to choose the first fix.**

**On the floor.** A press or induction heater shows a repeating alarm across shifts. An emergency stop may also remain engaged for hours. Several events exist, but the plant does not yet know which one consumes the most usable hours.

**Why it happens.** Stamped reads alarm codes and emergency-stop state from the machine's own control, then ranks the events by duration and repeat frequency. A timestamp shows when an alarm appeared, not why it occurred.

**The trade-off.** Pulling alarm codes and ranking hours takes maintenance attention away from lower-impact work. Fixing the highest-hour repeater first means the smaller alarms wait their turn.

**What Stamped sends.** “Rank the press and induction-heater repeaters by hours in alarm. Pull the codes for the top one and assign the first investigation. CNC-15 has also remained in e-stop for 2 hours; review it safely.” to the maintenance head.

**Who decides.** Maintenance owns the safe inspection, diagnosis, priority and repair.

**How we know it worked.** The selected alarm's hours and repeat frequency fall after the recorded intervention, and the e-stop state is cleared through the plant's procedure.

**Never touched.** Stamped never resets anything, bypasses a lockout, guesses the root cause or issues a machine command. The furnace energy signal in section 3 is another example of a trend that needs inspection before failure.

## 8. Asking Stamped: five moments on the floor

### The shift supervisor asks what changed since morning

**Q: “What changed since the morning shift?”**

Two furnaces held hot for more than 50 minutes while waiting on inspection.  
VMC-12 has been in a long stop since 12:40 pm; the reason recorded is material not issued.  
Batch 12 was released early to keep the main CNC fed.  
Three open actions have named owners. These answers come from furnace controller status, FANUC machine states, ERP and production records since 6 am.

**What happens next:** The supervisor opens the three actions, confirms the owners at handover and escalates the unissued material.

### The planner asks what to move for a rush order

**Q: “Rush order of 800 housings for Thursday. What do I move?”**

Which part family is it, and which truck is locked?  
After that answer, Stamped proposes the next-shift sequence: the job that slides, the changeover avoided and the truck protected.  
The proposal uses the schedule, due dates, material issue and routing records for machines and fixtures.  
The planner edits one line and accepts it.

**What happens next:** The accepted line is shared with the two station owners; the planning system changes only through the planner's normal action.

### The maintenance lead asks why VMC-12 stops at night

**Q: “Why does VMC-12 keep stopping on night shift?”**

Most long stops begin within 30 minutes of shift start.  
They line up with material not issued from stores.  
The pattern points to staging, not a machine fault.  
This comes from FANUC machine states, recorded stop reasons and ERP material-issue records across the recent night shifts.

**What happens next:** Stamped suggests stores and the night supervisor as the owners of the next check; maintenance can still inspect if the machine evidence requires it.

### The heat-treatment engineer asks whether Furnace 3 is drifting

**Q: “Is Furnace 3 drifting?”**

Yes. Energy per kg is above its normal range for three weeks on comparable runs.  
The comparison uses Furnace 3's controller readings, same recipe and load range from its last 20 runs.  
Look first at the door seal, burner setting and air leaks or infiltration.  
The temperature profile and quality result remain a separate check.

**What happens next:** The engineer accepts or edits the inspection request and records the survey or maintenance result.

### The supervisor asks to cut soak for a truck

**Q: “Can we cut soak by 10 minutes to make the truck?”**

No. Soak is fixed by metallurgy, and Stamped will not recommend changing it.  
Release the next compatible basket now if the owner accepts it.  
Otherwise move a flexible CNC job or tell despatch now so the customer hears early.  
The answer uses the recipe record, furnace controller status, batch plan and schedule.

**What happens next:** The named production or metallurgy owner chooses one of the safe alternatives and records the decision.

## 9. What Stamped will never change

| Area | Stays with the plant |
|---|---|
| Soak, quench, ageing | Metallurgy |
| Anodise dwell, current density, bath; powder cure | Finishing and quality |
| Quality holds and release | Quality |
| Maintenance work and lockout | Maintenance |
| Promise dates, customer priority, despatch sequence | Planning and sales |
| Machine and furnace commands | Operators |

Stamped recommends; a named person decides; the plant's systems stay the systems of record.

## 10. The first 30 days on a line like this

**Week 1: connect what already exists.** Connect CNC machine states, alarms, e-stop state and spindle load from the controls; furnace and oven controller status; energy meters; the production schedule and ERP records; and quality records. Agree the owner for each decision. Stamped reads those records; it does not replace them.

**Week 2: go live with three decisions.** Start with long CNC stops, an empty furnace at temperature, and a breakdown re-plan. Each card has one owner, one bounded action and one check.

**Weeks 3–4: check every action against its own signal.** Review stop minutes, minutes hot before a confirmed charge and whether the breakdown re-plan protected the committed job. Record what was accepted, rejected and why. Those answers shape the next recommendation; a rejected card is not sent again unless the situation changes.

**What the plant provides:** Access to one line's data, a named owner per decision, and the list of jobs that are flexible or locked.

**What Stamped returns:** The decisions, the owner workflow and a record of whether each action worked.

The next step is to pick the first line and the first three decisions.
