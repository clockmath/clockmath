import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026: added next to /calendar/2027/ (same page, lib/yearCalendar.ts),
// for planning ahead. Under 65 characters, the same pattern as 2027's title.
// Uses the holidays list's share card.
export const metadata = generateSEOMetadata({
  title: '2028 Calendar with Federal Holidays (Printable) | ClockMath',
  description:
    'The 2028 calendar with every US federal holiday and day off marked. A leap year; New Year’s Day is observed on Dec 31, 2027. 250 working days. Printable.',
  path: '/calendar/2028',
  ogImage: '/og/countdown/holidays.png?v=3',
  keywords:
    '2028 calendar, 2028 calendar with holidays, calendar 2028, printable 2028 calendar, 2028 calendar printable, federal holidays 2028, 2028 federal holidays, us holidays 2028, 2028 holidays, working days 2028, 2028 calendar with federal holidays',
});

export default function Calendar2028Layout({ children }: { children: ReactNode }) {
  return children;
}
