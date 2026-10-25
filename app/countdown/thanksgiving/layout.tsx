import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { seasonalSEO, nthWeekday } from '@/lib/holidays';

// Year and date in the title (see seasonalSEO): computed at build, so it
// moves to next year at the first deploy after the day.
const s = seasonalSEO('Thanksgiving', (y) => nthWeekday(y, 10, 4, 4));

export const metadata = generateSEOMetadata({
  // "Live Countdown" kept from the old title: after the Oct 17 2026 retitle
  // ("…2026? Countdown to Nov 26") Bing dropped the page for "how many days
  // until thanksgiving" from position 5.4 to 9.5. Year and date stay.
  title: `How Many Days Until Thanksgiving ${s.year}? Live Countdown to ${s.short} | ClockMath`,
  description: `Thanksgiving ${s.year} is ${s.long}. See how many days and weeks are left, with a live countdown to the second.`,
  path: '/countdown/thanksgiving',
  ogImage: '/og/countdown/thanksgiving.png?v=3',
  keywords: `how many days until thanksgiving, how many days until thanksgiving ${s.year}, thanksgiving countdown, days until thanksgiving, when is thanksgiving ${s.year}, how many weeks until thanksgiving`,
});

export default function ThanksgivingLayout({ children }: { children: ReactNode }) {
  return children;
}
