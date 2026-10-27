// node --test tests/ — overtime pay maths (lib/overtime.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOvertime, computeWeeklyOvertime, parseAmount, parseHours, round2 } from '../lib/overtime.ts';

test('round2 rounds half up to cents despite binary floating point', () => {
  assert.equal(round2(12.35 * 1.5), 18.53); // 18.525 → was 18.52
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(2.675), 2.68);
  assert.equal(round2(18.524), 18.52);
  assert.equal(round2(0), 0);
});

test('single week: 46.5 h at $20, 1.5x after 40', () => {
  const r = computeOvertime({ hoursWorked: 46.5, threshold: 40, multiplier: 1.5, rate: 20 });
  assert.deepEqual(r, { regularHours: 40, overtimeHours: 6.5, regularPay: 800, overtimePay: 195, totalPay: 995, overtimeRate: 30 });
});

test('overtime rate uses the rounded rate: $12.35 x 1.5 = $18.53', () => {
  const r = computeOvertime({ hoursWorked: 41, threshold: 40, multiplier: 1.5, rate: 12.35 });
  assert.equal(r.overtimeRate, 18.53);
  assert.equal(r.overtimePay, 18.53);
  assert.equal(r.totalPay, 512.53);
});

test('two weeks of 40 h is no overtime (FLSA is per workweek)', () => {
  const r = computeWeeklyOvertime([40, 40], { threshold: 40, multiplier: 1.5, rate: 20 });
  assert.equal(r.weeks, 2);
  assert.equal(r.overtimeHours, 0);
  assert.equal(r.totalPay, 1600);
});

test('45 h + 35 h: overtime only in the first week', () => {
  const r = computeWeeklyOvertime([45, 35], { threshold: 40, multiplier: 1.5, rate: 20 });
  assert.equal(r.regularHours, 75);
  assert.equal(r.overtimeHours, 5);
  assert.equal(r.overtimePay, 150);
  assert.equal(r.totalPay, 1650);
});

test('no rate: hours split only', () => {
  const r = computeWeeklyOvertime([50], { threshold: 40, multiplier: 2, rate: null });
  assert.deepEqual(r, { weeks: 1, regularHours: 40, overtimeHours: 10, regularPay: null, overtimePay: null, totalPay: null, overtimeRate: null });
});

test('parseAmount reads comma decimals, thousands and $ (18,50 was 1850)', () => {
  assert.equal(parseAmount('18.50'), 18.5);
  assert.equal(parseAmount('18,50'), 18.5);
  assert.equal(parseAmount('18,5'), 18.5);
  assert.equal(parseAmount('$18.50'), 18.5);
  assert.equal(parseAmount('1,850'), 1850);
  assert.equal(parseAmount('1,234.50'), 1234.5);
  assert.equal(parseAmount(' 40 '), 40);
  assert.equal(parseAmount('.5'), 0.5);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount('18,5,0'), null);
  assert.ok(Number.isNaN(parseAmount('-5')));
  // European grouping (Oct 2026 review: '1.234,50' read as 1.2345)
  assert.equal(parseAmount('1.234,50'), 1234.5);
  assert.equal(parseAmount('1.234.567'), 1234567);
  assert.equal(parseAmount('1,234,567.5'), 1234567.5);
  assert.equal(parseAmount('1.850'), 1.85);
  assert.equal(parseAmount('12,34.5'), null);
  assert.equal(parseAmount('1.234,5,6'), null);
});

test('parseHours reads decimals, h:mm and 46h 30m (46:30 was 4630)', () => {
  assert.equal(parseHours('46.5'), 46.5);
  assert.equal(parseHours('46,5'), 46.5);
  assert.equal(parseHours('46:30'), 46.5);
  assert.equal(parseHours('46:05'), 46 + 5 / 60);
  assert.equal(parseHours('46h 30m'), 46.5);
  assert.equal(parseHours('46h30'), 46.5);
  assert.equal(parseHours('46 hours 30 minutes'), 46.5);
  assert.equal(parseHours('46h'), 46);
  assert.equal(parseHours('40'), 40);
  assert.equal(parseHours('46:75'), null);
  assert.equal(parseHours('abc'), null);
  assert.equal(parseHours(''), null);
  assert.ok(Number.isNaN(parseHours('-5')));
  assert.ok(Number.isNaN(parseHours('-46:30')));
});
