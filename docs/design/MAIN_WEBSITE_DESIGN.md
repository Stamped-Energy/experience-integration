---
name: Stamped Energy
description: AI-powered energy intelligence for industrial plants. rupee-scored prescriptions. Verified with evidence.
colors:
  primary: "#F75440"
  on-primary: "#ffffff"
  primary-fixed: "#ffdad4"
  inverse-primary: "#ffb4a8"
  secondary: "#000a07"
  on-secondary: "#ffffff"
  secondary-container: "#bdd9c8"
  tertiary: "#00666b"
  on-tertiary: "#ffffff"
  surface: "#f7faf5"
  surface-low: "#f1f4f0"
  surface-container: "#ecefea"
  surface-high: "#e6e9e4"
  surface-highest: "#e0e3df"
  surface-dim: "#d8dbd6"
  on-surface: "#191c1a"
  on-surface-variant: "#5a403c"
  outline: "#8f706b"
  outline-variant: "#e3beb8"
  inverse-surface: "#252926"
  inverse-on-surface: "#e9ece7"
  error: "#ba1a1a"
  background: "#f7faf5"
  cream: "#fbfcf9"
motion:
  cream: "#fbfcf9"
  coral: "#F75440"
  coral-soft: "#ffdad4"
  lime: "#e8f07a"
  lime-ink: "#2f3218"
  acid: "#eef981"
  acid-ink: "#2f3218"
  forest: "#4a634d"
  forest-ink: "#fbfcf9"
  ember: "#e35f3f"
  ember-ink: "#fbfcf9"
  wine: "#761438"
  wine-ink: "#fbfcf9"
  wine-deep: "#4b1728"
  wine-deep-ink: "#e5ded1"
  cream-warm: "#eeeae3"
  cream-warm-ink: "#4a634d"
  cream-paper: "#f1ede3"
  cream-paper-ink: "#3f5143"
  ink-dark: "#182a27"
  ink-dark-on: "#f2eee5"
  halo: "color-mix(in srgb, #F75440 22%, transparent)"
typography:
  display:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.025em"
    lineHeight: 1.15
    weightsLoaded: "400 500 600 700"
  headline:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    letterSpacing: "-0.025em"
    lineHeight: 1.2
  title:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
    weightsLoaded: "400 500 600 700"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.68rem"
    fontWeight: 500
    letterSpacing: "0.12em"
    lineHeight: 1.4
    weightsLoaded: "400 500 600 700"
  nav:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    letterSpacing: "0.04em"
    lineHeight: 1.2
rounded:
  sm: "2px"
  md: "6px"
  lg: "8px"
spacing:
  section-y-sm: "4rem"
  section-y-md: "5.5rem"
  section-y-lg: "7.5rem"
  container-inline-sm: "1.25rem"
  container-inline-lg: "2.5rem"
  stack-tight: "0.75rem"
  stack-md: "1.5rem"
  stack-lg: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  section-badge:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 0.625rem"
    typography: "{typography.label}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.nav}"
  nav-dropdown-trigger-open:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    typography: "{typography.nav}"
  industry-tile:
    backgroundColor: "{colors.surface-low}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
---

# Design System: Stamped Energy

