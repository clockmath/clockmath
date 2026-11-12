import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { countdownProps } from '@/lib/countdowns';
import { momentIn } from '@/lib/seasons';

// Title and description follow the next June solstice after the build day
// (lib/seasons.ts), so a deploy after it moves both to the next year.
const at = countdownProps('first-day-of-summer').target!.getTime();
const year = new Date(at).getUTCFullYear();

export const metadata = generateSEOMetadata({
  title: `When Is the First Day of Summer ${year}? Solstice Time | ClockMath`,
  description: `The June solstice ${year} is at ${momentIn(at, 'UTC')} UTC (${momentIn(at, 'America/New_York')} Eastern). Live countdown, and the date and time where you are.`,
  path: '/countdown/first-day-of-summer',
  ogImage: '/og/countdown/first-day-of-summer.png?v=1',
  keywords: 'first day of summer 2027, when is the first day of summer, summer solstice 2027, june solstice 2027, days until summer, longest day of the year 2027, what time is the summer solstice',
});

export default function FirstDayOfSummerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
