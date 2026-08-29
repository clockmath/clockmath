import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Black Friday? Live Countdown | ClockMath',
  description:
    'Live countdown to Black Friday — days, hours, minutes, and seconds until the day after Thanksgiving. Automatically rolls over each year.',
  path: '/countdown/black-friday',
  keywords:
    'how many days until black friday, black friday countdown, days until black friday, when is black friday 2026, black friday 2026 date, how long until black friday',
});

export default function BlackFridayLayout({ children }: { children: ReactNode }) {
  return children;
}