> **Copy of the marketing-site design system** (source: Main_Website `DESIGN.md`, synced 2026-08-25).
> This is **not** the L6 product UI guide. Product chrome stays in repo-root `DESIGN.md` (Plus Jakarta Sans / Public Sans / Forge). Use this file when L6 work needs to match [stamped.work](https://stamped.work) type, coral/obsidian chrome, or MotionSlot scene colors.

Last synced from shipped code: **2026-08-25**.

**Sources of truth**

| Layer | File | What it owns |
|-------|------|----------------|
| Site chrome colors | `styles/theme.css` | All page/UI tokens (`--brand-*`) |
| Font loading | `app/layout.tsx` | Space Grotesk, Inter, IBM Plex Mono via `next/font/google` |
| CSS font aliases | `app/globals.css` | `--font-display`, `--font-sans`, `--font-mono` |
| Motion scene colors | `components/motion-slots/*.css` + `components/sections/hero/HeroPlantFlow.css` | Full-bleed animation fills. **Not** in `theme.css`. |
| Video / OpenMontage | `docs/openmontage-brand/DESIGN_VIDEO.md` | Timed video; inherits this stack |

## 1. Overview

**Creative North Star: "Plant-office decision layer"**

Stamped Energy’s marketing surface should feel like a bright plant office at mid-morning: a director scanning cost and next actions, not a SaaS landing page performing “innovation.” The system is industrial, rupee-clear, and sparse. Color commits (coral on near-black green against demo-deck beige). Type is grotesk display + clean body + mono labels. Structure favors one job per section, real plant photography where imagery matters, and progressive motion (GSAP pin/scrub, Reveal, looping SVG chromes) rather than decorative noise.

Runtime color source of truth remains `styles/theme.css` for **chrome**. MotionSlots use a separate **scene-mode** palette (forest, acid, ember, wine, cream, lime) documented in §8. Homepage narrative (ADR-016 stack) is the reference composition: Hero → Problem (dark) → What is → How it works (pin) → Impact → Solutions → Industries photo strip → Resources → Closing CTA.

**Rejects:** purple SaaS gradients, glassmorphism as default, hero-metric template strips, identical icon-card grids, thick colored side-stripes, cloning Infinite Uptime / Greenovative / CVector visuals (structure and motion grammar inspiration only), MES/plant-OS claims.

**Key Characteristics:**
- Committed coral accent; near-black green for contrast bands
- Space Grotesk headlines; Inter body; IBM Plex Mono for badges and motion labels only
- Flat tonal elevation; shadows reserved for primary CTA
- Uppercase Space Grotesk nav; coral pill on open dropdown triggers
- Generous `.section-y` air; body copy ≤75ch where possible
- Animation scene fills are chapter colors (forest / acid / ember / wine / lime / cream), not extra brand primaries

## 2. Colors

Committed coral on near-black green secondary, warm green-grey surfaces. Accent is frequent enough to carry identity, rare enough that it still means “action.”

Chrome tokens live in `styles/theme.css`. Do not introduce a second coral or a second near-black for buttons, nav, or section backgrounds.

### Primary
- **Forge Coral** (#F75440): CTAs, active nav pill, impact metrics, focus rings, accent rules (1px only), Problem-strip fills, live dots in light diagrams. On-primary text is white (#ffffff). Soft companions: inverse-primary (#ffb4a8) sparingly on dark bands; primary-fixed (#ffdad4) for tints and hero “negative” tags.

### Secondary
- **Obsidian Green** (#000a07): Full-bleed contrast sections (homepage Problem), footer gravity, secondary buttons. On-secondary is white. Secondary-container (#bdd9c8) is a soft companion, not a page fill.

### Tertiary
- **Process Teal** (#00666b): Optional supporting accent. Prefer primary for interactive chrome; do not invent a third competing brand color in nav or heroes.

### Neutral
- **Demo-deck Surface** (#f7faf5): Default page background (`surface` / `background`). Hero plant-flow canvas.
- **Surface Low** (#f1f4f0): Soft bands (Industries, HIW stage, What-is visual).
- **Surface ladder** (#ecefea → #e6e9e4 → #e0e3df → #d8dbd6): Subtle tonal steps, borders via outline-variant (#e3beb8).
- **On-surface** (#191c1a): Primary text, diagram wires, meter bars.
- **On-surface-variant** (#5a403c): Secondary text / mute.
- **Outline** (#8f706b) / **outline-variant** (#e3beb8): Hairline rules and card/slot borders.
- **Inverse surface** (#252926): Rare dark UI chrome when secondary is too absolute.
- **Motion cream** (#fbfcf9): Ink on coral/forest/ember/wine fills; icon-box fill in What-is; hero tag-positive ink. Not a page background.

### Named Rules
**The One Coral Rule.** Primary carries identity and action. Do not spray coral across large chrome fills; prefer text, borders, pills, and metrics. Large dark fills use secondary, not primary. Full coral drench is allowed only as a **motion scene mode** (Problem strips, Asset Health solutions chrome, short CTA beats).

**The Light Office Rule.** Default marketing canvas stays light (`#f7faf5`). Dark is a deliberate band (Problem, some footers), not a site-wide theme.

**The Scene-Mode Rule.** Forest, acid/lime, ember, wine, and cream fills belong to MotionSlots and solution HIW chromes. They are chapter backgrounds, not navbar / button / footer colors. Do not promote them into `theme.css` as brand primaries.

## 3. Typography

Loaded via `next/font/google` in `app/layout.tsx`; wired as `--font-display`, `--font-sans`, `--font-mono` in `app/globals.css`.

| Role | Family | CSS var | Weights loaded | Use |
|------|--------|---------|----------------|-----|
| Display / headlines / nav | **Space Grotesk** | `--font-space-grotesk` → `--font-display` | 400, 500, 600, 700 | H1–H4, wordmark, nav, KPI figures, SVG `.val` in motion |
| Body / UI | **Inter** | `--font-inter` → `--font-sans` | 400, 500, 600, 700 | Paragraphs, buttons, forms, SVG mute copy |
| Labels / chips | **IBM Plex Mono** | `--font-plex-mono` → `--font-mono` | 400, 500, 600, 700 | SectionBadge, MotionSlot captions, LIVE / step chips, SVG `.lbl` |

Fallbacks: `ui-sans-serif, system-ui, sans-serif` for display/body; `ui-monospace, monospace` for labels.

**Character:** Grotesk headlines feel industrial and direct; Inter keeps long copy readable in a plant-office scan; mono marks metadata without turning the whole chrome into a terminal costume.

SVG motion hardcodes `"Space Grotesk, sans-serif"`, `"Inter, sans-serif"`, and `"IBM Plex Mono, monospace"` (not CSS variables). Keep those family names in lockstep with `layout.tsx`.

### Hierarchy
- **Display / H1** (700, ~text-4xl–6xl, tracking -0.025em to -0.03em): Hero brand-forward headlines.
- **Headline / H2** (700, clamp ~1.875–3rem, tracking -0.025em): Section titles.
- **Title / H3** (600–700, ~1.25–1.875rem): Step titles, solution names, industry names.
- **Body** (400, 1rem, line-height 1.65, max ~65–75ch): Supporting paragraphs. Body default on `body` is Inter.
- **Label** (Plex Mono, ~0.68–0.75rem, uppercase, tracking ~0.12em): SectionBadge, MotionSlot captions. In SVG chromes: 7.5–11px, tracking 0.4–1.05px, opacity ~0.72 unless `.lbl-hi`.
- **Nav** (Space Grotesk, ~0.8rem, semibold, uppercase, tracking ~0.04em): Navbar links and dropdown items. CTA button label stays Inter/sans, often uppercase via utility.

`::selection` uses primary fill and on-primary text.

## 4. Elevation

**Philosophy: flat / tonal.** Depth comes from surface ladder steps, full-bleed secondary bands, and 1px borders (`outline-variant`), not stacked shadows or glass blur.

- Default sections: `bg-surface` or `bg-surface-low` with hairline dividers.
- Contrast band: `bg-secondary text-on-secondary` (homepage Problem).
- Media / slots: `rounded-md` + light border; no multi-layer drop shadows.
- **Exception:** Primary button may use a soft coral-tinted shadow and slight lift on hover. Do not generalize that shadow language to cards or nav panels.
- Dropdown panel: white/surface fill, thin border, minimal shadow-sm; 1px primary left rule only (structural, never a thick stripe).
- Hero plant-flow halo: `color-mix(in srgb, #F75440 22%, transparent)` — the only permitted coral glow, and only on that schematic.

## 5. Components

**Feel:** confident, sparse, uppercase chrome; mono reserved for badges.

### Button
- Height ~h-11 / sm:h-12; `rounded-md`; `text-sm font-semibold`.
- **Primary:** coral fill, white text, soft shadow, slight `-translate-y` on hover.
- **Outline:** transparent + 2px primary border; hover `bg-primary/8`.
- **Secondary:** secondary fill / on-secondary text.
- **Ghost:** transparent; hover `bg-surface-low`.
- Focus: `ring-2 ring-primary ring-offset-2 ring-offset-surface`.

### Section badge
- Triple short vertical ticks + mono uppercase label in a thin bordered pill (`rounded-sm`).
- Default: primary ticks, on-surface label. On dark bands: `alternate` uses on-secondary muted border/text.

### Navbar
- Fixed; transparent over light/dark heroes until scroll → solid surface blur.
- Wordmark: `font-display` bold.
- Links: uppercase Space Grotesk; hover to primary.
- Solutions / Industries: button triggers (not hub links); coral filled pill when open/hover; panel stays open ~300ms after pointer leave; only item rows navigate.
- Mobile: accordion for Solutions/Industries; same item links only.

### Nav dropdown panel
- Compact list, uppercase display titles, no descriptions, no “view all” footer in the panel.
- Hub routes (`/solutions`, `/industries`) remain for footer/SEO; not trigger destinations.

### Industry photo strip (home)
- Compact 2-col mobile / 5-col desktop linked tiles.
- `aspect-[4/3]` image, name in display semibold, one short focus line under (not long blurbs).
- Prefer crisp ≥1200px-wide assets; `object-cover` with quality-conscious `sizes`.

### How it works (home)
- Desktop: pin + scrub through Data → Analysis → Prescriptions → Decisions (client GSAP after MotionProvider `isReady`).
- Mobile / reduced motion: stacked steps, no pin.
- Sidebar step buttons jump to step progress on desktop.
- Stage art uses forest / acid / ember / wine scene fills (§8).

### MotionSlot
- Frame for homepage motion. Empty → mono “Animation soon” + label. Pass children to fill (A00–A10). Dark variant for secondary bands.

### Section rhythm
- `.section-y`: padding-block 4rem / 5.5rem (md) / 7.5rem (lg).
- Container: safe-area aware horizontal padding; max-width from Container component (page max 1440px).
- One composition per first viewport; brand-forward hero; no card grids in hero.

### Footer
- Columned: Solutions (explicit pillars), Industries (all live verticals named), Resources, Company.
- Display wordmark; secondary/surface treatment per current Footer.

## 6. Do's and Don'ts

### Do
- Change chrome colors only in `styles/theme.css`; map utilities through `app/globals.css`.
- Change motion scene fills in the slot CSS for that composition; keep the named scene palette in §8.
- Keep homepage section order unless IA is explicitly revised.
- Use real plant imagery for industries; MotionSlot only where animation is deferred.
- Lead with Verified with evidence / rupee-scored language where product truth allows.
- Prefer hairline borders and tonal bands over cards.
- Keep side accents at **1px** if used at all.
- Match SVG type to Space Grotesk / Inter / IBM Plex Mono.

### Don't
- Do not use gradient fills or gradient text on chrome (hero plant-flow may use a tiny surface fade at the stage edge to hide overflow — not a brand gradient).
- Do not use thick left/right accent stripes on cards or callouts.
- Do not ship purple-on-cream / glassmorphism / hero-metric SaaS strips.
- Do not put mono on the whole navbar (badges/slots only).
- Do not make Solutions/Industries triggers navigate to hub routes.
- Do not invent fleet metrics or bill-verified claims without evidence language.
- Do not nest cards or default every section to identical icon + title + text grids.
- Do not add bounce/elastic motion; ease-out exponentials only.
- Do not use Plus Jakarta Sans, Public Sans, or Helvetica Neue on this site (superseded by ADR-017).
- Do not treat forest / wine / acid / ember as button or nav colors.

## 7. Video and OpenMontage

Marketing **site** UI stays this document + `styles/theme.css`. Do not clone CVector site chrome.

For **product videos, launch teasers, explainers, and MotionSlot briefs**, use the portable pack:

**[`docs/openmontage-brand/`](docs/openmontage-brand/README.md)**

- Product/claims context (Master, ICP, voice firewall)
- `DESIGN_VIDEO.md` + `MOTION_LANGUAGE.md` (Impeccable brand register; C-Vector motion inspiration only)
- OpenMontage playbook `playbooks/stamped-industrial.yaml`

Copy the pack into an OpenMontage checkout; see pack README for read-order and install steps.

## 8. Motion and animation color

Motion grammar: `docs/openmontage-brand/MOTION_LANGUAGE.md`. This section is the **hex inventory of what the live site actually paints**.

**Physics (shipped):** ease-out quart (`1 - (1-t)^4`) in SVG loops; Problem A03 uses `cubic-bezier(0.16, 1, 0.3, 1)` (~0.42s). No bounce, elastic, or layout-property animation. `prefers-reduced-motion` → static stills, no pin, no cursor arrows.

**Type in motion:** Space Grotesk 700 for values / titles; Inter for mute body; IBM Plex Mono uppercase for chips, LIVE, evidence kickers. Ink is usually `currentColor` so it follows the scene fill’s on-color.

### 8.1 Scene-mode palette

These fills are **not** `theme.css` brand tokens. They are chapter backgrounds for looping chromes.

| Name | Fill | On / ink | Also used as | CSS class / notes |
|------|------|----------|----------------|-------------------|
| Cream | `#fbfcf9` | — | Ink on dark/coral scenes; icon boxes; hero positive-tag text | `--hpf-cream`; Problem strokes |
| Coral drench | `#F75440` / `#f75440` | `#fbfcf9` | Problem strips A01–A03; Asset Health home chrome (A10) | `.hp-strip`, `.sol-coral` |
| Coral soft | `#ffdad4` | `#5a403c` | Hero negative tags | `--hpf-coral-soft`, `--hpf-tag-neg` |
| Impact lime | `#e8f07a` | `#2f3218` | Load-energy home chrome (A09) | `.sol-lime` |
| Acid lime | `#eef981` | `#2f3218` (home HIW) or `#302821` (asset-health sage) | Home HIW Analysis; Load-energy ranked moves; Asset-health envelope | `.hiw-acid`, `.le-acid`, `.ah-sage` |
| Forest | `#4a634d` | `#fbfcf9` | Home HIW Data; Load-energy tariff/MD | `.hiw-forest`, `.le-forest` |
| Ember | `#e35f3f` | `#fbfcf9` | Home HIW Prescriptions (coral sibling, not identical to `#F75440`) | `.hiw-ember` |
| Wine | `#761438` | `#fbfcf9` | Home HIW Decisions; Load-energy plant control | `.hiw-wine`, `.le-wine` |
| Wine deep | `#4b1728` | `#e5ded1` | Asset-health decision feedback | `.ah-wine` |
| Cream warm | `#eeeae3` | `#4a634d` | Load-energy equipment model | `.le-cream` |
| Cream paper | `#f1ede3` | `#3f5143` | Asset-health constraints | `.ah-cream` |
| Ink dark | `#182a27` | `#f2eee5` | Asset-health root-cause | `.ah-dark` |
| Surface (hero / what-is) | `#f7faf5` / `#f1f4f0` | `#191c1a` | A00 plant-flow; A04 product visual | brand surface tokens |
| Packet / live | `#f75440` | — | What-is packets; LIVE dots on light scenes | `.packet` |

**Ink-on-hot:** When a control is “hot” (clicked / active), fill cream (`#fbfcf9`) and set the glyph/value to the scene fill (coral on Problem, wine `#761438` on HIW decisions, wine-deep `#4b1728` on asset-health). Cursor arrows: cream fill + wine/wine-deep stroke.

**Muted linework** on a scene uses `currentColor` at ~0.28–0.72 opacity (axes, unused chips, hatch). Active rows snap to opacity 1.

**Hero plant-flow (A00)** stays on brand chrome, not scene modes:

| Token | Hex | Role |
|-------|-----|------|
| `--hpf-bg` | `#f7faf5` | Stage |
| `--hpf-surface-low` | `#f1f4f0` | Panels |
| `--hpf-ink` / `--hpf-line` | `#191c1a` | Wires, plant stroke |
| `--hpf-mute` | `#5a403c` | Secondary labels |
| `--hpf-outline` | `#e3beb8` | Hairlines |
| `--hpf-coral` | `#f75440` | Active packets / emphasis |
| `--hpf-coral-soft` | `#ffdad4` | Soft tags |
| `--hpf-tag-pos` | `#191c1a` on `#fbfcf9` | Positive chip |
| `--hpf-halo` | coral 22% mix | Soft schematic glow only |

### 8.2 Slot → color map

| ID | Slot | Component | Fill | Ink |
|----|------|-----------|------|-----|
| A00 | Homepage hero | `HeroPlantFlow` | Surface `#f7faf5` | `#191c1a` + coral accent |
| A01–A03 | Problem strips | `ProblemStripVisuals` | Coral `#f75440` | Cream `#fbfcf9` (hot icon stroke coral) |
| A04 | What is Stamped | `WhatIsProductVisual` | Surface-low `#f1f4f0` | Ink `#191c1a`, mute `#5a403c`, packets coral, cards cream + `#e3beb8` |
| A05 | HIW Data | `DataStageVisual` | Forest `#4a634d` | Cream |
| A06 | HIW Analysis | `AnalysisStageVisual` | Acid `#eef981` | `#2f3218` |
| A07 | HIW Prescriptions | `PrescriptionsStageVisual` | Ember `#e35f3f` | Cream |
| A08 | HIW Decisions | `DecisionsStageVisual` | Wine `#761438` | Cream |
| A09 | Solutions · energy | `EnergyManagementVisual` | Lime `#e8f07a` | `#2f3218` |
| A10 | Solutions · assets | `AssetHealthVisual` | Coral `#F75440` | Cream; pill-ink coral |
| — | `/solutions/load-energy` HIW | `LoadEnergyHiwVisuals` | Cream-warm → forest → wine → acid | See table above |
| — | `/solutions/equipment-intelligence` HIW | `AssetHealthHiwVisuals` | Cream-paper → ink-dark → acid → wine-deep | See table above |

Do **not** clone CVector Flame Pea / Claret / Mindaro as **brand** primaries. The shipped forest / wine / acid / lime scene modes are Stamped-owned chapter colors with our hexes. Coral `#F75440` remains the only identity primary.

### 8.3 What stays grayscale / chrome

Navbar, footer, forms, buttons, section badges, and body copy never pick forest/wine/acid. They stay on the §2 token set. Impact **metrics** on the homepage are coral type on a light band, not a lime drench.
