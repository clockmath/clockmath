import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: "How Many Days Until Valentine's Day? Live Countdown | ClockMath",
  description:
    "Live countdown to Valentine's Day, February 14: the days and weeks left, what day it falls on each year, and when Galentine's Day and White Day are.",
  path: '/countdown/valentines-day',
  ogImage: '/og/countdown/valentines-day.png',
  keywords:
    "valentine's day countdown, how many days until valentine's day, days until valentines day, when is valentine's day 2027, valentines day 2027",
});

export default function ValentinesDayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
