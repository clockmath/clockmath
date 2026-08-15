/**
 * ToolsHub — the /tools index page content. The "share this link" page:
 * every tool as a tile, with the live market-hours pill. Static except the
 * pill and theme toggle, so the grid is fully crawlable.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Globe,
  ClipboardList,
  CandlestickChart,
  Hourglass,
  Percent,
  Bed,
  Trophy,
  BookOpen,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd from '@/components/JsonLd';
import { MARKETS, getMarketStatus } from '@/lib/markets';

const TILES = [
  {
    href: '/',
    title: 'Time Duration Calculator',
    description: 'The exact time between two times or dates — handles overnight automatically',
    icon: Clock,
  },
  {
    href: '/tools/timesheet',
    title: 'Work Hours & Timesheet',
    description: 'Add up shifts with breaks; decimal hours and gross pay for payroll',
    icon: ClipboardList,
  },
  {
    href: '/tools/market-hours',
    title: 'Stock Market Hours',
    description: 'Live open/closed status for 10 major exchanges in your timezone',
    icon: CandlestickChart,
    live: true,
  },
  {
    href: '/tools/timezone',
    title: 'Timezone Converter',
    description: 'Any two places, with automatic daylight-saving handling',
    icon: Globe,
  },
  {
    href: '/tools/decimal-hours',
    title: 'Decimal Hours Converter',
    description: 'Minutes to decimal (and back) with the full payroll chart',
    icon: Percent,
  },
  {
    href: '/tools/sleep',
    title: 'Sleep Calculator',
    description: 'Hours slept, plus bedtimes that fit 90-minute sleep cycles',
    icon: Bed,
  },
  {
    href: '/tools/countdown',
    title: 'Countdown Timer',
    description: 'Count down to any date — then share it with a link',
    icon: Hourglass,
  },
  {
    href: '/tools/quiz',
    title: 'Daily Time Quiz',
    description: 'Five clock-math questions a day, with an arcade-style leaderboard',
    icon: Trophy,
  },
  {
    href: '/articles',
    title: 'Guides',
    description: 'Practical articles on work hours, payroll time math, and timezones',
    icon: BookOpen,
  },
];

function getItemListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ClockMath free time and date tools',
    itemListElement: TILES.map((tile, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tile.title,
      url: `https://clockmath.com${tile.href === '/' ? '/' : `${tile.href}/`}`,
    })),
  };
}

export default function ToolsHub() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [marketsOpen, setMarketsOpen] = useState<number | null>(null);

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

  useEffect(() => {
    const now = new Date();
    setMarketsOpen(MARKETS.filter((m) => getMarketStatus(m, now).state === 'open').length);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('clockmath-darkmode', next.toString());
      return next;
    });
  }, []);

  return (
    <PageChrome currentTool="tools" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getItemListSchema()} />

      <header className="text-center mb-8 sm:mb-section">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Free time &amp; date tools</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Eight free tools. No signup, no ads in your way — everything runs in your browser.
        </p>
        <nav className="text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <span>All Tools</span>
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-section">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="group bg-card dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-border/50 dark:border-slate-700/50 hover:border-emerald-500/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                {tile.live && marketsOpen !== null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className={`w-1.5 h-1.5 rounded-full ${marketsOpen > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {marketsOpen} of {MARKETS.length} open
                  </span>
                )}
              </div>
              <h2 className="font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {tile.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{tile.description}</p>
            </Link>
          );
        })}
      </div>

      <SiteFooter />
    </PageChrome>
  );
}
