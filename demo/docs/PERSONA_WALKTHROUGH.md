# Persona walkthroughs

Minimal-context walks against the local production build (`pnpm build` · `pnpm start` on `127.0.0.1:3010`). Shared brief: *You work at this plant. This screen is Stamped. Find what needs you today and act on it. Think aloud. Do not read docs or URLs.* Cap: 15 clicks. Wrong turns count as at least P1.

## Baseline (before Home layout fixes)

### Plant head

| | |
|---|---|
| Role set | Plant head (default) |
| Start | `/` |
| Goal | Decide on the proposal that needs you most, or say who should |
| First impression | "This page is a plant dashboard: Overview, value, and a decision card." |
| Click path | Land Overview → scroll to Next decision → Accept 760 bar (Undo appears) |
| Clicks to goal | 1 (Accept on Home) |
| Success | Yes for Accept. Band and Expected result were **not** on the card (`variant="compact"`). Stop effect was visible. |

**Stuck log**

| Sev | Issue | Expected | Found |
|---|---|---|---|
| P1 | Compact DecisionCard on Overview | Limits band and expected result next to Accept | Only reason, evidence ids, If stopped, state strip |
| P1 | Lands on Overview, not Plant | Role home `plant` | `/?` → Overview for every role |
| P2 | Three stories compete (Working on, Next decision, Waiting, My day, value KPIs) | One primary act | Equal visual weight |

### Process engineer

| | |
|---|---|
| Role set | Process engineer via switcher |
| Start | `/` then Line B |
| Goal | Hold-pressure proposal on Line B; find Line B settings |
| First impression | "Same Overview as Plant head; switcher does not change the page." |
| Click path | Switch to Process engineer → still Overview → open `/process/lines/line-b` (sidebar Lines click from Home did not navigate in this run) → see Running settings and full DecisionCard |
| Clicks to goal | 3+ (role switch wasted; direct URL to Line B) |
| Success | Partial. Line B settings found. Home still used plant-head RBAC via `demoRole()`. |

**Stuck log**

| Sev | Issue | Expected | Found |
|---|---|---|---|
| P0 | Home ignores role switcher | Process engineer view and grants | `demoRole()` always `plant-head`; header has no role tag on Overview |
| P1 | Default view is Overview | Land on Plant (`roles[].home`) | Overview collage |
| P1 | Compact card on Home | Full band for Adjust in band | Compact; full card only on Line B |
| P2 | Sidebar Lines from Home did not change URL in this session | `/process` or lines list | Stayed on `/` |

### Quality head

| | |
|---|---|
| Role set | Quality head via switcher |
| Start | `/` |
| Goal | Most at-risk lot and its investigation |
| First impression | "Home is about process decisions, not lots." |
| Click path | Land Overview (no Lots at risk) → Quality group collapsed in rail → click Working on Investigating (no navigation) → open `/quality` → lot 3307 At risk → Open the investigation |
| Clicks to goal | 4+ with a dead Working-on click |
| Success | Yes once on `/quality`. Hard to discover from Home. |

**Stuck log**

| Sev | Issue | Expected | Found |
|---|---|---|---|
| P0 | Home ignores role switcher | Quality-shaped Home | Same Overview; plant-head grants on cards |
| P1 | No lots on default Home | Plant view with Lots at risk | Overview only; Quality rail collapsed |
| P1 | Working on → Investigating did not navigate | `/quality/investigations` | Click focused the link; URL stayed `/` |
| P2 | Investigation href is list, not case | Open inv for lot 3307 | `/quality/investigations` |

### Ranked fixes for this pass

1. **P0** Live `useRole()` on Home; DecisionCard and grants follow the switcher.
2. **P0/P1** Default `/?` to `roles[].home` when `?view` is absent.
3. **P1** Full DecisionCard on Home; Overview = card + queue (max 5) + My day only.
4. **P1** Plant side feed = Lots at risk only; Shift so far link under queue.
5. **P1** Working-on Investigating → `/quality/investigations/inv-1`.

## After results

Re-run on the rebuilt build. Persona e2e: 3/3 passed.

### Plant head

| | Before | After |
|---|---|---|
| Land | Overview | Plant today (`roles[].home`) |
| Card | Compact (no band) | Full: Expected result + Limits + Accept enabled |
| Clicks to goal | 1 | 1 |
| Success | Partial | Yes |

### Process engineer

| | Before | After |
|---|---|---|
| Land | Overview (as plant-head grants) | Plant today · Process engineer view |
| Role on Home | Ignored | Live `useRole()` |
| Line B | Direct URL after wrong turn | `/process/lines/line-b` · Running settings + Accept |
| Clicks to goal | 3+ | 2 (Home → Line B) |
| Success | Partial | Yes |

### Quality head

| | Before | After |
|---|---|---|
| Land | Overview, no lots | Plant today with Lots at risk |
| Quality rail | Collapsed | Opens Quality on Home |
| Accept on process card | Looked allowed (wrong role) | Disabled; names who can decide |
| Investigation path | `/quality` hunt | Lots on Home → Quality → Open the investigation |
| Clicks to goal | 4+ with dead end | 2–3 |
| Success | Painful | Yes |

### Remaining P2

- Sidebar “Lines” soft-nav from Home was flaky once in baseline automation; direct `/process/lines/line-b` is fine.
- Working-on strip removed from Overview (composition). Investigation deep link fixed if Working on appears on other views: `/quality/investigations/inv-1`.
- My day desk rows render as time · title · kind (verified in a11y tree).

## Printable one-pagers (for real plant people)

### Shared brief

You work at this plant. This screen is Stamped. Find what needs you today and act on it. Think aloud. Do not read docs or URLs. Stop after 15 clicks or when you succeed.

### Plant head

**Goal.** Decide on the one proposal that needs you most, or say who should decide it.

**Success.** You open the card, read the band and the Stop effect, and either Accept is allowed or the card names who can decide.

### Process engineer

**Goal.** The Line B hold-pressure proposal: adjust it inside the band or explain why not, then find Line B’s current settings.

**Success.** You reach the card and Line B’s running settings without an Engineering-only dead end.

### Quality head

**Goal.** Find which lot is most at risk and open its investigation (or start one).

**Success.** You reach the lot on Quality, open the investigation or correction, and can say why that lot is at risk.
