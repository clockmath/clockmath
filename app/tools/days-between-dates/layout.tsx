import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the page itself is
// a client component. Nov 2026: Bing's AI Performance report had Copilot
// citing other sites for "days between dates" (10K–50K citations), "calculate
// days" and "count days" (5K–10K each) while ClockMath had no such tool. The
// title stays under 65 characters, which Bing flags past.
export const metadata = generateSEOMetadata({
  title: 'Days Between Dates Calculator: Days, Weeks, Months | ClockMath',
  description:
    'How many days between two dates? Count the days, weeks, months and business days from one date to another, with or without the end date. Free, no signup.',
  path: '/tools/days-between-dates',
  ogImage: '/og/tool/days-between-dates.png?v=1',
  keywords:
    'days between dates, days between two dates, how many days between dates, calculate days, count days, days calculator, date counter, date calculator, time between dates, days count, business days between dates, weeks between dates, months between dates',
});

export default function DaysBetweenDatesLayout({ children }: { children: ReactNode }) {
  return children;
}
