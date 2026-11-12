/**
 * Adding to and subtracting from a date (the /tools/date-calculator/ page):
 * years, months, weeks and days, or business days. Nov 2026: Copilot cited
 * other sites 1K–5K times each for "date calculation" and "calculate dates"
 * while ClockMath had no such tool.
 *
 * Everything works on calendar dates (year, month, day), never on
 * milliseconds: across a clock change a day is 23 or 25 hours, so adding
 * 86 400 000 ms a day lands an hour off and, near midnight, on the wrong
 * date. A date becomes a day number on the UTC calendar, which has no clock
 * changes.
 *
 * The calendar basics (CalendarDate, day numbers, addMonths with month-end
 * clamping) are lib/dateDiff.ts's, shared with /tools/days-between-dates/.
 */
import {
  addDays,
  addMonths,
  dayNumber,
  fromDayNumber,
  toIsoDate,
  weekday,
  type CalendarDate,
} from '@/lib/dateDiff';
import { usFederalHolidays } from '@/lib/holidays';

export { fromLocalDate, toLocalDate, toIsoDate, type CalendarDate } from '@/lib/dateDiff';

/** The years the answer can show: toLocalDate (new Date(y, m, d)) reads 0–99 as 1900–1999. */
export const MIN_YEAR = 100;
export const MAX_YEAR = 9999;
export const inRange = (c: CalendarDate) => c.year >= MIN_YEAR && c.year <= MAX_YEAR;

export interface DateOffset {
  years: number;
  months: number;
  weeks: number;
  days: number;
}

export interface OffsetResult {
  date: CalendarDate;
  /** Calendar days from the start to the answer (negative when going back). */
  calendarDays: number;
  /** The month step landed on a shorter month: Jan 31 + 1 month → Feb 28. */
  clamped: boolean;
}

/**
 * `start` moved by an offset, forward (sign 1) or back (sign -1). Years and
 * months go first, as one step of years × 12 + months (so Feb 29 + 1 year is
 * Feb 28, and Jan 31 + 1 year 1 month is Feb 28 of the next year, not Mar 3),
 * then weeks and days. That's the order people mean by "3 months and 10 days
 * from now", and the one spreadsheets and timeanddate.com use.
 */
export function addOffset(start: CalendarDate, offset: DateOffset, sign: 1 | -1 = 1): OffsetResult {
  const afterMonths = addMonths(start, sign * (offset.years * 12 + offset.months));
  const date = addDays(afterMonths, sign * (offset.weeks * 7 + offset.days));
  return { date, calendarDays: dayNumber(date) - dayNumber(start), clamped: afterMonths.day !== start.day };
}

const daysOffCache = new Map<number, Map<string, string>>();

/**
 * US federal days off in a year (the observed date, so a Saturday holiday is
 * the Friday before), date → holiday name. A New Year's Day on a Saturday is
 * observed on Dec 31 of the year before, so next year's list is read too.
 */
export function usFederalDaysOff(year: number): Map<string, string> {
  const cached = daysOffCache.get(year);
  if (cached) return cached;
  const map = new Map<string, string>();
  for (const y of [year, year + 1]) {
    for (const h of usFederalHolidays(y)) {
      const off = (h.observed ?? h.date).toISOString().slice(0, 10);
      if (off.startsWith(`${year}-`)) map.set(off, h.name);
    }
  }
  daysOffCache.set(year, map);
  return map;
}

/** Up to about 40 years of working days, so the day-by-day walk stays instant. */
export const MAX_BUSINESS_DAYS = 10_000;

export interface BusinessDayResult {
  date: CalendarDate;
  calendarDays: number;
  /** Saturdays and Sundays stepped over. */
  weekendDays: number;
  /** Federal days off stepped over, in order (only with skipHolidays). */
  holidays: Array<{ date: CalendarDate; name: string }>;
}

/**
 * `n` business days after (or before, sign -1) `start`. The start day itself
 * doesn't count, the way "10 business days from Monday" is meant: Monday + 1
 * is Tuesday, Friday + 1 is the Monday after, and a Saturday + 1 is Monday.
 * Business days are Monday to Friday, less US federal days off when
 * `skipHolidays` is set. 0 business days is the start date, even on a weekend.
 */
export function addBusinessDays(
  start: CalendarDate,
  n: number,
  sign: 1 | -1 = 1,
  { skipHolidays = false }: { skipHolidays?: boolean } = {},
): BusinessDayResult {
  let day = dayNumber(start);
  let counted = 0;
  let weekendDays = 0;
  const holidays: BusinessDayResult['holidays'] = [];
  while (counted < n) {
    day += sign;
    const c = fromDayNumber(day);
    const wd = weekday(c);
    if (wd === 0 || wd === 6) {
      weekendDays++;
      continue;
    }
    const holiday = skipHolidays ? usFederalDaysOff(c.year).get(toIsoDate(c)) : undefined;
    if (holiday) {
      holidays.push({ date: c, name: holiday });
      continue;
    }
    counted++;
  }
  return { date: fromDayNumber(day), calendarDays: day - dayNumber(start), weekendDays, holidays };
}

/**
 * A count typed in a field: "", "30", "1,000" or " 12 ". Empty is 0; null
 * for anything else (decimals, minus signs, letters), so the field can say
 * so. Going back is the Subtract button, not a minus sign.
 */
export function parseCount(s: string): number | null {
  const t = s.trim().replace(/[,\s]/g, '');
  if (t === '') return 0;
  if (!/^\d{1,7}$/.test(t)) return null;
  return Number(t);
}
