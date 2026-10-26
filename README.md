# ClockMath

![ClockMath](https://clockmath.com/og-v4.png)

Free time calculators: durations, work hours and pay, time zones, sleep, countdowns and a daily clock-math quiz. No signup.

**Live site:** [clockmath.com](https://clockmath.com)

## What's on the site

### Tools

| Tool | Route | What it does |
|---|---|---|
| Time Duration Calculator | `/` | The time between two dates and times (overnight included), with decimal hours, total minutes, other units and a saved history. Press Calculate for the answer. |
| Work Hours Calculator | `/tools/timesheet` | Add up shifts with breaks and overnight handling: total hours, decimal hours, gross pay, optional weekly overtime. Saves drafts and named timesheets; share, copy or CSV. |
| Overtime Calculator | `/tools/overtime` | Splits a week into regular and overtime hours at 1.5× or 2×, with pay. |
| Minutes to Decimal Converter | `/tools/decimal-hours` | Hours and minutes to decimal hours and back, with a printable 1–60 minute chart. |
| Sleep Calculator | `/tools/sleep` | Hours slept, plus bedtimes or wake-up times that fit 90-minute sleep cycles. |
| Time Zone Converter | `/tools/timezone` | A time in one place converted to another, with place search, daylight-saving handling and clock-change notes. |
| Stock Market Hours | `/tools/market-hours` | Open/closed status and countdowns for 10 exchanges in your time zone, with holiday closures for NYSE, NASDAQ and LSE. |
| Countdown Timer | `/tools/countdown` | A live countdown to any date and time, with share links, saved countdowns and embed code. |
| Daily Time Quiz | `/tools/quiz` | Five clock-math questions a day, the same for everyone, with a leaderboard and streaks. |

All tools are listed at `/tools`. A single 12h/24h setting applies across the site.

### Countdown pages

Landing pages under `/countdown/`, built on a shared `EventPage` with a live split-flap board, facts, FAQ and structured data:

- **Holidays:** Thanksgiving, Black Friday, Christmas, New Year, Valentine's Day, Easter, Lunar New Year, Hanukkah, Halloween, the 4th of July, Canada Day and the weekend, plus an all-holidays board at `/countdown/holidays`
- **Launches and events:** GTA 6, Avengers: Doomsday, Super Bowl LXI and the LA 2028 Olympics
- **Eclipses and clocks:** the 2027 and 2028 solar eclipses, the January 2028 annular eclipse, and "When do the clocks change?" (`/countdown/daylight-saving-time`)
- **Your own date:** retirement, where the visitor picks the date (saved on their device)

Recurring dates roll to their next occurrence on their own. Every countdown also has an embeddable widget at `/embed/countdown/<slug>/`, and custom countdowns at `/embed/countdown/?to=…`. The widgets are noindex.

### Guides

14 how-to guides under `/articles/`: work hours, overtime, overnight shifts, weekly timesheets, time between dates, freelancer and study time, and time zones for meetings, family calls, travel, gaming events and stock markets.

### Design

The "station" design: ink type, split-flap answer tiles and a colour for each part of the site, like lines on a metro map. There's a dark mode, and a "Classic view" toggle that restores the earlier look.

### App and offline

The site can be installed as an app (web manifest and icons). A service worker (`public/sw.js`) keeps pages you've opened available offline. Regular users are offered "Install ClockMath".

### Privacy and analytics

- **Google Analytics 4 with Consent Mode v2.** In the EEA, the UK and Switzerland, nothing loads until the visitor accepts the cookie banner. Tools send a shared `tool_used` event plus their own events.
- **Microsoft Clarity**, under the same consent rules.
- **Core Web Vitals** are reported to GA4.
- **What you type stays in your browser.** Local storage keys start with `clockmath-`. Share links carry their own data in the address.

## Tech stack

- **Framework:** Next.js 15.5 (App Router) and React 19, static export (`output: 'export'`, built to `out/`)
- **Language:** TypeScript, strict; type and lint errors fail the build
- **Styling:** Tailwind CSS v4, plus the station CSS in `components/station/`
- **Libraries:** date-fns, react-day-picker, lucide-react, tz-lookup, Radix (toast only)
- **Hosting:** Cloudflare Pages via `@cloudflare/next-on-pages`, with a worker for the API, headers and redirects, and KV for the quiz leaderboard and feedback

## Getting started

Prerequisites: Node.js (recent: the tests run `.ts` files directly with `node --test`; developed on Node 23) and npm.

```bash
git clone https://github.com/clockmath/clockmath.git
cd clockmath
npm install
npm run dev
```

The site runs at `http://localhost:3000`. Analytics never loads on localhost.

## Environment variables

Build time, in `.env.local` (all optional):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID. Without it, analytics doesn't start. |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity project ID. Without it, Clarity doesn't load. |
| `NEXT_PUBLIC_GA_DEBUG` | `true` sends GA4 events to DebugView (for preview deploys). |
| `NEXT_PUBLIC_CLARITY_DEBUG` | `true` lets Clarity load on localhost, for testing. |
| `NEXT_PUBLIC_DISABLE_ANALYTICS` | `true` turns analytics off. |
| `NEXT_PUBLIC_BUILD_DATE` | Overrides the build day (`YYYY-MM-DD`) to preview date-switched pages, such as the GTA 6 launch version. |

Worker, set in the Cloudflare Pages dashboard (never committed):

| Variable | Purpose |
|---|---|
| `GEOAPIFY_API_KEY` | Place search in the time zone tool (`/api/places`; `GEOAPIFY_KEY` also works). Without it, search falls back to a built-in city list. |
| `EMAIL_SEND_TOKEN`, `CF_ACCOUNT_ID` | Email feedback-form messages to the site inbox. Needs clockmath.com onboarded to Cloudflare Email Sending and an API token with Email Sending permission. Without them, messages are only saved to KV (failures are logged). |

## Project structure

```
app/                  routes: / (duration calculator), tools/*, countdown/*, articles/*,
                      embed/countdown/*, privacy, terms, contact, sitemap, robots, manifest
components/           one component per tool or widget (TimesheetTool, EventPage, …)
  station/            the site design: StationChrome, StationBoard, Flap, StationFold,
                      AnswerBar, InstallPrompt, and the station CSS
  ui/                 time and date pickers, toast, calendar
  embed/ location/    countdown widgets; place search for the time zone tool
hooks/                use-clock-format, use-answer-feedback, use-dark-mode, …
lib/                  calculations and data: time, overtime, countdowns, holidays,
                      markets, quiz, colour, lines, seo, gtag, …
scripts/
  worker/             Cloudflare worker code, each with a test: api.js (headers, CSP,
                      /api/places, /api/geo, /api/quiz, /api/feedback, redirects),
                      live-counts.js, stale-assets.js
  inject-api.js       puts the worker code into the built _worker.js
  brand/generate.mjs  renders the icons and share cards
  stale-check.mjs     flags dates that have run out (runs before each deploy)
  indexnow.js         tells Bing about changed pages after a deploy
tests/                unit tests for lib/
public/               share cards (og/), icons, sw.js
```

## Scripts

```bash
npm run dev            # dev server on http://localhost:3000
npm run build          # static export to out/
npm test               # lib unit tests + worker tests
npm run lint           # ESLint
npm run spacing:audit  # report spacing values outside the scale
npm run preview        # Cloudflare Pages build, served locally by wrangler
npm run deploy         # stale-date check, Pages build, deploy, IndexNow ping
```

## Deployment

Deploys are manual: `npm run deploy` from `main`. It runs `@cloudflare/next-on-pages` (output in `.vercel/output/static`), then `scripts/inject-api.js` adds the API, security headers, redirects, live countdown numbers and cache policy to the generated worker. Then `wrangler pages deploy` publishes it, and `scripts/indexnow.js` pings Bing with the pages that changed.

Cloudflare runs the generated `_worker.js` in "Advanced Mode", which ignores `functions/`, `public/_headers` and `public/_redirects`. Headers, the CSP, API routes and redirects all live in `scripts/worker/api.js`.

A plain `npm run build` produces a static site in `out/` that any static host can serve, without the API routes, headers or redirects.

## License

MIT, see [LICENSE](LICENSE).
