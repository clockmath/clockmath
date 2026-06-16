# ClockMath

![ClockMath](https://clockmath.com/og.png)

Free online time, timezone, countdown, and timesheet calculators.

**Live Site**: [clockmath.com](https://clockmath.com)

## Features

### Tools

- **Time Duration Calculator** (home) — the exact duration between two dates/times, broken down calendar-accurately (years, months, days, hours, minutes, seconds) plus per-unit equivalences. Keeps a recent-calculations history.
- **Timezone Converter** (`/tools/timezone`) — convert times across global timezones with automatic location detection and daylight-saving support.
- **Countdown Timer** (`/tools/countdown`) — a live countdown to any date/time, with shareable links and saved countdowns.
- **Work Hours / Timesheet Calculator** (`/tools/timesheet`) — add up shifts (with breaks and overnight handling) to get total hours, decimal hours for payroll, and gross pay. Auto-saves your in-progress sheet; save/share multiple timesheets; export as text or CSV.

### Educational content

A library of in-depth guides (`/articles`) on practical time topics — work hours & overtime, sleep tracking, freelancer time tracking, remote-work scheduling, travel/timezones, and more.

### Privacy & analytics

- **Google Analytics 4** with **Consent Mode v2** — analytics/ad storage is denied by default in the EEA, UK, and Switzerland until the visitor opts in via the cookie banner; granted elsewhere. A "Manage cookie preferences" link reopens the banner.
- Core Web Vitals are reported to GA4.

### PWA

Installable (web manifest + app icons) with themed mobile browser chrome.

## Tech Stack

- **Framework**: Next.js 15 (App Router) / React 19, static export (`output: 'export'`)
- **Language**: TypeScript (type + ESLint checks enforced at build)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Date Handling**: date-fns
- **Analytics**: Google Analytics 4 + Consent Mode v2
- **Hosting**: Cloudflare Pages (via `@cloudflare/next-on-pages`) with Pages Functions for the API proxies

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/SpicyIntelChip/clockmath.git
cd clockmath
npm install
npm run dev
```

The site will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` for local development:

```env
# Exposed to the client at build time (analytics). Optional — without it,
# analytics simply doesn't initialize.
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Server-side only — used by the /api/places proxy, never exposed to the client.
GEOAPIFY_KEY=your_geoapify_api_key
```

- **`GEOAPIFY_KEY`** powers location search in the timezone tool via the server-side `/api/places` proxy. Get a free key at [geoapify.com](https://www.geoapify.com/) (3,000 requests/day). Without it, location search falls back to a small built-in city list. In production it's set in the Cloudflare Pages dashboard (or `wrangler.toml`), not committed.
- **`NEXT_PUBLIC_GA_ID`** is the GA4 measurement ID. Set `NEXT_PUBLIC_GA_DEBUG=true` on a preview deploy to route events to GA4 DebugView.

## Project Structure

```
├── app/
│   ├── page.tsx                # Home (Time Duration Calculator)
│   ├── layout.tsx              # Root layout, metadata, viewport/themeColor
│   ├── manifest.ts             # PWA manifest
│   ├── not-found.tsx           # Custom 404
│   ├── sitemap.ts / robots.ts  # Auto-generated from routes
│   ├── tools/
│   │   ├── timezone/           # Timezone Converter
│   │   ├── countdown/          # Countdown Timer
│   │   └── timesheet/          # Work Hours / Timesheet
│   ├── articles/               # Educational guides
│   ├── privacy/ · terms/ · contact/
│   └── icon.png · apple-icon.png   # App icons (generated)
├── components/
│   ├── ui/                     # Radix UI + inline date/time pickers
│   ├── Analytics.tsx           # GA4 + Consent Mode v2 init
│   ├── ConsentBanner.tsx       # EEA/UK/CH cookie banner
│   ├── WebVitals.tsx           # Core Web Vitals → GA4
│   ├── CountdownTool.tsx · TimesheetTool.tsx · TimezoneConverter.tsx
│   └── PageChrome.tsx · ToolsNavigation.tsx · SiteFooter.tsx
├── lib/
│   ├── time.ts                 # Timezone/duration utilities
│   ├── gtag.ts                 # Analytics helpers
│   ├── consent.ts              # Consent Mode v2 helpers + region list
│   ├── seo.ts                  # SEO metadata helpers
│   └── articlesCatalog.ts      # Article catalog
├── functions/api/              # Cloudflare Pages Functions (places, geo proxies)
├── scripts/
│   ├── inject-api.js           # Injects API handlers + security headers into the worker
│   └── gen-icons.js            # Regenerates app icons from logo.svg
└── public/
```

## Available Scripts

```bash
npm run dev          # Start the dev server (http://localhost:3000)
npm run build        # Next.js build / static export
npm run lint         # ESLint
npm run pages:build  # Build for Cloudflare Pages (@cloudflare/next-on-pages + inject API)
npm run preview      # Build + run the Pages build locally via wrangler
npm run deploy       # Build + deploy to Cloudflare Pages
```

## Deployment

Hosted on **Cloudflare Pages**. Deploys are **manual** (no Git auto-deploy):

```bash
npm run deploy
```

This runs `@cloudflare/next-on-pages` (output → `.vercel/output/static`, referenced by `wrangler.toml`), then `scripts/inject-api.js` injects the `/api/places` + `/api/geo` handlers and security headers (CSP, X-Frame-Options, etc.) into the generated worker, then `wrangler pages deploy` publishes it.

> Note: the API routes and security headers are injected into the worker because `@cloudflare/next-on-pages` emits a `_worker.js` (Advanced Mode), which causes Cloudflare to ignore the `functions/` directory and `_headers`. `scripts/inject-api.js` is the source of truth for both.

### Other platforms

A plain static export (`npm run build` → `out/`) can be hosted on Vercel, Netlify, GitHub Pages, etc. — but the `/api/places` and `/api/geo` proxies and the injected security headers are Cloudflare-specific.

## License

MIT License — see [LICENSE](LICENSE) for details.
