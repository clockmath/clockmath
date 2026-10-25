// node --test tests/ — the countdown tool's ?to= values (lib/wallClock.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWallClock, toWallClock } from '../lib/wallClock.ts';

test('a bare date is local midnight, not midnight UTC', () => {
  const d = parseWallClock('2026-12-25')!;
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [2026, 11, 25, 0, 0]);
});

test('a wall-clock time is read on the local clock', () => {
  const d = parseWallClock('2026-07-04T21:30')!;
  assert.deepEqual([d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [6, 4, 21, 30]);
  assert.equal(parseWallClock('2026-07-04T21:30:15')!.getSeconds(), 15);
});

test('round-trips with toWallClock', () => {
  assert.equal(toWallClock(parseWallClock('2027-01-01T00:00')!), '2027-01-01T00:00');
  assert.equal(toWallClock(parseWallClock('2026-12-25')!), '2026-12-25T00:00');
});

test('dates and times that do not exist are refused', () => {
  assert.equal(parseWallClock('2026-02-30'), null);
  assert.equal(parseWallClock('2026-13-01'), null);
  assert.equal(parseWallClock('2026-05-01T24:00'), null);
  assert.equal(parseWallClock('next-friday'), null);
  assert.equal(parseWallClock(''), null);
  assert.equal(parseWallClock(null), null);
});

test('an ISO time with a zone still means that instant', () => {
  assert.equal(parseWallClock('2026-12-25T05:00:00Z')!.getTime(), Date.UTC(2026, 11, 25, 5));
});
