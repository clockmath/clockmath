import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'When Do the Clocks Change? Daylight Saving Time 2026–27 | ClockMath',
  description:
    'Countdown to your next clock change. Clocks go back Nov 1, 2026 in the US and eastern Canada, Oct 25 in Europe. Western Canada no longer changes.',
  path: '/countdown/daylight-saving-time',
  ogImage: '/og/countdown/daylight-saving-time.png?v=2',
  keywords:
    'daylight saving time 2026, when do the clocks go back, clocks go back 2026, daylight saving time ends 2026, fall back 2026, when do clocks change, time change november 2026, clocks go forward 2027, bc time change 2026, alberta daylight saving time, manitoba time change 2026, manitoba daylight saving time',
});

export default function DaylightSavingTimeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
