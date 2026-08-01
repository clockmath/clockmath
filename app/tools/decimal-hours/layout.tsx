import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the decimal-hours
// page itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Decimal Hours Converter — Minutes to Decimal Chart | ClockMath',
  description:
    'Convert hours and minutes to decimal hours (and back) for payroll and timesheets. Includes the full minutes-to-decimal conversion chart: 15 min = 0.25, 30 min = 0.50, 45 min = 0.75.',
  path: '/tools/decimal-hours',
  keywords:
    'decimal hours calculator, minutes to decimal hours, time to decimal, decimal hours chart, convert minutes to decimal, payroll time conversion, decimal time converter',
});

export default function DecimalHoursLayout({ children }: { children: ReactNode }) {
  return children;
}
