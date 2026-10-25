import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the countdown page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Countdown Timer — Count Down to Any Date | ClockMath',
  description:
    'Create a free live countdown to any date and time, in days, hours, minutes and seconds, and share it with a link. For holidays, events, exams and trips.',
  path: '/tools/countdown',
  ogImage: '/og/tool/countdown.png?v=3',
  keywords:
    'countdown timer, count down to date, days until, countdown clock, event countdown, time until',
});

export default function CountdownLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
