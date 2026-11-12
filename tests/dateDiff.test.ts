// Days between dates (lib/dateDiff.ts). New York, for the clock changes.
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addMonths,
  dateDifference,
  dayNumber,
  fromDayNumber,
  fromLocalDate,
  parseIsoDate,
  partsWords,
  plural,
  toIsoDate,
  toLocalDate,
  weekday,
  type CalendarDate,
} from '../lib/dateDiff.ts';

const d = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });

test('plain spans, exclusive by default', () => {
  assert.equal(dateDifference(d(2026, 3, 1), d(2026, 4, 15)).days, 45);
  assert.equal(dateDifference(d(2025, 12, 20), d(2026, 1, 5)).days, 16);
  assert.equal(dateDifference(d(2026, 11, 12), d(2026, 11, 12)).days, 0);
  assert.equal(dateDifference(d(2026, 1, 1), d(2026, 12, 31)).days, 364);
});

test('inclusive counts the end date too', () => {
  assert.equal(dateDifference(d(2026, 3, 1), d(2026, 4, 15), { inclusive: true }).days, 46);
  assert.equal(dateDifference(d(2026, 11, 12), d(2026, 11, 12), { inclusive: true }).days, 1);
  assert.equal(dateDifference(d(2026, 1, 1), d(2026, 12, 31), { inclusive: true }).days, 365);
  // Jan 1–31 counting both ends is exactly one month
  const jan = dateDifference(d(2026, 1, 1), d(2026, 1, 31), { inclusive: true });
  assert.deepEqual(jan.months, { months: 1, days: 0 });
  assert.deepEqual(dateDifference(d(2026, 1, 1), d(2026, 1, 31)).months, { months: 0, days: 30 });
});

test('leap years: 366 days in 2024 and 2000, 365 in 2025 and 1900', () => {
  assert.equal(dateDifference(d(2024, 1, 1), d(2025, 1, 1)).days, 366);
  assert.equal(dateDifference(d(2025, 1, 1), d(2026, 1, 1)).days, 365);
  assert.equal(dateDifference(d(2000, 1, 1), d(2001, 1, 1)).days, 366);
  assert.equal(dateDifference(d(1900, 1, 1), d(1901, 1, 1)).days, 365);
  // The guide's example: Jan 15 to Mar 10 is 55 days in 2024, 54 in 2025
  assert.equal(dateDifference(d(2024, 1, 15), d(2024, 3, 10)).days, 55);
  assert.equal(dateDifference(d(2025, 1, 15), d(2025, 3, 10)).days, 54);
  // Feb 29 to the next Feb 28 is a whole year (the month end is kept)
  assert.deepEqual(dateDifference(d(2024, 2, 29), d(2025, 2, 28)).ymd, { years: 1, months: 0, days: 0 });
  assert.deepEqual(dateDifference(d(2024, 2, 29), d(2025, 3, 1)).ymd, { years: 1, months: 0, days: 1 });
  assert.deepEqual(dateDifference(d(2024, 2, 29), d(2028, 2, 29)).ymd, { years: 4, months: 0, days: 0 });
});

test('month ends: Jan 31 + 1 month is Feb 28, counted from the original day', () => {
  assert.deepEqual(addMonths(d(2027, 1, 31), 1), d(2027, 2, 28));
  assert.deepEqual(addMonths(d(2028, 1, 31), 1), d(2028, 2, 29));
  assert.deepEqual(addMonths(d(2027, 1, 31), 2), d(2027, 3, 31));
  assert.deepEqual(addMonths(d(2026, 11, 30), 3), d(2027, 2, 28));
  assert.deepEqual(addMonths(d(2026, 3, 31), -1), d(2026, 2, 28));

  assert.deepEqual(dateDifference(d(2027, 1, 31), d(2027, 2, 28)).months, { months: 1, days: 0 });
  assert.equal(dateDifference(d(2027, 1, 31), d(2027, 2, 28)).days, 28);
  assert.deepEqual(dateDifference(d(2027, 1, 31), d(2027, 2, 27)).months, { months: 0, days: 27 });
  assert.deepEqual(dateDifference(d(2027, 1, 31), d(2027, 3, 1)).months, { months: 1, days: 1 });
  assert.deepEqual(dateDifference(d(2027, 1, 31), d(2027, 3, 31)).months, { months: 2, days: 0 });
  assert.deepEqual(dateDifference(d(2026, 3, 31), d(2026, 4, 30)).months, { months: 1, days: 0 });
  assert.deepEqual(dateDifference(d(2026, 1, 15), d(2026, 3, 14)).months, { months: 1, days: 27 });
});

test('weeks, months and years break the same span down', () => {
  const r = dateDifference(d(2025, 8, 20), d(2026, 11, 12));
  assert.equal(r.days, 449);
  assert.deepEqual(r.weeks, { weeks: 64, days: 1 });
  assert.deepEqual(r.months, { months: 14, days: 23 });
  assert.deepEqual(r.ymd, { years: 1, months: 2, days: 23 });
  assert.deepEqual(dateDifference(d(2026, 1, 1), d(2027, 1, 1)).weeks, { weeks: 52, days: 1 });
});

