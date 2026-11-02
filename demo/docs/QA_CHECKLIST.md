# Process and Quality consistency QA

## Done in this pass

- Source alignment recorded in `SOURCE_ALIGNMENT.md`; FOUNDATION §6 updated.
- UI/UX/copy contract in `UI_CONTRACT.md`.
- Hub eyebrows via `processEyebrow` / `qualityEyebrow`.
- Detail routes show hub tabs (`ProcessTabs` / `QualityTabs` wrap hub tabs).
- `/process/simulate` matched under Analytics · Simulations.
- `Illustrative` renders a visible tag.
- Shortened PageHeader meta across Process and Quality.
- Shared utilities: `.type-small`, `.type-meta`, `.section-pad`, `.cell-stack`, `.row-actions`, `.link-strong`.
- Unit tests (`pnpm test:unit`) pass; `pnpm lint` (tsc + copy check) pass after copy-rule fixes.

## Intentional exceptions

- Full-width plant diagram (`/process/line`) and dense single-table setup screens stay without a context column.
- Causes / cause-gap / ROI keep an **Example data** tag (template or economics sample, not plant live data).
- L6 `PRODUCT.md` / `DESIGN.md` remain out of scope for this demo (different product).

## Manual follow-up

- Spot-check proposals, lots detail, health maps, and SPC at 1280 / 1440 / mobile.
- Confirm dark theme and compact density still read cleanly with Illustrative tags in headers.
- Run Playwright e2e when a local server is available (`pnpm preview` then `pnpm test:e2e`).
