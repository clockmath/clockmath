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
}

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
      marks.push({ date: h.date, name: h.name, kind: 'weekend-holiday' });
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
