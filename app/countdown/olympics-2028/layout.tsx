import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until the 2028 Olympics? Live Countdown | ClockMath',
  description:
    'Live countdown to the LA 2028 Summer Olympics — opening ceremony July 14, 2028. See exactly how many days remain until the Games begin.',
  path: '/countdown/olympics-2028',
  keywords:
    'la 2028 olympics countdown, 2028 olympics countdown, time until 2028 olympics, days until la28, summer olympics 2028 countdown, los angeles olympics countdown',
});

export default function Olympics2028Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
