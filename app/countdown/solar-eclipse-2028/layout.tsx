import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: '2028 Solar Eclipse Countdown: Sydney & New Zealand Times | ClockMath',
  description:
    'Countdown to the July 22, 2028 total solar eclipse: totality in Sydney at 1:59 PM AEST, with local times and coverage across Australia and New Zealand.',
  path: '/countdown/solar-eclipse-2028',
  ogImage: '/og/countdown/solar-eclipse-2028.png',
  keywords:
    'solar eclipse 2028, total solar eclipse july 22 2028, sydney eclipse 2028, eclipse 2028 australia, eclipse 2028 new zealand, eclipse 2028 time, 2028 eclipse path, eclipse 2028 melbourne brisbane',
});

export default function SolarEclipse2028Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
