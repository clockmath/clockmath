import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'How Many Days Until Beyond the Spider-Verse? | ClockMath',
  description:
    'Live countdown to Spider-Man: Beyond the Spider-Verse, in theaters June 18, 2027 after moving from June 4 and June 25. Days, hours, minutes and seconds left.',
  path: '/countdown/beyond-the-spider-verse',
  ogImage: '/og/countdown/beyond-the-spider-verse.png?v=1',
  keywords:
    'beyond the spider-verse countdown, beyond the spider-verse release date, spider-verse 3 release date, days until beyond the spider-verse, when does beyond the spider-verse come out, spider-man beyond the spider-verse',
});

export default function BeyondTheSpiderVerseLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
