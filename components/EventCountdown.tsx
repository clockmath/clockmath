'use client';

import { useEffect, useMemo, useState } from 'react';
import { intervalToDuration } from 'date-fns';

interface EventCountdownProps {
  target: Date;
  title: string;
  className?: string;
  /**
   * Optional trademark / affiliation disclaimer rendered beneath the timer.
   * Recommended on any event page that names a third-party brand so the page
   * can't be read as official or endorsed (nominative fair use). See
   * EVENT_DISCLAIMER for the standard template.
   */
  disclaimer?: string;
}

/**
 * Reusable disclaimer template for event countdowns that reference a
 * third-party brand. Fill in the brand name and rights holder(s).
 * Example: buildEventDisclaimer('Grand Theft Auto', 'Rockstar Games and Take-Two Interactive')
 */
export function buildEventDisclaimer(brand: string, rightsHolders: string): string {
  return `ClockMath is not affiliated with, endorsed by, or sponsored by ${rightsHolders}. "${brand}" and related names are trademarks of their respective owners. Release date subject to change.`;
}

// Display-only live countdown to a fixed target (used by event landing pages).
export function EventCountdown({ target, title, className = '', disclaimer }: EventCountdownProps) {
  const targetMs = target.getTime();
  // Before mount nowMs === targetMs so the breakdown is all zeros and matches
  // the server render (no hydration mismatch); the live value kicks in on mount.
  const [nowMs, setNowMs] = useState(targetMs);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNowMs(Date.now());
    setMounted(true);
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isPast = mounted && targetMs < nowMs;

  const tiles = useMemo<Array<{ label: string; value: number }>>(() => {
    const start = isPast ? targetMs : nowMs;
    const end = isPast ? nowMs : targetMs;
    const d = intervalToDuration({ start, end });
    const years = d.years ?? 0;
    const months = d.months ?? 0;
    const list: Array<{ label: string; value: number }> = [];
    if (years > 0) list.push({ label: 'Years', value: years });
    if (years > 0 || months > 0) list.push({ label: 'Months', value: months });
    list.push({ label: 'Days', value: d.days ?? 0 });
    list.push({ label: 'Hours', value: d.hours ?? 0 });
    list.push({ label: 'Minutes', value: d.minutes ?? 0 });
    list.push({ label: 'Seconds', value: d.seconds ?? 0 });
    return list;
  }, [nowMs, isPast, targetMs]);

  const dateLabel = useMemo(
    () =>
      new Date(targetMs).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [targetMs],
  );

  return (
    <div
      className={`bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-100 dark:border-slate-700/50 text-center ${className}`}
    >
      <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-1">
        {isPast ? `${title} has released!` : `Until ${title}`}
      </h2>
      <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">{dateLabel}</p>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3" aria-live="off">
        {tiles.map((unit) => (
          <div
            key={unit.label}
            className="flex-1 min-w-[64px] max-w-[120px] bg-white dark:bg-slate-900/60 rounded-xl py-4 sm:py-5 border border-slate-200 dark:border-slate-700/60 shadow-sm"
          >
            <div className="text-2xl sm:text-4xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
              {unit.value.toLocaleString()}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1">
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      {disclaimer && (
        <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-slate-500 mt-6 max-w-2xl mx-auto">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
