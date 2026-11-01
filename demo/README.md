# Stamped product UI: the showcase plant app

This folder is the Stamped product as a working web app, running on a fictional demonstration plant with illustrative data. It needs no API, database or plant connection. It is deployed as showcase.stamped.work (Vercel project `demo-stamped`, root directory `demo`). The server-backed product lives in `packages/web` at the repo root and is not changed by this app.

The source of truth for what the product should be is stamped-external `design/product-ui/PRODUCT_UI_SPEC.md`. How the code is organised (tokens, components, data module, route conventions) is in [FOUNDATION.md](FOUNDATION.md); read it before building on this app.

## Run it

You need Node 22 (22.14 or later) and pnpm 11.

```bash
cd demo
pnpm install
pnpm dev        # http://localhost:3010
pnpm lint       # type check plus the copy-rule check (scripts/check-copy.mjs)
pnpm test       # dataset cross-links, RBAC and copy rules (tests/*.test.ts)
pnpm build      # production build
pnpm preview    # serve the build on port 3010 (same as start; run only after build)
pnpm start      # alias of preview
```

After changing UI code, run `pnpm build` again before `pnpm preview`. If static chunks 404 or return 500, restart preview so `/_next/static/*` matches the latest build.

Viewport screenshots for QA (server must be running on 3010):

```bash
node scripts/capture-pr59-screens.mjs
```

## What it shows

The left rail has the areas below in the same order for every role.

- **Home** has four views. Plant shows each line's mode, what needs a decision, what Stamped did this shift, lots at risk and proof updates. Shift shows the shift timeline, the handover and open items. My line now is the operator view: current settings inside the signed band, the next proposal with large controls, and Stop with its stated effect. Owner shows value at the plant's prices, with Verified (proof rungs R3 and R4) and Indicative shown side by side and never added, plus recent activity and plant-wide context. Every value figure opens its proof record.
- **Inbox** has Waiting for me, Tasks and Decided, plus a detail page for each card. Proposals, trial signatures, lot links, corrections from Quality and data gaps all use the same shared card.
- **Process** has lines, line and run detail, proposals with the model's predicted band and the signed limits, Adjust in band, trials and stops, measurement plans and the holding check, running settings and model fit. Proof is not a separate area: the evidence sheet with the four questions, verdict and rung opens on demand from runs, trials and lines.
- **Quality** has lots at risk, lot detail with link scores, drift with the alarm budget, investigations, link confirmations, specs and grades, and corrections sent to Process. There is no release button; release happens in the plant's own quality system.
- **Plant** has the plant map with sections and key readings, asset detail with tag readings, data health, the Plant Box and its offline lease, and line packs.
- **Ask** has conversations, saved answers (some marked stale when the data or model behind them changed) and handover and weekly notes. Ask can be opened from any screen as a side panel and starts from the asset or line on screen. It reads only and cannot change a setting.
- **Settings** has signed limits, standing approvals, people and roles (the RBAC matrix), routing and notifications, integrations with API keys and webhooks, and plant setup and prices.
- **Activity** has the audit log and reports and exports.
- **Planning** is a "Coming soon" page. **Maintenance** is hidden on purpose.

## Roles and View as

The "View as" switcher in the top bar changes the role the app is seen as: Operator, Shift lead, Process engineer, Quality head, Plant head, Owner, Stamped engineer or Viewer. The choice is kept in a cookie, so pages still render on the server. Each role opens Home on its own default view. In the showcase every area stays reachable in every role; what changes is which actions are allowed. Permissions come from the spec's role, action and scope matrix in `src/lib/rbac.ts`, and a disabled action always says which roles can do it. Operators can accept proposals. No role can release a hold, and Stamped staff can never sign limits.

## Data model and illustrative data rules

The data lives in `src/lib/demo/`: `types.ts` holds one type per plant object (site, areas, lines, assets, tags and readings, runs, setpoint writes, signed limits, standing approvals, proposals, trials, stops, measurement plans, holding checks, model fits, proof records, grades and specs, lots, lot links, drift, investigations, corrections, data sources and gaps, Plant Box and lease, people and roles, routing, integrations, Ask threads, saved answers, notes, audit events, reports and value items). `data.ts` builds a deterministic dataset from a fixed demo time (20 Oct 2026, 14:00 IST) with seeded generators, so every load looks the same.

