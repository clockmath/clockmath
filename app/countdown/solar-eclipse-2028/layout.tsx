import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: '2028 Total Solar Eclipse Countdown — Sydney, Australia & New Zealand Times | ClockMath',
  description:
    'Live countdown to the July 22, 2028 total solar eclipse: totality in Sydney from 1:59 PM AEST, local times across Australia and New Zealand, and how much of the Sun is covered in Melbourne, Brisbane, Perth and Auckland.',
  path: '/countdown/solar-eclipse-2028',
  keywords:
    'solar eclipse 2028, total solar eclipse july 22 2028, sydney eclipse 2028, eclipse 2028 australia, eclipse 2028 new zealand, eclipse 2028 time, 2028 eclipse path, eclipse 2028 melbourne brisbane',
});

export default function SolarEclipse2028Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
