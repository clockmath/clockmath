/**
 * Year calendars for other countries (/calendar/<year>/uk/ and /canada/,
 * Nov 2026), next to the US ones in lib/yearCalendar.ts and drawn by the same
 * grid. Each region gives the same CalendarMark kinds: `off` for a day off
 * (with substitute days), `weekend-holiday` for a holiday on a Saturday or
 * Sunday, `other` for days most calendars mark.
 *
 * Australia isn't here yet: its public holidays, even the national ones, are
 * set state by state (Anzac Day 2026, a Saturday: NSW adds Monday 27 April,
 * Queensland doesn't), and on Nov 20 2026 only the NSW and Queensland lists
 * could be checked.
 */
import { lastWeekday, nthWeekday, westernEaster } from '@/lib/holidays';
import { WEEKDAY_NAMES, type CalendarMark, type MarkKind } from '@/lib/yearCalendar';

export type RegionId = 'uk' | 'canada';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const dow = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/* ---------- UK ---------- */

/**
 * Bank holidays from GOV.UK (https://www.gov.uk/bank-holidays.json, fetched
 * Nov 20 2026), as published: a substitute day carries the holiday's name on
 * the weekday it moved to. A table, not rules, because one-offs happen
 * (Scotland's World Cup bank holiday, 15 June 2026). Extend from the same
 * file when GOV.UK publishes 2029.
 */
type Table = Record<number, Array<[string, string]>>;

const ENGLAND_AND_WALES: Table = {
  2026: [
    ['2026-01-01', "New Year's Day"], ['2026-04-03', 'Good Friday'], ['2026-04-06', 'Easter Monday'],
    ['2026-05-04', 'Early May bank holiday'], ['2026-05-25', 'Spring bank holiday'], ['2026-08-31', 'Summer bank holiday'],
    ['2026-12-25', 'Christmas Day'], ['2026-12-28', 'Boxing Day'],
  ],
  2027: [
    ['2027-01-01', "New Year's Day"], ['2027-03-26', 'Good Friday'], ['2027-03-29', 'Easter Monday'],
    ['2027-05-03', 'Early May bank holiday'], ['2027-05-31', 'Spring bank holiday'], ['2027-08-30', 'Summer bank holiday'],
    ['2027-12-27', 'Christmas Day'], ['2027-12-28', 'Boxing Day'],
  ],
  2028: [
    ['2028-01-03', "New Year's Day"], ['2028-04-14', 'Good Friday'], ['2028-04-17', 'Easter Monday'],
    ['2028-05-01', 'Early May bank holiday'], ['2028-05-29', 'Spring bank holiday'], ['2028-08-28', 'Summer bank holiday'],
    ['2028-12-25', 'Christmas Day'], ['2028-12-26', 'Boxing Day'],
  ],
};

const SCOTLAND: Table = {
  2026: [
    ['2026-01-01', "New Year's Day"], ['2026-01-02', '2nd January'], ['2026-04-03', 'Good Friday'],
    ['2026-05-04', 'Early May bank holiday'], ['2026-05-25', 'Spring bank holiday'], ['2026-06-15', 'World Cup bank holiday'],
    ['2026-08-03', 'Summer bank holiday'], ['2026-11-30', "St Andrew's Day"], ['2026-12-25', 'Christmas Day'], ['2026-12-28', 'Boxing Day'],
  ],
  2027: [
    ['2027-01-01', "New Year's Day"], ['2027-01-04', '2nd January'], ['2027-03-26', 'Good Friday'],
    ['2027-05-03', 'Early May bank holiday'], ['2027-05-31', 'Spring bank holiday'], ['2027-08-02', 'Summer bank holiday'],
    ['2027-11-30', "St Andrew's Day"], ['2027-12-27', 'Christmas Day'], ['2027-12-28', 'Boxing Day'],
  ],
  2028: [
    ['2028-01-03', "New Year's Day"], ['2028-01-04', '2nd January'], ['2028-04-14', 'Good Friday'],
    ['2028-05-01', 'Early May bank holiday'], ['2028-05-29', 'Spring bank holiday'], ['2028-08-07', 'Summer bank holiday'],
    ['2028-11-30', "St Andrew's Day"], ['2028-12-25', 'Christmas Day'], ['2028-12-26', 'Boxing Day'],
  ],
};

