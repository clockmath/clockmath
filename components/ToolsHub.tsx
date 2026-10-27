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
import { Flap } from '@/components/station/Flap';
import JsonLd from '@/components/JsonLd';
import { MARKETS, getMarketStatus } from '@/lib/markets';
import { useDarkMode } from '@/hooks/use-dark-mode';

// Each tool's answer for its own starting inputs (9:00 AM to 5:30 PM, the
// default shift, 7h 45m, 11 PM to 6:30 AM, 46.5 hours…), on tiles in its line
// colour: what the tool does, at a glance. Live or varying answers (markets,
// time zones, countdowns) have none.
const TILES: Array<{
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  live?: boolean;
  sample?: Array<[string, string]>;
}> = [
  {
    href: '/',
    title: 'Time Duration Calculator',
    description: 'The exact time between two times or dates — handles overnight automatically',
    icon: Clock,
    sample: [['8', 'h'], ['30', 'm']],
  },
  {
    href: '/tools/timesheet',
    title: 'Work Hours Calculator',
    description: 'Add up shifts with breaks; decimal hours and gross pay for payroll',
    icon: ClipboardList,
    sample: [['7.50', 'h']],
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
    // Oct 2026 review: the only rows without a sample read as unfinished
    sample: [['+5', 'h']],
  },
  {
    href: '/tools/decimal-hours',
    title: 'Decimal Hours Converter',
    description: 'Minutes to decimal (and back) with the full payroll chart',
    icon: Percent,
    sample: [['7.75', '']],
  },
  {
    href: '/tools/sleep',
    title: 'Sleep Calculator',
    description: 'Hours slept, plus bedtimes that fit 90-minute sleep cycles',
    icon: Bed,
    sample: [['7', 'h'], ['30', 'm']],
  },
  {
    href: '/tools/countdown',
    title: 'Countdown Timer',
    description: 'Count down to any date — then share it with a link',
    icon: Hourglass,
    sample: [['42', 'd']],
  },
  {
    href: '/tools/overtime',
    title: 'Overtime Calculator',
    description: 'Regular vs overtime split, and what time and a half really pays',
    icon: AlarmClockPlus,
    sample: [['40', '+'], ['6.5', 'h']],
  },
  {
    href: '/tools/quiz',
    title: 'Daily Time Quiz',
    description: 'Five clock-math questions a day, with an arcade-style leaderboard',
    icon: Trophy,
    sample: [['60', 's']],
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
              {tile.sample && (
                <span className="st-hub-sample" aria-hidden="true">
                  {tile.sample.map(([value, unit]) => (
                    <span key={value}>
                      <Flap value={value} />
                      {unit && <small>{unit}</small>}
                    </span>
                  ))}
                </span>
              )}
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
