/**
 * ToolsHub — the /tools index page content. The "share this link" page:
 * every tool as a tile, with the live market-hours pill. Static except the
 * pill and theme toggle, so the grid is fully crawlable.
 */

'use client';

import { useState, useEffect } from 'react';
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
  AlarmClockPlus,
  BookOpen,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import { lineForHref } from '@/lib/lines';
import JsonLd from '@/components/JsonLd';
import { MARKETS, getMarketStatus } from '@/lib/markets';
import { useDarkMode } from '@/hooks/use-dark-mode';

const TILES = [
  {
    href: '/',
    title: 'Time Duration Calculator',
    description: 'The exact time between two times or dates — handles overnight automatically',
    icon: Clock,
  },
  {
    href: '/tools/timesheet',
    title: 'Work Hours Calculator',
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
    title: 'Time Zone Converter',
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
    href: '/tools/overtime',
    title: 'Overtime Calculator',
    description: 'Regular vs overtime split, and what time and a half really pays',
    icon: AlarmClockPlus,
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
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [marketsOpen, setMarketsOpen] = useState<number | null>(null);



  useEffect(() => {
    const now = new Date();
    setMarketsOpen(MARKETS.filter((m) => getMarketStatus(m, now).state === 'open').length);
  }, []);


  return (
    <StationChrome currentTool="tools" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getItemListSchema()} />

      <div className="st-intro">
        <h1 className="st-h1">Free time &amp; date tools</h1>
        <p className="st-lede">Nine free tools. No signup, no ads.</p>
      </div>

      {/* A departures board: one ruled row per tool */}
      <ul className="st-hub">
        {TILES.map((tile) => (
          <li key={tile.href} data-line={lineForHref(tile.href) ?? undefined}>
            <Link href={tile.href}>
              <span className="st-hub-title">{tile.title}</span>
              <span className="st-hub-desc">{tile.description}</span>
              {tile.live && marketsOpen !== null && (
                <span className="st-hub-live">
                  <i className={marketsOpen > 0 ? 'open' : undefined} aria-hidden="true" />
                  {marketsOpen} of {MARKETS.length} open
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <SiteFooter />
    </StationChrome>
  );
}
