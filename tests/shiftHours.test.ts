// node --test tests/ — shift lengths for the shift hours chart (lib/shiftHours.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHIFTS,
  SHIFT_GROUPS,
  clock12,
  clock24,
  decimalHours,
  findShift,
  fortyHourWeeks,
  hoursMinutes,
  isOvernight,
  paidMinutes,
  shiftMinutes,
  shortName,
} from '../lib/shiftHours.ts';

const at = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

test('clock minutes, overnight wraps to the next day', () => {
  assert.equal(shiftMinutes(at('9:00'), at('17:00')), 480);
  assert.equal(shiftMinutes(at('9:00'), at('17:30')), 510);
  assert.equal(shiftMinutes(at('7:00'), at('15:30')), 510);
  assert.equal(shiftMinutes(at('22:00'), at('6:00')), 480);
  assert.equal(shiftMinutes(at('19:00'), at('7:00')), 720);
  assert.equal(shiftMinutes(at('16:00'), at('0:00')), 480);
  assert.equal(shiftMinutes(at('16:30'), at('22:00')), 330);
});

test('paid minutes take the unpaid lunch off, none on short shifts', () => {
  assert.equal(paidMinutes(at('9:00'), at('17:00'), 0), 480);
  assert.equal(paidMinutes(at('9:00'), at('17:00'), 30), 450);
  assert.equal(paidMinutes(at('9:00'), at('17:00'), 60), 420);
  assert.equal(paidMinutes(at('7:00'), at('19:00'), 30), 690);
  // 4 and 5½ hours: no lunch columns
  assert.equal(paidMinutes(at('9:00'), at('13:00'), 30), null);
  assert.equal(paidMinutes(at('16:30'), at('22:00'), 60), null);
  assert.equal(paidMinutes(at('16:30'), at('22:00'), 0), 330);
});

test('labels', () => {
  assert.equal(clock12(at('9:00')), '9 AM');
  assert.equal(clock12(at('17:30')), '5:30 PM');
  assert.equal(clock12(at('0:00')), '12 AM');
  assert.equal(clock12(at('12:00')), '12 PM');
  assert.equal(clock24(at('9:00')), '09:00');
  assert.equal(clock24(at('0:00')), '00:00');
  assert.equal(shortName(at('9:00'), at('17:30')), '9 to 5:30');
  assert.equal(shortName(at('22:00'), at('6:00')), '10 to 6');
  assert.equal(hoursMinutes(510), '8h 30m');
  assert.equal(hoursMinutes(480), '8h');
  assert.equal(hoursMinutes(30), '30m');
  assert.equal(decimalHours(510), '8.50');
  assert.equal(decimalHours(450), '7.50');
  assert.equal(decimalHours(330), '5.50');
});

test('every shift is listed once, in a known group, at a sensible length', () => {
  const keys = SHIFTS.map((s) => `${s.start}-${s.end}`);
  assert.equal(new Set(keys).size, keys.length);
  const groups = new Set(SHIFT_GROUPS.map((g) => g.id));
  for (const s of SHIFTS) {
    assert.ok(groups.has(s.group), `${clock24(s.start)} group`);
    const mins = shiftMinutes(s.start, s.end);
    assert.ok(mins >= 4 * 60 && mins <= 12 * 60, `${clock24(s.start)}–${clock24(s.end)} is ${mins} minutes`);
  }
  for (const g of SHIFT_GROUPS) assert.ok(SHIFTS.some((s) => s.group === g.id), `${g.name} has shifts`);
});

test('overnight shifts', () => {
  assert.equal(isOvernight(findShift('22:00', '6:00')), true);
  assert.equal(isOvernight(findShift('16:00', '0:00')), true);
  assert.equal(isOvernight(findShift('0:00', '8:00')), false);
  assert.equal(isOvernight(findShift('9:00', '17:00')), false);
});

test('40-hour weeks over five days', () => {
  const weeks = fortyHourWeeks();
  const has = (s: string, e: string, unpaidBreak: number) =>
    weeks.some((w) => w.shift === findShift(s, e) && w.unpaidBreak === unpaidBreak);
  assert.ok(has('9:00', '17:30', 30));
  assert.ok(has('8:00', '16:30', 30));
  assert.ok(has('8:00', '17:00', 60));
  assert.ok(has('9:00', '17:00', 0));
  assert.ok(!has('9:00', '17:00', 30));
  for (const w of weeks) assert.equal(w.weekMinutes, 2400);
});

test('findShift throws for a shift not in the chart', () => {
  assert.throws(() => findShift('9:15', '17:00'));
});
