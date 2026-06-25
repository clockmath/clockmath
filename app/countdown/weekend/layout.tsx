import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Weekend Countdown — How Long Until the Weekend? | ClockMath',
  description:
    'Live countdown to the weekend. See exactly how many days, hours, minutes, and seconds are left until Saturday.',
  path: '/countdown/weekend',
  keywords:
    'weekend countdown, how long until the weekend, time until the weekend, days until saturday, countdown to the weekend, friday countdown',
});

export default function WeekendLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
