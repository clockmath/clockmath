import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Holidays 2026–2027: Dates and Days Until Each | ClockMath',
  description:
    'Upcoming holidays and events with the days left until each, updated daily, plus all 11 US federal holidays for 2027 and the days they are observed.',
  path: '/countdown/holidays',
  ogImage: '/og/countdown/holidays.png',
  keywords:
    'holidays 2026, holidays 2027, federal holidays 2027, upcoming holidays, us holidays 2027, days until holidays, list of holidays 2027, when is the next holiday',
});

export default function HolidaysLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
