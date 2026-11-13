// node --test tests/ — the image badges' table (lib/badges.ts) and the
// countdown live spec it shares with the event pages (lib/liveSpec.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGE_SLUGS, badgeEntries, badgePath } from '../lib/badges.ts';
import { liveSpecFor } from '../lib/liveSpec.ts';
import { COUNTDOWN_SLUGS } from '../lib/countdowns.ts';
import { channels, contrast } from '../lib/colour.ts';

test('every countdown but the clock change has a badge', () => {
  const table = badgeEntries(2026);
  assert.deepEqual(Object.keys(table).sort(), COUNTDOWN_SLUGS.filter((s) => s !== 'daylight-saving-time').sort());
  assert.deepEqual([...BADGE_SLUGS].sort(), Object.keys(table).sort());
  for (const [slug, b] of Object.entries(table)) {
    assert.match(b.spec, /^(t:\d+|d:\d{4}-\d{2}-\d{2}|w:\d:\d)/, slug);
    assert.ok(b.title && b.arrived && b.name, slug);
    assert.match(b.path, /^\/countdown\/[a-z0-9-]+\/$/, slug);
    // The words sit on the board (4.5:1); the 32px bold numerals on the tile
    // need WCAG's large-text 3:1, as on the event pages' own tiles
    for (const c of [b.color, b.ink, b.tile]) assert.match(c, /^#[0-9a-f]{6}$/i, slug);
    const ratio = (x: string, y: string) => contrast(channels(x), channels(y));
    assert.ok(ratio(b.ink, b.tile) >= 3, `${slug} tile ${ratio(b.ink, b.tile)}`);
    assert.ok(ratio(b.ink, b.color) >= 4.5, `${slug} board ${ratio(b.ink, b.color)}`);
    assert.match(badgePath(slug), /^\/badge\/countdown\/[a-z0-9-]+\.svg$/);
  }
});

test('badge specs', () => {
  const t = badgeEntries(2026);
  assert.equal(t.christmas.spec, 'd:2026-12-25,2027-12-25,2028-12-25,2029-12-25,2030-12-25,2031-12-25');
  assert.equal(t.thanksgiving.spec.split(',')[0], 'd:2026-11-26');
  assert.equal(t['black-friday'].spec.split(',')[1], '2027-11-26');
  assert.equal(t['solar-eclipse-2027'].spec, `t:${Date.UTC(2027, 7, 2, 10, 6, 37)}`);
  assert.equal(t['solar-eclipse-2027'].title, 'the 2027 total solar eclipse');
  assert.equal(t.christmas.arrived, 'Merry Christmas! 🎄');
});

test('liveSpecFor', () => {
  assert.equal(liveSpecFor({ weekly: { weekday: 6, spanDays: 2 } }, 2026), 'w:6:2');
  assert.equal(liveSpecFor({ weekly: { weekday: 5 } }, 2026), 'w:5:1');
  assert.equal(liveSpecFor({ target: new Date(2026, 10, 19) }, 2026), 'd:2026-11-19'); // a release day
  assert.equal(liveSpecFor({ target: new Date(Date.UTC(2027, 0, 1, 15, 30)) }, 2026), `t:${Date.UTC(2027, 0, 1, 15, 30)}`);
  assert.equal(
    liveSpecFor({ dateRanges: [{ start: '2026-12-04', end: '2026-12-12' }, { start: '2027-04-01' }, { start: '2027-05-01', end: '2027-05-01' }] }, 2026),
    'd:2026-12-04/2026-12-12,2027-04-01,2027-05-01',
  );
  assert.equal(liveSpecFor({ recurring: { month: 1, day: 14 } }, 2030), 'd:2030-02-14,2031-02-14,2032-02-14,2033-02-14,2034-02-14,2035-02-14');
  assert.equal(liveSpecFor({}, 2026), undefined);
});
