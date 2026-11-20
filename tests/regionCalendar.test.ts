// node --test tests/ — UK and Canada calendars (lib/regionCalendar.ts).
// Expected dates are written out by hand: UK from GOV.UK's bank holidays
// (Nov 20 2026), Canada 2026 from the Canada Revenue Agency's list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGIONS, REGION_IDS, regionDescription, regionFacts, regionTitle } from '../lib/regionCalendar.ts';

const offDates = (id: 'uk' | 'canada' | 'australia', year: number) => REGIONS[id].holidays(year).filter((m) => m.kind === 'off').map((m) => m.date);

test('UK 2027: Christmas and Boxing Day on the weekend, substitute days Mon 27 and Tue 28', () => {
  assert.deepEqual(offDates('uk', 2027), ['2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28']);
  const weekend = REGIONS.uk.holidays(2027).filter((m) => m.kind === 'weekend-holiday');
  assert.deepEqual(weekend.map((m) => [m.date, m.observed]), [['2027-12-25', '2027-12-27'], ['2027-12-26', '2027-12-28']]);
  assert.deepEqual(regionFacts('uk', 2027), { starts: 'Friday', weekdays: 261, daysOff: 8, workingDays: 253 });
});

test('UK 2026 Boxing Day and 2028 New Year substitutes', () => {
  assert.ok(offDates('uk', 2026).includes('2026-12-28'));
  assert.equal(REGIONS.uk.holidays(2028).find((m) => m.kind === 'weekend-holiday')?.observed, '2028-01-03');
  assert.equal(regionFacts('uk', 2028).workingDays, 252);
});

test('UK regional days: Scotland and Northern Ireland only', () => {
  const r2026 = REGIONS.uk.regional(2026).map((r) => `${r.date} ${r.where}`);
  assert.ok(r2026.includes('2026-06-15 Scotland')); // World Cup bank holiday, a one-off
  assert.ok(r2026.includes('2026-07-13 Northern Ireland')); // Boyne, Sunday 12th → Monday
  assert.ok(r2026.includes('2026-08-03 Scotland'));
  assert.ok(!r2026.some((r) => r.startsWith('2026-12-25')));
});

test('Canada 2026 matches the CRA list (federal statutory days)', () => {
  assert.deepEqual(offDates('canada', 2026), ['2026-01-01', '2026-04-03', '2026-05-18', '2026-07-01', '2026-09-07', '2026-09-30', '2026-10-12', '2026-11-11', '2026-12-25']);
  // Boxing Day 2026 is a Saturday
  assert.deepEqual(REGIONS.canada.holidays(2026).filter((m) => m.kind === 'weekend-holiday').map((m) => m.date), ['2026-12-26']);
});

test('Canada: Victoria Day and Canada Day rules', () => {
  // The Monday before May 25: May 24 when that's a Monday (2027)
  assert.ok(offDates('canada', 2027).includes('2027-05-24'));
  assert.ok(offDates('canada', 2028).includes('2028-05-22'));
  // 2028: Canada Day is a Saturday, so it stays on July 1 (only Sunday moves to July 2)
  assert.ok(REGIONS.canada.holidays(2028).some((m) => m.date === '2028-07-01' && m.kind === 'weekend-holiday'));
  assert.equal(REGIONS.canada.holidays(2027).length, 10);
});

test('titles and descriptions fit', () => {
  for (const id of REGION_IDS) {
    for (const y of REGIONS[id].years) {
      assert.ok(regionTitle(id, y).length <= 65, regionTitle(id, y));
      assert.ok(regionDescription(id, y).length <= 160, regionDescription(id, y));
    }
  }
});

test('Australia (NSW): additional days from the NSW Government list', () => {
  // 2026: Anzac Day Sat → also Mon Apr 27; Boxing Day Sat → also Mon Dec 28
  assert.deepEqual(offDates('australia', 2026), ['2026-01-01', '2026-01-26', '2026-04-03', '2026-04-06', '2026-04-27', '2026-06-08', '2026-10-05', '2026-12-25', '2026-12-28']);
  // 2027: Anzac Sun → Mon Apr 26; Christmas Sat → Mon Dec 27; Boxing Day Sun → Tue Dec 28
  assert.deepEqual(offDates('australia', 2027), ['2027-01-01', '2027-01-26', '2027-03-26', '2027-03-29', '2027-04-26', '2027-06-14', '2027-10-04', '2027-12-27', '2027-12-28']);
  // Easter Saturday and Sunday are public holidays on the weekend, with no additional day
  const easter = REGIONS.australia.holidays(2027).filter((m) => m.name.startsWith('Easter S'));
  assert.deepEqual(easter.map((m) => [m.kind, m.observed]), [['weekend-holiday', undefined], ['weekend-holiday', undefined]]);
  assert.deepEqual(regionFacts('australia', 2027), { starts: 'Friday', weekdays: 261, daysOff: 9, workingDays: 252 });
  // Only the years NSW has published
  assert.deepEqual(REGIONS.australia.years, [2026, 2027]);
});