test('business days: Mon–Fri, the end date only when inclusive', () => {
  // Mon Nov 9 to Fri Nov 13, 2026
  assert.equal(weekday(d(2026, 11, 9)), 1);
  assert.equal(dateDifference(d(2026, 11, 9), d(2026, 11, 13)).businessDays, 4);
  assert.equal(dateDifference(d(2026, 11, 9), d(2026, 11, 13), { inclusive: true }).businessDays, 5);
  // A weekend alone has none
  const weekend = dateDifference(d(2026, 11, 14), d(2026, 11, 15), { inclusive: true });
  assert.equal(weekend.businessDays, 0);
  assert.equal(weekend.weekendDays, 2);
  // Fri to the next Mon: Fri, Sat, Sun → 1
  assert.equal(dateDifference(d(2026, 11, 13), d(2026, 11, 16)).businessDays, 1);
  // A whole year: 2026 has 261 weekdays, 2028 (leap, starts Saturday) 260
  assert.equal(dateDifference(d(2026, 1, 1), d(2026, 12, 31), { inclusive: true }).businessDays, 261);
  assert.equal(dateDifference(d(2028, 1, 1), d(2028, 12, 31), { inclusive: true }).businessDays, 260);
  // Checked against a day-by-day count over many spans
  for (let start = dayNumber(d(2026, 1, 1)); start < dayNumber(d(2026, 1, 15)); start++) {
    for (let len = 0; len < 40; len++) {
      let count = 0;
      for (let i = 0; i < len; i++) {
        const w = weekday(fromDayNumber(start + i));
        if (w !== 0 && w !== 6) count++;
      }
      assert.equal(dateDifference(fromDayNumber(start), fromDayNumber(start + len)).businessDays, count);
    }
  }
});

test('clock changes: calendar days, not 24-hour blocks', () => {
  // Spring forward (Mar 8, 2026) and fall back (Nov 1, 2026) in New York
  const before = new Date(2026, 2, 7);
  const after = new Date(2026, 2, 9);
  assert.equal((after.getTime() - before.getTime()) / 86_400_000 < 2, true); // 47 hours
  assert.equal(dateDifference(fromLocalDate(before), fromLocalDate(after)).days, 2);
  assert.equal(dateDifference(fromLocalDate(new Date(2026, 9, 31)), fromLocalDate(new Date(2026, 10, 2))).days, 2);
  // A whole spring-to-fall span, and times of day are ignored
  assert.equal(dateDifference(fromLocalDate(new Date(2026, 2, 1, 23, 59)), fromLocalDate(new Date(2026, 10, 30, 0, 1))).days, 274);
  // Local midnight round trip
  assert.deepEqual(fromLocalDate(toLocalDate(d(2026, 3, 8))), d(2026, 3, 8));
});

test('reversed order counts from the earlier date and says so', () => {
  const forward = dateDifference(d(2026, 3, 1), d(2026, 4, 15));
  const back = dateDifference(d(2026, 4, 15), d(2026, 3, 1));
  assert.equal(forward.reversed, false);
  assert.equal(back.reversed, true);
  assert.deepEqual({ ...back, reversed: false }, forward);
  // Month ends from the earlier date: Feb 28 → Jan 31 is Jan 31 → Feb 28
  assert.deepEqual(dateDifference(d(2027, 2, 28), d(2027, 1, 31)).months, { months: 1, days: 0 });
  assert.equal(dateDifference(d(2026, 11, 13), d(2026, 11, 9), { inclusive: true }).businessDays, 5);
});

test('day numbers and weekdays', () => {
  assert.equal(dayNumber(d(1970, 1, 1)), 0);
  assert.equal(dayNumber(d(1969, 12, 31)), -1);
  assert.equal(weekday(d(1970, 1, 1)), 4);
  assert.equal(weekday(d(1969, 12, 28)), 0);
  assert.deepEqual(fromDayNumber(dayNumber(d(1900, 3, 1))), d(1900, 3, 1));
  // Years under 100 aren't read as 19xx
  assert.equal(dateDifference(d(50, 1, 1), d(51, 1, 1)).days, 365);
});

test('?from= / ?to= dates: yyyy-mm-dd, real dates only', () => {
  assert.deepEqual(parseIsoDate('2026-11-12'), d(2026, 11, 12));
  assert.deepEqual(parseIsoDate(' 2028-2-29 '), d(2028, 2, 29));
  assert.equal(parseIsoDate('2027-02-29'), null);
  assert.equal(parseIsoDate('2026-13-01'), null);
  assert.equal(parseIsoDate('2026-11-12T10:00'), null);
  assert.equal(parseIsoDate('11/12/2026'), null);
  assert.equal(parseIsoDate(''), null);
  assert.equal(parseIsoDate(null), null);
  assert.equal(toIsoDate(d(2026, 3, 8)), '2026-03-08');
});

test('words', () => {
  assert.equal(plural(1, 'day'), '1 day');
  assert.equal(plural(1200, 'day'), '1,200 days');
  assert.equal(partsWords([3, 'week'], [2, 'day']), '3 weeks 2 days');
  assert.equal(partsWords([1, 'year'], [0, 'month'], [1, 'day']), '1 year 1 day');
  assert.equal(partsWords([0, 'week'], [0, 'day']), '0 days');
});