The plant is fictional and generic: Line A is a batch mixing line and Line B a discrete moulding line. People are named by role, such as "Plant head A.". There are no client names and no real results. The rules the data follows:

- Rupee figures appear only on the owner's Home, always tagged Illustrative. Verified and Indicative are separate fields with no total.
- Confidence follows the method behind each item. Proposals and Ask answers show a word label and a band only, never a score. Lot links show their documented 0 to 1 link score. Proof verdicts show the verdict, rung and interval.
- No pricing of Stamped itself appears anywhere.
- Copy: no em dashes, British and Indian spelling, none of the banned pitch words listed in spec section 14, no WhatsApp. `pnpm lint` and `pnpm test` check part of this.

## Design system

The look follows the technical architecture site's operations design system. Geist is used for everything and Geist Mono for ids, tags and timers. Space Grotesk appears in one brand place only. All colours, spacing and type sizes are tokens in `src/styles/tokens.css`, which is the only place hex values live. Lines are 1px, there are no gradients or glows, and the coral accent appears at full strength only where a decision is needed. There is a dark theme and a compact density for panel PCs, both toggled from the bottom of the rail. The official Stamped logo (`public/stamped-logo.png`) is the rail mark, the favicon and the app icon.

## Known gaps and limits

- Actions such as Accept, Adjust, Decline, Stop, Sign and Confirm show their result on screen but do not persist and write nothing.
- Search in the top bar is a placeholder.
- Ask answers come from the saved and scoped demo threads, plus three suggested questions that answer live. Anything else abstains and says which input is missing.
- Exports and reports are illustrative.
- Vercel does not build preview deployments for the `demo-stamped` project, so a branch cannot be seen online before merge. Run it locally to review.
- Merging into main replaces the live showcase at showcase.stamped.work.
- dev.stamped.work is a separate Cloudflare copy. Deploy steps are below.
- Phone layouts work, but wide tables scroll sideways.

## Deploy dev.stamped.work

This publishes the `demo/` app as the Cloudflare Worker `stamped-dev` on https://dev.stamped.work. It does not update showcase.stamped.work. That host is the Vercel project `demo-stamped` and changes when `main` is merged.

Deploy a clean `origin/main`. Leave local uncommitted edits out of the publish.

From `experience-integration`:

```bash
git fetch origin
git checkout main
git pull
```

Credentials are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the repo-root `.env` (gitignored). Copy them from `stamped-external/site/.env` if they are missing. Names are listed in `.env.example`. Do not commit `.env`.

From `demo/`, load those two variables and publish. Node 22.14+ and pnpm 11. Run `pnpm install` in `demo/` first if `node_modules` is missing.

PowerShell:

```powershell
cd demo
Get-Content ..\.env | ForEach-Object {
  if ($_ -match '^(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)=(.*)$') {
    Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2].Trim().Trim('"')
  }
}
pnpm run deploy:vinext
```

bash:

```bash
cd demo
set -a
source <(grep -E '^(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)=' ../.env)
set +a
pnpm run deploy:vinext
```

`pnpm run deploy:vinext` is `vinext-cloudflare deploy`. It builds the Vite app and publishes the worker named in `cloudflare.config.ts`. The domain on that worker is `dev.stamped.work`.

## Next steps

- Review the app locally and agree the final copy before merging.
- Decide whether actions should persist for a session in the showcase.
- Port approved screens into `packages/web`, keeping the demo-only pieces (role switcher, illustrative band) out of the product.
- Update the website and positioning docs to the authority line "Stamped works inside limits set beforehand".

## Mascot

Ask has a mascot: the Stamped logo with two eyes. It lives in `src/components/mascot/StampedMascot.tsx` and is drawn by a pure engine in `src/lib/mascot/engine.ts`, built on a port of bloub's core (`src/lib/mascot/bloub/`, MIT, licence kept). States: arrival, idle (blinks and eye drift), listening (while you type), thinking (spokes turn slowly), answering (spokes open, gentle bob), success (eight coral particles along the spokes), warning (amber badge) and error (spokes close, colour dims). It holds still when the browser asks for reduced motion. The rail and banner logo are now vector (`StampedMark`), so dark mode no longer needs a white tile.
