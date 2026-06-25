'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { EventCountdown } from '@/components/EventCountdown';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';

// Single source of truth for the release date — easy to update if it slips
// again (Nov 19, 2026, local midnight).
const GTA6_RELEASE = new Date(2026, 10, 19);

const FACTS: Array<{ label: string; value: string }> = [
  { label: 'Release date', value: 'November 19, 2026' },
  { label: 'Platforms', value: 'PlayStation 5, Xbox Series X|S' },
  { label: 'Pre-orders', value: 'Open now' },
];

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: 'When does GTA 6 come out?',
    answer:
      'Grand Theft Auto VI is scheduled to release on Thursday, November 19, 2026, according to Rockstar Games.',
  },
  {
    question: 'What platforms is GTA 6 releasing on?',
    answer: 'GTA 6 launches on PlayStation 5 and Xbox Series X|S.',
  },
  {
    question: 'Is there a GTA 6 PC release date?',
    answer:
      'Rockstar has not announced a PC release date. Previous Grand Theft Auto titles came to PC some time after their console launch.',
  },
  {
    question: 'Can I pre-order GTA 6?',
    answer: 'Yes — pre-orders for Grand Theft Auto VI are open at digital storefronts and select retailers.',
  },
];

export default function Gta6CountdownPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('clockmath-darkmode');
    if (saved) setIsDarkMode(saved === 'true');
    else setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
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
    <PageChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(FAQS)} />

      {/* Header */}
      <header className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">GTA 6</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </h1>
        <p className="text-slate-700 dark:text-emerald-200 text-base sm:text-lg font-medium mt-1">
          Time until Grand Theft Auto VI releases
        </p>
        <nav className="text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <Link href="/tools/countdown/" className="hover:text-primary transition-colors">
            Countdown
          </Link>
          <span className="mx-2">›</span>
          <span>GTA 6</span>
        </nav>
      </header>

      <EventCountdown target={GTA6_RELEASE} title="GTA 6" className="mb-6" />

      {/* Facts */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        {FACTS.map((f) => (
          <div
            key={f.label}
            className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 dark:border-slate-700/50 text-center"
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</div>
            <div className="font-semibold text-foreground dark:text-slate-100 mt-1">{f.value}</div>
          </div>
        ))}
      </div>

      {/* Intro */}
      <div className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50 mb-6">
        <p className="text-foreground dark:text-slate-200 leading-relaxed">
          The wait for <strong>Grand Theft Auto VI</strong> is almost over. Rockstar Games has set the
          release for <strong>November 19, 2026</strong> on PlayStation 5 and Xbox Series X|S. The live
          countdown above shows exactly how many days, hours, minutes, and seconds remain until launch —
          updating every second.
        </p>
      </div>

      {/* FAQ */}
      <section className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50 mb-6">
        <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-foreground dark:text-slate-100">{faq.question}</h3>
              <p className="text-muted-foreground dark:text-slate-400 mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground mb-3">Want a countdown to your own event?</p>
        <Link
          href="/tools/countdown/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
        >
          Make your own countdown
        </Link>
      </div>

      <SiteFooter />
    </PageChrome>
  );
}
