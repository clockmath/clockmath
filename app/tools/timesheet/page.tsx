'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TimesheetTool } from '@/components/TimesheetTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'How do I calculate my work hours?',
    answer:
      'Enter each shift’s start time, end time, and unpaid break minutes. The calculator subtracts the break and totals every shift — for example, 9:00 AM to 5:30 PM with a 30-minute lunch is 8.00 hours. Add your hourly rate to see gross pay for the period.',
  },
  {
    question: 'How are lunch and breaks deducted?',
    answer:
      'Break minutes are subtracted from each shift as unpaid time. A 7:00 AM–3:30 PM shift with a 30-minute lunch counts as 8.00 hours, not 8.50. If your breaks are paid, leave the break field at 0.',
  },
  {
    question: 'Does it handle overnight shifts?',
    answer:
      'Yes. When the end time is earlier than the start time, the shift is treated as crossing midnight — 11:00 PM to 7:30 AM counts as 8.5 hours and is marked “+1 day.”',
  },
  {
    question: 'Why does payroll use decimal hours?',
    answer:
      'Pay is calculated as hours × rate, which needs hours as a decimal. 7 hours 45 minutes is 7.75 hours because 45 ÷ 60 = 0.75. The calculator shows both formats for every shift and for the total.',
  },
  {
    question: 'Does the calculator compute overtime pay?',
    answer:
      'It totals your hours and gross pay at one rate. It doesn’t split regular from overtime hours — overtime rules vary by country and state (US federal law generally requires 1.5× pay past 40 hours in a week; some states add daily thresholds). Total your hours here, then apply your local rule.',
  },
  {
    question: 'Is my timesheet data private?',
    answer:
      'Yes. Shifts are saved only in your browser’s local storage — nothing is uploaded. Share links encode the timesheet in the URL itself, so only people you give the link to can see it.',
  },
];

// Common minute values payroll teams look up (minutes ÷ 60, rounded to 2dp)
const DECIMAL_ROWS: Array<[string, string]> = [
  ['5 min', '0.08'],
  ['10 min', '0.17'],
  ['15 min', '0.25'],
  ['20 min', '0.33'],
  ['30 min', '0.50'],
  ['40 min', '0.67'],
  ['45 min', '0.75'],
  ['50 min', '0.83'],
];

