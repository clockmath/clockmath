import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Lunar New Year 2027? Countdown | ClockMath',
  description:
    'Live countdown to Lunar New Year 2027, the Year of the Goat: Saturday, February 6 in China, with dates and zodiac animals for the coming years.',
  path: '/countdown/lunar-new-year',
  ogImage: '/og/countdown/lunar-new-year.png',
  keywords:
    'lunar new year countdown, chinese new year countdown, how many days until chinese new year, chinese new year 2027, lunar new year 2027, year of the goat 2027, seollal 2027, tet 2027',
});

export default function LunarNewYearLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
