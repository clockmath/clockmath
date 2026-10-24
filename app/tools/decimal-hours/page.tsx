'use client';

import React from 'react';
import Link from 'next/link';
import { DecimalHoursTool, minutesToDecimal } from '@/components/DecimalHoursTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import QuickAnswers, { type QuickAnswer } from '@/components/QuickAnswers';
import PrintChartButton from '@/components/PrintChartButton';
import { useDarkMode } from '@/hooks/use-dark-mode';

// "15 minutes in decimal" alone drew 4.5K Copilot citations to this page in
// 3 months (Bing AI Performance, Oct 2026), while "10/20/40/45 minutes in
// decimal" (5K–10K citations each across all sites) barely cited it — only
// 15 had an answer worded the way people ask. So each lead is the query.
const dec = (minutes: number) => minutesToDecimal(minutes).toFixed(2);

const COMMON: QuickAnswer[] = [
  ...[5, 10, 15, 20, 25].map((m) => ({ lead: `${m} minutes in decimal`, rest: `is ${dec(m)} hours (${m}\u00a0÷\u00a060).` })),
  { lead: '30 minutes in decimal', rest: `(half an hour) is ${dec(30)} hours.` },
  ...[35, 40, 45, 50].map((m) => ({ lead: `${m} minutes in decimal`, rest: `is ${dec(m)} hours (${m}\u00a0÷\u00a060).` })),
  { lead: '1 hour 30 minutes', rest: `is ${(1 + minutesToDecimal(30)).toFixed(2)} hours.` },
  { lead: '7 hours 45 minutes', rest: `is ${(7 + minutesToDecimal(45)).toFixed(2)} hours — not 7.45.` },
];

const FAQS = [
  {
    question: 'What is 15 minutes in decimal?',
    answer: `15 minutes is ${dec(15)} hours: 15 ÷ 60 = 0.25, a quarter of an hour. So 8 hours 15 minutes is 8.25 hours.`,
  },
  {
    question: 'What is 45 minutes as a decimal?',
    answer: `45 minutes is ${dec(45)} hours: 45 ÷ 60 = 0.75, three quarters of an hour. So 7 hours 45 minutes is 7.75 hours.`,
  },
  {
    question: 'What is half an hour in decimal?',
    answer: `Half an hour (30 minutes) is ${dec(30)} hours, usually written 0.5. So 7 hours 30 minutes is 7.5 hours.`,
  },
  {
    question: 'How do I convert minutes to decimal hours?',
    answer:
      'Divide the minutes by 60. 45 minutes is 45 ÷ 60 = 0.75, so 7 hours 45 minutes is 7.75 decimal hours. The converter above does this instantly in both directions.',
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
      'Multiply the fraction by 60. For 7.75 hours: 0.75 × 60 = 45, so it’s 7 hours 45 minutes. The decimal-to-hours converter above handles any value, like 8.33 → 8h 20m.',
  },
];

export default function DecimalHoursPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();




  return (
    <StationChrome currentTool="decimal-hours" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Decimal Hours Converter',
          description:
            'Convert hours and minutes to decimal hours (and back) for payroll and timesheets, with the full minutes-to-decimal reference chart.',
          url: 'https://clockmath.com/tools/decimal-hours/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">

        <nav className="st-crumbs" aria-label="Breadcrumb">

          <Link href="/tools/">Tools</Link> / Decimal Hours

        </nav>

        <h1 className="st-h1">Minutes to Decimal Converter</h1>

        <p className="st-lede">Time to decimal hours and back, for timesheets and payroll</p>

      </div>

      <DecimalHoursTool className="mb-section" />

      <QuickAnswers heading="Common minutes to decimal hours" items={COMMON} />

      {/* Explanation */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
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
      <section className="max-w-3xl mx-auto mb-section">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground">
            Minutes to decimal hours chart
          </h2>
          <PrintChartButton />
        </div>
        <p className="text-muted-foreground mb-4">
          Values to two decimal places, the convention most timesheet software uses. Print it on one page to keep by the time clock.
        </p>
        <div className="overflow-x-auto bg-card dark:bg-card rounded-2xl p-4 border border-border/50 dark:border-border/50">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border dark:border-border">
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
                <tr key={row} className="border-b border-border/40 dark:border-border/40">
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
        <p className="text-xs text-muted-foreground mt-3">
          Payroll systems that round punch times (to 6 or 15 minutes) do so before converting; this chart shows the values before that rounding.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">
          Questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          Related tools and guides
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/tools/timesheet" className="text-primary hover:text-primary/80 font-semibold">
              Work hours calculator
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
    </StationChrome>
  );
}
