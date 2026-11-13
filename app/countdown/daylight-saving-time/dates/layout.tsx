import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026: a reference table to cite and print. Bing: "daylight savings
// 2027" 9.4K impressions a quarter, "daylight savings time 2027" 2.1K, "dst
// 2027" 1.3K, "2027 daylight savings dates" 915. The countdown page above it
// keeps "when do the clocks change"; this one is the years ahead. Title
// under 65 characters (Bing flags longer). Uses the clock-change share card.
export const metadata = generateSEOMetadata({
  title: 'Daylight Saving Time Dates 2026–2035 by Country | ClockMath',
  description:
    'When daylight saving time starts and ends each year, 2026 to 2035: the US, Canada, UK, Europe, Israel, Egypt, Australia, New Zealand and Chile. Printable.',
  path: '/countdown/daylight-saving-time/dates',
  ogImage: '/og/countdown/daylight-saving-time.png?v=3',
  keywords:
    'daylight saving time dates, daylight savings 2027, dst 2027, daylight saving time 2027, when is daylight savings 2027, 2027 daylight savings dates, time change 2027, daylight saving time 2028, dst dates by country, clocks go forward 2027, clocks go back 2027, daylight saving time chart',
});

export default function DstDatesLayout({ children }: { children: ReactNode }) {
  return children;
}
