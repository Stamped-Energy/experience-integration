# Showcase walkthrough (metal works)

Presenter script for the fictional auto-component metal works in `demo/`. Run a production build locally (`pnpm build` · `pnpm start` on `http://127.0.0.1:3010`) or use showcase.stamped.work after merge.

Use **`?as=<role>`** once on any URL to set View as and drop the param (cookie: `stamped-role`). Roles: `operator`, `shift-lead`, `process-engineer`, `quality-head`, `plant-head`, `owner`, `stamped-engineer`, `viewer`. Pair with **`?view=plant|shift|line|owner|overview`** on Home when you need a specific tab.

## Demo limits (say these early)

- One demonstration plant serves every account story. Lines are Forge (`line-a`), Heat treatment (`line-c`), Foundry (`line-d`), Machining (`line-e`), and a small Moulding line (`line-b`).
- **Fabricators** with welding, stress relief or dedicated fab cells still have **no own line** in this dataset; say that plainly if the visitor expects it.
- Actions (Accept, Adjust, Sign, Stop, holds) **show outcomes on screen but do not persist**; nothing is written to a real plant.
- Ask answers from saved threads and four suggested chips; anything else abstains and names the missing input.
- Rupee value appears only on the owner Home. Verified (proof rungs R3 and R4) and Indicative stay **separate** and are never added.
- The breadcrumb **Demonstration plant** is the only page-level demo marker. Figures use Measured, Estimated or Modelled vocabulary, not client names or deck proof numbers (see `docs/UI_CONTRACT.md`).

## Main path (~8 minutes)

Default role unless noted: **Plant head** (`/?as=plant-head`).

