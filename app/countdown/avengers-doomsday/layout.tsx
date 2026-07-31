import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Avengers: Doomsday Countdown — Release Date Timer | ClockMath',
  description:
    'Live countdown to Avengers: Doomsday, in theaters December 18, 2026. See exactly how many days, hours, minutes, and seconds are left until Robert Downey Jr. returns as Doctor Doom.',
  path: '/countdown/avengers-doomsday',
  keywords:
    'avengers doomsday countdown, avengers doomsday release date, days until avengers doomsday, time until avengers doomsday, new avengers movie countdown, doctor doom movie release',
});

export default function AvengersDoomsdayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