const NORTHERN_IRELAND: Table = {
  2026: [
    ['2026-01-01', "New Year's Day"], ['2026-03-17', "St Patrick's Day"], ['2026-04-03', 'Good Friday'], ['2026-04-06', 'Easter Monday'],
    ['2026-05-04', 'Early May bank holiday'], ['2026-05-25', 'Spring bank holiday'], ['2026-07-13', 'Battle of the Boyne (Orangemen\'s Day)'],
    ['2026-08-31', 'Summer bank holiday'], ['2026-12-25', 'Christmas Day'], ['2026-12-28', 'Boxing Day'],
  ],
  2027: [
    ['2027-01-01', "New Year's Day"], ['2027-03-17', "St Patrick's Day"], ['2027-03-26', 'Good Friday'], ['2027-03-29', 'Easter Monday'],
    ['2027-05-03', 'Early May bank holiday'], ['2027-05-31', 'Spring bank holiday'], ['2027-07-12', 'Battle of the Boyne (Orangemen\'s Day)'],
    ['2027-08-30', 'Summer bank holiday'], ['2027-12-27', 'Christmas Day'], ['2027-12-28', 'Boxing Day'],
  ],
  2028: [
    ['2028-01-03', "New Year's Day"], ['2028-03-17', "St Patrick's Day"], ['2028-04-14', 'Good Friday'], ['2028-04-17', 'Easter Monday'],
    ['2028-05-01', 'Early May bank holiday'], ['2028-05-29', 'Spring bank holiday'], ['2028-07-12', 'Battle of the Boyne (Orangemen\'s Day)'],
    ['2028-08-28', 'Summer bank holiday'], ['2028-12-25', 'Christmas Day'], ['2028-12-26', 'Boxing Day'],
  ],
};

/** The fixed-date bank holidays: when the table's date differs, it's a substitute day */
const UK_FIXED: Record<string, string> = { "New Year's Day": '01-01', '2nd January': '01-02', "St Andrew's Day": '11-30', "St Patrick's Day": '03-17', 'Battle of the Boyne (Orangemen\'s Day)': '07-12', 'Christmas Day': '12-25', 'Boxing Day': '12-26' };

/** One nation's table as marks: the day off, and the weekend date it stands in for */
function tableMarks(year: number, rows: Array<[string, string]>): CalendarMark[] {
  const marks: CalendarMark[] = [];
  for (const [date, name] of rows) {
    const fixed = UK_FIXED[name];
    const actual = fixed ? `${year}-${fixed}` : date;
    if (actual === date) {
      marks.push({ date, name, kind: 'off' });
    } else {
      marks.push({ date, name: `${name} (substitute day)`, kind: 'off' });
      // New Year's Day on Sat Jan 1 2028 has its substitute on Mon Jan 3, same year
      marks.push({ date: actual, name, kind: 'weekend-holiday', observed: date });
    }
  }
  return marks;
}

/** The last Sunday of March and of October, 01:00 GMT (UK and EU) */
const ukClocks = (year: number): CalendarMark[] => [
  { date: iso(lastWeekday(year, 2, 0)), name: 'Clocks go forward', kind: 'other' },
  { date: iso(lastWeekday(year, 9, 0)), name: 'Clocks go back', kind: 'other' },
];

function ukOther(year: number): CalendarMark[] {
  const easter = westernEaster(year);
  return [
    { date: `${year}-02-14`, name: "Valentine's Day", kind: 'other' },
    // Mothering Sunday: the fourth Sunday of Lent, three weeks before Easter
    { date: iso(new Date(easter.getTime() - 21 * 86400000)), name: 'Mothering Sunday', kind: 'other' },
    { date: iso(easter), name: 'Easter Sunday', kind: 'other' },
    { date: iso(nthWeekday(year, 5, 0, 3)), name: "Father's Day", kind: 'other' },
    { date: `${year}-10-31`, name: 'Halloween', kind: 'other' },
    { date: `${year}-11-05`, name: 'Bonfire Night', kind: 'other' },
    { date: iso(nthWeekday(year, 10, 0, 2)), name: 'Remembrance Sunday', kind: 'other' },
    { date: `${year}-12-24`, name: 'Christmas Eve', kind: 'other' },
    { date: `${year}-12-31`, name: "New Year's Eve", kind: 'other' },
    ...ukClocks(year),
  ];
}

/* ---------- Canada ---------- */

/**
 * The ten general holidays of the Canada Labour Code (s. 166), which apply
 * to federally regulated work; provinces set their own lists for everyone
 * else, mostly overlapping. The 2026 dates match the Canada Revenue Agency's
 * list (checked Nov 20 2026). A holiday on a weekend gets a day off "at
 * another time" under the Code, usually the next working day, so the
 * calendar rings it rather than naming a substitute date.
 */
