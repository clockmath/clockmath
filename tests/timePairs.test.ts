// node --test tests/ — the time difference pages (lib/timePairs.ts) and the
// worker's copy of the live sentence (scripts/worker/live-counts.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TIME_PAIRS,
  formatClock,
  formatGap,
  gapChanges,
  gapOf,
  getPlace,
  getTimePair,
  hourRows,
  liveSpec,
  meetingAdvice,
  overlap,
  pairDescription,
  pairFaqs,
  pairTitle,
  relationSentence,
  reverseRedirects,
  segmentAt,
  segments,
  utcLabel,
  wallClockLabel,
  yearOfGaps,
  yearSentence,
  type TimePair,
} from '../lib/timePairs.ts';

const at = (iso: string) => Date.parse(iso);
const YEAR = 365 * 86_400_000;
const NOV_12 = at('2026-11-12T12:00:00Z');
const tableFor = (a: string, b: string, from = NOV_12) => segments(getPlace(a)!.zone, getPlace(b)!.zone, from, from + 2 * YEAR);
// A pair that has no page, for the zones the pages don't cover yet
const pairOf = (a: string, b: string): TimePair => ({ slug: `${a}-to-${b}`, a: getPlace(a)!, b: getPlace(b)! });

test('words', () => {
  assert.equal(formatGap(300), '5 hours');
  assert.equal(formatGap(-60), '1 hour');
  assert.equal(formatGap(570), '9 hours 30 minutes');
  assert.equal(formatGap(45), '45 minutes');
  assert.equal(relationSentence('New York', 'London', 300), 'London is 5 hours ahead of New York');
  assert.equal(relationSentence('New York', 'Los Angeles', -180), 'Los Angeles is 3 hours behind New York');
  assert.equal(relationSentence('Phoenix', 'Los Angeles', 0), 'Phoenix and Los Angeles are on the same time');
  assert.equal(formatClock(0), '12:00 AM');
  assert.equal(formatClock(12 * 60), '12:00 PM');
  assert.equal(formatClock(13 * 60 + 30), '1:30 PM');
  assert.equal(formatClock(25 * 60), '1:00 AM'); // wraps past midnight
  assert.equal(formatClock(-30), '11:30 PM');
  assert.equal(formatClock(9 * 60 + 5, true), '09:05');
  assert.equal(utcLabel(-300), 'UTC−5');
  assert.equal(utcLabel(330), 'UTC+5:30');
  assert.equal(utcLabel(0), 'UTC+0');
  assert.equal(wallClockLabel(at('2026-11-12T20:15:00Z'), -300), 'Thursday 3:15 PM');
});

test('New York and London: different change dates make a 4-hour gap twice a year', () => {
  const segs = tableFor('new-york', 'london');
  // The US springs forward on Mar 14 2027 (2 AM EST = 07:00 UTC), the UK on
  // Mar 28 (01:00 UTC); the UK falls back on Oct 31 (01:00 UTC), the US on
  // Nov 7 (2 AM EDT = 06:00 UTC)
  const changes = gapChanges(segs).slice(0, 4);
  assert.deepEqual(
    changes.map((c) => [new Date(c.at).toISOString(), c.moved, gapOf(c.after)]),
    [
      ['2027-03-14T07:00:00.000Z', 'a', 240],
      ['2027-03-28T01:00:00.000Z', 'b', 300],
      ['2027-10-31T01:00:00.000Z', 'b', 240],
      ['2027-11-07T06:00:00.000Z', 'a', 300],
    ],
  );
  const year = yearOfGaps(segs, NOV_12);
  assert.deepEqual(year.map((g) => [g.gap, g.days]), [[300, 344], [240, 21]]);
  const p = getTimePair('new-york-to-london')!;
  assert.equal(
    yearSentence(p, year),
    'London is 5 hours ahead of New York for most of the year, and 4 hours ahead for about 3 weeks.',
  );
  assert.equal(gapOf(segmentAt(segs, at('2027-03-20T12:00:00Z'))), 240);
  assert.equal(gapOf(segmentAt(segs, at('2027-07-01T12:00:00Z'))), 300);
});

test('US zones change at 2 AM local, an hour apart: no overnight blip in the summaries', () => {
  const segs = tableFor('new-york', 'chicago');
  // The raw table has the hour when New York has moved and Chicago hasn't
  assert.ok(segs.some((s) => gapOf(s) !== -60));
  const year = yearOfGaps(segs, NOV_12);
  assert.deepEqual(year.map((g) => g.gap), [-60]);
  const changes = gapChanges(segs);
  assert.ok(changes.length >= 2);
  assert.ok(changes.every((c) => c.moved === 'both' && gapOf(c.after) === -60));
  assert.equal(yearSentence(getTimePair('new-york-to-chicago')!, year), 'Chicago is 1 hour behind New York all year.');
});

