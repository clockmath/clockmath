import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { RELEASED } from './launch';

// Countdown until release day, "is Avengers: Doomsday out?" from then on (see launch.ts).
export const metadata = generateSEOMetadata(
  RELEASED
    ? {
        title: 'Is Avengers: Doomsday Out? Release Date & Disney+ | ClockMath',
        description:
          'Yes: Avengers: Doomsday opened in theaters December 18, 2026 (December 16 in the UK). Is it on Disney+ yet, and when the next Avengers film comes out.',
        path: '/countdown/avengers-doomsday',
        ogImage: '/og/countdown/avengers-doomsday.png?v=3',
        keywords:
          'is avengers doomsday out, avengers doomsday release date, avengers doomsday disney plus, when did avengers doomsday come out, next avengers movie, avengers secret wars release date',
      }
    : {
        title: 'How Many Days Until Avengers: Doomsday? Live Countdown | ClockMath',
        description:
          'Countdown to Avengers: Doomsday, in theaters December 18, 2026: the days, hours, minutes and seconds until Robert Downey Jr. returns as Doctor Doom.',
        path: '/countdown/avengers-doomsday',
        ogImage: '/og/countdown/avengers-doomsday.png?v=3',
        keywords:
          'avengers doomsday countdown, avengers doomsday release date, days until avengers doomsday, time until avengers doomsday, new avengers movie countdown, doctor doom movie release',
      },
);

export default function AvengersDoomsdayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
