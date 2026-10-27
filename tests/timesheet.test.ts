// Work hours maths (lib/timesheet.ts). New York, for the clock changes.
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clockMinutes,
  decodeShareParam,
  dstLabel,
  elapsedMinutes,
  encodeShareParam,
  parseBreak,
  shiftMinutes,
  workweekMinutes,
  type Shift,
} from '../lib/timesheet.ts';

const shift = (date: string, start: string, end: string, breakMins = 0): Shift => {
  const [y, m, d] = date.split('-').map(Number);
  return { id: date + start, date: new Date(y, m - 1, d), start: `${start}:00`, end: `${end}:00`, breakMins };
};

test('clock minutes: overnight adds a day', () => {
  assert.equal(clockMinutes({ start: '09:00:00', end: '17:30:00' }), 510);
  assert.equal(clockMinutes({ start: '22:00:00', end: '06:00:00' }), 480);
});

test('elapsed minutes follow daylight saving: 9 h falling back, 7 h springing forward', () => {
  assert.equal(elapsedMinutes(shift('2026-10-31', '22:00', '06:00')), 9 * 60);
  assert.equal(elapsedMinutes(shift('2027-03-13', '22:00', '06:00')), 7 * 60);
  assert.equal(elapsedMinutes(shift('2026-10-26', '22:00', '06:00')), 8 * 60);
  assert.equal(dstLabel(shift('2026-10-31', '22:00', '06:00')), '+1h clock change');
  assert.equal(dstLabel(shift('2027-03-13', '22:00', '06:00')), '−1h clock change');
  assert.equal(dstLabel(shift('2026-10-26', '09:00', '17:00')), '');
});

test('shift minutes take off the break, never below zero', () => {
  assert.equal(shiftMinutes(shift('2026-10-26', '09:00', '17:00', 30)), 450);
  assert.equal(shiftMinutes(shift('2026-10-26', '09:00', '09:10', 30)), 0);
});

test('parseBreak takes minutes, hours and h:mm', () => {
  assert.equal(parseBreak(''), 0);
  assert.equal(parseBreak('45'), 45);
  assert.equal(parseBreak('45m'), 45);
  assert.equal(parseBreak('1h'), 60);
  assert.equal(parseBreak('1.5h'), 90);
  assert.equal(parseBreak('1:00'), 60);
  assert.equal(parseBreak('1h 30m'), 90);
  assert.equal(parseBreak('1:75'), null);
  assert.equal(parseBreak('lunch'), null);
});

test('workweeks are Sunday to Saturday; a shift counts in the week it starts', () => {
  // Mon Oct 19 – Fri Oct 23 2026, then Mon Oct 26: two weeks
  const weekOne = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map((d) => shift(d, '09:00', '17:00'));
  const weeks = workweekMinutes([...weekOne, shift('2026-10-26', '09:00', '17:00')]);
  assert.deepEqual(weeks, [40 * 60, 8 * 60]);
  // Saturday night into Sunday stays in the Saturday's week
  assert.deepEqual(workweekMinutes([shift('2026-10-24', '22:00', '06:00'), shift('2026-10-25', '09:00', '10:00')]), [480, 60]);
});

test('share links survive a round trip, "%" in a name included', () => {
  const shifts = [shift('2026-10-26', '09:00', '17:00', 30), shift('2026-10-27', '22:00', '06:00', 0)];
  const param = decodeURIComponent(encodeShareParam('Week 100%', '18,50', shifts));
  const back = decodeShareParam(param);
  assert.ok(back);
  assert.equal(back.name, 'Week 100%');
  assert.equal(back.rate, '18,50');
  assert.equal(back.shifts.length, 2);
  assert.equal(back.shifts[1].start, '22:00:00');
  assert.equal(back.shifts[1].end, '06:00:00');
  assert.equal(back.shifts[0].breakMins, 30);
  assert.equal(back.shifts[0].date.getDate(), 26);
  assert.equal(decodeShareParam('not json'), null);
  assert.equal(decodeShareParam('{"s":[]}'), null);
});
