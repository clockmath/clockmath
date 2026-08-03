'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Hourglass } from 'lucide-react';
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

      {/* Header — slim: brand lives in the nav; the page leads with what it is */}
      <header className="mb-6 sm:mb-8">
        <nav className="text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <span>Countdown Timer</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <Hourglass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Countdown Timer</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Count down to any date — and share it with a link</p>
          </div>
        </div>
      </header>

      <CountdownTool className="mb-8" />

      <SiteFooter />
    </PageChrome>
  );
}
