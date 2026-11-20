/**
 * A year's calendar with US holidays (/calendar/<year>/, Nov 2026). Bing,
 * Aug–Nov 2026: "2027 calendar" 334K impressions a quarter, "2027 calendar
 * printable" 92K, "2027 calendar with holidays" 29.9K, "federal holidays
 * 2027" 25.4K and "2027 federal holidays" 24.4K. Built on the holiday rules
 * the holidays list and the working-days counts already use (lib/holidays.ts,
 * lib/dateAdd.ts), so the three can't disagree.
 */
import { holidayList, US_CLOCK_CHANGES } from '@/lib/holidays';
import { countWorkingDays } from '@/lib/workingDays';
import { daysInMonth, isLeapYear, weekday } from '@/lib/dateDiff';

export type MarkKind = 'off' | 'weekend-holiday' | 'other';

export interface CalendarMark {
  /** YYYY-MM-DD */
  date: string;
  name: string;
  /**
   * off: a federal day off (the holiday itself on a weekday, or its observed
   * weekday); weekend-holiday: a federal holiday on a Saturday or Sunday,
   * whose day off is the Friday before or Monday after; other: widely kept
   * days that aren't days off by law, and the US clock changes.
   */
  kind: MarkKind;
  /**
   * weekend-holiday only: the weekday off, which can fall in another year
   * (New Year's Day 2028, a Saturday, is observed on Friday Dec 31, 2027)
   */
  observed?: string;
}

/**
 * Years with a page at /calendar/<year>/ (one app/calendar/<year>/ folder
 * each). Nov 2026: 2026 and 2028 added next to 2027; the holidays list and
 * each calendar's year links read this.
 */
export const CALENDAR_YEARS = [2026, 2027, 2028];

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Every marked day of `year`, in date order (a day can carry two marks). */
export function yearMarks(year: number): CalendarMark[] {
  const marks: CalendarMark[] = [];
  for (const h of holidayList(year)) {
    if (!h.federal) {
      marks.push({ date: h.date, name: h.name, kind: 'other' });
      continue;
    }
    if (h.observed) {
      marks.push({ date: h.date, name: h.name, kind: 'weekend-holiday', observed: h.observed });
      if (h.observed.startsWith(`${year}-`)) marks.push({ date: h.observed, name: `${h.name} (observed)`, kind: 'off' });
    } else {
      marks.push({ date: h.date, name: h.name, kind: 'off' });
    }
  }
  // Next New Year's Day on a Saturday is observed on this year's Dec 31 (2027)
  for (const h of holidayList(year + 1)) {
    if (h.federal && h.observed?.startsWith(`${year}-`)) {
      marks.push({ date: h.observed, name: `${h.name} ${year + 1} (observed)`, kind: 'off' });
    }
  }
  for (const c of US_CLOCK_CHANGES) {
    if (!c.start.startsWith(`${year}-`)) continue;
    marks.push({ date: c.start, name: c.start.slice(5, 7) === '03' ? 'Clocks go forward (US)' : 'Clocks go back (US)', kind: 'other' });
  }
  const order: Record<MarkKind, number> = { off: 0, 'weekend-holiday': 1, other: 2 };
  return marks.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind]);
}

/** The federal days off in `year` (observed dates), in order. */
export const daysOff = (year: number) => yearMarks(year).filter((m) => m.kind === 'off');

