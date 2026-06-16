import type { MetadataRoute } from 'next';

// Required for output: 'export' (static manifest), same as app/sitemap.ts.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClockMath — Time & Timesheet Calculators',
    short_name: 'ClockMath',
    description:
      'Free time duration, timezone, countdown, and work-hours/timesheet calculators.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
