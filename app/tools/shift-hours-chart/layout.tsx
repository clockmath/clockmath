import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026: the full answer to "how many hours is 9 to 5:30" style questions,
// which Google answers in its AI Overview and then qualifies with the lunch
// break (see lib/shiftHours.ts). Bing: "how many hours is 9-5" and its
// variants ~1.4K impressions a quarter; the results there are shift-length
// charts. Title 64 characters (Bing flags over 65). Uses the timesheet's
// share card.
export const metadata = generateSEOMetadata({
  title: 'How Many Hours Is 9 to 5? Shift Hours Chart & Breaks | ClockMath',
  description:
    'How many hours common shifts are, with and without an unpaid lunch: 9 to 5 is 8 hours (7.5 with a 30-minute lunch), 9 to 5:30 is 8.5, 7 to 7 is 12. Printable.',
  path: '/tools/shift-hours-chart',
  ogImage: '/og/tool/timesheet.png?v=3',
  keywords:
    'how many hours is 9 to 5, how many hours is 9-5, 9 to 5:30 is how many hours, how many hours is 8 to 5, how many hours is 7 to 3, shift hours chart, shift length chart, how many hours is a 12 hour shift, work hours with lunch, hours worked with lunch break, 40 hour week schedule',
});

export default function ShiftHoursChartLayout({ children }: { children: ReactNode }) {
  return children;
}
