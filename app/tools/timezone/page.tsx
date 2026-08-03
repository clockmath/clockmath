'use client';

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, useCallback } from 'react';
import { TimezoneConverter } from '@/components/TimezoneConverter';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema } from '@/components/JsonLd';

export default function TimezonePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("clockmath-darkmode");
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === "true");
    } else {
      // Check system preference
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("clockmath-darkmode", newDarkMode.toString());
  }, [isDarkMode]);
  return (
    <PageChrome currentTool="timezone" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Timezone Converter',
          description: 'Convert time between any timezone instantly. Auto-detects your location, supports all global timezones, and handles daylight saving time.',
          url: 'https://clockmath.com/tools/timezone/',
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
          <span>Timezone Converter</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0" aria-hidden="true">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Timezone Converter</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Convert time between any two places — DST handled automatically</p>
          </div>
        </div>
      </header>

        {/* Tools Navigation */}
        {/* Timezone Converter */}
        <TimezoneConverter className="mb-section" />


        <SiteFooter />
    </PageChrome>
  );
}
