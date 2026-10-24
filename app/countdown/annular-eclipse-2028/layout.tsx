import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: '2028 Annular Eclipse Countdown: Jan 26 Ring of Fire Times | ClockMath',
  description:
    'Countdown to the January 26, 2028 "ring of fire" eclipse, with local times for Ecuador, Peru, Brazil, Spain and Portugal and coverage elsewhere.',
  path: '/countdown/annular-eclipse-2028',
  ogImage: '/og/countdown/annular-eclipse-2028.png?v=2',
  keywords:
    'annular eclipse 2028, ring of fire eclipse january 26 2028, eclipse 2028 spain, eclipse 2028 seville, eclipse 2028 portugal, eclipse 2028 ecuador, eclipse 2028 brazil, 2028 eclipse countdown',
});

export default function AnnularEclipse2028Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
