import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'LA 2028 Olympics Countdown — Time Until the 2028 Summer Games | ClockMath',
  description:
    'Live countdown to the Los Angeles 2028 Summer Olympics, opening July 14, 2028. See exactly how many days, hours, minutes, and seconds are left.',
  path: '/countdown/olympics-2028',
  keywords:
    'la 2028 olympics countdown, 2028 olympics countdown, time until 2028 olympics, days until la28, summer olympics 2028 countdown, los angeles olympics countdown',
});

export default function Olympics2028Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
