'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { QuizTool } from '@/components/QuizTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'Is the daily quiz the same for everyone?',
    answer:
      'Yes. Each day has one five-question puzzle, generated from the date, so every player worldwide answers the same questions. A new one starts at midnight UTC.',
  },
  {
    question: 'How is the score calculated?',
    answer:
      'One point per correct answer, out of five. Ties on the leaderboard go to the faster time, and the clock only runs while a question is waiting for your answer, so reading an explanation costs nothing.',
  },
  {
    question: 'What kind of questions are asked?',
    answer:
      'Everyday time math: the time between two clock times, durations across midnight, adding time to a clock, minutes to decimal hours, paid hours after an unpaid break, and on some days reading an analog clock or converting 12-hour and 24-hour time.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. Your results and streak are saved on your device, and the leaderboard only asks for three letters, arcade style. Practice mode is unlimited.',
  },
];

export default function QuizPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('clockmath-darkmode');
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('clockmath-darkmode', next.toString());
      return next;
    });
  }, []);

  return (
    <PageChrome currentTool="quiz" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Daily Time Quiz',
          description:
            'A free daily five-question quiz on elapsed time, clock math, decimal hours, and payroll shifts, with an arcade-style leaderboard and unlimited practice mode.',
          url: 'https://clockmath.com/tools/quiz/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      {/* Header — slim: brand lives in the nav; the page leads with what it is */}
      <header className="mb-6 sm:mb-8">
        <nav className="text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <span>Daily Quiz</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Daily Time Quiz</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              How fast is your clock math?
            </p>
          </div>
        </div>
      </header>

      <QuizTool className="mb-section" />

      {/* About — plain text, no accordions: the quiz is the page, this is
          the small print. Mirrors the FAQPage JSON-LD above. */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100 mb-3">About the quiz</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          Time math is harder than it looks because clocks count in 60s while everything else counts in 10s. Each
          question matches a ClockMath tool, and every explanation shows the mental method: count up to the next full
          hour, add the whole hours, then the leftover minutes. Miss one and the quiz points you to the{' '}
          <Link href="/" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-4">
            duration
          </Link>
          ,{' '}
          <Link href="/tools/decimal-hours" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-4">
            decimal hours
          </Link>{' '}
          or{' '}
          <Link href="/tools/timesheet" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-4">
            work hours
          </Link>{' '}
          calculator. Teachers: practice mode is unlimited, untimed and needs no accounts, so it works on shared
          classroom devices.
        </p>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-semibold text-foreground text-sm sm:text-base mb-1">{faq.question}</dt>
              <dd className="text-sm text-muted-foreground">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <SiteFooter />
    </PageChrome>
  );
}
