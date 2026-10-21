import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';
import { LAUNCHED } from './launch';

// Countdown until release day, "is GTA 6 out?" from then on (see launch.ts).
export const metadata = generateSEOMetadata(
  LAUNCHED
    ? {
        title: 'Is GTA 6 Out? Release Date & Unlock Times by Region | ClockMath',
        description:
          'Yes: Grand Theft Auto VI released November 19, 2026 on PS5 and Xbox Series X|S. When it unlocked in each region, and whether there is a PC date yet.',
        path: '/countdown/gta-6',
        keywords:
          'is gta 6 out, gta 6 release date, gta 6 release time, what time did gta 6 unlock, gta 6 pc release date, when did gta 6 come out',
      }
    : {
        title: 'How Many Days Until GTA 6? Live Countdown | ClockMath',
        description:
          'Live countdown to Grand Theft Auto VI — releasing November 19, 2026. See exactly how many days, hours, minutes, and seconds remain until GTA 6 launches.',
        path: '/countdown/gta-6',
        keywords:
          'gta 6 countdown, gta 6 release date, time until gta 6, how many days until gta 6, grand theft auto vi countdown, gta 6 release countdown',
      },
);

export default function Gta6Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
