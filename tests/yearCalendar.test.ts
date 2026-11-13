// node --test tests/ — the year calendar (lib/yearCalendar.ts). The 2027
// days off are written out by hand from OPM's rules (5 U.S.C. 6103 and the
// Saturday → Friday / Sunday → Monday observance), not from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysOff, longDate, monthWeeks, shortDate, yearFacts, yearMarks } from '../lib/yearCalendar.ts';

test('2027 federal days off, observed dates included', () => {
  assert.deepEqual(
    daysOff(2027).map((m) => `${m.date} ${m.name}`),
    [
      "2027-01-01 New Year's Day",
      '2027-01-18 Martin Luther King Jr. Day',
      "2027-02-15 Washington's Birthday / Presidents' Day",
      '2027-05-31 Memorial Day',
      '2027-06-18 Juneteenth (observed)',
      '2027-07-05 Independence Day (observed)',
      '2027-09-06 Labor Day',
      '2027-10-11 Columbus Day',
      '2027-11-11 Veterans Day',
      '2027-11-25 Thanksgiving Day',
      '2027-12-24 Christmas Day (observed)',
      "2027-12-31 New Year's Day 2028 (observed)",
    ],
  );
});

test('2027 weekend holidays and other days', () => {
  const marks = yearMarks(2027);
  const weekend = marks.filter((m) => m.kind === 'weekend-holiday').map((m) => m.date);
  assert.deepEqual(weekend, ['2027-06-19', '2027-07-04', '2027-12-25']);
  const other = new Map(marks.filter((m) => m.kind === 'other').map((m) => [m.name, m.date]));
  assert.equal(other.get('Easter Sunday'), '2027-03-28');
  assert.equal(other.get('Good Friday'), '2027-03-26');
  assert.equal(other.get("Mother's Day"), '2027-05-09');
  assert.equal(other.get("Father's Day"), '2027-06-20');
  assert.equal(other.get('Black Friday'), '2027-11-26');
  assert.equal(other.get('Clocks go forward (US)'), '2027-03-14');
  assert.equal(other.get('Clocks go back (US)'), '2027-11-07');
  // In date order; the day off before the holiday on the same date ordering
  const dates = marks.map((m) => m.date);
  assert.deepEqual(dates, [...dates].sort());
});

test('2026: Independence Day on a Saturday, observed Friday July 3', () => {
  const offs = daysOff(2026).map((m) => m.date);
  assert.ok(offs.includes('2026-07-03'));
  assert.ok(!offs.includes('2026-07-04'));
  assert.equal(offs.length, 11);
});

test('2028: New Year observed in 2027 is not counted again', () => {
  const offs = daysOff(2028).map((m) => m.date);
  assert.ok(!offs.some((d) => d.startsWith('2027')));
  assert.ok(!offs.includes('2028-01-01')); // a Saturday
  assert.equal(offs.length, 10);
});

test('month grids', () => {
  const jan = monthWeeks(2027, 1);
  assert.deepEqual(jan[0], [null, null, null, null, null, 1, 2]); // Jan 1, 2027 is a Friday
  assert.equal(jan.flat().filter(Boolean).length, 31);
  const feb = monthWeeks(2027, 2);
  assert.equal(feb.flat().filter(Boolean).length, 28);
  assert.deepEqual(feb[0], [null, 1, 2, 3, 4, 5, 6]);
  assert.equal(monthWeeks(2028, 2).flat().filter(Boolean).length, 29);
  for (let m = 1; m <= 12; m++) for (const w of monthWeeks(2027, m)) assert.equal(w.length, 7);
});

test('year facts', () => {
  assert.deepEqual(yearFacts(2027), {
    days: 365,
    leap: false,
    starts: 'Friday',
    ends: 'Friday',
    weekdays: 261,
    workingDays: 249,
    federalDaysOff: 12,
  });
  assert.equal(yearFacts(2028).days, 366);
  assert.equal(yearFacts(2028).starts, 'Saturday');
});

test('date labels', () => {
  assert.equal(shortDate('2027-07-05'), 'Mon, Jul 5');
  assert.equal(longDate('2027-12-31'), 'Friday, December 31, 2027');
});
