import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the decimal-hours
// page itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Minutes to Decimal Converter: Time to Decimal Hours Chart | ClockMath',
  description:
    'Convert minutes or time to decimal hours and back: 15 min = 0.25, 30 min = 0.50, 45 min = 0.75. Includes the full minutes-to-decimal chart for payroll.',
  path: '/tools/decimal-hours',
  ogImage: '/og/tool/decimal-hours.png',
  keywords:
    'minutes to decimal, minutes to decimals, time to decimal, time to decimal calculator, decimal to time, hours to decimal, minutes to decimal chart, decimal hours calculator, minutes to decimal hours, decimal hours chart, convert minutes to decimal, payroll time conversion, decimal time converter',
});

export default function DecimalHoursLayout({ children }: { children: ReactNode }) {
  return children;
}
