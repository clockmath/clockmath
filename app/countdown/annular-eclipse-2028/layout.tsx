import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: '2028 Annular Solar Eclipse Countdown — January 26 Ring of Fire Times | ClockMath',
  description:
    'Live countdown to the January 26, 2028 annular "ring of fire" eclipse: local times for Ecuador, Peru, Brazil, and Spain and Portugal at sunset, how much of the Sun is covered elsewhere, and what North America sees.',
  path: '/countdown/annular-eclipse-2028',
  keywords:
    'annular eclipse 2028, ring of fire eclipse january 26 2028, eclipse 2028 spain, eclipse 2028 seville, eclipse 2028 portugal, eclipse 2028 ecuador, eclipse 2028 brazil, 2028 eclipse countdown',
});

export default function AnnularEclipse2028Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
