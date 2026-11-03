# Process and Quality consistency QA

## Done in this pass

- Source alignment recorded in `SOURCE_ALIGNMENT.md`; FOUNDATION §1 / §4 / §7 and UI_CONTRACT updated for fonts, tags, body 14px, demo-label (crumb only) and metal-works plant story.
- Hub eyebrows via `processEyebrow` / `qualityEyebrow`.
- Detail list routes show hub tabs (`ProcessTabs` / `QualityTabs` wrap hub tabs). Action detail hub tabs land in a later commit.
- `/process/simulate` matched under Analytics · Simulations; layout e2e covers detail and simulate routes.
- Shortened PageHeader meta across Process and Quality.
- Shared utilities: `.type-small`, `.type-meta`, `.section-pad`, `.cell-stack`, `.row-actions`, `.link-strong`.
- Unit tests (`pnpm test:unit`) pass; `pnpm lint` (tsc + copy check) pass after copy-rule fixes.

## Intentional exceptions

- Full-width plant diagram (`/process/line`) and dense single-table setup screens stay without a context column.
- No Illustrative tags and no “Example data” banners on client-facing pages. The crumb is the marker. Causes / cause-gap / ROI use short factual subheads only.
- L6 `PRODUCT.md` / `DESIGN.md` remain out of scope for this demo (different product).
- Body stays 14px for the dense console.

## Manual follow-up

- Spot-check proposals, lots detail, health maps, and SPC at 1280 / 1440 / mobile.
- Confirm dark theme and compact density still read cleanly with Geist titles and ops-style tags.
- Run Playwright e2e when a local server is available (`pnpm preview` then `pnpm test:e2e`).
- After the metal-works data commits: walk the forge → heat-treatment → foundry path from `docs/PERSONA_WALKTHROUGH.md`.
