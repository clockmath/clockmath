import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { seasonalSEO } from '@/lib/holidays';

// Year and date in the title (see seasonalSEO): computed at build, so it
// moves to next year at the first deploy after the day.
const s = seasonalSEO('Christmas', (y) => new Date(Date.UTC(y, 11, 25)));

export const metadata = generateSEOMetadata({
  title: s.title,
  description: `Christmas ${s.year} is ${s.long}. See how many days and weeks are left, with a live countdown to the second and the weekday in coming years.`,
  path: '/countdown/christmas',
  ogImage: '/og/countdown/christmas.png?v=3',
  keywords: `how many days until christmas, how many days until christmas ${s.year}, christmas countdown, days until christmas, xmas countdown`,
});

export default function ChristmasLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
