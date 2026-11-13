// node --test tests/ — the daylight saving dates table (lib/dstDates.ts),
// checked against the IANA zone data that ships with Node. If a country
// changes its law, Node's data changes and this fails: update the rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DST_REGIONS, YEARS, dstYear, getDstRegion, last, nth } from '../lib/dstDates.ts';

const fmt = new Map<string, Intl.DateTimeFormat>();
const formatter = (timeZone: string) => {
  let f = fmt.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    fmt.set(timeZone, f);
  }
  return f;
};
const parts = (zone: string, ms: number) => Object.fromEntries(formatter(zone).formatToParts(ms).map((p) => [p.type, p.value]));
const offset = (zone: string, ms: number) => parts(zone, ms).timeZoneName as string;
const localYmd = (zone: string, ms: number) => {
  const p = parts(zone, ms);
  return `${p.year}-${p.month}-${p.day}`;
};
const localHm = (zone: string, ms: number) => {
  const p = parts(zone, ms);
  return `${Number(p.hour)}:${p.minute}`;
};
const minutes = (o: string) => {
  const m = /GMT([+-])(\d\d):(\d\d)/.exec(o);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
};

/** Every offset change in `year`: { at (ms, first minute of the new offset), up }. */
function transitions(zone: string, year: number) {
  const out: Array<{ at: number; up: boolean }> = [];
  let t = Date.UTC(year, 0, 1, 12);
  const end = Date.UTC(year + 1, 0, 1, 12);
  let prev = offset(zone, t);
  for (t += 86400000; t <= end; t += 86400000) {
    const cur = offset(zone, t);
    if (cur !== prev) {
      let lo = t - 86400000;
      let hi = t;
      while (hi - lo > 60000) {
        const mid = lo + Math.floor((hi - lo) / 120000) * 60000;
        if (offset(zone, mid) === prev) lo = mid;
        else hi = mid;
      }
      out.push({ at: hi, up: minutes(cur) > minutes(prev) });
      prev = cur;
    }
  }
  return out;
}

// The local date of a change is the date just after it (Chile's spring change
// at Saturday midnight is on the Sunday; Egypt's autumn one, back from
// midnight to 11 PM, on the Thursday).
function changes(zone: string, year: number) {
  const ts = transitions(zone, year);
  const pick = (up: boolean) => {
    const t = ts.find((x) => x.up === up);
    assert.ok(t, `${zone} ${year}: no ${up ? 'forward' : 'back'} change`);
    return { ymd: localYmd(zone, t.at), before: localHm(zone, t.at - 60000), after: localHm(zone, t.at) };
  };
  assert.equal(ts.length, 2, `${zone} ${year}: ${ts.length} changes`);
  return { forward: pick(true), back: pick(false) };
}

// Each region's dates against its own zone and the others it names
const ALSO: Record<string, string[]> = {
  us: ['America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Halifax', 'America/St_Johns', 'Atlantic/Bermuda', 'America/Nassau', 'America/Port-au-Prince', 'America/Tijuana', 'America/Ciudad_Juarez', 'America/Matamoros'],
  uk: ['Europe/Dublin', 'Europe/Lisbon', 'Atlantic/Azores'],
  eu: ['Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Warsaw', 'Europe/Oslo', 'Europe/Zurich', 'Europe/Athens', 'Europe/Helsinki', 'Europe/Bucharest', 'Europe/Riga', 'Europe/Belgrade'],
  australia: ['Australia/Melbourne', 'Australia/Hobart', 'Australia/Adelaide'],
  nz: ['Pacific/Chatham'],
};