function canadaStatutory(year: number): Array<[string, string]> {
  const easter = westernEaster(year);
  // Victoria Day: the Monday before May 25
  const may24 = utc(year, 4, 24);
  const victoria = new Date(may24.getTime() - ((may24.getUTCDay() + 6) % 7) * 86400000);
  return [
    [`${year}-01-01`, "New Year's Day"],
    [iso(new Date(easter.getTime() - 2 * 86400000)), 'Good Friday'],
    [iso(victoria), 'Victoria Day'],
    // Holidays Act: when July 1 is a Sunday, July 2 is Canada Day
    [dow(`${year}-07-01`) === 0 ? `${year}-07-02` : `${year}-07-01`, 'Canada Day'],
    [iso(nthWeekday(year, 8, 1, 1)), 'Labour Day'],
    [`${year}-09-30`, 'National Day for Truth and Reconciliation'],
    [iso(nthWeekday(year, 9, 1, 2)), 'Thanksgiving'],
    [`${year}-11-11`, 'Remembrance Day'],
    [`${year}-12-25`, 'Christmas Day'],
    [`${year}-12-26`, 'Boxing Day'],
  ];
}

function canadaMarks(year: number): CalendarMark[] {
  return canadaStatutory(year).map(([date, name]): CalendarMark =>
    dow(date) === 0 || dow(date) === 6 ? { date, name, kind: 'weekend-holiday' } : { date, name, kind: 'off' },
  );
}

/** Provincial holidays and days most calendars mark (not federal days off) */
function canadaOther(year: number): CalendarMark[] {
  const easter = westernEaster(year);
  return [
    { date: iso(nthWeekday(year, 1, 1, 3)), name: 'Family Day (most provinces)', kind: 'other' },
    { date: `${year}-02-14`, name: "Valentine's Day", kind: 'other' },
    { date: iso(nthWeekday(year, 2, 0, 2)), name: 'Clocks go forward (where they change)', kind: 'other' },
    { date: iso(easter), name: 'Easter Sunday', kind: 'other' },
    { date: iso(new Date(easter.getTime() + 86400000)), name: 'Easter Monday', kind: 'other' },
    { date: iso(nthWeekday(year, 4, 0, 2)), name: "Mother's Day", kind: 'other' },
    { date: iso(nthWeekday(year, 5, 0, 3)), name: "Father's Day", kind: 'other' },
    { date: `${year}-06-24`, name: 'Saint-Jean-Baptiste Day (Quebec)', kind: 'other' },
    { date: iso(nthWeekday(year, 7, 1, 1)), name: 'Civic Holiday (most provinces)', kind: 'other' },
    { date: `${year}-10-31`, name: 'Halloween', kind: 'other' },
    { date: iso(nthWeekday(year, 10, 0, 1)), name: 'Clocks go back (where they change)', kind: 'other' },
    { date: `${year}-12-24`, name: 'Christmas Eve', kind: 'other' },
    { date: `${year}-12-31`, name: "New Year's Eve", kind: 'other' },
  ];
}

/* ---------- Shared ---------- */

export interface RegionalRow {
  name: string;
  date: string;
  where: string;
}

export interface Region {
  id: RegionId;
  /** "UK", "Canada" */
  name: string;
  /** What a day off is called: "bank holiday", "statutory holiday" */
  dayOff: string;
  /** Whose days off the grid shows */
  scope: string;
  years: number[];
  /** Days off and weekend holidays */
  holidays: (year: number) => CalendarMark[];
  other: (year: number) => CalendarMark[];
  /** Days off in only part of the country */
  regional: (year: number) => RegionalRow[];
  source: string;
}

const order: Record<MarkKind, number> = { off: 0, 'weekend-holiday': 1, other: 2 };
const sortMarks = (marks: CalendarMark[]) => marks.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind]);

/** Rows of `table` (by date and name) that England and Wales don't have */
function differences(year: number, table: Table, where: string): RegionalRow[] {
  const ew = new Set(ENGLAND_AND_WALES[year].map(([d, n]) => `${d} ${n}`));
  return table[year].filter(([d, n]) => !ew.has(`${d} ${n}`)).map(([date, name]) => ({ date, name, where }));
}

