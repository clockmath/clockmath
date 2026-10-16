import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: '2027 Solar Eclipse Countdown: August 2 Times by City | ClockMath',
  description:
    'Countdown to the August 2, 2027 total solar eclipse: local times of totality in Spain, Morocco, Libya, Egypt and Saudi Arabia, and coverage elsewhere.',
  path: '/countdown/solar-eclipse-2027',
  keywords:
    'solar eclipse 2027, total solar eclipse august 2 2027, 2027 eclipse countdown, eclipse 2027 spain time, eclipse 2027 luxor, eclipse 2027 morocco, 2027 eclipse path, eclipse 2027 times by city, how long is the 2027 eclipse',
});

export default function SolarEclipse2027Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
