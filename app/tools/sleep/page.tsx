'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bed } from 'lucide-react';
import { SleepTool } from '@/components/SleepTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'How many hours of sleep did I get?',
    answer:
      'Enter the time you went to bed and the time you woke up — the calculator handles overnight automatically, so 11:00 PM to 6:30 AM correctly reads 7 hours 30 minutes, shown in hours-and-minutes and decimal form.',
  },
  {
    question: 'What is a sleep cycle?',
    answer:
      'Sleep moves through light, deep, and REM stages in cycles averaging roughly 90 minutes. Waking at the end of a cycle tends to feel easier than being pulled out mid-cycle, which is why the planner suggests bedtimes in 90-minute steps rather than round hours.',
  },
  {
    question: 'What time should I go to bed if I wake at 6:30 AM?',
    answer:
      'For six full cycles (about 9 hours of sleep) go to bed around 9:15 PM; for five cycles (7.5 hours) around 10:45 PM. Both include roughly 15 minutes to fall asleep. The planner computes this for any wake-up time.',
  },
  {
    question: 'How much sleep do adults need?',
    answer:
      'Major sleep-health bodies recommend 7–9 hours per night for most adults, with individual needs varying. The calculator flags whether your night fell inside or outside that range.',
  },
  {
    question: 'Is this medical advice?',
    answer:
      'No — cycle lengths and sleep-need ranges are population averages, and your own rhythm may differ. If you have ongoing sleep problems, talk to a doctor or sleep specialist.',
  },
];

export default function SleepPage() {
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
    <PageChrome currentTool="sleep" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Sleep Calculator',
          description:
            'Calculate how long you slept and plan bedtimes around 90-minute sleep cycles for any wake-up time.',
          url: 'https://clockmath.com/tools/sleep/',
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
          <span>Sleep</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <Bed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sleep Calculator</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Hours slept, and bedtimes that fit your sleep cycles
            </p>
          </div>
        </div>
      </header>

      <SleepTool className="mb-section" />

      {/* Explanation */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          How the sleep cycle math works
        </h2>
        <p className="text-muted-foreground mb-3">
          Sleep isn&apos;t one continuous state — it runs in cycles of light sleep, deep sleep, and
          REM that average roughly <strong className="text-foreground">90 minutes</strong> each.
          Waking at a cycle boundary usually feels easier than being pulled out of deep sleep
          mid-cycle, even with slightly less total sleep. The planner works backward from your
          wake-up time in 90-minute steps and adds about 15 minutes for falling asleep.
        </p>
        <p className="text-muted-foreground">
          Worked example: waking at <strong className="text-foreground">6:30 AM</strong> with six
          cycles means 6 × 90 + 15 = 555 minutes — bed at{' '}
          <strong className="text-foreground">9:15 PM</strong>. Five cycles puts bedtime at 10:45 PM
          for 7.5 hours of sleep, still inside the 7–9 hours most adults need.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-card dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-slate-700/50"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          Related tools and guides
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/articles/sleep-hours-calculator" className="text-primary hover:text-primary/80 font-semibold">
              Sleep hours guide
            </Link>{' '}
            — tracking your sleep patterns and what they mean
          </li>
          <li>
            <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
              Time duration calculator
            </Link>{' '}
            — the exact time between any two times
          </li>
          <li>
            <Link href="/tools/countdown" className="text-primary hover:text-primary/80 font-semibold">
              Countdown timer
            </Link>{' '}
            — count down to your alarm, or anything else
          </li>
        </ul>
      </section>

      <SiteFooter />
    </PageChrome>
  );
}
