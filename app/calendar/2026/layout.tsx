import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026: added next to /calendar/2027/ (same page, lib/yearCalendar.ts).
// The rest of 2026 and anyone looking back at it. Under 65 characters, the
// same pattern as 2027's title. Uses the holidays list's share card.
export const metadata = generateSEOMetadata({
  title: '2026 Calendar with Federal Holidays (Printable) | ClockMath',
  description:
    'The 2026 calendar with every US federal holiday and day off marked: July 4 is a Saturday, so Friday July 3 is the day off. 250 working days. Printable.',
  path: '/calendar/2026',
  ogImage: '/og/countdown/holidays.png?v=3',
  keywords:
    '2026 calendar, 2026 calendar with holidays, calendar 2026, printable 2026 calendar, 2026 calendar printable, federal holidays 2026, 2026 federal holidays, us holidays 2026, 2026 holidays, working days 2026, 2026 calendar with federal holidays',
});

export default function Calendar2026Layout({ children }: { children: ReactNode }) {
  return children;
}
