'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CountdownTool } from '@/components/CountdownTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema } from '@/components/JsonLd';

export default function CountdownPage() {
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
    <PageChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Countdown Timer',
          description:
            'Create a live countdown to any date and time, then share it with a link. Counts down days, hours, minutes, and seconds.',
          url: 'https://clockmath.com/tools/countdown/',
        })}
      />
      <Toaster />

      {/* Header */}
      <header className="text-center mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-lg border border-slate-700 dark:border-slate-600">
              <svg width="80" height="80" viewBox="0 0 80 80" className="w-12 sm:w-16 h-12 sm:h-16">
                <circle cx="40" cy="40" r="39.5" fill="white" stroke="#1e293b" strokeWidth="1" />
                {/* hourglass */}
                <path d="M28 22 H52 L42 40 L52 58 H28 L38 40 Z" fill="none" stroke="#059669" strokeWidth="3" strokeLinejoin="round" />
                <path d="M40 40 L34 54 H46 Z" fill="#dc2626" />
                <line x1="26" y1="22" x2="54" y2="22" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                <line x1="26" y1="58" x2="54" y2="58" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">Countdown</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">Timer</span>
            </h1>
            <p className="text-slate-700 dark:text-emerald-200 text-base sm:text-lg font-medium">
              Count down to any date — and share it
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <span>Countdown Timer</span>
        </nav>
      </header>

      <CountdownTool className="mb-8" />

      <SiteFooter />
    </PageChrome>
  );
}
