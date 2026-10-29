# ClockMath

## What it is
clockmath.com: free time calculators (duration, work hours/timesheet, overtime, decimal hours, sleep, time zones, market hours, countdowns, a daily quiz), plus event countdown pages and how-to guides. Most search traffic comes from Bing, about five times Google's.

## Stack
- Next.js 15.5 (App Router) + React 19, TypeScript (strict), static export (`output: 'export'`, `trailingSlash`, built to `out/`)
- Tailwind CSS v4 (`@theme inline` in `app/globals.css`) plus hand-written "station" CSS in `components/station/*.css`
- date-fns 4, react-day-picker 9 (loaded on demand), lucide-react icons, tz-lookup, Radix only for Toast/Slot
- Cloudflare Pages: the static export in `out/` plus a hand-written Advanced Mode `_worker.js` (`scripts/build-worker.js`; no adapter since Oct 2026), Wrangler 4, KV `QUIZ_KV`
- Fonts via `next/font`: Archivo (body) and Big Shoulders (headings, figures)
- Node: tests run `.ts` files straight through `node --test` (type stripping), so a current Node is needed (`engines` >=22.18; `.nvmrc` and CI use 24; also tested on 23.10)

## Structure
- `app/`: one folder per route. `app/page.tsx` is the homepage (duration calculator); `app/tools/<tool>/`, `app/countdown/<event>/`, `app/articles/<slug>/`, `app/embed/countdown/` (noindex widgets), plus privacy, terms, contact, sitemap, robots, manifest
- `components/`: one PascalCase `.tsx` per tool or widget (`TimesheetTool.tsx`, `EventPage.tsx`, …)
  - `components/station/`: the site design. `StationChrome` (header, tabs, theme/classic toggles, install offer), `StationBoard` (countdown board), `Flap` (split-flap tiles), `StationFold`, `AnswerBar`, and all station CSS
  - `components/ui/`: `InlineTimePicker`, `InlineDatePicker`, toast, button, calendar, `SearchableSelect`
  - `components/embed/`, `components/location/`
- `hooks/`: `use-*.ts` (`use-clock-format`, `use-answer-feedback`, `use-dark-mode`, `use-toast`, `use-classic-view`)
- `lib/`: camelCase logic modules (`time.ts`, `overtime.ts`, `countdowns.ts`, `holidays.ts`, `markets.ts`, `quiz.ts`, `colour.ts`, `lines.ts`, `gtag.ts`, `seo.ts`, `wallClock.ts`, `safeStorage.ts`, `clipboard.ts`, …)
- `scripts/worker/`: Cloudflare worker code, each file with a `*.test.js` (`api.js`: security headers/CSP, `/api/*`, redirects; `live-counts.js`: live countdown numbers in HTML; `stale-assets.js`: reload guard). `scripts/build-worker.js` writes them into `out/_worker.js`, which serves everything else through `env.ASSETS`
- `scripts/brand/generate.mjs`: renders icons and every share card (`public/og/**`) with headless Chrome
- `tests/`: `node --test` unit tests for `lib/` (import with relative `../lib/x.ts` paths; `tests/alias.mjs` resolves the `@/` imports inside lib files)
- `public/`: static files, `sw.js` (service worker), share cards

## Conventions
- Pages are client components; route metadata lives in a sibling `layout.tsx` via `generateSEOMetadata` (`lib/seo.ts`). Tool pages: `StationChrome currentTool=…` → `.st-intro` (crumbs, `h1.st-h1`, `.st-lede`) → the tool → `StationFold` (explainers, FAQ) → `SiteFooter`
- Imports use the `@/` alias. Match each file's own quote and semicolon style (the homepage uses double quotes and no semicolons; components mostly single quotes with semicolons)
- Station CSS classes are `st-*`; colours are CSS variables (`--ink`, `--dial`, `--rule`, `--quiet`, `--enamel`, `--line`, `--line-ink`, …). Every new design rule is scoped `html:not(.classic)` so the "Classic view" toggle (`html.classic`) keeps the old look
- Line colours: each section has a colour (`lib/lines.ts` + `components/station/lines.css`, via `data-line`); answers sit on a board in that colour. Event pages use their own board colour (`data-hero`, `eventLineColours` in `lib/colour.ts`)
- Answers are shown on split-flap tiles (`Flap`, or `RollingNumber` inside `.st-result .st-figure`). Anything rendered as tiles before mount must match on server and client (countdowns use `buildDayCount`)
- Shared behaviour to reuse, not re-implement:
  - 12h/24h: `useClockFormat`
  - local storage: `storageGet`/`storageSet` with `clockmath-*` keys
  - copying: `copyText`
  - typed numbers ("8,25", "46:30"): `parseAmount`/`parseHours`
  - a wall-clock time in a zone: `zonedWallTime`
  - `?to=` values: `parseWallClock`
  - feedback after a calculation: `useCalculateFeedback`, `useSettledChange`, `AnswerBar`
- Analytics: `event`/`toolUsed` from `lib/gtag` (blocked on localhost). Consent Mode v2: no GA or Clarity before consent in the EEA/UK/CH
- Comments explain why, often dated ("Oct 2026 audit: …"). Keep that style
- The worker ignores `functions/` and `public/_headers`/`_redirects`: change headers, CSP, APIs and redirects in `scripts/worker/api.js` (and update its test). A new third-party script needs a CSP change there
- The CSP has no `'unsafe-inline'` for scripts: the worker gives a per-request nonce to every `<script>`/`<style>` in the served HTML. An inline script in the built page is fine; one inserted at runtime (`next/script` with inline content, `createElement('script')` with text) is blocked, so run that code from the bundle instead
- Share-card URLs carry `?v=N`: bump it everywhere after regenerating the cards. Revert pixel-noise changes to cards you didn't mean to touch

## Commands
- `npm run dev`: dev server on :3000 (`.claude/launch.json` name: `clockmath-dev`)
- `npm run build`: static export to `out/`. Stop the dev server first (a build breaks it), then `git checkout -- next-env.d.ts` (builds modify it)
- `npm test`: lib unit tests plus the worker tests
- `npm run lint` (includes `scripts/worker/`); `npm run spacing:audit` (report only)
- CI (`.github/workflows/checks.yml`): tests, lint and a static build on every PR and push to `main`
- `npm run preview`: Pages build served by wrangler, locally
- `npm run deploy`: tests and lint → stale-date check (and upcoming date switches) → feedback count → Pages build → `wrangler pages deploy` → IndexNow ping. Run from `main` only
- `npm run feedback`: read the feedback form's messages from KV (kept 90 days)
- `node scripts/brand/generate.mjs`: regenerate icons and share cards

## Workflow
- At the start of each session, read NOTES.md for current status
- One feature at a time, on its own branch (`fix/…`, `design/…`, `feature/…`, `seo/…`); never commit to `main`. Open a PR on `clockmath/clockmath` (`gh` needs `--repo clockmath/clockmath`)
- Merge (squash, delete branch) and deploy only when Mark says "merge and deploy"; then confirm the merge with `gh api repos/clockmath/clockmath/pulls/N --jq .merged`
- Ask before changing unrelated files. Don't add dependencies, rename or move files, or make big structural changes without asking
- Build and fix errors before calling something done (`npm test`, `npm run build`; check pages in the dev server at desktop and 375px)
- Test on the dev server, not the live site (live visits send GA events). Never sign in, enter credentials or post anywhere on Mark's behalf
- When a feature is finished, update NOTES.md (what changed, what's next, known issues) and commit it with the feature