test('India: half-hour offset, no clock changes', () => {
  const segs = tableFor('new-york', 'mumbai');
  const year = yearOfGaps(segs, NOV_12);
  assert.deepEqual(year.map((g) => [g.gap, g.days]), [[570, 238], [630, 127]]);
  assert.ok(gapChanges(segs).every((c) => c.moved === 'a'), 'only New York changes');
  assert.equal(relationSentence('New York', 'Mumbai', 630), 'Mumbai is 10 hours 30 minutes ahead of New York');
  // 9:00 AM in New York is 6:30 PM (summer) in Mumbai
  assert.equal(formatClock(9 * 60 + 570), '6:30 PM');
  const rows = hourRows(570);
  assert.equal(rows[20].b, 5 * 60 + 30); // 8 PM in New York → 5:30 AM
  assert.equal(rows[20].bDayShift, 1); // … the next day
});

test('Zones without clock changes: one gap all year', () => {
  const segs = tableFor('mumbai', 'tokyo');
  assert.equal(segs.length, 1);
  assert.deepEqual(gapChanges(segs), []);
  const year = yearOfGaps(segs, NOV_12);
  assert.deepEqual(year.map((g) => [g.gap, g.days]), [[210, 365]]);
  const p = pairOf('mumbai', 'tokyo');
  assert.equal(yearSentence(p, year), 'Tokyo is 3 hours 30 minutes ahead of Mumbai all year.');
  const faq = pairFaqs(p, year, []).find((f) => f.question.startsWith('Do '))!;
  assert.match(faq.answer, /^Neither changes its clocks/);
});

test('Alberta and Arizona: no clock changes, whatever the tz data', () => {
  // Alberta stays on UTC−6 from Nov 1 2026 (lib/time routes it through a
  // fixed zone on stale tz data), so Calgary–Toronto is 1 hour in winter
  const calgary = tableFor('calgary', 'toronto');
  assert.equal(gapOf(segmentAt(calgary, at('2027-01-15T12:00:00Z'))), 60);
  assert.equal(gapOf(segmentAt(calgary, at('2027-07-15T12:00:00Z'))), 120);
  assert.ok(gapChanges(calgary).every((c) => c.moved === 'b'), 'only Toronto changes');
  assert.equal(
    yearSentence(getTimePair('calgary-to-toronto')!, yearOfGaps(calgary, NOV_12)),
    'Toronto is 2 hours ahead of Calgary for about 8 months, and 1 hour ahead for about 4 months.',
  );
  const phoenix = tableFor('phoenix', 'los-angeles');
  assert.deepEqual(yearOfGaps(phoenix, NOV_12).map((g) => g.gap), [0, -60]);
  assert.equal(
    yearSentence(getTimePair('phoenix-to-los-angeles')!, yearOfGaps(phoenix, NOV_12)),
    'Phoenix and Los Angeles are on the same time for about 8 months, and Los Angeles is 1 hour behind Phoenix for about 4 months.',
  );
});

test('Los Angeles and Sydney: opposite seasons, three gaps', () => {
  const segs = tableFor('los-angeles', 'sydney');
  const year = yearOfGaps(segs, NOV_12);
  assert.deepEqual(year.map((g) => g.gap / 60).sort(), [17, 18, 19]);
  assert.equal(year.reduce((n, g) => n + g.days, 0), 365);
  assert.equal(gapOf(segmentAt(segs, at('2027-01-15T12:00:00Z'))), 19 * 60);
  assert.equal(gapOf(segmentAt(segs, at('2027-07-15T12:00:00Z'))), 17 * 60);
});

test('FAQ answers: the example times, without repeating the page', () => {
  const p = getTimePair('new-york-to-london')!;
  const segs = tableFor('new-york', 'london');
  const faqs = pairFaqs(p, yearOfGaps(segs, NOV_12), gapChanges(segs));
  assert.deepEqual(faqs.slice(0, 2), [
    { question: 'If it is 9:00 AM in New York, what time is it in London?', answer: '2:00 PM in London for most of the year, or 1:00 PM for about 3 weeks.' },
    { question: 'If it is 9:00 AM in London, what time is it in New York?', answer: '4:00 AM in New York for most of the year, or 5:00 AM for about 3 weeks.' },
  ]);
  assert.match(faqs[2].answer, /^No\. New York is on Eastern Time/);
  // Clocks that change together
  const la = getTimePair('new-york-to-los-angeles')!;
  const laSegs = tableFor('new-york', 'los-angeles');
  const laFaqs = pairFaqs(la, yearOfGaps(laSegs, NOV_12), gapChanges(laSegs));
  // 9 AM in New York is 6 AM in LA (night), so the example is 8 PM
  assert.deepEqual(laFaqs[0], { question: 'If it is 8:00 PM in New York, what time is it in Los Angeles?', answer: '5:00 PM in Los Angeles.' });
  assert.match(laFaqs[2].answer, /^Yes, so the difference never changes/);
});

