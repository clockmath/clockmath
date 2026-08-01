/**
 * MarketHoursTool component for ClockMath.com
 * Live stock market hours in the visitor's timezone: open/closed status,
 * countdowns to the next open/close, and pinnable exchange cards.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Star } from 'lucide-react';
import {
  MARKETS,
  getMarketStatus,
  getStateLabel,
  formatCountdown,
  type Market,
  type MarketState,
  type MarketStatus,
} from '@/lib/markets';
import { getUserTimeZone, formatZoned, getTimeZoneDisplayName } from '@/lib/time';
import { event as gaEvent, toolUsed } from '@/lib/gtag';

const PINNED_KEY = 'clockmath-pinned-markets';

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop';

interface MarketHoursToolProps {
  className?: string;
}

const STATE_BADGE: Record<MarketState, string> = {
  open: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'pre-market': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'after-hours': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  lunch: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  closed: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

const STATE_DOT: Record<MarketState, string> = {
  open: 'bg-emerald-500',
  'pre-market': 'bg-amber-500',
  'after-hours': 'bg-amber-500',
  lunch: 'bg-sky-500',
  closed: 'bg-slate-400',
};

// Sort weight: pinned handled separately; among the rest, trading states
// first, then closed markets by soonest reopen.
const STATE_WEIGHT: Record<MarketState, number> = {
  open: 0,
  lunch: 1,
  'pre-market': 2,
  'after-hours': 3,
  closed: 4,
};

const TRANSITION_VERB: Record<MarketStatus['nextTransitionLabel'], string> = {
  opens: 'Opens',
  closes: 'Closes',
  resumes: 'Resumes',
};

export function MarketHoursTool({ className = '' }: MarketHoursToolProps) {
  const toolUsedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [hour12, setHour12] = useState(true);
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    setIsHydrated(true);
    setNowMs(Date.now());

    try {
      const savedPins = window.localStorage.getItem(PINNED_KEY);
      if (savedPins) setPinned(JSON.parse(savedPins));
    } catch {
      /* ignore */
    }

    // Shared preference with the other tools
    const saved12Hour = window.localStorage.getItem('clockmath-hour12');
    if (saved12Hour !== null) setHour12(saved12Hour === 'true');
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isHydrated]);

  const markToolUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('market_hours', { device: getDevice() });
    }
  }, []);

  // Note: deliberately not counted as tool use — the format toggle is a
  // cosmetic preference (TimezoneConverter treats the same toggle the same way).
  const setHourFormat = useCallback((is12: boolean) => {
    setHour12(is12);
    try {
      window.localStorage.setItem('clockmath-hour12', is12.toString());
    } catch {
      /* ignore */
    }
  }, []);

  const togglePin = useCallback(
    (marketId: string) => {
      setPinned((prev) => {
        const next = prev.includes(marketId)
          ? prev.filter((id) => id !== marketId)
          : [...prev, marketId];
        try {
          window.localStorage.setItem(PINNED_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      gaEvent({ action: 'market_pinned', params: { device: getDevice(), market: marketId } });
      markToolUsed();
    },
    [markToolUsed],
  );

  const userTZ = useMemo(() => (isHydrated ? getUserTimeZone() : 'UTC'), [isHydrated]);

  const statuses = useMemo(() => {
    const now = new Date(nowMs);
    return MARKETS.map((market) => ({ market, status: getMarketStatus(market, now) }));
  }, [nowMs]);

  const sorted = useMemo(() => {
    const rank = (entry: { market: Market; status: MarketStatus }) => {
      const pinIndex = pinned.indexOf(entry.market.id);
      return {
        pinRank: pinIndex === -1 ? Number.MAX_SAFE_INTEGER : pinIndex,
        stateRank: STATE_WEIGHT[entry.status.state],
        nextMs: entry.status.nextTransition.getTime(),
      };
    };
    return [...statuses].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra.pinRank !== rb.pinRank) return ra.pinRank - rb.pinRank;
      if (ra.stateRank !== rb.stateRank) return ra.stateRank - rb.stateRank;
      return ra.nextMs - rb.nextMs;
    });
  }, [statuses, pinned]);

  const openCount = statuses.filter((s) => s.status.state === 'open').length;
  const uncuratedNames = MARKETS.filter((m) => !m.holidays)
    .map((m) => m.shortName)
    .join(', ');

  // Static-export friendly: the server-rendered shell shows a loading card and
  // the live grid appears after hydration (status depends on the real clock).
  if (!isHydrated) {
    return (
      // min-height approximates the hydrated grid so the swap doesn't cause a
      // large layout shift (CLS) below the placeholder.
      <div className={`bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 dark:border-slate-700/50 min-h-[640px] ${className}`}>
        <p className="text-center text-muted-foreground py-12">Loading live market hours…</p>
      </div>
    );
  }

  const now = new Date(nowMs);
  const todayInUserTz = formatZoned(now, userTZ).date;

  return (
    <div className={className}>
      {/* Summary bar */}
      <div className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-4 shadow-xl border border-border/50 dark:border-slate-700/50 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">
            {openCount === 0 ? 'No markets open right now' : `${openCount} of ${MARKETS.length} markets open`}
          </p>
          <p className="text-sm text-muted-foreground">
            All times shown in your timezone — {getTimeZoneDisplayName(userTZ)}
          </p>
        </div>
        <div className="flex bg-muted/50 dark:bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => setHourFormat(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
              hour12
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            12h
          </button>
          <button
            onClick={() => setHourFormat(false)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
              !hour12
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            24h
          </button>
        </div>
      </div>

      {/* Market cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map(({ market, status }) => {
          const isPinned = pinned.includes(market.id);
          const sessionTimes = status.sessions
            .map((s) => {
              const open = formatZoned(s.openUtc, userTZ, { hour12 });
              const close = formatZoned(s.closeUtc, userTZ, { hour12 });
              return `${open.time} – ${close.time}`;
            })
            .join(' · ');
          const sessionDay = status.sessions[0]
            ? formatZoned(status.sessions[0].openUtc, userTZ)
            : null;
          const sessionDayLabel =
            sessionDay && sessionDay.date !== todayInUserTz ? `${sessionDay.weekday} ` : '';
          const localHours = market.sessions.map((s) => `${s.open}–${s.close}`).join(', ');

          return (
            <div
              key={market.id}
              className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-xl border border-border/50 dark:border-slate-700/50"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl" aria-hidden="true">{market.flag}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground leading-tight">{market.shortName}</h3>
                    <p className="text-xs text-muted-foreground truncate">{market.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATE_BADGE[status.state]}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[status.state]} ${status.state === 'open' ? 'animate-pulse' : ''}`} />
                    {getStateLabel(status.state)}
                  </span>
                  <button
                    onClick={() => togglePin(market.id)}
                    aria-label={isPinned ? `Unpin ${market.shortName}` : `Pin ${market.shortName} to top`}
                    aria-pressed={isPinned}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isPinned
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <p className="text-lg font-semibold text-foreground mb-1">
                {TRANSITION_VERB[status.nextTransitionLabel]} in{' '}
                <span className="font-mono text-primary">
                  {formatCountdown(status.nextTransition, new Date(nowMs))}
                </span>
              </p>

              <p className="text-sm text-muted-foreground">
                {sessionDayLabel}
                {sessionTimes || '—'} your time
              </p>
              <p className="text-xs text-muted-foreground/70">
                {localHours} in {market.city}
              </p>

              {(status.holidayName || status.isHalfDay) && (
                <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {status.holidayName ? `Closed today — ${status.holidayName}` : 'Shortened trading day today'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground/70 text-center">
        Regular trading hours with automatic DST handling. Holiday closures included for NYSE, NASDAQ,
        and LSE; {uncuratedNames} show regular weekday hours only.
      </p>
    </div>
  );
}
