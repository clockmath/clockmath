import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { seasonalSEO, nthWeekday } from '@/lib/holidays';

// Year and date in the title (see seasonalSEO): computed at build, so it
// moves to next year at the first deploy after the day.
const s = seasonalSEO('Black Friday', (y) => nthWeekday(y, 10, 4, 4, 1));

export const metadata = generateSEOMetadata({
  title: s.title,
  description: `Black Friday ${s.year} is ${s.long}, the day after Thanksgiving. See how many days and weeks are left, with a live countdown to the second.`,
  path: '/countdown/black-friday',
  ogImage: '/og/countdown/black-friday.png?v=3',
  keywords: `how many days until black friday, how many days until black friday ${s.year}, black friday countdown, days until black friday, when is black friday ${s.year}`,
});

export default function BlackFridayLayout({ children }: { children: ReactNode }) {
  return children;
}
