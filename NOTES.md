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
- **Tests and checks:** `npm test` passes (lib unit tests plus worker tests); `npm run lint` is clean

## In progress
- No open PRs or uncommitted work
- **Dated work, waiting:**
  - **Nov 1:** deploy so the Halloween title rolls over to next year. Seasonal titles are computed at build time (`seasonalSEO` in `lib/holidays.ts`)
  - **On or after Nov 19:** deploy so `/countdown/gta-6/` switches to its launch version (`LAUNCHED` in `app/countdown/gta-6/launch.ts` reads the build day)
  - **When the NFL announces it:** add the Super Bowl LXI kickoff time; the page says it isn't announced yet
- **Nov 3:** check whether the Oct 17–25 title and design changes moved Bing, Google and Copilot numbers (Thanksgiving, sleep, decimal hours)

## Next up
- _(for Mark to fill in)_

## Known issues
- **Thanksgiving title:** 75 characters ("…2026? Live Countdown to Nov 26 | ClockMath"); Bing URL Inspection flags it "Title too long". Left as is until the Nov 3 check
- **Bing drop since about Oct 17:** search impressions roughly halved and Copilot citations fell about 75%, mostly Thanksgiving, the old sleep article (now a 301 to `/tools/sleep/`) and decimal hours. Cause not confirmed
- **Leftovers:**
  - An empty, untracked `functions/` folder (only `.DS_Store`)
  - `public/_redirects` is kept only as a record; its comment points to `scripts/inject-api.js`, but the redirects now live in `scripts/worker/api.js`
  - `wrangler.toml` (git-ignored) has a comment naming `functions/api/quiz.js`
- **Legacy icon script:** `scripts/gen-icons.js` and `public/logo.svg` are the old emerald icon pipeline. The script needs `sharp`, which isn't a dependency; icons now come from `scripts/brand/generate.mjs`
- **Lint command:** `npm run lint` uses `next lint`, which Next marks as deprecated (it prints a migration notice)
- **Spacing audit:** `npm run spacing:audit` reports 19 values outside the spacing scale (report only)
- **CSP:** `script-src` and `style-src` allow `'unsafe-inline'`; no nonce yet
- **Feedback email:** feedback is saved to KV but not emailed. The email step needs `EMAIL_SEND_TOKEN` and `CF_ACCOUNT_ID` set in Cloudflare Pages
- **Install offer:** Chrome's install dialog on the live domain hasn't been seen working yet; the service worker is live
- **Phone time wheel:** phones use the native time wheel, which follows the phone's 12h/24h setting, not the site's (a deliberate choice)