/** A month as weeks of 7 cells, Sunday first; null for days outside the month. */
export function monthWeeks(year: number, month: number): Array<Array<number | null>> {
  const first = weekday({ year, month, day: 1 });
  const total = daysInMonth(year, month);
  const cells: Array<number | null> = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface YearFacts {
  days: number;
  leap: boolean;
  /** Weekday of January 1 and of December 31 */
  starts: string;
  ends: string;
  /** Monday to Friday */
  weekdays: number;
  /** Weekdays less federal days off */
  workingDays: number;
  federalDaysOff: number;
}

export function yearFacts(year: number): YearFacts {
  const leap = isLeapYear(year);
  const span = countWorkingDays({ year, month: 1, day: 1 }, { year, month: 12, day: 31 });
  return {
    days: leap ? 366 : 365,
    leap,
    starts: WEEKDAY_NAMES[weekday({ year, month: 1, day: 1 })],
    ends: WEEKDAY_NAMES[weekday({ year, month: 12, day: 31 })],
    weekdays: span.workingDays + span.holidays.length,
    workingDays: span.workingDays,
    federalDaysOff: span.holidays.length,
  };
}

/** "Fri, Jan 1" */
export function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${WEEKDAY_NAMES[weekday({ year: y, month: m, day: d })].slice(0, 3)}, ${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}

/** "Friday, January 1, 2027" */
export function longDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${WEEKDAY_NAMES[weekday({ year: y, month: m, day: d })]}, ${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export const dayKey = ymd;

/** "A", "A and B", "A, B and C" */
export const andList = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/*
 * Month pages (/calendar/<year>/<month>/, Nov 2026): "january 2027 calendar"
 * style searches, one page per month of each CALENDAR_YEARS year, from the
 * same marks as the year page.
 */
export const MONTH_SLUGS = MONTH_NAMES.map((n) => n.toLowerCase());

/** 1–12 for "january"…"december", or null */
export function monthFromSlug(slug: string): number | null {
  const i = MONTH_SLUGS.indexOf(slug);
  return i < 0 ? null : i + 1;
}

/** The marks dated in that month (a weekend holiday keeps its own date) */
export const monthMarks = (year: number, month: number) => yearMarks(year).filter((m) => m.date.startsWith(`${year}-${pad(month)}-`));

/** The month before or after, if it has a page */
export function adjacentMonth(year: number, month: number, step: -1 | 1): { year: number; month: number } | null {
  const m = month + step;
  const at = m < 1 ? { year: year - 1, month: 12 } : m > 12 ? { year: year + 1, month: 1 } : { year, month: m };
  return CALENDAR_YEARS.includes(at.year) ? at : null;
}

export interface MonthFacts {
  days: number;
  /** Weekday of the 1st and of the last day */
  starts: string;
  ends: string;
  weekdays: number;
  workingDays: number;
  federalDaysOff: number;
}

export function monthFacts(year: number, month: number): MonthFacts {
  const days = daysInMonth(year, month);
  const span = countWorkingDays({ year, month, day: 1 }, { year, month, day: days });
  return {
    days,
    starts: WEEKDAY_NAMES[weekday({ year, month, day: 1 })],
    ends: WEEKDAY_NAMES[weekday({ year, month, day: days })],
    weekdays: span.workingDays + span.holidays.length,
    workingDays: span.workingDays,
    federalDaysOff: span.holidays.length,
  };
}

/** The holiday a day off is for: "Independence Day (observed)" → "Independence Day" */
export const offName = (m: CalendarMark) => m.name.replace(/ \(observed\)$/, '');

/** Under 65 characters for every month ("September 2027 …" is the longest) */
export const monthTitle = (year: number, month: number) => `${MONTH_NAMES[month - 1]} ${year} Calendar with Holidays (Printable) | ClockMath`;

/** At most 160 characters: drops the holiday names when they don't fit */
export function monthDescription(year: number, month: number): string {
  const name = `${MONTH_NAMES[month - 1]} ${year}`;
  const facts = monthFacts(year, month);
  const offs = monthMarks(year, month).filter((m) => m.kind === 'off').map(offName);
  const tail = ` ${facts.workingDays} working days; starts on a ${facts.starts}. Printable.`;
  const withNames = offs.length
    ? `The ${name} calendar with US holidays. Days off: ${andList(offs)}.${tail}`
    : `The ${name} calendar with US holidays marked. No federal days off this month.${tail}`;
  return withNames.length <= 160 ? withNames : `The ${name} calendar with ${offs.length} US federal day${offs.length === 1 ? '' : 's'} off and other holidays marked.${tail}`;
}
