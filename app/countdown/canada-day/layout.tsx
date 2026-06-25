import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Canada Day Countdown — How Many Days Until Canada Day? | ClockMath',
  description:
    'Live countdown to Canada Day (July 1). See exactly how many days, hours, minutes, and seconds are left until Canada Day this year.',
  path: '/countdown/canada-day',
  keywords:
    'canada day countdown, how many days until canada day, days until canada day, july 1 countdown, canada day timer',
});

export default function CanadaDayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
