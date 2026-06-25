import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'New Year Countdown — How Many Days Until New Year? | ClockMath',
  description:
    'Live countdown to New Year (January 1). See exactly how many days, hours, minutes, and seconds are left until the new year.',
  path: '/countdown/new-year',
  keywords:
    'new year countdown, how many days until new year, days until new year, countdown to new year, new years eve countdown, nye countdown',
});

export default function NewYearLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
