'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildDay } from '@/lib/buildDay';
import { intervalToDuration } from 'date-fns';

export interface EventCountdownProps {
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
  weekly?: { weekday: number; spanDays?: number };
  /**
   * Recurring nth-weekday-of-month event (e.g. Thanksgiving = 4th Thursday
   * of November → { month: 10, weekday: 4, n: 4 }). `offsetDays` shifts the
   * result (Black Friday = same rule with offsetDays: 1). Month and weekday
   * are 0-indexed like the other recurrences.
   */
  nthWeekday?: { month: number; weekday: number; n: number; offsetDays?: number };
  /**
   * Events on a calendar this code doesn't compute (Hanukkah: Hebrew calendar),
   * as explicit date ranges, YYYY-MM-DD, inclusive. Counts to the next start;
   * between start and end the event reads as arrived instead of jumping to
   * next year.
   */
  dateRanges?: ReadonlyArray<{ start: string; end?: string }>;
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

export { buildEventDisclaimer } from '@/lib/disclaimer';

// Next upcoming occurrence of an annual date, rolling to next year only once
// the day has fully ended (so the page reads correctly on the day itself).
function nextOccurrence(month: number, day: number, now = new Date()): number {
  const year = now.getFullYear();
  const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
  const targetYear = now.getTime() > endOfDay.getTime() ? year + 1 : year;
  return new Date(targetYear, month, day, 0, 0, 0, 0).getTime();
}

// Next occurrence of a weekday (0 = Sun … 6 = Sat) at midnight. While inside
// the event window (`spanDays` days starting at the target weekday) the target
// is the window's start midnight — already passed → reads as arrived. The
// weekend page spans Sat+Sun, so Sunday still reads "It's the weekend!"
// instead of counting 6 days to the next Saturday.
function nextWeekday(weekday: number, spanDays = 1, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceLast = (today.getDay() - weekday + 7) % 7;
  if (daysSinceLast < spanDays) {
    today.setDate(today.getDate() - daysSinceLast);
    return today.getTime();
  }
  const add = (weekday - today.getDay() + 7) % 7 || 7;
  today.setDate(today.getDate() + add);
  return today.getTime();
}

// The nth `weekday` of `month` in `year`, plus `offsetDays`, at midnight.
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number, offsetDays = 0): Date {
  const first = new Date(year, month, 1);
  const firstOccurrence = 1 + ((weekday - first.getDay() + 7) % 7);
  return new Date(year, month, firstOccurrence + (n - 1) * 7 + offsetDays, 0, 0, 0, 0);
}

// " That's 6 weeks." / " That's 5 weeks and 3 days." — empty under a week
// or beyond a year (nobody counts 91 weeks). Mirrored in
// scripts/worker/live-counts.js; keep the two in step.
export function weeksPhrase(days: number): string {
  if (days < 7 || days > 365) return '';
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  const w = weeks === 1 ? '1 week' : `${weeks.toLocaleString()} weeks`;
  return rest ? ` That's ${w} and ${rest === 1 ? '1 day' : `${rest} days`}.` : ` That's ${w}.`;
}

