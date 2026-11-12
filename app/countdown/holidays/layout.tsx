import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  // Nov 2026: "Full List" for "holidays in 2026", which Copilot answered
  // from other sites; the page now lists every holiday of both years
  title: 'Holidays 2026 & 2027: Full List, Dates, Days Until | ClockMath',
  description:
    'Every holiday in 2026 and 2027: the 11 US federal holidays with their observed days, plus Easter, Mother’s Day, Halloween and more, and the days left until each.',
  path: '/countdown/holidays',
  ogImage: '/og/countdown/holidays.png?v=3',
  keywords:
    'holidays 2026, holidays 2027, holidays in 2026, list of holidays 2026, federal holidays 2026, 2026 holidays, federal holidays 2027, upcoming holidays, us holidays 2027, days until holidays, list of holidays 2027, when is the next holiday',
});

export default function HolidaysLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
