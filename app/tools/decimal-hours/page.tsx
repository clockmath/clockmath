'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Percent } from 'lucide-react';
import { DecimalHoursTool, minutesToDecimal } from '@/components/DecimalHoursTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'How do I convert minutes to decimal hours?',
    answer:
      'Divide the minutes by 60. 45 minutes is 45 ÷ 60 = 0.75, so 7 hours 45 minutes is 7.75 decimal hours. The converter above does this instantly in both directions.',
  },
  {
    question: 'What is 7 hours 30 minutes in decimal?',
    answer: '7.5 hours — 30 minutes is half an hour (30 ÷ 60 = 0.50), so 7:30 becomes 7.50.',
  },
  {
    question: 'Why does payroll use decimal hours instead of hours and minutes?',
    answer:
      'Pay is calculated as hours × hourly rate, and that multiplication needs a decimal. 7:45 at $20/hour is 7.75 × $20 = $155.00 — treating 7:45 as “7.45” would underpay by $6.00.',
  },
  {
    question: 'What is the difference between rounding to 2 decimals and payroll rounding?',
    answer:
      'This chart shows exact values rounded to 2 decimal places. Some payroll systems instead round worked time to the nearest tenth of an hour (6-minute steps) or quarter hour (15-minute steps) before converting — check which policy your employer uses.',
  },
  {
    question: 'How do I convert decimal hours back to minutes?',
    answer:
      'Multiply the fraction by 60. For 7.75 hours: 0.75 × 60 = 45, so it’s 7 hours 45 minutes. The right-hand converter above handles any value, like 8.33 → 8h 20m.',
  },
];

export default function DecimalHoursPage() {
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
    <PageChrome currentTool="decimal-hours" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Decimal Hours Converter',
          description:
            'Convert hours and minutes to decimal hours (and back) for payroll and timesheets, with the full minutes-to-decimal reference chart.',
          url: 'https://clockmath.com/tools/decimal-hours/',
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
          <span>Decimal Hours</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Decimal Hours Converter</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Minutes to decimal and back, for timesheets and payroll</p>
          </div>
        </div>
      </header>

      <DecimalHoursTool className="mb-10" />

      {/* Explanation */}
      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          How the conversion works
        </h2>
        <p className="text-muted-foreground mb-3">
          Decimal hours express minutes as a fraction of an hour:{' '}
          <strong className="text-foreground">divide minutes by 60</strong>. So 15 minutes is 0.25,
          30 minutes is 0.50, and 45 minutes is 0.75. Going the other way,{' '}
          <strong className="text-foreground">multiply the fraction by 60</strong>: 8.33 hours is 8
          hours plus 0.33 × 60 ≈ 20 minutes.
        </p>
        <p className="text-muted-foreground">
          The classic payroll mistake is reading the clock digits as decimals — 7:45 is{' '}
          <em>not</em> 7.45 hours. At $20/hour that error underpays 7.75 − 7.45 = 0.30 hours, or
          $6.00, every single shift.
        </p>
      </section>

      {/* Full chart — static, server-rendered */}
      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          Minutes to decimal hours chart
        </h2>
        <p className="text-muted-foreground mb-4">
          Exact values rounded to two decimal places — the convention most timesheet software uses.
        </p>
        <div className="overflow-x-auto bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 dark:border-slate-700/50">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border dark:border-slate-700">
                {[0, 1, 2, 3].map((c) => (
                  <React.Fragment key={c}>
                    <th scope="col" className="text-left py-2 px-2 font-semibold text-foreground">Min</th>
                    <th scope="col" className="text-left py-2 px-2 font-semibold text-foreground">Decimal</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, row) => (
                <tr key={row} className="border-b border-border/40 dark:border-slate-700/40">
                  {[0, 1, 2, 3].map((col) => {
                    const minute = row + 1 + col * 15;
                    return (
                      <React.Fragment key={col}>
                        <td className="py-1 px-2 text-muted-foreground">{minute}</td>
                        <td className="py-1 px-2 font-mono text-foreground">
                          {minutesToDecimal(minute).toFixed(2)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3">
          Note: some payroll systems round punches to the nearest tenth of an hour (6-minute steps)
          or quarter hour (15-minute steps) before converting — this chart shows unrounded values.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-slate-700/50"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          Related tools and guides
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/tools/timesheet" className="text-primary hover:text-primary/80 font-semibold">
              Work hours &amp; timesheet calculator
            </Link>{' '}
            — add up shifts with breaks and see decimal totals and gross pay
          </li>
          <li>
            <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
              Time duration calculator
            </Link>{' '}
            — the exact time between any two times, with decimal output
          </li>
          <li>
            <Link href="/articles/timesheet-calculator" className="text-primary hover:text-primary/80 font-semibold">
              Timesheet calculator guide
            </Link>{' '}
            — weekly totals and payroll conversions, step by step
          </li>
        </ul>
      </section>

      <SiteFooter />
    </PageChrome>
  );
}
