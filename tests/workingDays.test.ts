// Working days and weekends until a holiday (lib/workingDays.ts), checked by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { christmasEveAhead, countWorkingDays, halloweenAhead, thanksgivingEveAhead, yearEnd } from '../lib/workingDays.ts';

const d = (year: number, month: number, day: number) => ({ year, month, day });

test('Thu Nov 12 to Christmas Eve 2026: 30 working days, Thanksgiving skipped, 6 weekends', () => {
  // Nov 12–13 (2), Nov 16–20 (5), Nov 23–27 less Thanksgiving (4), three full weeks (15), Dec 21–24 (4)
  assert.deepEqual(countWorkingDays(d(2026, 11, 12), d(2026, 12, 24)), {
    workingDays: 30,
    weekends: 6,
    holidays: ['Thanksgiving Day'],
  });
});

test('in 2027 Christmas is a Saturday, so Friday Dec 24 is the federal day off', () => {
  assert.deepEqual(countWorkingDays(d(2027, 12, 1), d(2027, 12, 24)), { workingDays: 17, weekends: 3, holidays: ['Christmas Day'] });
});

test("New Year's Day 2028 is a Saturday, so Friday Dec 31, 2027 is off", () => {
  assert.deepEqual(countWorkingDays(d(2027, 12, 27), d(2027, 12, 31)), { workingDays: 4, weekends: 0, holidays: ["New Year's Day"] });
});

test('a span that ends before it starts counts nothing; a single day counts itself', () => {
  assert.deepEqual(countWorkingDays(d(2026, 12, 25), d(2026, 12, 24)), { workingDays: 0, weekends: 0, holidays: [] });
  assert.equal(countWorkingDays(d(2026, 12, 24), d(2026, 12, 24)).workingDays, 1);
});

test('the day each page counts through', () => {
  assert.deepEqual(christmasEveAhead(d(2026, 11, 12)), d(2026, 12, 24));
  assert.deepEqual(christmasEveAhead(d(2026, 12, 24)), d(2026, 12, 24));
  assert.deepEqual(christmasEveAhead(d(2026, 12, 25)), d(2027, 12, 24));
  assert.deepEqual(yearEnd(d(2026, 11, 12)), d(2026, 12, 31));
  assert.deepEqual(halloweenAhead(d(2026, 10, 31)), d(2026, 10, 31));
  assert.deepEqual(halloweenAhead(d(2026, 11, 1)), d(2027, 10, 31));
  // Thanksgiving 2026 is Thu Nov 26, 2027 is Thu Nov 25
  assert.deepEqual(thanksgivingEveAhead(d(2026, 11, 12)), d(2026, 11, 25));
  assert.deepEqual(thanksgivingEveAhead(d(2026, 11, 25)), d(2026, 11, 25));
  assert.deepEqual(thanksgivingEveAhead(d(2026, 11, 26)), d(2027, 11, 24));
});
