/**
 * The countdown "live spec": what the worker needs to recompute a day count
 * on every request (scripts/worker/live-counts.js liveDays). "t:<ms>" a fixed
 * instant, "d:<dates>" the next few occurrences of a recurring date (or
 * "start/end" ranges), "w:<weekday>:<span>" a weekly event.
 *
 * Moved out of components/EventCountdown.tsx in Nov 2026 so the image badges
 * (/badge/countdown/<slug>.svg, built from lib/badges.ts) count to exactly
 * what the event pages' answer sentences count to.
 */

export interface LiveSpecTarget {
  target?: Date;
  recurring?: { month: number; day: number };
  weekly?: { weekday: number; spanDays?: number };
  nthWeekday?: { month: number; weekday: number; n: number; offsetDays?: number };
  dateRanges?: ReadonlyArray<{ start: string; end?: string }>;
}

/** The nth `weekday` of `month` in `year`, plus `offsetDays`, at local midnight. */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number, offsetDays = 0): Date {
  const first = new Date(year, month, 1);
  const firstOccurrence = 1 + ((weekday - first.getDay() + 7) % 7);
  return new Date(year, month, firstOccurrence + (n - 1) * 7 + offsetDays, 0, 0, 0, 0);
}

/**
 * Calendar date as YYYY-MM-DD, from local fields (the countdown dates are
 * built with the local-time constructor, so these are the intended days).
 */
export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * A release-day target (`new Date(2026, 10, 19)`) is local midnight wherever
 * it is evaluated: the build machine's zone in the static HTML, the
 * visitor's in the browser. Oct 2026 review: its instant used to be baked
 * into the worker's "t:" spec and the pre-mount count, so both followed the
 * build machine's zone; as a calendar day they follow the visitor's.
 */
export const isLocalMidnight = (d: Date): boolean =>
  d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;

/** The worker's spec for a countdown target, with recurring dates from `fromYear` for six years. */
export function liveSpecFor({ target, recurring, weekly, nthWeekday, dateRanges }: LiveSpecTarget, fromYear: number): string | undefined {
  if (dateRanges) {
    // "start/end" entries; the worker treats a range like the day itself.
    return `d:${dateRanges.map((r) => (r.end && r.end !== r.start ? `${r.start}/${r.end}` : r.start)).join(',')}`;
  }
  if (recurring || nthWeekday) {
    const dates: string[] = [];
    for (let y = fromYear; y <= fromYear + 5; y++) {
      const d = recurring
        ? new Date(y, recurring.month, recurring.day)
        : nthWeekdayOfMonth(y, nthWeekday!.month, nthWeekday!.weekday, nthWeekday!.n, nthWeekday!.offsetDays);
      dates.push(ymd(d));
    }
    return `d:${dates.join(',')}`;
  }
  if (weekly) return `w:${weekly.weekday}:${weekly.spanDays ?? 1}`;
  if (target) return isLocalMidnight(target) ? `d:${ymd(target)}` : `t:${target.getTime()}`;
  return undefined;
}
