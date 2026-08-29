import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Thanksgiving? Live Countdown | ClockMath',
  description:
    'Live countdown to Thanksgiving — days, hours, minutes, and seconds until the fourth Thursday of November. Automatically rolls over each year.',
  path: '/countdown/thanksgiving',
  keywords:
    'how many days until thanksgiving, thanksgiving countdown, days until thanksgiving, when is thanksgiving 2026, thanksgiving 2026 date, how long until thanksgiving',
});

export default function ThanksgivingLayout({ children }: { children: ReactNode }) {
  return children;
}
