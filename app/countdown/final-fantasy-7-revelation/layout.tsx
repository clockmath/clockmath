import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until FF7 Revelation? Release Countdown | ClockMath',
  description:
    'Live countdown to Final Fantasy VII Revelation, the last part of the remake trilogy: out April 8, 2027 on PS5, Xbox Series X|S, Switch 2 and PC.',
  path: '/countdown/final-fantasy-7-revelation',
  ogImage: '/og/countdown/final-fantasy-7-revelation.png?v=1',
  keywords:
    'ff7 revelation countdown, ff7 revelation release date, final fantasy vii revelation release date, days until ff7 revelation, when does ff7 revelation come out, final fantasy 7 remake part 3 release date',
});

export default function Ff7RevelationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
