// node --test tests/ — adding to and subtracting from dates (lib/dateAdd.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessDays, addOffset, inRange, parseCount, toIsoDate, usFederalDaysOff, type CalendarDate } from '../lib/dateAdd.ts';
import { addMonths } from '../lib/dateDiff.ts';

const d = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });
const iso = (c: CalendarDate) => toIsoDate(c);
const off = (o: Partial<{ years: number; months: number; weeks: number; days: number }>) => ({ years: 0, months: 0, weeks: 0, days: 0, ...o });

test('answers stay within years 100–9999', () => {
  assert.equal(inRange(d(2026, 11, 12)), true);
  assert.equal(inRange(d(99, 12, 31)), false);
  assert.equal(inRange(d(10000, 1, 1)), false);
});

// addMonths is lib/dateDiff.ts's; these are the cases the date calculator
// leans on, going back as well as forward
test('month steps stay inside the month', () => {
  assert.equal(iso(addMonths(d(2027, 1, 31), 1)), '2027-02-28');
  assert.equal(iso(addMonths(d(2028, 1, 31), 1)), '2028-02-29'); // leap year
  assert.equal(iso(addMonths(d(2027, 1, 31), 2)), '2027-03-31'); // from the original day, not Feb 28
  assert.equal(iso(addMonths(d(2027, 3, 31), -1)), '2027-02-28');
  assert.equal(iso(addMonths(d(2026, 11, 12), 14)), '2028-01-12');
  assert.equal(iso(addMonths(d(2027, 1, 15), -13)), '2025-12-15');
});

test('offsets: years and months first, then weeks and days', () => {
  assert.equal(iso(addOffset(d(2027, 1, 1), off({ days: 90 })).date), '2027-04-01');
  assert.equal(iso(addOffset(d(2026, 11, 12), off({ days: 30 })).date), '2026-12-12');
  assert.equal(iso(addOffset(d(2026, 11, 12), off({ weeks: 6 })).date), '2026-12-24');
  // Jan 31 + 1 month 1 day is Mar 1 (Feb 28 + 1), not Mar 4
  assert.equal(iso(addOffset(d(2027, 1, 31), off({ months: 1, days: 1 })).date), '2027-03-01');
  assert.equal(iso(addOffset(d(2028, 2, 29), off({ years: 1 })).date), '2029-02-28');
  assert.equal(iso(addOffset(d(2028, 2, 29), off({ years: 4 })).date), '2032-02-29');
  assert.equal(iso(addOffset(d(2027, 3, 1), off({ days: 30 }), -1).date), '2027-01-30');
  assert.equal(iso(addOffset(d(2027, 3, 31), off({ months: 1 }), -1).date), '2027-02-28');
});

test('offsets report calendar days and month-end clamping', () => {
  const r = addOffset(d(2027, 1, 31), off({ months: 1 }));
  assert.equal(r.clamped, true);
  assert.equal(r.calendarDays, 28);
  assert.equal(addOffset(d(2027, 1, 15), off({ months: 1 })).clamped, false);
  assert.equal(addOffset(d(2027, 1, 1), off({ years: 1 })).calendarDays, 365);
  assert.equal(addOffset(d(2028, 1, 1), off({ years: 1 })).calendarDays, 366);
  assert.equal(addOffset(d(2027, 3, 1), off({ days: 30 }), -1).calendarDays, -30);
});

test('clock changes make no difference (whole calendar days)', () => {
  // US clocks spring forward Mar 14, 2027 and fall back Nov 7, 2027
  assert.equal(iso(addOffset(d(2027, 3, 13), off({ days: 1 })).date), '2027-03-14');
  assert.equal(iso(addOffset(d(2027, 3, 14), off({ days: 1 })).date), '2027-03-15');
  assert.equal(iso(addOffset(d(2027, 11, 6), off({ days: 2 })).date), '2027-11-08');
});

test('business days: Mon–Fri, the start day not counted', () => {
  assert.equal(iso(addBusinessDays(d(2026, 11, 16), 10).date), '2026-11-30');
  assert.equal(iso(addBusinessDays(d(2026, 11, 20), 1).date), '2026-11-23'); // Fri + 1 = Mon
  assert.equal(iso(addBusinessDays(d(2026, 11, 21), 1).date), '2026-11-23'); // Sat + 1 = Mon
  assert.equal(iso(addBusinessDays(d(2026, 11, 21), 0).date), '2026-11-21');
  assert.equal(iso(addBusinessDays(d(2026, 11, 23), 1, -1).date), '2026-11-20'); // Mon − 1 = Fri
  const r = addBusinessDays(d(2026, 11, 16), 10);
  assert.equal(r.weekendDays, 4); // Nov 21–22 and 28–29
  assert.equal(r.calendarDays, 14);
});

test('business days can skip US federal days off', () => {
  const r = addBusinessDays(d(2026, 11, 16), 10, 1, { skipHolidays: true });
  assert.equal(iso(r.date), '2026-12-01');
  assert.deepEqual(r.holidays.map((h) => [iso(h.date), h.name]), [['2026-11-26', 'Thanksgiving Day']]);
  assert.equal(iso(addBusinessDays(d(2026, 11, 25), 1, 1, { skipHolidays: true }).date), '2026-11-27');
  assert.equal(iso(addBusinessDays(d(2026, 11, 25), 1).date), '2026-11-26');
  // Going back over Christmas (Fri Dec 25, 2026)
  assert.equal(iso(addBusinessDays(d(2026, 12, 28), 1, -1, { skipHolidays: true }).date), '2026-12-24');
});

test('federal days off use the observed date', () => {
  // Jan 1, 2028 is a Saturday: observed Friday Dec 31, 2027
  assert.equal(usFederalDaysOff(2027).get('2027-12-31'), "New Year's Day");
  assert.equal(usFederalDaysOff(2028).has('2028-01-01'), false);
  // Juneteenth 2027 is a Saturday: observed Friday June 18
  assert.equal(usFederalDaysOff(2027).get('2027-06-18'), 'Juneteenth');
  assert.equal(usFederalDaysOff(2026).size, 11);
});

test('counts typed in a field', () => {
  assert.equal(parseCount(''), 0);
  assert.equal(parseCount(' 30 '), 30);
  assert.equal(parseCount('1,000'), 1000);
  assert.equal(parseCount('2.5'), null);
  assert.equal(parseCount('-3'), null);
  assert.equal(parseCount('ten'), null);
});
