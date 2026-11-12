import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the decimal-hours
// page itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  // Nov 2026: 69 characters was over the 65 Bing flags; same words, shorter.
  title: 'Minutes to Decimal Converter & Time to Decimal Chart | ClockMath',
  description:
    'Convert time to decimal hours and back: 15 min = 0.25, 45 min = 0.75, 0.8 h = 48 min. Charts for minutes to decimal, decimal to minutes and tenths of an hour.',
  path: '/tools/decimal-hours',
  ogImage: '/og/tool/decimal-hours.png?v=3',
  keywords:
    'minutes to decimal, minutes to decimals, time to decimal, time to decimal calculator, decimal to time, hours to decimal, minutes to decimal chart, decimal hours calculator, minutes to decimal hours, decimal hours chart, convert minutes to decimal, payroll time conversion, decimal time converter, time decimal chart, decimal to minutes chart, tenths of an hour chart, 7 minute rule chart',
});

export default function DecimalHoursLayout({ children }: { children: ReactNode }) {
  return children;
}
