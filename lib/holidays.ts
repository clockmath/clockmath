/**
 * Holiday and event dates shared by the countdown pages and the holidays
 * list (/countdown/holidays/). Calendar dates as YYYY-MM-DD; a range's `end`
 * is inclusive. Rule-based holidays are computed; the rest are tables with
 * their sources noted.
 */
import { buildDay } from '@/lib/buildDay';

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

/**
 * The next occurrence on or after the build day (lib/buildDay), for page
 * titles and descriptions that name the year and date — "Thanksgiving 2026
 * … Nov 26" — and move on by themselves at the next deploy after the day.
 * Bing showed the yearless titles at position ~5 with a 0.2–0.6% click
 * rate while the results around them carried the date (Oct 2026).
 */
export function nextOccurrence(dateFor: (year: number) => Date): Date {
  const today = buildDay();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const d = dateFor(today.getFullYear());
  return d.getTime() >= t ? d : dateFor(today.getFullYear() + 1);
}

const fmtUTC = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

/**
 * Title and description pieces for a countdown's next date.
 *
 * Nov 2026: the title is the pre-Oct 17 one that ranked (Bing position ~5,
 * "How Many Days Until Thanksgiving? Live Countdown"), plus the year. The
 * Oct 17 version added "Countdown to Nov 26" (70 characters) and every page
 * retitled that day lost Bing: Thanksgiving 357 → 37 impressions a day and
 * out of the index by Nov 12, Black Friday 15 → 0, while pages left alone
 * held. The date stays in the descriptions. Keep titles at 65 characters or
 * fewer (Bing flags longer ones "Title too long"; tests/holidays.test.ts).
 */
export function seasonalSEO(name: string, dateFor: (year: number) => Date) {
  const d = nextOccurrence(dateFor);
  return {
    year: d.getUTCFullYear(),
    /** "Nov 26" */
    short: fmtUTC(d, { month: 'short', day: 'numeric' }),
    /** "Thursday, November 26" */
    long: fmtUTC(d, { weekday: 'long', month: 'long', day: 'numeric' }),
    title: `How Many Days Until ${name} ${d.getUTCFullYear()}? Live Countdown | ClockMath`,
  };
}

/**
 * Western (Gregorian) Easter Sunday: the Anonymous Gregorian algorithm
 * (Meeus), the one the EASTER table above was computed with. For the full
 * year lists, which need any year, including ones the table doesn't hold.
 */
export function westernEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month - 1, day);
}

// Lunar New Year 2026 (Year of the Horse), Feb 17 in China, from the same
// tables as LUNAR_NEW_YEAR, which starts at 2027 because its countdown only
// needs dates still to come.
const LUNAR_NEW_YEAR_2026 = { start: '2026-02-17', animal: 'Horse' };

export type HolidayId =
  | 'new-year' | 'mlk' | 'lunar-new-year' | 'valentines' | 'presidents' | 'st-patricks' | 'good-friday' | 'easter'
  | 'mothers' | 'memorial' | 'fathers' | 'juneteenth' | 'july-4th' | 'labor' | 'columbus' | 'halloween'
  | 'veterans' | 'thanksgiving' | 'black-friday' | 'hanukkah' | 'christmas-eve' | 'christmas' | 'new-years-eve';

export interface ListedHoliday {
  id: HolidayId;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** One of the 11 US federal holidays (5 U.S.C. 6103), or a widely kept day that isn't a day off by law. */
  federal: boolean;
  /** The weekday it's observed on, when a federal holiday falls on a weekend (may be in the year before). */
  observed?: string;
}

/**
 * The year's holidays for /countdown/holidays/: the 11 US federal holidays
 * with their observed dates, and the other days most US calendars mark
 * (Valentine's Day, Easter, Mother's Day, Halloween, Black Friday …), in date
 * order. Nov 2026: "holidays in 2026" drew 1K–5K Copilot citations to other
 * sites while the page listed only the next year's federal holidays.
 */
export function holidayList(year: number): ListedHoliday[] {
  const fed = usFederalHolidays(year);
  const federalId: HolidayId[] = ['new-year', 'mlk', 'presidents', 'memorial', 'juneteenth', 'july-4th', 'labor', 'columbus', 'veterans', 'thanksgiving', 'christmas'];
  const list: ListedHoliday[] = fed.map((h, i) => ({
    id: federalId[i],
    name: h.name,
    date: iso(h.date),
    federal: true,
    ...(h.observed ? { observed: iso(h.observed) } : {}),
  }));
  const easter = westernEaster(year);
  const lunar = [LUNAR_NEW_YEAR_2026, ...LUNAR_NEW_YEAR].find((l) => l.start.startsWith(`${year}-`));
  const hanukkah = HANUKKAH.find((h) => h.start.startsWith(`${year}-`));
  const others: Array<[HolidayId, string, Date | string | undefined]> = [
    ['lunar-new-year', lunar ? `Lunar New Year (Year of the ${lunar.animal})` : 'Lunar New Year', lunar?.start],
    ['valentines', "Valentine's Day", utc(year, 1, 14)],
    ["st-patricks", "St. Patrick's Day", utc(year, 2, 17)],
    ['good-friday', 'Good Friday', new Date(easter.getTime() - 2 * 86400000)],
    ['easter', 'Easter Sunday', easter],
    ['mothers', "Mother's Day", nthWeekday(year, 4, 0, 2)],
    ['fathers', "Father's Day", nthWeekday(year, 5, 0, 3)],
    ['halloween', 'Halloween', utc(year, 9, 31)],
    ['black-friday', 'Black Friday', nthWeekday(year, 10, 4, 4, 1)],
    ['hanukkah', 'Hanukkah begins (evening)', hanukkah?.start],
    ['christmas-eve', 'Christmas Eve', utc(year, 11, 24)],
    ['new-years-eve', "New Year's Eve", utc(year, 11, 31)],
  ];
  for (const [id, name, d] of others) {
    if (d) list.push({ id, name, date: typeof d === 'string' ? d : iso(d), federal: false });
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}
