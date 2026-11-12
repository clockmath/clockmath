import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the page itself is
// a client component. Nov 2026: Bing's AI Performance report had Copilot
// citing other sites 1K–5K times each for "date calculation" and "calculate
// dates" while ClockMath had no such tool. The title stays under 65
// characters, which Bing flags past.
export const metadata = generateSEOMetadata({
  title: 'Date Calculator: Add or Subtract Days, Weeks, Months | ClockMath',
  description:
    'Add or subtract days, weeks, months, years or business days from any date. Handles month ends (Jan 31 + 1 month), leap years and US holidays. Free.',
  path: '/tools/date-calculator',
  ogImage: '/og/tool/date-calculator.png?v=1',
  keywords:
    'date calculator, date calculation, calculate dates, add days to date, subtract days from date, days from today, add months to date, add weeks to date, business days calculator, add business days, 90 days from today, 30 days from today, date plus days',
});

export default function DateCalculatorLayout({ children }: { children: ReactNode }) {
  return children;
}
