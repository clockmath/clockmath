import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the timezone page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Time Zone Converter: Time Difference Between Cities | ClockMath',
  description:
    'Convert a time between any two time zones or cities, with daylight saving handled for the date you pick. For meetings, calls and travel.',
  path: '/tools/timezone',
  ogImage: '/og/tool/timezone.png?v=2',
  keywords:
    'time zone converter, timezone converter, time difference between cities, convert time zones, meeting timezone converter, time difference calculator, what time is it in',
});

export default function TimezoneLayout({ children }: { children: ReactNode }) {
  return children;
}
