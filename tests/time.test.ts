// node --test tests/ — wall-clock times in a zone (lib/time.ts), around clock changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedWallTime, parseDateTimeInZone } from '../lib/time.ts';

const wall = (d: Date, timeZone: string) =>
  d.toLocaleString('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' });

test('an ordinary time is that time', () => {
  const r = zonedWallTime('2026-10-25', '13:15', 'America/Halifax');
  assert.equal(r.kind, 'normal');
  assert.equal(r.date.toISOString(), '2026-10-25T16:15:00.000Z');
  assert.equal(parseDateTimeInZone('2026-07-01', '09:00', 'Asia/Tokyo').toISOString(), '2026-07-01T00:00:00.000Z');
});

test('a time the clocks skip moves forward by the gap, west and east of UTC', () => {
  const ny = zonedWallTime('2027-03-14', '02:30', 'America/New_York');
  assert.equal(ny.kind, 'skipped');
  assert.equal(wall(ny.date, 'America/New_York'), '14/03/2027, 03:30 GMT-4'); // EDT; was 01:30 EST
  const london = zonedWallTime('2027-03-28', '01:30', 'Europe/London');
  assert.equal(london.kind, 'skipped');
  assert.equal(wall(london.date, 'Europe/London'), '28/03/2027, 02:30 GMT+1');
});

test('a time the clocks pass twice is the first of the two', () => {
  const ny = zonedWallTime('2026-11-01', '01:30', 'America/New_York');
  assert.equal(ny.kind, 'repeated');
  assert.equal(wall(ny.date, 'America/New_York'), '01/11/2026, 01:30 GMT-4');
  const london = zonedWallTime('2026-10-25', '01:30', 'Europe/London');
  assert.equal(london.kind, 'repeated');
  assert.equal(wall(london.date, 'Europe/London'), '25/10/2026, 01:30 GMT+1');
});

test('the hours either side of a change are ordinary', () => {
  assert.equal(zonedWallTime('2026-11-01', '00:30', 'America/New_York').kind, 'normal');
  assert.equal(zonedWallTime('2026-11-01', '02:30', 'America/New_York').kind, 'normal');
  assert.equal(zonedWallTime('2027-03-14', '03:00', 'America/New_York').kind, 'normal');
  assert.equal(zonedWallTime('2027-03-14', '01:59', 'America/New_York').kind, 'normal');
});
