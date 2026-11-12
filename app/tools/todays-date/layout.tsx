import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the page itself is
// a client component. Nov 2026: Bing's AI Performance report had Copilot
// citing other sites 1K–5K times each for "what day is it", "today's date",
// "what is the date" and "julian date". The title holds no date (it would be
// the deploy day's) and stays under 65 characters, which Bing flags past.
export const metadata = generateSEOMetadata({
  title: "Today's Date: What Day Is It? Week & Julian Date | ClockMath",
  description:
    "What is today's date? The date where you are, with the day of the year, days left, ISO and US week numbers, and today's Julian date and day number.",
  path: '/tools/todays-date',
  ogImage: '/og/tool/todays-date.png?v=1',
  keywords:
    "today's date, what day is it, what is today's date, what is the date, what day is it today, todays date, current date, day of the year, what day of the year is it, week number, what week is it, julian date, today's julian date, julian day number, date today",
});

export default function TodaysDateLayout({ children }: { children: ReactNode }) {
  return children;
}
