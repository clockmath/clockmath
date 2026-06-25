'use client';

import { useEffect, useMemo, useState } from 'react';
import { intervalToDuration } from 'date-fns';

interface EventCountdownProps {
  /** Fixed one-off target (e.g. a game release). Ignored if `recurring` is set. */
  target?: Date;
  /**
   * Recurring annual event (e.g. a holiday). `month` is 0-indexed (0 = Jan).
   * The next upcoming occurrence is resolved on the client, so the page never
   * goes stale after the date passes.
   */
  recurring?: { month: number; day: number };
  /**
   * Recurring weekly event (e.g. "the weekend"). `weekday` is 0-indexed
   * (0 = Sunday … 6 = Saturday). Resolves to the next occurrence client-side.
   */
  weekly?: { weekday: number };
  title: string;
  className?: string;
  /** Heading shown once the target has arrived. Defaults to `${title} has released!`. */
  arrivedLabel?: string;
  /**
   * Optional trademark / affiliation disclaimer rendered beneath the timer.
   * Recommended on any event page that names a third-party brand so the page
   * can't be read as official or endorsed (nominative fair use). See
   * buildEventDisclaimer for the standard template.
   */
  disclaimer?: string;
}

/**
 * Reusable disclaimer template for event countdowns that reference a
 * third-party brand. Fill in the brand name and rights holder(s).
 * Example: buildEventDisclaimer('Grand Theft Auto', 'Rockstar Games or Take-Two Interactive')
 */
export function buildEventDisclaimer(brand: string, rightsHolders: string): string {
  return `ClockMath is not affiliated with, endorsed by, or sponsored by ${rightsHolders}. "${brand}" and related names are trademarks of their respective owners. Release date subject to change.`;
}

// Next upcoming occurrence of an annual date, rolling to next year only once
// the day has fully ended (so the page reads correctly on the day itself).
function nextOccurrence(month: number, day: number): number {
  const now = new Date();
  const year = now.getFullYear();
  const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
  const targetYear = now.getTime() > endOfDay.getTime() ? year + 1 : year;
  return new Date(targetYear, month, day, 0, 0, 0, 0).getTime();
}

// Next occurrence of a weekday (0 = Sun … 6 = Sat) at midnight. On the day
// itself the target is today's midnight (already passed → reads as arrived).
function nextWeekday(weekday: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const add = (weekday - today.getDay() + 7) % 7;
  today.setDate(today.getDate() + add);
  return today.getTime();
}

// Display-only live countdown to a fixed or recurring target (event pages).
export function EventCountdown({
  target,
  recurring,
  weekly,
  title,
  className = '',
  arrivedLabel,
  disclaimer,
}: EventCountdownProps) {
  // Fixed targets are stable across server/client, so they can seed state
  // directly. Recurring/weekly targets must be resolved on the client (current
  // date dependent), so they start null and fill in on mount.
  const [targetMs, setTargetMs] = useState<number | null>(
    recurring || weekly ? null : (target ? target.getTime() : null),
  );
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (recurring) setTargetMs(nextOccurrence(recurring.month, recurring.day));
    else if (weekly) setTargetMs(nextWeekday(weekly.weekday));
    setNowMs(Date.now());
    setMounted(true);
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
    // `recurring`/`weekly` are fresh object literals each render; depend on
    // their parts so the effect doesn't re-run on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring?.month, recurring?.day, weekly?.weekday]);

  const ready = mounted && targetMs !== null && nowMs !== null;
  const isPast = ready && (targetMs as number) < (nowMs as number);

  const tiles = useMemo<Array<{ label: string; value: number }>>(() => {
    if (!ready) {
      // Pre-mount / unresolved: render a stable zero skeleton (no mismatch).
      return [
        { label: 'Days', value: 0 },
        { label: 'Hours', value: 0 },
        { label: 'Minutes', value: 0 },
        { label: 'Seconds', value: 0 },
      ];
    }
    const t = targetMs as number;
    const n = nowMs as number;
    const start = isPast ? t : n;
    const end = isPast ? n : t;
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
  }, [ready, nowMs, isPast, targetMs]);

  const dateLabel = useMemo(() => {
    if (targetMs === null) return ' '; // nbsp placeholder to hold layout
    return new Date(targetMs).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [targetMs]);

  return (
    <div
      className={`bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-100 dark:border-slate-700/50 text-center ${className}`}
    >
      <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-1">
        {isPast ? (arrivedLabel ?? `${title} has released!`) : `Until ${title}`}
      </h2>
      <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6" suppressHydrationWarning>
        {dateLabel}
      </p>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3" aria-live="off">
        {tiles.map((unit) => (
          <div
            key={unit.label}
            className="flex-1 min-w-[64px] max-w-[120px] bg-white dark:bg-slate-900/60 rounded-xl py-4 sm:py-5 border border-slate-200 dark:border-slate-700/60 shadow-sm"
          >
            <div className="text-2xl sm:text-4xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400" suppressHydrationWarning>
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