export default function TimesheetPage() {
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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('clockmath-darkmode', next.toString());
      return next;
    });
  }, []);

  return (
    <PageChrome currentTool="timesheet" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Work Hours & Timesheet Calculator',
          description:
            'Add up your shifts to get total work hours, decimal hours for payroll, and gross pay. Save timesheets and export a summary.',
          url: 'https://clockmath.com/tools/timesheet/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />
      <Toaster />

      {/* Header */}
      <header className="text-center mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-lg border border-slate-700 dark:border-slate-600">
              <svg width="80" height="80" viewBox="0 0 80 80" className="w-12 sm:w-16 h-12 sm:h-16">
                <circle cx="40" cy="40" r="39.5" fill="white" stroke="#1e293b" strokeWidth="1" />
                {/* Clipboard */}
                <rect x="26" y="20" width="28" height="40" rx="3" fill="none" stroke="#059669" strokeWidth="3" />
                <rect x="34" y="16" width="12" height="7" rx="2" fill="#dc2626" />
                <path d="M32 34h16M32 42h16M32 50h10" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">Work Hours</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">Calculator</span>
            </h1>
            <p className="text-slate-700 dark:text-emerald-200 text-base sm:text-lg font-medium">
              Total your shifts for the pay period
            </p>
          </div>
        </div>

        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <span>Timesheet</span>
        </nav>
      </header>

      <TimesheetTool className="mb-8" />

      {/* Supporting content — static JSX, fully server-rendered for crawlers */}
      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          How to use the work hours calculator
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Add a shift</strong> — pick the date, start time, and
            end time. Overnight shifts are detected automatically when the end time is earlier than
            the start.
          </li>
          <li>
            <strong className="text-foreground">Enter unpaid break minutes</strong> — a 30-minute
            lunch on a 9:00–5:30 shift brings it from 8.5 down to 8.00 hours.
          </li>
          <li>
            <strong className="text-foreground">Repeat for the pay period</strong> — daily, weekly,
            or biweekly. Every shift shows hours two ways: h&nbsp;m and decimal.
          </li>
          <li>
            <strong className="text-foreground">Add your hourly rate</strong> (optional) to see gross
            pay, then save, share, or export the timesheet as text or CSV.
          </li>
        </ol>
        <p className="text-muted-foreground">
          Your timesheet saves automatically in this browser — nothing is uploaded — and it&apos;s
          here when you come back.
        </p>
      </section>

      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          A worked payroll example
        </h2>
        <p className="text-muted-foreground mb-3">
          Five shifts of 8:30 AM – 5:00 PM with a 30-minute unpaid lunch each day: every shift is 8.5
          clock hours minus 0.5 for the break, so <strong className="text-foreground">8.00 hours per
          day → 40.00 hours for the week</strong>. At $18.50/hour, gross pay is 40 × $18.50 ={' '}
          <strong className="text-foreground">$740.00</strong>. The calculator does this per shift,
          so mixed schedules — a 6-hour Tuesday, a 10-hour Friday, an overnight Saturday — total just
          as easily.
        </p>
        <p className="text-muted-foreground">
          Note the calculator totals hours at one rate and doesn&apos;t split out overtime — see the{' '}
          <Link
            href="/articles/overtime-hours-calculator"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            overtime hours guide
          </Link>{' '}
          for how time-and-a-half typically applies past 40 hours a week.
        </p>
      </section>

      <section id="decimal-hours" className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          Minutes to decimal hours
        </h2>
        <p className="text-muted-foreground mb-4">
          Payroll multiplies hours × rate, so minutes must become decimals: divide by 60. Forty-five
          minutes is 45 ÷ 60 = 0.75, so 7&nbsp;h&nbsp;45&nbsp;m is 7.75 hours. Common values below —
          for any other value (or the reverse conversion), use the{' '}
          <Link
            href="/tools/decimal-hours"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            decimal hours converter
          </Link>
          :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md mx-auto text-sm border-collapse">
            <thead>
              <tr className="border-b border-border dark:border-slate-700">
                <th scope="col" className="text-left py-2 px-3 font-semibold text-foreground">Minutes</th>
                <th scope="col" className="text-left py-2 px-3 font-semibold text-foreground">Decimal hours</th>
                <th scope="col" className="text-left py-2 px-3 font-semibold text-foreground">Minutes</th>
                <th scope="col" className="text-left py-2 px-3 font-semibold text-foreground">Decimal hours</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-border/50 dark:border-slate-700/50">
                  <td className="py-1.5 px-3 text-muted-foreground">{DECIMAL_ROWS[i][0]}</td>
                  <td className="py-1.5 px-3 font-mono text-foreground">{DECIMAL_ROWS[i][1]}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{DECIMAL_ROWS[i + 4][0]}</td>
                  <td className="py-1.5 px-3 font-mono text-foreground">{DECIMAL_ROWS[i + 4][1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Related tools & guides */}
      <section className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          Related tools and guides
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
              Time duration calculator
            </Link>{' '}
            — the exact time between any two times, including across midnight
          </li>
          <li>
            <Link href="/articles/timesheet-calculator" className="text-primary hover:text-primary/80 font-semibold">
              Timesheet calculator guide
            </Link>{' '}
            — weekly totals and decimal conversions for payroll, step by step
          </li>
          <li>
            <Link href="/articles/shift-work-hours-calculator" className="text-primary hover:text-primary/80 font-semibold">
              Shift work hours guide
            </Link>{' '}
            — overnight and rotating schedules
          </li>
          <li>
            <Link href="/articles/freelancer-time-tracking" className="text-primary hover:text-primary/80 font-semibold">
              Freelancer time tracking guide
            </Link>{' '}
            — billable hours and client invoicing
          </li>
        </ul>
      </section>

      <SiteFooter />
    </PageChrome>
  );
}
