/**
 * Days between two dates (the /tools/days-between-dates/ page), in calendar
 * days. Nov 2026: Copilot cited other sites ~10K–50K times a quarter for
 * "days between dates" while ClockMath had only a how-to guide.
 *
 * Every count works on the dates themselves (year, month, day), never on
 * milliseconds: across a clock change a day is 23 or 25 hours, so
 * (end - start) / 86 400 000 is 1.96 days over the spring-forward weekend and
 * floors to 1. A date is turned into a day number on the UTC calendar, which
 * has no clock changes, and the counts are differences of those.
 */

/** A date on the calendar, month 1–12. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const MS_PER_DAY = 86_400_000;

/** The calendar date a Date shows on this device (its time of day ignored). */
export function fromLocalDate(d: Date): CalendarDate {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** A local-midnight Date for a calendar date, for the date pickers. */
export function toLocalDate(c: CalendarDate): Date {
  return new Date(c.year, c.month - 1, c.day);
}

/** Days since Jan 1, 1970 (negative before). */
export function dayNumber(c: CalendarDate): number {
  // Date.UTC maps years 0–99 to 1900–1999; setUTCFullYear doesn't
  const d = new Date(Date.UTC(2000, c.month - 1, c.day));
  d.setUTCFullYear(c.year);
  return Math.round(d.getTime() / MS_PER_DAY);
}

/** The calendar date of a day number. */
export function fromDayNumber(n: number): CalendarDate {
  const d = new Date(n * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday. Jan 1, 1970 was a Thursday. */
export function weekday(c: CalendarDate): number {
  return (((dayNumber(c) + 4) % 7) + 7) % 7;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/**
 * The same day `n` months later, kept inside the month: Jan 31 + 1 month is
 * Feb 28 (Feb 29 in a leap year). Always counted from the original day, so
 * Jan 31 + 2 months is Mar 31, not Mar 28.
 */
export function addMonths(c: CalendarDate, n: number): CalendarDate {
  const total = c.year * 12 + (c.month - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month, day: Math.min(c.day, daysInMonth(year, month)) };
}

export function addDays(c: CalendarDate, n: number): CalendarDate {
  return fromDayNumber(dayNumber(c) + n);
}

/** "2026-11-12" for ?from= / ?to= links. */
export function toIsoDate(c: CalendarDate): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(c.year, 4)}-${pad(c.month)}-${pad(c.day)}`;
}

/** A yyyy-mm-dd date from a link, or null when it isn't a real date (2026-02-30). */
export function parseIsoDate(s: string | null | undefined): CalendarDate | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((s ?? '').trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** Weekdays (Mon–Fri) among the `days` days starting on day number `start`. */
function weekdaysFrom(start: number, days: number): number {
  const fullWeeks = Math.floor(days / 7);
  let count = fullWeeks * 5;
  const firstDow = (((start + 4) % 7) + 7) % 7;
  for (let i = 0; i < days % 7; i++) {
    const dow = (firstDow + fullWeeks * 7 + i) % 7;
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export interface DateDifference {
  /** The end date was before the start date; the counts run from the earlier one. */
  reversed: boolean;
  /** The days counted: the gap between the dates, plus one when the end date counts. */
  days: number;
  weeks: { weeks: number; days: number };
  /** Whole months (month ends kept: Jan 31 → Feb 28 is a month) and the days left over. */
  months: { months: number; days: number };
  ymd: { years: number; months: number; days: number };
  /** Mondays to Fridays among the days counted (no public holidays). */
  businessDays: number;
  weekendDays: number;
}

/**
 * How far apart two dates are. Exclusive by default, the way "how many days
 * until" is meant: the start day counts, the end day doesn't, so Monday to
 * Friday is 4 days. `inclusive` counts the end date too (5 days), as for a
 * conference or a hotel's nights-plus-one; it is the same as moving the end
 * a day later, so Jan 1–31 inclusive is exactly 1 month.
 */
export function dateDifference(from: CalendarDate, to: CalendarDate, { inclusive = false } = {}): DateDifference {
  let a = dayNumber(from);
  let b = dayNumber(to);
  let start = from;
  const reversed = b < a;
  if (reversed) {
    [a, b] = [b, a];
    start = to;
  }
  if (inclusive) b += 1;
  const days = b - a;

  // Whole months: the most n with start + n months still on or before the end
  let months = Math.max(0, (fromDayNumber(b).year - start.year) * 12 + (fromDayNumber(b).month - start.month));
  while (months > 0 && dayNumber(addMonths(start, months)) > b) months--;
  const leftover = b - dayNumber(addMonths(start, months));

  const businessDays = weekdaysFrom(a, days);
  return {
    reversed,
    days,
    weeks: { weeks: Math.floor(days / 7), days: days % 7 },
    months: { months, days: leftover },
    ymd: { years: Math.floor(months / 12), months: months % 12, days: leftover },
    businessDays,
    weekendDays: days - businessDays,
  };
}

/** 1 → "1 day", 50 → "50 days", 1200 → "1,200 days". */
export function plural(n: number, unit: string): string {
  return `${n.toLocaleString('en-US')} ${unit}${n === 1 ? '' : 's'}`;
}

/** [3, 'week', 2, 'day'] → "3 weeks 2 days"; zero parts dropped, "0 days" if all are zero. */
export function partsWords(...parts: Array<[number, string]>): string {
  const kept = parts.filter(([n]) => n !== 0);
  if (kept.length === 0) return plural(0, parts[parts.length - 1][1]);
  return kept.map(([n, u]) => plural(n, u)).join(' ');
}
