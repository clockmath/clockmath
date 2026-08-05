import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the sleep page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Sleep Calculator — Hours Slept & Sleep Cycle Bedtimes | ClockMath',
  description:
    'Work out exactly how long you slept (overnight handled automatically), or plan your bedtime around 90-minute sleep cycles for a target wake-up time. Free, no signup.',
  path: '/tools/sleep',
  keywords:
    'sleep calculator, sleep cycle calculator, how many hours did I sleep, bedtime calculator, wake up time calculator, hours of sleep calculator, sleep duration calculator',
});

export default function SleepLayout({ children }: { children: ReactNode }) {
  return children;
}
