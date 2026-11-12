import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Fable? Release Date Countdown | ClockMath',
  description:
    'Live countdown to Fable, out February 23, 2027 on Xbox Series X|S, PS5 and PC, with Premium Edition early access from February 18. Days, hours and seconds left.',
  path: '/countdown/fable',
  ogImage: '/og/countdown/fable.png?v=1',
  keywords:
    'fable countdown, fable release date, days until fable, when does fable come out, fable early access, fable 2027, fable game pass, fable release time',
});

export default function FableLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
