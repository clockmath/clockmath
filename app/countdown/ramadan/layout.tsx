import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'When Is Ramadan 2027? Start Date, Eid and Countdown | ClockMath',
  description:
    'Ramadan 2027 is expected to begin Monday, February 8 (first tarawih the evening of February 7), with Eid al-Fitr on March 9 or 10. Live countdown and key dates.',
  path: '/countdown/ramadan',
  ogImage: '/og/countdown/ramadan.png?v=1',
  keywords:
    'ramadan 2027, when is ramadan 2027, when does ramadan start, ramadan 2027 start date, eid al fitr 2027, when is eid 2027, days until ramadan, ramadan countdown',
});

export default function RamadanLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
