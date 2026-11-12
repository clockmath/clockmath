/**
 * Facts about a calendar date for /tools/todays-date/: day of the year, ISO
 * and US week numbers, quarter, the Julian day number and the "Julian"
 * (ordinal) date. Nov 2026: Copilot cited other sites 1K–5K times each for
 * "what day is it", "today's date", "what is the date" and "julian date".
 *
 * The worker (scripts/worker/live-counts.js, liveToday) works out the same
 * values per request in the visitor's zone, so the page's static HTML says
 * the right date on every day, not just deploy day. tests/todaysDate.test.ts
 * checks the two agree for every day of several years.
 */
import { dayNumber, isLeapYear, weekday, type CalendarDate } from '@/lib/dateDiff';

/** Julian day number of Jan 1, 1970 (a day number of 0). */
const JDN_EPOCH = 2440588;

export const daysInYear = (year: number) => (isLeapYear(year) ? 366 : 365);

/** 1 for Jan 1 … 365 (366) for Dec 31. */
export function dayOfYear(c: CalendarDate): number {
  return dayNumber(c) - dayNumber({ year: c.year, month: 1, day: 1 }) + 1;
}

/**
 * ISO 8601 week: weeks start on Monday, and week 1 is the one with the
 * year's first Thursday (so it holds Jan 4). Dec 29–31 can be in week 1 of
 * the next year and Jan 1–3 in week 52 or 53 of the last, so the week's own
 * year comes back too.
 */
export function isoWeek(c: CalendarDate): { week: number; year: number } {
  const isoWeekday = weekday(c) || 7; // Monday 1 … Sunday 7
  // The Thursday of this week decides the year and the week
  const thursday = dayNumber(c) - isoWeekday + 4;
  const year = new Date(thursday * 86_400_000).getUTCFullYear();
  const week = Math.floor((thursday - dayNumber({ year, month: 1, day: 1 })) / 7) + 1;
  return { week, year };
}

/**
 * US-style week number: weeks start on Sunday and week 1 is the one with
 * Jan 1 in it (Outlook's and most US calendars' default). It can differ from
 * the ISO week by one, and the year's last days can be week 53.
 */
export function usWeek(c: CalendarDate): number {
  const jan1 = weekday({ year: c.year, month: 1, day: 1 });
  return Math.floor((dayOfYear(c) - 1 + jan1) / 7) + 1;
}

/** Weeks in an ISO year: 53 when Jan 1 is a Thursday, or a Wednesday in a leap year. */
export function isoWeeksInYear(year: number): number {
  const jan1 = weekday({ year, month: 1, day: 1 });
  return jan1 === 4 || (jan1 === 3 && isLeapYear(year)) ? 53 : 52;
}

export const quarter = (c: CalendarDate) => Math.floor((c.month - 1) / 3) + 1;

/**
 * Astronomers' Julian day number: whole days since noon UTC on Jan 1,
 * 4713 BC (Julian calendar). A calendar date's number is the one for that
 * day's noon, so Jan 1, 2000 is 2,451,545.
 */
export const julianDayNumber = (c: CalendarDate) => dayNumber(c) + JDN_EPOCH;

/** The Julian date of an instant, with the fraction of the day since noon UTC. */
export const julianDate = (ms: number) => ms / 86_400_000 + JDN_EPOCH - 0.5;

/**
 * The "Julian date" of food packaging, the military and mainframes: the
 * year and the day of the year. Not a Julian-calendar date at all; the name
 * stuck from the day count. 2026-316 (ISO 8601 ordinal) and 26316 (YYDDD).
 */
export function ordinalDate(c: CalendarDate): { iso: string; yyddd: string } {
  const ddd = String(dayOfYear(c)).padStart(3, '0');
  return { iso: `${c.year}-${ddd}`, yyddd: `${String(c.year % 100).padStart(2, '0')}${ddd}` };
}

export interface DateFacts {
  dayOfYear: number;
  daysInYear: number;
  daysLeft: number;
  isoWeek: number;
  isoWeekYear: number;
  usWeek: number;
  quarter: number;
  julianDayNumber: number;
  ordinal: string;
  yyddd: string;
  leapYear: boolean;
}

export function dateFacts(c: CalendarDate): DateFacts {
  const doy = dayOfYear(c);
  const iso = isoWeek(c);
  const ord = ordinalDate(c);
  return {
    dayOfYear: doy,
    daysInYear: daysInYear(c.year),
    daysLeft: daysInYear(c.year) - doy,
    isoWeek: iso.week,
    isoWeekYear: iso.year,
    usWeek: usWeek(c),
    quarter: quarter(c),
    julianDayNumber: julianDayNumber(c),
    ordinal: ord.iso,
    yyddd: ord.yyddd,
    leapYear: isLeapYear(c.year),
  };
}
