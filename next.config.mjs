import { fileURLToPath } from 'node:url';

// Oct 2026 review: the build day was the UTC date, read back as a local day
// (lib/buildDay.ts), so an evening deploy in the Americas shipped tomorrow's
// pages (GTA 6 "launched" a day early, seasonal titles rolled over early).
// One named zone makes it the same wherever the build runs. Eastern: most
// visitors are in the US.
const BUILD_ZONE = 'America/New_York';
const buildDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUILD_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This folder is the project root. Next 15.5 otherwise guesses from the
  // nearest lockfile and can pick a stray one in a parent directory.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  env: {
    // Make GA_ID available on client-side during build
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    // Build day (YYYY-MM-DD, in BUILD_ZONE) for pre-mount placeholder dates — see lib/buildDay.ts
    // (Overridable to preview date-switched pages, e.g. the GTA 6 launch version.)
    NEXT_PUBLIC_BUILD_DATE: process.env.NEXT_PUBLIC_BUILD_DATE || buildDate,
    // Note: GEOAPIFY_KEY is intentionally NOT exposed to client-side
    // It's only available server-side via /api/places proxy
  },
  // Note: For static export, redirects and canonical enforcement 
  // must be handled at the hosting level (Netlify, Cloudflare, etc.)
}

export default nextConfig
