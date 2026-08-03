'use client';

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, useCallback } from 'react';
import { MarketHoursTool } from '@/components/MarketHoursTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import Link from 'next/link';
import { CandlestickChart } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'What time does the New York Stock Exchange open in my timezone?',
    answer:
      'The NYSE trades 9:30 AM to 4:00 PM Eastern Time, Monday through Friday. This page converts that automatically to your local timezone — including daylight saving time on both ends, which shifts the difference by an hour for a few weeks each spring and fall.',
  },
  {
    question: 'Is the stock market open today?',
    answer:
      'The status badges above update live. US markets close for about ten holidays a year (New Year’s Day, Thanksgiving, Christmas, and others) and close early at 1:00 PM Eastern on a few half days — those closures are built into this page for the NYSE, NASDAQ, and LSE.',
  },
  {
    question: 'Why do Tokyo and Hong Kong show a lunch break?',
    answer:
      'Several Asian exchanges pause trading midday. Tokyo halts from 11:30 AM to 12:30 PM local time, Hong Kong from noon to 1:00 PM, and Shanghai from 11:30 AM to 1:00 PM. The cards show a “Lunch break” status during the pause and count down to the afternoon session.',
  },
  {
    question: 'What are pre-market and after-hours trading?',
    answer:
      'US exchanges support electronic trading outside regular sessions — pre-market from 4:00 AM Eastern and after-hours until 8:00 PM Eastern. Liquidity is thinner and spreads are wider, but these windows matter for reacting to earnings reports and overnight news.',
  },
];

export default function MarketHoursPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('clockmath-darkmode');
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
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
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('clockmath-darkmode', newDarkMode.toString());
  }, [isDarkMode]);

  return (
    <PageChrome currentTool="market-hours" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Stock Market Hours',
          description:
            'Live open/closed status for major stock exchanges worldwide, converted to your local timezone with countdowns to the next open and close.',
          url: 'https://clockmath.com/tools/market-hours/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />
      <Toaster />

      {/* Header — slim: brand lives in the nav; the page leads with what it is */}
      <header className="mb-6 sm:mb-8">
        <nav className="text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <span>Market Hours</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <CandlestickChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Stock Market Hours</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Is the market open? Every exchange, your timezone</p>
          </div>
        </div>
      </header>

      {/* Live market grid */}
      <MarketHoursTool className="mb-section" />

      {/* SEO / help content */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
          World stock market trading hours, converted for you
        </h2>
        <p className="text-muted-foreground mb-3">
          Global markets hand off around the clock: Sydney and Tokyo open the day, Hong Kong and
          Shanghai follow, Europe takes over mid-morning, and New York carries the close. Each card
          above converts an exchange's official trading session to your local clock and counts down
          to its next open or close — no mental timezone math, and no getting caught out by
          daylight saving shifts that move the gap by an hour twice a year.
        </p>
        <p className="text-muted-foreground">
          Want to convert a specific meeting or market event instead? Use the{' '}
          <Link href="/tools/timezone" className="text-primary hover:text-primary/80 font-semibold">
            timezone converter
          </Link>
          , or read our{' '}
          <Link
            href="/articles/stock-market-timezone-converter"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            guide to trading across timezones
          </Link>
          .
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

      <SiteFooter />
    </PageChrome>
  );
}
