// Holiday dates (lib/holidays.ts), checked against published calendars.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HANUKKAH, US_CLOCK_CHANGES, lastWeekday, nthWeekday, usFederalHolidays, usObserved } from '../lib/holidays.ts';

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

test('nth and last weekdays', () => {
  assert.equal(iso(nthWeekday(2026, 10, 4, 4)), '2026-11-26'); // Thanksgiving
  assert.equal(iso(nthWeekday(2026, 10, 4, 4, 1)), '2026-11-27'); // Black Friday
  assert.equal(iso(nthWeekday(2027, 10, 4, 4)), '2027-11-25');
  assert.equal(iso(lastWeekday(2026, 4, 1)), '2026-05-25'); // Memorial Day
  assert.equal(iso(lastWeekday(2027, 4, 1)), '2027-05-31');
});

test('federal holidays on weekends are observed on the nearest weekday', () => {
  assert.equal(iso(usObserved(new Date(Date.UTC(2026, 6, 4)))), '2026-07-03'); // Saturday → Friday
  assert.equal(iso(usObserved(new Date(Date.UTC(2027, 11, 25)))), '2027-12-24'); // Saturday → Friday
  assert.equal(iso(usObserved(new Date(Date.UTC(2028, 0, 1)))), '2027-12-31'); // Saturday → Friday
  assert.equal(iso(usObserved(new Date(Date.UTC(2026, 10, 26)))), null);
  const y2026 = usFederalHolidays(2026);
  assert.equal(y2026.length, 11);
  const by = Object.fromEntries(y2026.map((h) => [h.name, iso(h.date)]));
  assert.equal(by['Martin Luther King Jr. Day'], '2026-01-19');
  assert.equal(by['Labor Day'], '2026-09-07');
  assert.equal(by['Columbus Day'], '2026-10-12');
});

test('US clock changes: second Sunday of March, first Sunday of November', () => {
  const dates = US_CLOCK_CHANGES.map((r) => r.start);
  assert.ok(dates.includes('2026-11-01'));
  assert.ok(dates.includes('2027-03-14'));
  assert.ok(dates.includes('2027-11-07'));
  assert.deepEqual([...dates].sort(), dates, 'in order');
});

test('Hanukkah ranges are eight days, in order', () => {
  for (const r of HANUKKAH) {
    assert.ok(r.end, r.start);
    const days = (Date.parse(r.end!) - Date.parse(r.start)) / 86400000;
    assert.equal(days, 8, r.start); // first candle evening → eighth day
  }
  const starts = HANUKKAH.map((r) => r.start);
  assert.deepEqual([...starts].sort(), starts);
});
