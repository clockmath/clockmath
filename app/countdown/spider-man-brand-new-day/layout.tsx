import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Spider-Man: Brand New Day — In Theaters & on Digital | ClockMath',
  description:
    'Spider-Man: Brand New Day opened in theaters July 31, 2026 and has been on digital to rent or buy since October 6. When to expect it on Netflix.',
  path: '/countdown/spider-man-brand-new-day',
  keywords:
    'is spider-man brand new day out, spider-man brand new day streaming date, spider-man brand new day digital release, spider-man brand new day in theaters, spider-man brand new day release date, spider-man 4',
});

export default function SpiderManLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