export const REGIONS: Record<RegionId, Region> = {
  uk: {
    id: 'uk',
    name: 'UK',
    dayOff: 'bank holiday',
    scope: 'England and Wales',
    years: [2026, 2027, 2028],
    holidays: (year) => sortMarks(tableMarks(year, ENGLAND_AND_WALES[year])),
    other: (year) => sortMarks(ukOther(year)),
    regional: (year) => [...differences(year, SCOTLAND, 'Scotland'), ...differences(year, NORTHERN_IRELAND, 'Northern Ireland')].sort((a, b) => a.date.localeCompare(b.date)),
    source: 'Bank holidays from GOV.UK, checked November 20, 2026.',
  },
  canada: {
    id: 'canada',
    name: 'Canada',
    dayOff: 'statutory holiday',
    scope: 'federally regulated workplaces (Canada Labour Code)',
    years: [2026, 2027, 2028],
    holidays: (year) => sortMarks(canadaMarks(year)),
    other: (year) => sortMarks(canadaOther(year)),
    regional: (year) => {
      const third = iso(nthWeekday(year, 1, 1, 3));
      const civic = iso(nthWeekday(year, 7, 1, 1));
      return [
        { date: third, name: 'Family Day', where: 'Alberta, British Columbia, New Brunswick, Ontario, Saskatchewan' },
        { date: third, name: 'Louis Riel Day', where: 'Manitoba' },
        { date: third, name: 'Islander Day', where: 'Prince Edward Island' },
        { date: third, name: 'Heritage Day', where: 'Nova Scotia' },
        { date: iso(new Date(westernEaster(year).getTime() + 86400000)), name: 'Easter Monday', where: 'Federal public service; not a general holiday' },
        { date: `${year}-06-24`, name: 'Saint-Jean-Baptiste Day (Fête nationale)', where: 'Quebec' },
        { date: civic, name: 'Civic Holiday (named locally)', where: 'Most provinces and territories, not Quebec' },
      ];
    },
    source: 'Canada Labour Code general holidays; 2026 dates checked against the Canada Revenue Agency list, November 20, 2026.',
  },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

/** Every mark for the grid, in date order */
export const regionMarks = (id: RegionId, year: number) => sortMarks([...REGIONS[id].holidays(year), ...REGIONS[id].other(year)]);

export interface RegionFacts {
  starts: string;
  weekdays: number;
  /** Days off that fall on a weekday (substitute days included) */
  daysOff: number;
  workingDays: number;
}

export function regionFacts(id: RegionId, year: number): RegionFacts {
  const offs = new Set(REGIONS[id].holidays(year).filter((m) => m.kind === 'off' && m.date.startsWith(`${year}-`)).map((m) => m.date));
  let weekdays = 0;
  for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += 86400000) if (new Date(t).getUTCDay() % 6 !== 0) weekdays++;
  return { starts: WEEKDAY_NAMES[dow(`${year}-01-01`)], weekdays, daysOff: offs.size, workingDays: weekdays - offs.size };
}


const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Mon Dec 28" */
export const dayLabel = (date: string) => `${WEEKDAY_NAMES[dow(date)].slice(0, 3)} ${MONTHS_SHORT[+date.slice(5, 7) - 1]} ${+date.slice(8, 10)}`;

/** Under 65 characters (tests/regionCalendar.test.ts) */
export function regionTitle(id: RegionId, year: number): string {
  return id === 'uk'
    ? `${year} Calendar UK with Bank Holidays (Printable) | ClockMath`
    : `${year} Canada Calendar with Statutory Holidays | ClockMath`;
}

/** At most 160 characters; the substitute days go first when they fit */
export function regionDescription(id: RegionId, year: number): string {
  const facts = regionFacts(id, year);
  const weekend = REGIONS[id].holidays(year).filter((m) => m.kind === 'weekend-holiday');
  if (id === 'uk') {
    const subs = weekend.filter((m) => m.observed).map((m) => `${m.name} ${dayLabel(m.observed!)}`);
    const base = `The ${year} UK calendar with England and Wales bank holidays`;
    const tail = `. Scotland and NI days too. ${facts.workingDays} working days. Printable.`;
    const full = `${base}${subs.length ? ` (${subs.join(', ')})` : ''}${tail}`;
    // The title already says "Printable", so that word goes before the dates do
    const trimmed = full.replace(/ Printable\.$/, '');
    return full.length <= 160 ? full : trimmed.length <= 160 ? trimmed : `${base}${tail}`;
  }
  const full = `The ${year} Canada calendar with the 10 statutory holidays marked, plus Family Day, Saint-Jean-Baptiste and the Civic Holiday. ${facts.workingDays} working days.`;
  return full.length <= 160 ? full : `The ${year} Canada calendar with the 10 statutory holidays and the provincial days marked. ${facts.workingDays} working days. Printable.`;
}
