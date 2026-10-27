# Notes

## Current status (Oct 26 2026, deployed)
- **Tools live:**
  - Time duration calculator (homepage, Calculate button)
  - Work hours / timesheet, overtime, decimal hours, sleep (hours slept + cycle planner)
  - Time zone converter, stock market hours, countdown tool, daily quiz with leaderboard (KV)
- **Countdown pages:** 22 event pages under `/countdown/` (holidays, launches, eclipses, clock changes, retirement), a holidays board, and embeddable widgets at `/embed/countdown/…`. 14 guides under `/articles/`
- **Design:** station design with line colours, split-flap answer boards, a classic-view toggle and dark mode
- **Recent features:**
  - Calculation feedback: re-flip, "Updated", scroll to the answer, phone answer bar, change glow (#135)
  - "Install ClockMath" offer plus a service worker for offline pages (#134)
- **Docs:** CLAUDE.md, NOTES.md and an up-to-date README (Oct 26)
- **Tests and checks:** `npm test` passes (lib unit tests plus worker tests); `npm run lint` (ESLint CLI with `eslint.config.mjs`; covers `scripts/worker/`, not the other scripts) is clean. CI runs both plus a build on every PR

## In progress
- No open PRs or uncommitted work
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
- [ ] M1. `@cloudflare/next-on-pages` is deprecated and `inject-api.js` regex-patches its minified worker (**own branch**: hand-written `_worker.js`)
- [x] M2. Feedback is stored in KV for 90 days and never emailed, so it can expire unread
- [x] M3. Quiz leaderboard: the once-a-day check is a cookie and the rate limit is per isolate. Add a KV marker per hashed IP per day (plus a Cloudflare rate-limit rule, set up in the dashboard)
- [ ] M4. Sitemap: 28 URLs, every tool page included, have lastmod `2025-01-15`
- [ ] M5. Untested logic inside big components (TimesheetTool 1160 lines, app/page.tsx 704); no tests for holidays, countdowns, markets (**own branch**)
- [x] M6. `RollingNumber` names a plain span with `aria-label`; screen readers may not read gross pay, overtime or quiz score
- [x] L1. Geist Sans is preloaded on every page but the station design uses Archivo
- [x] L2. Worker live counts round up (`Math.ceil`) while the page counts calendar days; fixed-date targets use the build machine's local midnight
- [x] L3. `parseAmount("1.234,50")` gave 1.2345 (now 1234.5); a lone "1.850" keeps the US reading, 1.85
- [ ] L4. Dead code and duplication: `convertDateBetweenZones` is a no-op, `pointer: coarse` repeated instead of `lib/device.ts`, `navigator.clipboard` used directly instead of `copyText`
- [ ] L5. `sw.js` page cache has no size limit
- [ ] L6. Homepage, noon to noon across the fall-back night: "1 day" next to 25.00 decimal hours, unexplained
- [ ] L7. No Node version pinned (`engines`, `.nvmrc`); `wrangler.toml` is gitignored (**own branch** to commit it)
- [ ] L8. Next 15.5 → 16, React 19.3, lucide, react-day-picker 10 (**own branch**, after M1)

## Next up
- Work through the Oct 26 review list above

## Known issues
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
