import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: '4th of July Countdown — How Many Days Until Independence Day? | ClockMath',
  description:
    'Live countdown to the 4th of July (Independence Day). See exactly how many days, hours, minutes, and seconds are left until July 4th this year.',
  path: '/countdown/july-4th',
  keywords:
    '4th of july countdown, fourth of july countdown, how many days until 4th of july, days until independence day, july 4th timer',
});

export default function July4thLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
