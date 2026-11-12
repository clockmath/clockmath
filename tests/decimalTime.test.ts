// node --test tests/ — decimal hours conversions and chart rows (lib/decimalTime.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decimalToHm, decimalToMinutes, formatMinutes, minutesToDecimal, roundingBands } from '../lib/decimalTime.ts';

test('minutes to decimal hours, 2 places', () => {
  assert.equal(minutesToDecimal(15), 0.25);
  assert.equal(minutesToDecimal(20), 0.33);
  assert.equal(minutesToDecimal(40), 0.67);
  assert.equal(minutesToDecimal(45), 0.75);
  assert.equal(minutesToDecimal(1), 0.02);
  assert.equal(minutesToDecimal(60), 1);
});

test('decimal hours to hours and minutes', () => {
  assert.deepEqual(decimalToHm(7.75), { hours: 7, minutes: 45 });
  assert.deepEqual(decimalToHm(8.33), { hours: 8, minutes: 20 });
  // 0.999 h is 59.94 min, which rounds into the next hour rather than "0h 60m"
  assert.deepEqual(decimalToHm(0.999), { hours: 1, minutes: 0 });
});

test('fraction of an hour to minutes, 1 place', () => {
  assert.equal(decimalToMinutes(0.01), 0.6);
  assert.equal(decimalToMinutes(0.1), 6);
  assert.equal(decimalToMinutes(0.25), 15);
  assert.equal(decimalToMinutes(0.33), 19.8);
  assert.equal(decimalToMinutes(0.8), 48);
  assert.equal(decimalToMinutes(0.83), 49.8);
  assert.equal(decimalToMinutes(1), 60);
  // Float noise: 0.07 * 60 is 4.2000000000000002
  assert.equal(decimalToMinutes(0.07), 4.2);
});

test('every hundredth from 0.01 to 1.00 converts cleanly', () => {
  for (let i = 1; i <= 100; i++) {
    const m = decimalToMinutes(i / 100);
    assert.equal(m, (i * 6) / 10, `0.${i} h`);
    assert.match(formatMinutes(m), /^\d+(\.\d)?$/);
  }
});

test('whole minutes print without ".0"', () => {
  assert.equal(formatMinutes(6), '6');
  assert.equal(formatMinutes(19.8), '19.8');
  assert.equal(formatMinutes(0.6), '0.6');
});

test('tenth-of-an-hour bands round to the nearest 6 minutes', () => {
  const bands = roundingBands(6);
  assert.equal(bands.length, 11);
  assert.deepEqual(bands[0], { from: 0, to: 2, roundsTo: 0, decimal: 0 });
  assert.deepEqual(bands[1], { from: 3, to: 8, roundsTo: 6, decimal: 0.1 });
  assert.deepEqual(bands[5], { from: 27, to: 32, roundsTo: 30, decimal: 0.5 });
  assert.deepEqual(bands[10], { from: 57, to: 60, roundsTo: 60, decimal: 1 });
});

test('quarter-hour bands follow the 7-minute rule', () => {
  const bands = roundingBands(15);
  assert.deepEqual(
    bands.map((b) => [b.from, b.to, b.decimal]),
    [
      [0, 7, 0],
      [8, 22, 0.25],
      [23, 37, 0.5],
      [38, 52, 0.75],
      [53, 60, 1],
    ],
  );
});

test('bands cover every minute 0–60 once, in order', () => {
  for (const step of [5, 6, 15]) {
    const bands = roundingBands(step);
    assert.equal(bands[0].from, 0);
    assert.equal(bands[bands.length - 1].to, 60);
    for (let i = 1; i < bands.length; i++) assert.equal(bands[i].from, bands[i - 1].to + 1);
  }
});
