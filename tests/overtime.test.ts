// node --test tests/ — overtime pay maths (lib/overtime.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOvertime, computeWeeklyOvertime, round2 } from '../lib/overtime.ts';

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
