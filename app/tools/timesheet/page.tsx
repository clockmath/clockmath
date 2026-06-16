'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TimesheetTool } from '@/components/TimesheetTool';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema } from '@/components/JsonLd';

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

      <SiteFooter />
    </PageChrome>
  );
}
