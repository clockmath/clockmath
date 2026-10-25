import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Hanukkah 2026? Live Countdown | ClockMath',
  description:
    'Live countdown to Hanukkah 2026, which begins at sundown on Friday, December 4 and ends Saturday, December 12, with dates for the coming years.',
  path: '/countdown/hanukkah',
  ogImage: '/og/countdown/hanukkah.png?v=3',
  keywords:
    'hanukkah countdown, how many days until hanukkah, when is hanukkah 2026, hanukkah 2026 dates, chanukah 2026, first night of hanukkah, hanukkah 2027',
});

export default function HanukkahLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
