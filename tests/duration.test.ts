// Homepage duration maths (lib/duration.ts). New York, for the clock changes.
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDurationParts, parseTimeToSeconds, spanBetween } from '../lib/duration.ts';

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

test('parseTimeToSeconds reads HH:MM and HH:MM:SS, refuses the rest', () => {
  assert.equal(parseTimeToSeconds('09:30'), 9 * 3600 + 30 * 60);
  assert.equal(parseTimeToSeconds('23:59:59'), 86399);
  assert.ok(Number.isNaN(parseTimeToSeconds('24:00')));
  assert.ok(Number.isNaN(parseTimeToSeconds('9')));
  assert.ok(Number.isNaN(parseTimeToSeconds('')));
});

test('a plain day span', () => {
  const s = spanBetween({ startDate: day(2026, 10, 26), startTime: '09:00', endDate: day(2026, 10, 26), endTime: '17:30' });
  assert.ok(!('error' in s));
  assert.equal(s.seconds, 8.5 * 3600);
  assert.equal(s.overnight, false);
  assert.equal(s.clockShift, 0);
  assert.equal(s.summary, '8h 30m');
});

test('an earlier end time on the same date runs overnight', () => {
  const s = spanBetween({ startDate: day(2026, 10, 26), startTime: '22:00', endDate: day(2026, 10, 26), endTime: '06:00' });
  assert.ok(!('error' in s));
  assert.equal(s.overnight, true);
  assert.equal(s.seconds, 8 * 3600);
});

test('an earlier end date is an error', () => {
  const s = spanBetween({ startDate: day(2026, 10, 26), startTime: '09:00', endDate: day(2026, 10, 25), endTime: '09:00' });
  assert.ok('error' in s);
});

test('clock changes: 25 hours noon to noon falling back, 23 springing forward (Oct 2026 review)', () => {
  const back = spanBetween({ startDate: day(2026, 10, 31), startTime: '12:00', endDate: day(2026, 11, 1), endTime: '12:00' });
  assert.ok(!('error' in back));
  assert.equal(back.seconds, 25 * 3600);
  assert.equal(back.clockShift, 60);
  assert.equal(back.summary, '1 day');
  const forward = spanBetween({ startDate: day(2027, 3, 13), startTime: '12:00', endDate: day(2027, 3, 14), endTime: '12:00' });
  assert.ok(!('error' in forward));
  assert.equal(forward.seconds, 23 * 3600);
  assert.equal(forward.clockShift, -60);
  // An overnight shift across fall-back is 9 real hours
  const night = spanBetween({ startDate: day(2026, 10, 31), startTime: '22:00', endDate: day(2026, 10, 31), endTime: '06:00' });
  assert.ok(!('error' in night));
  assert.equal(night.seconds, 9 * 3600);
  assert.equal(night.clockShift, 60);
});

test('formatDurationParts: seconds only under a day, plurals', () => {
  assert.equal(formatDurationParts({ days: 2, hours: 1, seconds: 5 }), '2 days 1h');
  assert.equal(formatDurationParts({ minutes: 1, seconds: 5 }), '1m 5s');
  assert.equal(formatDurationParts({}), '0s');
});
