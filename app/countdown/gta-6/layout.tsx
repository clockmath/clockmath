import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until GTA 6? Live Countdown | ClockMath',
  description:
    'Live countdown to Grand Theft Auto VI — releasing November 19, 2026. See exactly how many days, hours, minutes, and seconds remain until GTA 6 launches.',
  path: '/countdown/gta-6',
  keywords:
    'gta 6 countdown, gta 6 release date, time until gta 6, how many days until gta 6, grand theft auto vi countdown, gta 6 release countdown',
});

export default function Gta6Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
