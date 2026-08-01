import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the timezone page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Timezone Converter | ClockMath',
  description:
    'Convert time between any two timezones instantly. Handles Daylight Saving Time automatically. Perfect for scheduling meetings, calls, or events across different time zones.',
  path: '/tools/timezone',
  keywords:
    'timezone converter, time zone converter, convert time zones, meeting timezone converter, time difference calculator, what time is it in',
});

export default function TimezoneLayout({ children }: { children: ReactNode }) {
  return children;
}
