import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026. Bing, Aug–Nov 2026, a quarter: "2027 calendar" 334K impressions,
// "2027 calendar printable" 92K, "2027 calendar with holidays" 29.9K,
// "federal holidays 2027" 25.4K, "2027 federal holidays" 24.4K. Under 65
// characters. Uses the holidays list's share card until this has its own.
export const metadata = generateSEOMetadata({
  title: '2027 Calendar with Federal Holidays (Printable) | ClockMath',
  description:
    'The 2027 calendar with every US federal holiday and day off marked: Juneteenth, July 4 and Christmas observed on Friday or Monday. 249 working days. Printable.',
  path: '/calendar/2027',
  ogImage: '/og/countdown/holidays.png?v=3',
  keywords:
    '2027 calendar, 2027 calendar with holidays, calendar 2027, printable 2027 calendar, 2027 calendar printable, federal holidays 2027, 2027 federal holidays, us holidays 2027, 2027 holidays, working days 2027, 2027 calendar with federal holidays',
});

export default function Calendar2027Layout({ children }: { children: ReactNode }) {
  return children;
}
