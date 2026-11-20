// node --test tests/ — the blank timesheet template (lib/timesheetTemplate.ts).
// Expected days written out from a wall calendar (Nov 22 2026 is a Sunday).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { periodLabel, templateCsv, templateDays, weekStart } from '../lib/timesheetTemplate.ts';

const iso = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null;

test('weekStart: Sunday or Monday weeks', () => {
  const wed = new Date(2026, 10, 25);
  assert.equal(iso(weekStart(wed, 0)), '2026-11-22');
  assert.equal(iso(weekStart(wed, 1)), '2026-11-23');
  // On the first day itself, and a Sunday in a Monday week
  assert.equal(iso(weekStart(new Date(2026, 10, 22), 0)), '2026-11-22');
  assert.equal(iso(weekStart(new Date(2026, 10, 22), 1)), '2026-11-16');
  // Across a month and a year
  assert.equal(iso(weekStart(new Date(2027, 0, 1), 0)), '2026-12-27');
});

test('blank weekly template: seven named days, no dates', () => {
  const days = templateDays('weekly', 1, null);
  assert.deepEqual(
    days.map((d) => d.name),
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  );
  assert.ok(days.every((d) => d.date === null && d.week === 1));
  assert.equal(periodLabel(days), '');
});

test('biweekly from a date: 14 days, two weeks, across the new year', () => {
  const days = templateDays('biweekly', 0, new Date(2026, 11, 27));
  assert.equal(days.length, 14);
  assert.deepEqual([iso(days[0].date), iso(days[6].date), iso(days[7].date), iso(days[13].date)], ['2026-12-27', '2027-01-02', '2027-01-03', '2027-01-09']);
  assert.deepEqual([days[0].name, days[7].name, days[13].name], ['Sunday', 'Sunday', 'Saturday']);
  assert.deepEqual([days[6].week, days[7].week], [1, 2]);
  assert.equal(periodLabel(days), 'Dec 27, 2026 – Jan 9, 2027');
});

test('a start date sets the first weekday, whatever the week setting', () => {
  const days = templateDays('weekly', 0, new Date(2026, 10, 25));
  assert.equal(days[0].name, 'Wednesday');
  assert.equal(periodLabel(days), 'Nov 25 – Dec 1, 2026');
});

test('CSV: formulas for each day, week totals and the period total', () => {
  const weekly = templateCsv(templateDays('weekly', 0, new Date(2026, 10, 22))).trim().split('\r\n');
  assert.equal(weekly.length, 9);
  assert.equal(weekly[0], 'Day,Date,Time in,Lunch out,Lunch in,Time out,Hours');
  assert.equal(weekly[1], 'Sunday,2026-11-22,,,,,"=IF(F2="""","""",ROUND((MOD(F2-C2,1)-MOD(E2-D2,1))*24,2))"');
  assert.equal(weekly[8], 'Total hours,,,,,,=SUM(G2:G8)');

  const biweekly = templateCsv(templateDays('biweekly', 1, null)).trim().split('\r\n');
  assert.equal(biweekly.length, 18);
  assert.equal(biweekly[1].slice(0, 8), 'Monday,,');
  assert.deepEqual(biweekly.slice(15), ['Week 1 total,,,,,,=SUM(G2:G8)', 'Week 2 total,,,,,,=SUM(G9:G15)', 'Total hours,,,,,,=SUM(G2:G15)']);
});
