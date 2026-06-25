import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'GTA 6 Countdown — Time Until Grand Theft Auto VI Releases | ClockMath',
  description:
    'Live countdown to GTA 6 (Grand Theft Auto VI), releasing November 19, 2026 on PS5 and Xbox Series X|S. See exactly how many days, hours, minutes, and seconds are left.',
  path: '/countdown/gta-6',
  keywords:
    'gta 6 countdown, gta 6 release date, time until gta 6, how many days until gta 6, grand theft auto vi countdown, gta 6 release countdown',
});

export default function Gta6Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