| Step | Start link | What to show |
|------|------------|--------------|
| 1 | [`/?as=plant-head&view=plant`](http://127.0.0.1:3010/?as=plant-head&view=plant) | **Plant today**: line strip across forge, heat treatment and foundry (mode, waiting proposals, outcome sparkline). **Needs a decision** and Inbox queue span forge proposals, HT soak signature, foundry pour temperature, moulding hold pressure. Point at decisions that sit on different lines, not one hero KPI. |
| 2 | [`/quality/actions/ex-q1`](http://127.0.0.1:3010/quality/actions/ex-q1) | **Quality · Hold the next basket while quench oil rises basket to basket** on heat treatment. Chart of oil temperature by basket, **Hold the next basket** vs sample vs continue. Open **load 5119** (`/process/runs/run-c-5119`) from the linked load control. Name that Stamped asks; the hold is set in the plant quality system. |
| 3 | [`/process/actions/ex-p1`](http://127.0.0.1:3010/process/actions/ex-p1) then [`/process/trials/trial-1`](http://127.0.0.1:3010/process/trials/trial-1) | **Process · Trial a lower billet exit target when heater H1 runs hot** (forge hot spell). On the trial page: **Limits** band for billet exit temperature, **switchback schedule** with A/B arms and run outcomes, **Stop** restores 1215 °C from the next shift run. For **Sign trial**, switch to Plant head and open [`/process/trials/trial-4`](http://127.0.0.1:3010/process/trials/trial-4) or Inbox [`/inbox/in-17`](http://127.0.0.1:3010/inbox/in-17) (soak time on furnace F1, awaiting signature). Machining **twin-first** feed trials live on [`/process/actions/ex-p5`](http://127.0.0.1:3010/process/actions/ex-p5) if you need a twin story in the same visit. |
| 4 | [`/process/trials/trial-2?evidence=proof-2`](http://127.0.0.1:3010/process/trials/trial-2?evidence=proof-2) | **Evidence sheet** for a **closed** change: hold pressure on Moulding. Four questions, **verdict Improved**, **rung R3**, effect interval on scrap (low, point, high). Closed warm-idle on forge is also documented on [`/process/actions/ex-p2`](http://127.0.0.1:3010/process/actions/ex-p2) with proof [`/process?evidence=proof-5`](http://127.0.0.1:3010/process?evidence=proof-5). |
| 5 | Stay on [`/quality/actions/ex-q1`](http://127.0.0.1:3010/quality/actions/ex-q1) | **View as Operator**, then **Viewer**, on the same card. Operator can choose Hold; Viewer sees the card but actions name who can decide. |
| 6 | [`/?as=owner&view=owner`](http://127.0.0.1:3010/?as=owner&view=owner) | **Owner Home**: Verified and Indicative **side by side** (paired bars, no total). Open a value row to its proof record. |
| 7 | [`/plant/assets/a-heater`](http://127.0.0.1:3010/plant/assets/a-heater) | **Ask** (panel or bar): *Why are cold billets rising after stops?* Answer is Estimated with band, evidence ids, and a link to [`/process/actions/ex-p2`](http://127.0.0.1:3010/process/actions/ex-p2). |

Authority line on Agent at work pages: *Stamped works inside limits set beforehand. Nothing is written until a named role accepts.*

## Per-account start points

Same plant, different door. Use `?as=plant-head&view=plant` unless the visitor is an owner (use `owner` view).

| Visitor plant type | Start here | Story on this line |
|--------------------|------------|--------------------|
| Forge / press shop | [`/process/lines/line-a`](http://127.0.0.1:3010/process/lines/line-a) or [`/process/actions/ex-p1`](http://127.0.0.1:3010/process/actions/ex-p1) | Induction heater H1, screw press P1, overheating scrap and press-stop behaviour. |
| Foundry | [`/inbox/in-16`](http://127.0.0.1:3010/inbox/in-16) or [`/quality/actions/ex-q3`](http://127.0.0.1:3010/quality/actions/ex-q3) | **Pour temperature** on melt furnace M1 and heat 8836 mould holds. |
| Cable / component (moulding + machining) | [`/process/lines/line-b`](http://127.0.0.1:3010/process/lines/line-b) then [`/process/lines/line-e`](http://127.0.0.1:3010/process/lines/line-e) | Moulding hold pressure and cycle proof, then machining feed trial on the twin. |
| Fabricator (welding, stress relief) | [`/?view=plant`](http://127.0.0.1:3010/?view=plant) | **Limit:** no dedicated welding or stress-relief line yet; use forge + HT for analogous decisions or say the next dataset pass will add a fab cell. |

Shorter plant-visitor path (quality-heavy): `docs/DEMO_SCRIPT_CLIENT.md`.

---

## Appendix: Persona QA history

Minimal-context walks against the local production build. Shared brief: *You work at this plant. This screen is Stamped. Find what needs you today and act on it. Think aloud. Do not read docs or URLs.* Cap: 15 clicks.

### After layout and role fixes (current build)

Persona e2e: plant head, process engineer and quality head happy paths pass (`e2e/personas.spec.ts`). Presenter link `/?as=quality-head&view=plant` sets the cookie and keeps `view=plant`.

| Role | Land | Success criterion |
|------|------|-------------------|
| Plant head | Plant today | Full decision card with Limits and Accept enabled |
| Process engineer | Plant today | Reach Line B running settings and Accept on hold pressure |
| Quality head | Plant today with lots at risk | Open investigation for lot 3307 |

### Printable one-pagers (for real plant people)

**Shared brief.** You work at this plant. This screen is Stamped. Find what needs you today and act on it. Think aloud. Do not read docs or URLs. Stop after 15 clicks or when you succeed.

**Plant head.** Decide on the one proposal that needs you most, or say who should decide it. Success: you read the band and Stop effect, and either Accept is allowed or the card names who can decide.

**Process engineer.** Line B hold-pressure proposal: adjust inside the band or explain why not, then find Line B running settings. Success: reach the card and settings without an Engineering-only dead end.

**Quality head.** Find the most at-risk lot and open its investigation. Success: reach the lot on Quality, open the investigation, and say why that lot is at risk.
