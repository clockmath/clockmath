import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Spider-Man: Brand New Day Countdown — Release Date Timer | ClockMath',
  description:
    'Live countdown to Spider-Man: Brand New Day, in theaters July 31, 2026. See exactly how many days, hours, minutes, and seconds are left until release.',
  path: '/countdown/spider-man-brand-new-day',
  keywords:
    'spider-man brand new day countdown, spider man brand new day release date, time until spider-man brand new day, days until spider-man 4, new spider-man movie countdown',
});

export default function SpiderManLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
