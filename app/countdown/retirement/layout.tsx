import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Retirement Countdown — Days Until You Retire | ClockMath',
  description:
    'Free retirement countdown timer. Enter your retirement date and see exactly how many years, months, days, hours, minutes, and seconds are left until you retire.',
  path: '/countdown/retirement',
  keywords:
    'retirement countdown, days until retirement, retirement timer, countdown to retirement, how long until i retire, retirement date calculator',
});

export default function RetirementLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
