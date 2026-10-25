import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Easter 2027? Live Countdown | ClockMath',
  description:
    'Live countdown to Easter Sunday 2027, March 28: Good Friday, Orthodox Easter (May 2) and Easter dates for the coming years, and why the date moves.',
  path: '/countdown/easter',
  ogImage: '/og/countdown/easter.png?v=2',
  keywords:
    'easter countdown, how many days until easter, when is easter 2027, easter 2027 date, good friday 2027, orthodox easter 2027, easter sunday 2027',
});

export default function EasterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
