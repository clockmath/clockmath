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
      'Yes — each day has one shared five-question puzzle, generated from the date itself, so every player worldwide answers the same questions. That is what makes the daily leaderboard a fair comparison.',
  },
  {
    question: 'When does a new quiz come out?',
    answer:
      'At midnight UTC, every day. The leaderboard resets with it, so each day is a fresh start no matter how yesterday went.',
  },
  {
    question: 'How is the score calculated?',
    answer:
      'One point per correct answer, out of five. The leaderboard ranks by score first and breaks ties by solving time — and the clock only runs while a question is on screen waiting for your answer, so reading the explanations costs nothing.',
  },
  {
    question: 'What kind of questions are asked?',
    answer:
      'The five daily questions always cover the same real-world skills: elapsed time between two clock times, durations that cross midnight, adding hours and minutes to a time, converting hours and minutes to decimal hours, and working out paid hours on a shift with an unpaid break.',
  },
  {
    question: 'Do I need an account to play or join the leaderboard?',
    answer:
      'No signup, ever. Your results and streak are saved on your device, and the leaderboard just takes three letters, arcade style. Practice mode is unlimited and free too.',
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
              Five questions, one shared puzzle a day — how fast is your clock math?
            </p>
          </div>
        </div>
      </header>

      <QuizTool className="mb-section" />

      {/* Explanation — collapsed like the FAQ; content stays prerendered */}
      <section className="max-w-3xl mx-auto mb-section">
        <details className="group bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50">
          <summary className="flex items-center justify-between gap-3 cursor-pointer select-none list-none px-4 sm:px-5 py-3 [&::-webkit-details-marker]:hidden">
            <h2 className="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">
              Why practice time math?
            </h2>
            <span
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="px-4 sm:px-5 pb-4">
        <p className="text-muted-foreground mb-3">
          Elapsed-time math shows up everywhere adults actually do arithmetic: reading a
          timesheet, checking a night-shift schedule, working out whether a 7:45 AM start and a
          4:05 PM finish really adds up to eight paid hours. It is also one of the skills students
          consistently find hardest, because clocks are base-60 while everything else they
          practice is base-10 — the &ldquo;borrow&rdquo; step works differently.
        </p>
        <p className="text-muted-foreground mb-3">
          Each daily question maps to a real ClockMath tool, and every explanation shows the
          mental method: count up to the next full hour, add whole hours, then the leftover
          minutes. Miss one and the quiz points you at the matching calculator —{' '}
          <Link href="/" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-4">
            duration
          </Link>
          ,{' '}
          <Link href="/tools/decimal-hours" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-4">
            decimal hours
          </Link>
          , or{' '}
          <Link href="/tools/timesheet" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-4">
            work hours
          </Link>{' '}
          — so you can check the same math with real numbers.
        </p>
        <p className="text-muted-foreground">
          Teachers: practice mode is unlimited, untimed, and needs no accounts — it works fine on
          a classroom of shared devices, and everyone gets the same daily puzzle to compare
          against.
        </p>
          </div>
        </details>
      </section>

      {/* FAQ — mirrors the FAQPage JSON-LD above */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer select-none list-none px-4 sm:px-5 py-3 font-semibold text-foreground dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <p className="px-4 sm:px-5 pb-4 text-muted-foreground text-sm sm:text-base">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter />
    </PageChrome>
  );
}
