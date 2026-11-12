// node --test tests/ — day of year, week numbers and Julian dates (lib/todaysDate.ts),
// and the worker's copy of the same maths (scripts/worker/live-counts.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dateFacts, dayOfYear, isoWeek, isoWeeksInYear, julianDate, julianDayNumber, ordinalDate, usWeek } from '../lib/todaysDate.ts';
import { fromDayNumber, dayNumber, toIsoDate, type CalendarDate } from '../lib/dateDiff.ts';

const d = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });

test('day of the year', () => {
  assert.equal(dayOfYear(d(2026, 1, 1)), 1);
  assert.equal(dayOfYear(d(2026, 11, 12)), 316);
  assert.equal(dayOfYear(d(2026, 12, 31)), 365);
  assert.equal(dayOfYear(d(2028, 12, 31)), 366);
  assert.equal(dayOfYear(d(2028, 3, 1)), 61); // after Feb 29
  assert.equal(dateFacts(d(2026, 11, 12)).daysLeft, 49);
});

test('ISO weeks, including the ones that cross a new year', () => {
  assert.deepEqual(isoWeek(d(2026, 11, 12)), { week: 46, year: 2026 });
  assert.deepEqual(isoWeek(d(2026, 1, 1)), { week: 1, year: 2026 }); // a Thursday
  assert.deepEqual(isoWeek(d(2026, 12, 31)), { week: 53, year: 2026 });
  assert.deepEqual(isoWeek(d(2027, 1, 3)), { week: 53, year: 2026 }); // Sunday
  assert.deepEqual(isoWeek(d(2027, 1, 4)), { week: 1, year: 2027 }); // Monday
  assert.deepEqual(isoWeek(d(2024, 12, 30)), { week: 1, year: 2025 });
  assert.deepEqual(isoWeek(d(2021, 1, 1)), { week: 53, year: 2020 });
  assert.equal(isoWeeksInYear(2026), 53);
  assert.equal(isoWeeksInYear(2027), 52);
  assert.equal(isoWeeksInYear(2020), 53); // leap year starting on a Wednesday
});

test('US weeks start on Sunday, week 1 holds Jan 1', () => {
  assert.equal(usWeek(d(2026, 1, 1)), 1);
  assert.equal(usWeek(d(2026, 1, 3)), 1); // Saturday
  assert.equal(usWeek(d(2026, 1, 4)), 2); // Sunday
  assert.equal(usWeek(d(2026, 11, 12)), 46);
  assert.equal(usWeek(d(2026, 12, 31)), 53);
});

test('Julian day numbers and dates', () => {
  assert.equal(julianDayNumber(d(2000, 1, 1)), 2451545);
  assert.equal(julianDayNumber(d(1970, 1, 1)), 2440588);
  assert.equal(julianDayNumber(d(2026, 11, 12)), 2461357);
  assert.equal(julianDate(Date.UTC(2000, 0, 1, 12)), 2451545); // J2000.0
  assert.equal(julianDate(Date.UTC(2026, 10, 12)), 2461356.5); // midnight UTC
});

test('ordinal ("Julian") dates', () => {
  assert.deepEqual(ordinalDate(d(2026, 11, 12)), { iso: '2026-316', yyddd: '26316' });
  assert.deepEqual(ordinalDate(d(2027, 1, 5)), { iso: '2027-005', yyddd: '27005' });
  assert.deepEqual(ordinalDate(d(2005, 2, 1)), { iso: '2005-032', yyddd: '05032' });
});

test('the worker agrees with the lib on every day, 2024–2032', () => {
  const code = readFileSync(new URL('../scripts/worker/live-counts.js', import.meta.url), 'utf8');
  const liveToday = new Function(`${code}; return liveToday;`)() as (kind: string, ms: number, tz: string) => string | null;
  const fmt = (c: CalendarDate, opts: Intl.DateTimeFormatOptions) =>
    new Date(Date.UTC(c.year, c.month - 1, c.day)).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
  for (let n = dayNumber(d(2024, 1, 1)); n <= dayNumber(d(2032, 12, 31)); n++) {
    const c = fromDayNumber(n);
    const f = dateFacts(c);
    const noon = Date.UTC(c.year, c.month - 1, c.day, 12);
    const expect: Record<string, string> = {
      iso: toIsoDate(c),
      long: fmt(c, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      doy: String(f.dayOfYear),
      left: String(f.daysLeft),
      'days-in-year': String(f.daysInYear),
      week: String(f.isoWeek),
      'week-us': String(f.usWeek),
      quarter: `Q${f.quarter}`,
      jdn: String(f.julianDayNumber),
      ordinal: f.ordinal,
      yyddd: f.yyddd,
    };
    for (const [kind, value] of Object.entries(expect)) assert.equal(liveToday(kind, noon, 'UTC'), value, `${kind} on ${toIsoDate(c)}`);
  }
});
