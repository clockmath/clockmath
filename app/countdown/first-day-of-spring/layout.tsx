import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { countdownProps } from '@/lib/countdowns';
import { momentIn } from '@/lib/seasons';

// Title and description follow the next March equinox after the build day
// (lib/seasons.ts), so a deploy after it moves both to the next year.
const at = countdownProps('first-day-of-spring').target!.getTime();
const year = new Date(at).getUTCFullYear();

export const metadata = generateSEOMetadata({
  title: `When Is the First Day of Spring ${year}? Equinox Time | ClockMath`,
  description: `The March equinox ${year} is at ${momentIn(at, 'UTC')} UTC (${momentIn(at, 'America/New_York')} Eastern). Live countdown, and the date and time where you are.`,
  path: '/countdown/first-day-of-spring',
  ogImage: '/og/countdown/first-day-of-spring.png?v=1',
  keywords: 'first day of spring 2027, when is the first day of spring, spring equinox 2027, march equinox 2027, days until spring, what time is the spring equinox, is the first day of spring march 20 or 21',
});

export default function FirstDayOfSpringLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
