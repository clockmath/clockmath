import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'When Does March Madness 2027 Start? Dates & Countdown | ClockMath',
  description:
    'March Madness 2027: Selection Sunday March 14, first games March 16, Final Four April 3 and 5 in Detroit. Every round of the first 76-team tournament, with days left.',
  path: '/countdown/march-madness',
  ogImage: '/og/countdown/march-madness.png?v=1',
  keywords:
    'march madness 2027, when does march madness start, selection sunday 2027, final four 2027, march madness 2027 dates, ncaa tournament 2027 schedule, days until march madness, womens final four 2027',
});

export default function MarchMadnessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
