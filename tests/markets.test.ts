// Market hours (lib/markets.ts) and the countdown catalogue (lib/countdowns.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MARKETS, getMarketStatus } from '../lib/markets.ts';
import { COUNTDOWNS } from '../lib/countdowns.ts';
import { channels, luminance } from '../lib/colour.ts';

const nyse = MARKETS.find((m) => m.id === 'nyse')!;
const tokyo = MARKETS.find((m) => m.timezone === 'Asia/Tokyo');

test('NYSE through a regular Monday (Oct 26 2026, New York = UTC−4)', () => {
  assert.equal(getMarketStatus(nyse, new Date('2026-10-26T12:00:00Z')).state, 'pre-market'); // 08:00
  const open = getMarketStatus(nyse, new Date('2026-10-26T15:00:00Z')); // 11:00
  assert.equal(open.state, 'open');
  assert.equal(open.nextTransitionLabel, 'closes');
  assert.equal(open.nextTransition.toISOString(), '2026-10-26T20:00:00.000Z');
  assert.equal(getMarketStatus(nyse, new Date('2026-10-26T21:00:00Z')).state, 'after-hours'); // 17:00
  assert.equal(getMarketStatus(nyse, new Date('2026-10-27T02:00:00Z')).state, 'closed'); // 22:00
});

test('NYSE after the clocks go back keeps 9:30 New York time (UTC−5)', () => {
  const s = getMarketStatus(nyse, new Date('2026-11-02T13:00:00Z')); // Mon 08:00 EST
  assert.equal(s.nextTransitionLabel, 'opens');
  assert.equal(s.nextTransition.toISOString(), '2026-11-02T14:30:00.000Z');
});

test('NYSE weekends and listed holidays are closed; half days close at 13:00', () => {
  assert.equal(getMarketStatus(nyse, new Date('2026-10-31T15:00:00Z')).state, 'closed'); // Saturday
  const full = nyse.holidays!.find((h) => !h.halfDay && Date.parse(h.date) > Date.parse('2026-01-01'))!;
  const atNoon = new Date(`${full.date}T16:00:00Z`);
  const s = getMarketStatus(nyse, atNoon);
  assert.equal(s.state, 'closed', full.date);
  assert.equal(s.holidayName, full.name);
  const half = nyse.holidays!.find((h) => h.halfDay);
  if (half) {
    const h = getMarketStatus(nyse, new Date(`${half.date}T15:00:00Z`));
    assert.equal(h.isHalfDay, true);
    assert.equal(h.sessions[0].closeUtc.getUTCHours() - h.sessions[0].openUtc.getUTCHours(), 4); // 9:30 → 13:00, in UTC hours
  }
});

test('Tokyo has a lunch break', { skip: !tokyo }, () => {
  // Tue Oct 27 2026 12:00 in Tokyo (UTC+9) = 03:00 UTC
  assert.equal(getMarketStatus(tokyo!, new Date('2026-10-27T03:00:00Z')).state, 'lunch');
});

// The countdown catalogue: every entry has a page, one kind of target, and a
// board that passes WCAG AA for its numerals (the spec's own promise).
test('countdowns: pages exist, targets and board contrast', () => {
  const contrast = (a: string, b: string) => {
    const [l1, l2] = [luminance(channels(a)), luminance(channels(b))].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  for (const [slug, entry] of Object.entries(COUNTDOWNS)) {
    assert.ok(fs.existsSync(`app${entry.path}page.tsx`), `${slug}: ${entry.path} has a page`);
    const s = entry.spec;
    const kinds = [s.target, s.recurring, s.weekly, s.nthWeekday, s.dateRanges].filter(Boolean).length;
    const special = Boolean(entry.eclipse || entry.clockChange);
    assert.ok(special ? kinds === 0 : kinds === 1, `${slug}: exactly one target kind`);
    const ratio = contrast(s.board.color, s.board.ink ?? '#ffffff');
    assert.ok(ratio >= 4.5, `${slug}: board contrast ${ratio.toFixed(2)}`);
  }
});
