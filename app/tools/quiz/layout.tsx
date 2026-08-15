import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the quiz page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Daily Time Quiz — Test Your Clock Math | ClockMath',
  description:
    'A new five-question time quiz every day: elapsed time, clock math, decimal hours, and payroll shifts. Same puzzle for everyone, arcade-style leaderboard, free practice mode. No signup.',
  path: '/tools/quiz',
  keywords:
    'time quiz, clock math quiz, elapsed time practice, telling time quiz, duration quiz, decimal hours quiz, daily quiz, time math game',
});

export default function QuizLayout({ children }: { children: ReactNode }) {
  return children;
}