// Local clock just before (as the minute it would have become) and after
const TIMES: Record<string, { forward: [string, string]; back: [string, string] }> = {
  'America/New_York': { forward: ['1:59', '3:00'], back: ['1:59', '1:00'] },
  'Europe/London': { forward: ['0:59', '2:00'], back: ['1:59', '1:00'] },
  'Europe/Paris': { forward: ['1:59', '3:00'], back: ['2:59', '2:00'] },
  'Europe/Athens': { forward: ['2:59', '4:00'], back: ['3:59', '3:00'] },
  'Atlantic/Azores': { forward: ['23:59', '1:00'], back: ['0:59', '0:00'] },
  'Asia/Jerusalem': { forward: ['1:59', '3:00'], back: ['1:59', '1:00'] },
  'Africa/Cairo': { forward: ['23:59', '1:00'], back: ['23:59', '23:00'] },
  'Australia/Sydney': { forward: ['1:59', '3:00'], back: ['2:59', '2:00'] },
  'Pacific/Auckland': { forward: ['1:59', '3:00'], back: ['2:59', '2:00'] },
  'America/Santiago': { forward: ['23:59', '1:00'], back: ['23:59', '23:00'] },
};

test('Easter Island: the same moments as Santiago, 10 PM on the Saturday by its clock', () => {
  for (const y of YEARS) {
    const s = transitions('America/Santiago', y).map((t) => t.at);
    const e = transitions('Pacific/Easter', y).map((t) => t.at);
    assert.deepEqual(e, s, String(y));
    assert.equal(localHm('Pacific/Easter', s[0] - 60000), '21:59');
  }
});

for (const region of DST_REGIONS) {
  test(`${region.name}: 2026–2035 match the zone data`, () => {
    for (const zone of [region.zone, ...(ALSO[region.id] ?? [])]) {
      for (const y of YEARS) {
        const want = dstYear(region, y);
        const got = changes(zone, y);
        assert.equal(want.forward.ymd, got.forward.ymd, `${zone} ${y} forward`);
        assert.equal(want.back.ymd, got.back.ymd, `${zone} ${y} back`);
        const times = TIMES[zone];
        if (times) {
          assert.deepEqual([got.forward.before, got.forward.after], times.forward, `${zone} ${y} forward times`);
          assert.deepEqual([got.back.before, got.back.after], times.back, `${zone} ${y} back times`);
        }
      }
    }
  });
}

test('places that stopped changing have no changes', () => {
  // Not the 2026 Canadian provinces: Node's zone data may predate them
  for (const zone of ['America/Asuncion', 'America/Mexico_City', 'Asia/Tehran', 'Asia/Amman', 'Asia/Damascus', 'America/Whitehorse', 'America/Sao_Paulo', 'Europe/Istanbul', 'Europe/Moscow', 'America/Punta_Arenas', 'America/Phoenix', 'Pacific/Honolulu', 'America/Regina', 'Australia/Brisbane', 'Australia/Perth', 'Asia/Tokyo', 'Asia/Kolkata']) {
    for (const y of [2027, 2030]) assert.equal(transitions(zone, y).length, 0, `${zone} ${y}`);
  }
});

test('labels and helpers', () => {
  const us = getDstRegion('us')!;
  assert.deepEqual(dstYear(us, 2027), { forward: { ymd: '2027-03-14', label: 'Sun, Mar 14' }, back: { ymd: '2027-11-07', label: 'Sun, Nov 7' } });
  assert.equal(dstYear(getDstRegion('israel')!, 2027).forward.label, 'Fri, Mar 26');
  assert.equal(dstYear(getDstRegion('egypt')!, 2027).back.label, 'Thu, Oct 28');
  assert.equal(dstYear(getDstRegion('chile')!, 2027).forward.label, 'Sun, Sep 5');
  assert.equal(dstYear(getDstRegion('chile')!, 2027).back.label, 'Sat, Apr 3');
  assert.deepEqual(nth(2026, 11, 0, 1), { month: 11, day: 1 });
  assert.deepEqual(last(2026, 10, 0), { month: 10, day: 25 });
  assert.deepEqual(last(2027, 2, 0), { month: 2, day: 28 });
  assert.equal(new Set(DST_REGIONS.map((r) => r.id)).size, DST_REGIONS.length);
});