test('working-hours overlap and meeting advice', () => {
  // New York and London (5 hours): 9 AM–12 PM in New York
  assert.deepEqual(overlap(300), { aStart: 9 * 60, aEnd: 12 * 60, bDayShift: 0 });
  // Los Angeles and London (8 hours): 9 to 5 never overlaps; 8 AM–12 PM stretches
  assert.equal(overlap(480), null);
  assert.deepEqual(meetingAdvice(480).stretch, { aStart: 8 * 60, aEnd: 12 * 60, bDayShift: 0 });
  // Los Angeles and Sydney (17 hours): 4–5 PM in LA is 9–10 AM the next day
  assert.deepEqual(overlap(17 * 60), { aStart: 16 * 60, aEnd: 17 * 60, bDayShift: 1 });
  // Behind: Los Angeles is 3 hours behind New York, 12–5 PM in New York
  assert.deepEqual(overlap(-180), { aStart: 12 * 60, aEnd: 17 * 60, bDayShift: 0 });
  // Same time: the whole day
  assert.deepEqual(overlap(0), { aStart: 9 * 60, aEnd: 17 * 60, bDayShift: 0 });
  // New York and Mumbai (9:30 in summer): no 9-to-5 overlap; 8 PM in Mumbai is 10:30 AM
  assert.equal(overlap(570), null);
  assert.deepEqual(meetingAdvice(570).stretch, { aStart: 8 * 60, aEnd: 10 * 60 + 30, bDayShift: 0 });
});

test('every page: title length, unique slugs, FAQs, redirects', () => {
  const slugs = new Set<string>();
  for (const p of TIME_PAIRS) {
    assert.ok(pairTitle(p).length <= 65, `${p.slug}: title ${pairTitle(p).length} characters`);
    assert.ok(!slugs.has(p.slug), `${p.slug} twice`);
    slugs.add(p.slug);
    const segs = tableFor(p.a.slug, p.b.slug);
    const year = yearOfGaps(segs, NOV_12);
    const faqs = pairFaqs(p, year, gapChanges(segs));
    assert.equal(faqs.length, 4, `${p.slug}: ${faqs.length} FAQs`);
    for (const f of faqs) assert.ok(!/undefined|NaN|right now/.test(f.answer), `${p.slug}: ${f.answer}`);
    assert.ok(pairDescription(p, year).length <= 170, `${p.slug}: description too long`);
  }
  // One page per pair of clocks: no two pages with the same offsets all year
  const shapes = TIME_PAIRS.map((p) => JSON.stringify(tableFor(p.a.slug, p.b.slug).map((s) => [s.a, s.b])));
  assert.equal(new Set(shapes).size, shapes.length);
  // The worker's table matches
  const api = readFileSync(new URL('../scripts/worker/api.js', import.meta.url), 'utf8');
  const block = api.slice(api.indexOf('const TIME_PAIR_REDIRECTS'), api.indexOf('Object.assign(EXACT_REDIRECTS'));
  const inWorker = Object.fromEntries([...block.matchAll(/'([^']+)': '([^']+)'/g)].map((m) => [m[1], m[2]]));
  assert.deepEqual(inWorker, reverseRedirects());
});

test('the worker’s live sentence and clocks match the page’s', () => {
  const code = readFileSync(new URL('../scripts/worker/live-counts.js', import.meta.url), 'utf8');
  const { livePair, pairOffsets } = new Function(`${code}; return { livePair, pairOffsets };`)() as {
    livePair: (kind: string, offsets: { a: number; b: number } | null, names: string, now: number) => string | null;
    pairOffsets: (spec: string, now: number) => { a: number; b: number } | null;
  };
  const instants = ['2026-11-12T12:00:00Z', '2027-03-20T15:45:00Z', '2027-07-01T03:05:00Z', '2027-10-31T00:59:00Z', '2027-10-31T01:00:00Z', '2028-01-01T00:00:00Z'].map(at);
  for (const p of [...TIME_PAIRS, pairOf('new-york', 'mumbai'), pairOf('mumbai', 'tokyo')]) {
    const segs = tableFor(p.a.slug, p.b.slug);
    const spec = liveSpec(segs);
    const names = `${p.a.name}|${p.b.name}`;
    for (const now of instants) {
      const s = segmentAt(segs, now);
      const offsets = pairOffsets(spec, now);
      assert.deepEqual(offsets, { a: s.a, b: s.b }, `${p.slug} at ${new Date(now).toISOString()}`);
      assert.equal(livePair('sentence', offsets, names, now), relationSentence(p.a.name, p.b.name, gapOf(s)));
      assert.equal(livePair('time-a', offsets, names, now), wallClockLabel(now, s.a));
      assert.equal(livePair('time-b', offsets, names, now), wallClockLabel(now, s.b));
      assert.equal(livePair('gap', offsets, names, now), gapOf(s) === 0 ? 'no difference' : formatGap(gapOf(s)));
    }
  }
  // Before the table starts, the first row; a broken spec, nothing
  assert.deepEqual(pairOffsets('0:-300:0,1800000000000:-240:60', 1), { a: -300, b: 0 });
  assert.equal(pairOffsets('nonsense', 1), null);
  assert.equal(livePair('sentence', null, 'A|B', 1), null);
});
