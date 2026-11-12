import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until God of War Laufey? PS5 Countdown | ClockMath',
  description:
    'Live countdown to God of War Laufey, now out May 20, 2027 on PS5 after its delay from February. The days, hours, minutes and seconds until release.',
  path: '/countdown/god-of-war-laufey',
  ogImage: '/og/countdown/god-of-war-laufey.png?v=1',
  keywords:
    'god of war laufey countdown, god of war laufey release date, god of war laufey delay, days until god of war laufey, when does god of war laufey come out, new god of war release date',
});

export default function GodOfWarLaufeyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
