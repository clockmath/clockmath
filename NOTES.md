# Notes

## Current status (Oct 29 2026, deployed)
- **Tools live:**
  - Time duration calculator (homepage, Calculate button)
  - Work hours / timesheet, overtime, decimal hours, sleep (hours slept + cycle planner)
  - Time zone converter, stock market hours, countdown tool, daily quiz with leaderboard (KV)
- **Countdown pages:** 22 event pages under `/countdown/` (holidays, launches, eclipses, clock changes, retirement), a holidays board, and embeddable widgets at `/embed/countdown/…`. 14 guides under `/articles/`
- **Design:** station design with line colours, split-flap answer boards, a classic-view toggle and dark mode
- **Recent features:**
  - Days between dates calculator (#156, merged and deployed Nov 12): `/tools/days-between-dates/`, on the Time line, under All tools (no tab of its own, Mark's call). Total days on tiles, plus weeks and days, months and days, years/months/days and business days (Mon–Fri); "Include the end date" option, From today / To today, swap, Copy result / Copy link (`?from=yyyy-mm-dd&to=…&inclusive=1`). Maths in `lib/dateDiff.ts` (calendar days, month ends kept: Jan 31 → Feb 28 is a month) with tests; `?from=` added to `urlHasVisitorData` so Clarity stays off on shared links (GA already strips it). Linked from the tools hub, `articlesCatalog` (and the time-between-dates guide's related tools), the guide's text and the homepage explainers. New share card `og/tool/days-between-dates.png?v=1`. Aimed at Copilot queries ClockMath had no page for ("days between dates" 10K–50K citations, "calculate days", "count days", "date counter"…)
  - Hand-written Pages worker (#147, Oct 29): `next build` + `scripts/build-worker.js` → `out/`; `@cloudflare/next-on-pages` removed. Plus `wrangler.toml` tracked (#145) and duration/timesheet maths in `lib/` with 46 tests (#149)
  - Oct 26 review fixes (#144, merged and deployed Oct 26; list below): build day in Eastern time, deploy runs tests and lint, CI on PRs, quiz limit per IP, live counts in calendar days, converter answers as you pick, pinned "All tools" on phones, sitemap dates from git, and more
  - Calculation feedback: re-flip, "Updated", scroll to the answer, phone answer bar, change glow (#135)
  - "Install ClockMath" offer plus a service worker for offline pages (#134)
- **Docs:** CLAUDE.md, NOTES.md and an up-to-date README (Oct 26)
- **Tests and checks:** `npm test` passes (lib unit tests plus worker tests); `npm run lint` (ESLint CLI with `eslint.config.mjs`; covers `scripts/worker/`, not the other scripts) is clean. CI runs both plus a build on every PR

## In progress
- **Copilot gap pages (Nov 12 2026, one PR each; Mark confirmed the order and URLs):** pages for questions where Bing Copilot cites other sites
  1. Decimal charts on `/tools/decimal-hours/` (#155): decimal → minutes chart (every hundredth), payroll rounding chart (tenths and quarter hours / 7-minute rule), reverse quick answers ("0.8 hours in minutes"), 5 more FAQs, one print button per chart. Maths moved to `lib/decimalTime.ts` with tests. Title shortened to 64 characters (was 69). Also fixes Classic view on phones, where the minutes chart showed one figure per line
  2. **Date calculator** at `/tools/date-calculator/` (`feature/date-calculator`): add or subtract years, months, weeks and days, or business days (optionally skipping US federal holidays on their observed dates). Month ends clamp (Jan 31 + 1 month = Feb 28), years and months go before weeks and days, the start day isn't counted. Maths in `lib/dateAdd.ts` with tests; time line; hub tile, catalog entry, "All tools" tab, share card `og/tool/date-calculator.png?v=1`
     - Rebased on #156 (days between dates): the calendar basics come from `lib/dateDiff.ts`, the two tools link to each other, and the time-between-dates guide lists both
     - Possible follow-up: "N days from today" answers in the static HTML, kept current by the worker like the countdowns (the page's quick answers use fixed dates so they don't go stale)
  3. Next: `/tools/todays-date/` (date, day of year, ISO week, Julian date), then full 2026/2027 lists on `/countdown/holidays/`
- **Deployed Oct 29:** #145, #147, #149, #150 (after #144 Oct 26 and #148 Oct 27). Live checks with curl: 19 routes and APIs (pages, 308 slash, 404 page, `/countdown/` and legacy 301s, www → apex, RSC `.txt`, `/api/geo`, `/api/quiz`), all security headers, CSP nonce on all 37 scripts, "counting today", embed `frame-ancestors *`, immutable `/_next/static`, all 32 referenced assets 200, no 2025-01-15 sitemap dates. Headers match the previous deployment (including Pages' own `access-control-allow-origin: *`)
- **Deployed Oct 29, later:** #151 and #152 (Next 16.4, React 19.3, lucide 1.64, react-day-picker 10). Live checks: pages, 308/301/404, Next 16's navigation `.txt` files, `/api/geo` and `/api/quiz`, all security headers, all 19 scripts nonced, "counting today", all 31 referenced assets 200 and immutable
- **Deployed Nov 12:** #156 (days between dates). IndexNow submitted the new page with the deploy. Live checks with curl: page, hub, homepage, guide, share card and sitemap 200 (lastmod 2026-11-12), the slashless URL 308s, title and FAQ schema in the HTML, tiles in the static HTML, all 20 scripts nonced, all 19 page assets 200
- **No open PRs** (apart from this notes update)
- **Next for the new page:** check it in Bing Webmaster (URL Inspection) and watch its AI Performance citations for the date queries over the following weeks. Later ideas from the same gap list: a date add/subtract calculator, a "today's date" page, a decimal-minutes chart
- **Wrangler login is per machine:** `npm run deploy` needs `npx wrangler login` as the Cloudflare user that owns `clockmath` (`npx wrangler pages project list` shows it). A Spoventa login replaces it: the Oct 29 deploy failed with "Pages project clockmath does not exist" until the login was switched back
- **Next:** the Oct 26 review list is done. Open follow-ups are under Known issues (React Compiler hook warnings, Node 23 locally) plus Mark's Cloudflare rate-limit rule and feedback email setup
- **Dated work, waiting:**
  - **Nov 1:** deploy so the Halloween title rolls over to next year. Seasonal titles are computed at build time (`seasonalSEO` in `lib/holidays.ts`)
  - **On or after Nov 19:** deploy so `/countdown/gta-6/` switches to its launch version (`LAUNCHED` in `app/countdown/gta-6/launch.ts` reads the build day)
  - **When the NFL announces it:** add the Super Bowl LXI kickoff time; the page says it isn't announced yet
- **Nov 3:** check whether the Oct 17–25 title and design changes moved Bing, Google and Copilot numbers (Thanksgiving, sleep, decimal hours)

## Oct 26 review: findings
A first-time-user walk-through (dev server, desktop, 375px, dark) and a senior-developer code review. Fixed on `fix/oct-26-review`, one commit per item, unless marked as its own branch.

**First-time user**
- [x] U1. Countdown board says "59 full days" while the sentence below says "60 days"
- [x] U2. Time zone converter keeps the old answer after a new city is picked ("Press Calculate"); it should update by itself
- [x] U3. `/countdown/` is a 404; header "Countdowns" goes to `/tools/countdown/`, footer "Countdowns" to `/countdown/holidays/`
- [x] U4. Quiz shows the UTC day ("Tue, Oct 27" on Monday evening in the Americas)
- [x] U5. Phones: "Quiz" and "All tools" are off-screen in the sideways-scrolling tab bar, with no sign it scrolls
- [x] U6. Phones: "Classic view" is an unlabelled icon
- [x] U7. Mixed capitalisation ("From Location", "Calculate Time Difference" vs "Shifts", "Summary")
- [x] U8. Tools hub: two tools had no preview tiles (the faint look was only the flip-in animation)

**Senior developer**
- [x] H1. Build day is the UTC date but read as local: an evening deploy in the Americas ships tomorrow's pages (GTA 6 "launched" a day early). Use one named zone everywhere at build time
- [x] H2. `npm run deploy` runs no tests or lint; `scripts/worker` is never linted; no CI on PRs
- [x] H3. Date switches still need a manual deploy: the stale check should list upcoming ones (Halloween title, GTA 6 launch) so they're hard to miss
- [x] M1. `@cloudflare/next-on-pages` is deprecated and `inject-api.js` regex-patches its minified worker → hand-written `_worker.js` (#147, stacked on #145)
- [x] M2. Feedback is stored in KV for 90 days and never emailed, so it can expire unread
- [x] M3. Quiz leaderboard: the once-a-day check is a cookie and the rate limit is per isolate. Add a KV marker per hashed IP per day (plus a Cloudflare rate-limit rule, set up in the dashboard)
- [x] M4. Sitemap: 28 URLs, every tool page included, have lastmod `2025-01-15`
- [x] M5. Untested logic inside big components (TimesheetTool 1160 lines, app/page.tsx 704); no tests for holidays, countdowns, markets (#149; #146 was closed by GitHub)
- [x] M6. `RollingNumber` names a plain span with `aria-label`; screen readers may not read gross pay, overtime or quiz score
- [x] L1. Geist Sans is preloaded on every page but the station design uses Archivo
- [x] L2. Worker live counts round up (`Math.ceil`) while the page counts calendar days; fixed-date targets use the build machine's local midnight
- [x] L3. `parseAmount("1.234,50")` gave 1.2345 (now 1234.5); a lone "1.850" keeps the US reading, 1.85
- [x] L4. Dead code and duplication: `convertDateBetweenZones` is a no-op, `pointer: coarse` repeated instead of `lib/device.ts`, `navigator.clipboard` used directly instead of `copyText`
- [x] L5. `sw.js`: page cache had no cap, and the static cache evicted the oldest-stored files (the shared framework chunks) first; both now drop the least recently used
- [x] L6. Homepage, noon to noon across the fall-back night: "1 day" next to 25.00 decimal hours, unexplained
- [x] L7. No Node version pinned (done with H2: `.nvmrc` 24, `engines` >=22.18); `wrangler.toml` was gitignored (#145)
- [x] L8. Next 15.5 → 16, React 19.3, lucide, react-day-picker 10 (#152, deployed Oct 29)

**Found while fixing**
- [x] Q1. The daily quiz differed by JS engine (`sort(() => rand() - 0.5)` in `lib/quiz.ts`): `workerd` built a different quiz from Chrome's, so `/api/quiz` scored right answers wrong (#148, merged and deployed Oct 27 01:08 UTC; quiz scores are right from then on, earlier boards keep their scores)
- [x] L8 details (#152): Next 16.4 (Turbopack), React 19.3, eslint-config-next 16 (flat config), lucide-react 1.64, react-day-picker 10. No more `distDir: 'out'`: Next 16's dev server wrote 87 MB into `out/dev`, the folder that gets uploaded; build and dev files are now in `.next/`, `out/` is the export only, and a build no longer breaks a running dev server

## Next up
- Work through the Oct 26 review list above

## Known issues
- **`npm run deploy` lint fails while Claude worktrees exist (Nov 12):** in the main checkout, `eslint .` also walks `.claude/worktrees/*`, including their `.next/` and `out/` build output (3,365 errors, none in the real code); the ignores only cover the root's `.next/` and `out/`. The Nov 12 deploy ran the same steps by hand with `npx eslint . --ignore-pattern '.claude/**'`. Fix in #159 (adds `.claude/` to the ignores in `eslint.config.mjs`); until it's merged, deploy with that `--ignore-pattern`
- **React Compiler hook rules (since the Next 16 upgrade):** 49 lint warnings (48, plus the days-between-dates tool's read-the-link-on-mount effect), set to warn on purpose (`eslint.config.mjs`). 36 are `set-state-in-effect`, the read-browser-state-after-mount pattern used for hydration in 24 files (`useSyncExternalStore` would replace most); the rest are refs read in event callbacks, a `Date.now()` fallback before mount, and one dependency list. No behaviour problem; worth its own pass
- **Node 23 locally:** an ESLint dependency (`eslint-visitor-keys` 5) supports Node ^22.13 or >=24, so `npm install` warns on 23.10 (end of life). `.nvmrc` and CI use 24; switching local Node to 24 clears it
- **Dev font warning:** Turbopack repeats "Failed to find font override values for font `Big Shoulders`" on every dev compile. Known and harmless (`adjustFontFallback: false` in `components/station/fonts.ts`)
- **Quiz leaderboard limits (M3):** the worker now allows 3 submissions per hashed IP a day, but KV is eventually consistent, so a fast burst can still get a few extra through. For a hard limit, add a Cloudflare rate-limiting rule in the dashboard (Security > WAF > Rate limiting rules) on POST `/api/quiz`, and the same shape on `/api/feedback` and `/api/places`
- **Thanksgiving title:** 75 characters ("…2026? Live Countdown to Nov 26 | ClockMath"); Bing URL Inspection flags it "Title too long". Left as is until the Nov 3 check
- **Bing drop since about Oct 17:** search impressions roughly halved and Copilot citations fell about 75%, mostly Thanksgiving, the old sleep article (now a 301 to `/tools/sleep/`) and decimal hours. Cause not confirmed
- **CSP nonce, GA and Clarity:** since Oct 26 the CSP uses a per-page nonce instead of `'unsafe-inline'`. Checked on a local Pages preview with GA consent denied, so gtag.js and Clarity weren't loaded there (they're external scripts from allowed hosts and shouldn't need the nonce). Confirm in GA Realtime / Clarity that data still arrives
- **Feedback email:** feedback is saved to KV (90 days) but not yet emailed; it has never sent. Until it does, `npm run feedback` reads it, and every deploy prints how many are waiting (Oct 26: 1 message, deleted in 28 days). The code is ready, and since Oct 26 it logs why a copy wasn't sent. `CF_ACCOUNT_ID` is set; still to do, in the Cloudflare dashboard:
  1. Email Service > Email Sending > Onboard Domain > clockmath.com (adds the `cf-bounce` records; none exist yet)
  2. Create an API token with Email Sending permission, then `npx wrangler pages secret put EMAIL_SEND_TOKEN --project-name clockmath`
  3. Deploy, send a test from "Feedback or feature request" in the site footer, and check hello@clockmath.com
- **Proton mail DNS:** the root SPF record only includes Cloudflare (`include:_spf.mx.cloudflare.net`) and there are no `protonmail._domainkey` records, while DMARC is `p=quarantine`. Mail sent from hello@clockmath.com through Proton may fail SPF/DKIM and land in spam. Proton's domain settings list the records to add
- **Install offer:** Chrome's install dialog on the live domain hasn't been seen working yet; the service worker is live
- **Phone time wheel:** phones use the native time wheel, which follows the phone's 12h/24h setting, not the site's (a deliberate choice)
