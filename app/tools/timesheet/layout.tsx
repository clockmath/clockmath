import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the page itself is a
// client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Work Hours & Timesheet Calculator — Add Up Your Shifts | ClockMath',
  description:
    'Free timesheet calculator: add your shifts (with breaks) to get total work hours, decimal hours for payroll, and gross pay. Save timesheets and export a summary.',
  path: '/tools/timesheet',
  keywords:
    'timesheet calculator, work hours calculator, hours worked calculator, time card calculator, payroll hours, decimal hours',
});

export default function TimesheetLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
