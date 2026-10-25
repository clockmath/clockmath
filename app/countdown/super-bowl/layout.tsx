import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Super Bowl 2027 Countdown — Super Bowl LXI on Feb 14 | ClockMath',
  description:
    'Live countdown to Super Bowl LXI: Sunday, February 14, 2027 at SoFi Stadium in Inglewood, California — the first Super Bowl played on Valentine’s Day.',
  path: '/countdown/super-bowl',
  ogImage: '/og/countdown/super-bowl.png?v=3',
  keywords:
    'super bowl countdown, how many days until the super bowl, super bowl 2027, super bowl lxi, when is the super bowl 2027, super bowl 2027 date, super bowl 61',
});

export default function SuperBowlLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