// Calendar date as YYYY-MM-DD, from local fields (the dates above are built
// with the local-time constructor, so these are the intended calendar days).
const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Start (local midnight, ms) of the first range that hasn't ended yet — so
// during the event it returns this year's start (reads as arrived).
function nextRangeStart(ranges: ReadonlyArray<{ start: string; end?: string }>, now = new Date()): number | null {
  const today = ymd(now);
  const r = ranges.find((x) => (x.end ?? x.start) >= today);
  if (!r) return null;
  const [y, m, d] = r.start.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

// Next upcoming nth-weekday occurrence, rolling to next year only once the
// day has fully ended (same convention as nextOccurrence).
function nextNthWeekday(month: number, weekday: number, n: number, offsetDays = 0, now = new Date()): number {
  const thisYear = nthWeekdayOfMonth(now.getFullYear(), month, weekday, n, offsetDays);
  const endOfDay = new Date(thisYear.getFullYear(), thisYear.getMonth(), thisYear.getDate(), 23, 59, 59, 999);
  if (now.getTime() > endOfDay.getTime()) {
    return nthWeekdayOfMonth(now.getFullYear() + 1, month, weekday, n, offsetDays).getTime();
  }
  return thisYear.getTime();
}

export type CountdownTarget = Pick<EventCountdownProps, 'target' | 'recurring' | 'weekly' | 'nthWeekday' | 'dateRanges'>;

/**
 * Calendar days from the build day to the target: the same number on the
 * server and in the browser's first render, whatever the visitor's clock or
 * timezone, so markup built from it (the board's split-flap tiles, one
 * element per digit) hydrates cleanly. Fixed instants count UTC dates;
 * local-midnight targets count local calendar days from the build date.
 * Replaced by the live count once the countdown mounts.
 */
export function buildDayCount({ target, recurring, weekly, nthWeekday, dateRanges }: CountdownTarget): number | null {
  const from = buildDay();
  if (target) {
    const utc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
    return Math.round((utc - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);
  }
  const t = recurring
    ? nextOccurrence(recurring.month, recurring.day, from)
    : weekly
      ? nextWeekday(weekly.weekday, weekly.spanDays, from)
      : nthWeekday
        ? nextNthWeekday(nthWeekday.month, nthWeekday.weekday, nthWeekday.n, nthWeekday.offsetDays, from)
        : dateRanges
          ? nextRangeStart(dateRanges, from)
          : null;
  return t === null ? null : Math.round((t - from.getTime()) / 86400000);
}

// The live state behind an event countdown: the resolved target, the tiles,
// the answer sentence's day count, and the spec the worker uses to keep that
// sentence current. Shared by EventCountdown and the station-clock board.
export function useEventCountdown({ target, recurring, weekly, nthWeekday, dateRanges }: CountdownTarget) {
  // Stable dependency for the dateRanges array (a fresh literal each render).
  const rangesKey = dateRanges ? dateRanges.map((r) => `${r.start}/${r.end ?? ''}`).join(',') : '';

  // Fixed targets are stable across server/client, so they can seed state
  // directly. Recurring/weekly targets must be resolved on the client (current
  // date dependent), so they start null and fill in on mount.
  const [targetMs, setTargetMs] = useState<number | null>(
    recurring || weekly || nthWeekday || dateRanges ? null : (target ? target.getTime() : null),
  );
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (recurring) setTargetMs(nextOccurrence(recurring.month, recurring.day));
    else if (weekly) setTargetMs(nextWeekday(weekly.weekday, weekly.spanDays));
    else if (nthWeekday) setTargetMs(nextNthWeekday(nthWeekday.month, nthWeekday.weekday, nthWeekday.n, nthWeekday.offsetDays));
    else if (dateRanges) setTargetMs(nextRangeStart(dateRanges));
    setNowMs(Date.now());
    setMounted(true);
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
    // `recurring`/`weekly` are fresh object literals each render; depend on
    // their parts so the effect doesn't re-run on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring?.month, recurring?.day, weekly?.weekday, weekly?.spanDays, nthWeekday?.month, nthWeekday?.weekday, nthWeekday?.n, nthWeekday?.offsetDays, rangesKey]);

  const ready = mounted && targetMs !== null && nowMs !== null;
  // A date table whose last entry has passed (e.g. Super Bowl LXI, the only
  // date listed, after Feb 14 2027). Without this the tiles sat at 0 0 0 0
  // under "Until …" forever; say plainly that no next date is known yet.
  const noUpcoming = mounted && !!dateRanges && targetMs === null;
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

  // Plain-sentence answer to "how many days until X?" — the query these
  // pages rank for. Fixed targets render a real number at build time (SSR
  // uses build-day "now"; suppressHydrationWarning lets the client correct
  // it), so crawlers see an answer without executing JS.
  const totalDays = useMemo(() => {
    // Recurring/weekly targets resolve on mount for the tiles, but the answer
    // sentence can compute the next occurrence at render time too — at build
    // (SSR) that uses the build date, which suppressHydrationWarning lets the
    // client correct. Crawlers get a real number either way.
    const t =
      targetMs ??
      (recurring
        ? nextOccurrence(recurring.month, recurring.day)
        : weekly
          ? nextWeekday(weekly.weekday, weekly.spanDays)
          : nthWeekday
            ? nextNthWeekday(nthWeekday.month, nthWeekday.weekday, nthWeekday.n, nthWeekday.offsetDays)
            : dateRanges
              ? nextRangeStart(dateRanges)
            : null);
    if (t === null) return null;
    const n = nowMs ?? Date.now();
    if (t <= n) return null;
    if (recurring || weekly || nthWeekday || dateRanges) {
      // Local-midnight targets: count calendar days. Dividing elapsed ms by
      // 24h is a day high in the last hour before midnight when a DST change
      // falls in between (and would disagree with the worker's count).
      const today = new Date(n);
      const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      return Math.round((t - midnight) / 86400000);
    }
    // A fixed instant: calendar days on the viewer's clock too. Rounding the
    // time left up (Math.ceil) said "2 days" for tomorrow evening from this
    // afternoon (Oct 2026: a time picked in the countdown tool); for the
    // event pages' midnight targets the two counts are the same.
    const today = new Date(n);
    const target = new Date(t);
    const fromMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const toMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    return Math.round((toMidnight - fromMidnight) / 86400000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs, nowMs, recurring?.month, recurring?.day, weekly?.weekday, weekly?.spanDays, nthWeekday?.month, nthWeekday?.weekday, nthWeekday?.n, nthWeekday?.offsetDays, rangesKey]);

  // What the worker needs to recompute the answer sentence on every request
  // (scripts/worker/live-counts.js): the static HTML is built once, but the
  // sentence is what crawlers and AI answers quote, so it must not freeze on
  // the build day. "t:<ms>" fixed instant, "d:<dates>" the next few
  // occurrences of a recurring date, "w:<weekday>:<span>" a weekly event.
  const liveSpec = useMemo(() => {
    if (dateRanges) {
      // "start/end" entries; the worker treats a range like the day itself.
      return `d:${dateRanges.map((r) => (r.end && r.end !== r.start ? `${r.start}/${r.end}` : r.start)).join(',')}`;
    }
    if (recurring || nthWeekday) {
      const year = new Date().getFullYear();
      const dates: string[] = [];
      for (let y = year; y <= year + 5; y++) {
        const d = recurring
          ? new Date(y, recurring.month, recurring.day)
          : nthWeekdayOfMonth(y, nthWeekday!.month, nthWeekday!.weekday, nthWeekday!.n, nthWeekday!.offsetDays);
        dates.push(ymd(d));
      }
      return `d:${dates.join(',')}`;
    }
    if (weekly) return `w:${weekly.weekday}:${weekly.spanDays ?? 1}`;
    return target ? `t:${target.getTime()}` : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.getTime(), recurring?.month, recurring?.day, weekly?.weekday, weekly?.spanDays, nthWeekday?.month, nthWeekday?.weekday, nthWeekday?.n, nthWeekday?.offsetDays, rangesKey]);
  const fixedTarget = !recurring && !weekly && !nthWeekday && !dateRanges && target ? target.getTime() : undefined;

  return { ready, noUpcoming, isPast, tiles, dateLabel, totalDays, liveSpec, fixedTarget, targetMs, nowMs };
}
