import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Halloween Countdown — How Many Days Until Halloween? | ClockMath',
  description:
    'Live countdown to Halloween (October 31). See exactly how many days, hours, minutes, and seconds are left until Halloween this year.',
  path: '/countdown/halloween',
  keywords:
    'halloween countdown, how many days until halloween, days until halloween, time until halloween, halloween timer',
});

export default function HalloweenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
