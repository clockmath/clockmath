import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the page itself is a
// client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Work Hours Calculator with Breaks — Free Timesheet | ClockMath',
  description:
    'Calculate work hours with lunch breaks deducted: add your shifts (overnight included) to get weekly totals, decimal hours for payroll, and gross pay. Saves automatically; export as CSV.',
  path: '/tools/timesheet',
  keywords:
    'work hours calculator with breaks, timesheet calculator, hours worked calculator, calculate work hours with lunch, time card calculator, weekly hours calculator, payroll hours, decimal hours',
});

export default function TimesheetLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
