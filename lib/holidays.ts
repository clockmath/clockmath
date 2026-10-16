/**
 * Holiday and event dates shared by the countdown pages and the holidays
 * list (/countdown/holidays/). Calendar dates as YYYY-MM-DD; a range's `end`
 * is inclusive. Rule-based holidays are computed; the rest are tables with
 * their sources noted.
 */
export type DateRange = { start: string; end?: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const YEARS = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** A fixed date every year (month 0-indexed). */
export const fixedDates = (month: number, day: number, from = 2026, to = 2032): DateRange[] =>
  YEARS(from, to).map((y) => ({ start: iso(utc(y, month, day)) }));

/** nth weekday of a month (weekday 0 = Sun), shifted by offsetDays. */
export function nthWeekday(year: number, month: number, weekday: number, n: number, offsetDays = 0): Date {
  const first = utc(year, month, 1);
  const day = 1 + ((weekday - first.getUTCDay() + 7) % 7) + (n - 1) * 7 + offsetDays;
  return utc(year, month, day);
}

/** Last weekday of a month (weekday 0 = Sun). */
export function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = utc(year, month + 1, 0);
  return utc(year, month, last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7));
}

export const nthWeekdayDates = (month: number, weekday: number, n: number, offsetDays = 0, from = 2026, to = 2032): DateRange[] =>
  YEARS(from, to).map((y) => ({ start: iso(nthWeekday(y, month, weekday, n, offsetDays)) }));

/** US federal observance: Saturday → the Friday before, Sunday → the Monday after. */
export function usObserved(d: Date): Date | null {
  if (d.getUTCDay() === 6) return new Date(d.getTime() - 86400000);
  if (d.getUTCDay() === 0) return new Date(d.getTime() + 86400000);
  return null;
}

/** The 11 US federal holidays (5 U.S.C. 6103) for a year, with observed dates. */
export function usFederalHolidays(year: number): Array<{ name: string; date: Date; observed: Date | null }> {
  const list: Array<[string, Date, boolean]> = [
    ["New Year's Day", utc(year, 0, 1), true],
    ['Martin Luther King Jr. Day', nthWeekday(year, 0, 1, 3), false],
    ["Washington's Birthday / Presidents' Day", nthWeekday(year, 1, 1, 3), false],
    ['Memorial Day', lastWeekday(year, 4, 1), false],
    ['Juneteenth', utc(year, 5, 19), true],
    ['Independence Day', utc(year, 6, 4), true],
    ['Labor Day', nthWeekday(year, 8, 1, 1), false],
    ['Columbus Day', nthWeekday(year, 9, 1, 2), false],
    ['Veterans Day', utc(year, 10, 11), true],
    ['Thanksgiving Day', nthWeekday(year, 10, 4, 4), false],
    ['Christmas Day', utc(year, 11, 25), true],
  ];
  return list.map(([name, date, fixed]) => ({ name, date, observed: fixed ? usObserved(date) : null }));
}

// Hanukkah: first candle on the evening of `start`; `end` is the eighth day.
// Hebcal API ("Chanukah: 1 Candle" … "8th Day"), fetched Oct 15, 2026.
export const HANUKKAH: DateRange[] = [
  { start: '2026-12-04', end: '2026-12-12' },
  { start: '2027-12-24', end: '2028-01-01' },
  { start: '2028-12-12', end: '2028-12-20' },
  { start: '2029-12-01', end: '2029-12-09' },
  { start: '2030-12-20', end: '2030-12-28' },
  { start: '2031-12-09', end: '2031-12-17' },
];

// Lunar New Year by date in China (UTC+8): chinatravel.com / vclock.com
// tables, cross-checked with the second new moon after the winter solstice
// in China time (Meeus). Korea's Seollal 2027 is Feb 7 (Korea Aerospace
// Administration): that new moon is 23:56 in Beijing, 00:56 in Seoul.
export const LUNAR_NEW_YEAR: Array<DateRange & { animal: string }> = [
  { start: '2027-02-06', animal: 'Goat' },
  { start: '2028-01-26', animal: 'Monkey' },
  { start: '2029-02-13', animal: 'Rooster' },
  { start: '2030-02-03', animal: 'Dog' },
  { start: '2031-01-23', animal: 'Pig' },
  { start: '2032-02-11', animal: 'Rat' },
];

// Easter from the computus: Anonymous Gregorian algorithm (Western) and
// Meeus's Julian algorithm + 13 days (Orthodox), computed Oct 15, 2026.
export const EASTER: Array<{ year: string; easter: string; orthodox: string }> = [
  { year: '2027', easter: '2027-03-28', orthodox: '2027-05-02' },
  { year: '2028', easter: '2028-04-16', orthodox: '2028-04-16' },
  { year: '2029', easter: '2029-04-01', orthodox: '2029-04-08' },
  { year: '2030', easter: '2030-04-21', orthodox: '2030-04-28' },
  { year: '2031', easter: '2031-04-13', orthodox: '2031-04-13' },
  { year: '2032', easter: '2032-03-28', orthodox: '2032-05-02' },
];

// US clock changes: back on the first Sunday of November, forward on the
// second Sunday of March.
export const US_CLOCK_CHANGES: DateRange[] = YEARS(2026, 2032)
  .flatMap((y) => [iso(nthWeekday(y, 2, 0, 2)), iso(nthWeekday(y, 10, 0, 1))])
  .map((start) => ({ start }));
