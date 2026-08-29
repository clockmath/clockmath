'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AlarmClockPlus } from 'lucide-react';
import { OvertimeTool } from '@/components/OvertimeTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'How is overtime pay calculated?',
    answer:
      'Multiply your regular hourly rate by the overtime multiplier — usually 1.5 — then by the overtime hours. At $18/hour, time and a half is $27/hour, so 6 overtime hours pay 6 × $27 = $162 on top of regular wages.',
  },
  {
    question: 'What is time and a half of my rate?',
    answer:
      'Time and a half is your hourly rate multiplied by 1.5. For example, $15 becomes $22.50, $18 becomes $27, and $22 becomes $33 per overtime hour. Enter your rate in the calculator to see it exactly.',
  },
  {
    question: 'When does overtime start?',
    answer:
      'Under the US federal FLSA, overtime starts after 40 hours in a workweek for non-exempt employees. Some states add daily overtime — California, for example, requires overtime after 8 hours in a single day — and some contracts or countries use different thresholds, which is why the threshold is adjustable here.',
  },
  {
    question: 'What is double time and when does it apply?',
    answer:
      'Double time is twice the regular rate. Federal law does not require it, but some states and union contracts do — California requires double time after 12 hours in a day, and some employers pay it for holidays. Switch the calculator to 2× to compute it.',
  },
  {
    question: 'Does this calculator give legal or tax advice?',
    answer:
      'No — it does the arithmetic. Overtime eligibility depends on your jurisdiction, your exemption status, and your contract, and the figures here are gross pay before taxes and deductions. Check your local labor rules or payroll department for the rules that apply to you.',
  },
];

export default function OvertimePage() {
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
    <PageChrome currentTool="overtime" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Overtime Calculator',
          description:
            'Split weekly hours into regular and overtime time, and calculate time-and-a-half or double-time pay with an adjustable overtime threshold.',
          url: 'https://clockmath.com/tools/overtime/',
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
          <span>Overtime</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <AlarmClockPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Overtime Calculator</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Regular vs overtime hours, and what time and a half really pays
            </p>
          </div>
        </div>
      </header>

      <OvertimeTool className="mb-section" />

      {/* Explanation */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          How the overtime math works
        </h2>
        <p className="text-muted-foreground mb-3">
          Hours up to your overtime threshold pay at your regular rate; everything beyond it pays at
          the overtime rate — your regular rate times the multiplier. The US federal baseline (FLSA)
          is <strong className="text-foreground">1.5× after 40 hours in a workweek</strong>, which is
          where &ldquo;time and a half&rdquo; comes from.
        </p>
        <p className="text-muted-foreground mb-3">
          Worked example: 46.5 hours at $18/hour with a 40-hour threshold splits into 40 regular
          hours (40 × $18 = <strong className="text-foreground">$720</strong>) and 6.5 overtime hours
          at $27 (6.5 × $27 = <strong className="text-foreground">$175.50</strong>) — total gross pay{' '}
          <strong className="text-foreground">$895.50</strong>.
        </p>
        <p className="text-muted-foreground">
          The threshold and multiplier are adjustable because rules differ: some US states add daily
          overtime (California requires 1.5× after 8 hours in a day and 2× after 12), many countries
          set weekly thresholds other than 40, and some contracts pay double time for holidays. This
          calculator does the arithmetic for whatever rule applies to you — it isn&apos;t legal advice.
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
              <p className="text-sm text-muted-foreground dark:text-slate-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="max-w-3xl mx-auto mb-section text-sm text-muted-foreground dark:text-slate-400">
        <p>
          Building your total from individual shifts? The{' '}
          <Link href="/tools/timesheet" className="underline underline-offset-4 hover:text-foreground">
            work hours calculator
          </Link>{' '}
          adds them up with breaks. Converting minutes for payroll? Try the{' '}
          <Link href="/tools/decimal-hours" className="underline underline-offset-4 hover:text-foreground">
            decimal hours converter
          </Link>
          , or read the{' '}
          <Link href="/articles/overtime-hours-calculator" className="underline underline-offset-4 hover:text-foreground">
            guide to calculating overtime hours
          </Link>
          .
        </p>
      </section>

      <SiteFooter />
    </PageChrome>
  );
}
