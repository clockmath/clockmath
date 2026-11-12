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

test('Easter by computus matches the Easter table', async () => {
  const { EASTER, westernEaster } = await import('../lib/holidays.ts');
  for (const e of EASTER) assert.equal(iso(westernEaster(Number(e.year))), e.easter, e.year);
  assert.equal(iso(westernEaster(2026)), '2026-04-05');
  assert.equal(iso(westernEaster(2019)), '2019-04-21');
  assert.equal(iso(westernEaster(2038)), '2038-04-25'); // latest possible
});

test('full year lists: federal holidays and observances in date order', async () => {
  const { holidayList } = await import('../lib/holidays.ts');
  const y2026 = holidayList(2026);
  const by = Object.fromEntries(y2026.map((h) => [h.id, h]));
  assert.equal(y2026.filter((h) => h.federal).length, 11);
  assert.deepEqual([...y2026].map((h) => h.date).sort(), y2026.map((h) => h.date), 'in order');
  assert.equal(by['lunar-new-year'].date, '2026-02-17');
  assert.equal(by['good-friday'].date, '2026-04-03');
  assert.equal(by['easter'].date, '2026-04-05');
  assert.equal(by['mothers'].date, '2026-05-10');
  assert.equal(by['fathers'].date, '2026-06-21');
  assert.equal(by['black-friday'].date, '2026-11-27');
  assert.equal(by['hanukkah'].date, '2026-12-04');
  assert.equal(by['july-4th'].observed, '2026-07-03'); // Saturday
  assert.equal(by['thanksgiving'].observed, undefined);
  const y2027 = Object.fromEntries(holidayList(2027).map((h) => [h.id, h]));
  assert.equal(y2027['easter'].date, '2027-03-28');
  assert.equal(y2027['good-friday'].date, '2027-03-26');
  assert.equal(y2027['mothers'].date, '2027-05-09');
  assert.equal(y2027['fathers'].date, '2027-06-20');
  assert.equal(y2027['juneteenth'].observed, '2027-06-18');
  assert.equal(y2027['christmas'].observed, '2027-12-24');
  assert.equal(y2027['lunar-new-year'].name, 'Lunar New Year (Year of the Goat)');
  assert.equal(y2027['hanukkah'].date, '2027-12-24');
  // A year the Lunar New Year and Hanukkah tables don't reach: those rows are left out, not wrong
  const y2040 = holidayList(2040).map((h) => h.id);
  assert.ok(!y2040.includes('lunar-new-year') && !y2040.includes('hanukkah'));
  assert.equal(y2040.length, 21);
});
