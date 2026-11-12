import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: "When Is the 2027 Women's World Cup? Dates & Countdown | ClockMath",
  description:
    "The 2027 FIFA Women's World Cup in Brazil runs June 24 to July 25, with the opener and final at the Maracanã. Every stage with days left, and Brazil time vs yours.",
  path: '/countdown/womens-world-cup-2027',
  ogImage: '/og/countdown/womens-world-cup-2027.png?v=1',
  keywords:
    "womens world cup 2027, when is the womens world cup, women's world cup 2027 dates, womens world cup countdown, women's world cup 2027 brazil, womens world cup final 2027, days until womens world cup",
});

export default function WomensWorldCupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
