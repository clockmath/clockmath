import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026: the printable half of the work-hours group (the Nov 20 review:
// searches that want something to take away, not a sum Google answers).
// Title 65 characters (Bing flags over 65). Uses the timesheet's share card.
export const metadata = generateSEOMetadata({
  title: 'Free Printable Timesheet Template, Weekly or Biweekly | ClockMath',
  description:
    'A free printable timesheet: weekly or biweekly, blank or with your dates, with lunch in and out and signature lines. Print it, save a PDF, or open it in Excel.',
  path: '/tools/timesheet-template',
  ogImage: '/og/tool/timesheet.png?v=3',
  keywords:
    'printable timesheet, timesheet template, free printable timesheet, weekly timesheet template, biweekly timesheet template, blank timesheet, time card template, printable time card, employee timesheet pdf, timesheet template excel',
});

export default function TimesheetTemplateLayout({ children }: { children: ReactNode }) {
  return children;
}
