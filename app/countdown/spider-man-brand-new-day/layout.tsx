import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Spider-Man: Brand New Day — Now in Theaters | ClockMath',
  description:
    'Spider-Man: Brand New Day released in theaters July 31, 2026. See how long it has been out, and when to expect the digital and streaming release.',
  path: '/countdown/spider-man-brand-new-day',
  keywords:
    'is spider-man brand new day out, spider-man brand new day streaming date, spider-man brand new day digital release, spider-man brand new day in theaters, spider-man brand new day release date, spider-man 4',
});

export default function SpiderManLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
