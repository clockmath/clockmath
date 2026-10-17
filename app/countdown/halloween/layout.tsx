import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { seasonalSEO } from '@/lib/holidays';

// Year and date in the title (see seasonalSEO): computed at build, so it
// moves to next year at the first deploy after the day.
const s = seasonalSEO('Halloween', (y) => new Date(Date.UTC(y, 9, 31)));

export const metadata = generateSEOMetadata({
  title: s.title,
  description: `Halloween ${s.year} is ${s.long}. See how many days and weeks are left, with a live countdown to the second and the weekday in coming years.`,
  path: '/countdown/halloween',
  keywords: `how many days until halloween, how many days until halloween ${s.year}, halloween countdown, days until halloween, halloween ${s.year} date`,
});

export default function HalloweenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
