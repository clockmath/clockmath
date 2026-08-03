import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Christmas? Live Countdown | ClockMath',
  description:
    'Live countdown to Christmas Day (December 25). See exactly how many days, hours, minutes, and seconds are left until Christmas this year.',
  path: '/countdown/christmas',
  keywords:
    'christmas countdown, how many days until christmas, days until christmas, time until christmas, christmas timer, xmas countdown',
});

export default function ChristmasLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
