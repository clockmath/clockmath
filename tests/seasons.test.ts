// Season starts (lib/seasons.ts): the instants, the next-one lookup, and the
// local dates that make "March 20 or 21?" depend on where you are.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASON_STARTS, momentIn, nextSeasonStart } from '../lib/seasons.ts';

test('one start a year, in order, on the expected days', () => {
  for (const [kind, list] of Object.entries(SEASON_STARTS)) {
    list.forEach((ms, i) => {
      const d = new Date(ms);
      assert.equal(d.getUTCFullYear(), 2027 + i, `${kind} ${i}`);
      assert.equal(d.getUTCMonth(), kind === 'spring' ? 2 : 5);
      assert.ok([19, 20, 21].includes(d.getUTCDate()));
    });
  }
});

test('the next start after a moment', () => {
  const spring27 = Date.UTC(2027, 2, 20, 20, 25);
  assert.equal(nextSeasonStart('spring', Date.UTC(2026, 10, 12)), spring27);
  assert.equal(nextSeasonStart('spring', spring27 - 1), spring27);
  assert.equal(nextSeasonStart('spring', spring27), Date.UTC(2028, 2, 20, 2, 17));
  // after the last listed one: stays on it (stale-check flags the page)
  assert.equal(nextSeasonStart('summer', Date.UTC(2031, 0, 1)), Date.UTC(2030, 5, 21, 7, 31));
});

test('the 2027 equinox is March 20 in the Americas and Europe, March 21 from Dubai east', () => {
  const at = SEASON_STARTS.spring[0];
  assert.equal(momentIn(at, 'America/New_York'), 'Saturday, March 20, 4:25 PM');
  assert.equal(momentIn(at, 'Europe/London'), 'Saturday, March 20, 8:25 PM');
  assert.equal(momentIn(at, 'Europe/Moscow'), 'Saturday, March 20, 11:25 PM');
  assert.equal(momentIn(at, 'Asia/Dubai'), 'Sunday, March 21, 12:25 AM');
  assert.equal(momentIn(at, 'Asia/Tokyo'), 'Sunday, March 21, 5:25 AM');
});

test('the 2027 solstice: June 21, and June 22 in eastern Australia', () => {
  const at = SEASON_STARTS.summer[0];
  assert.equal(momentIn(at, 'America/New_York'), 'Monday, June 21, 10:11 AM');
  assert.equal(momentIn(at, 'Australia/Sydney'), 'Tuesday, June 22, 12:11 AM');
});
