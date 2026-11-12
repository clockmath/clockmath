/**
 * Daylight saving time dates by country, 2026–2035, computed from each
 * country's rule (Nov 2026). Bing: "daylight savings 2027" 9.4K impressions a
 * quarter, "dst 2027" 1.3K, "2027 daylight savings dates" 915; a multi-year
 * table by country is also the kind of reference page schedulers, HR and
 * bloggers link to.
 *
 * Pure calendar arithmetic, no time zone data, so the server, the browser and
 * every year agree. tests/dstDates.test.ts checks every date against the IANA
 * zone data that ships with Node (2025a on Node 23, newer on 24); a country
 * that changes its law makes that test fail, which is the reminder to update
 * the rule here. Rules as in tzdata 2026e (the Canadian changes of 2026 are
 * on the daylight saving page; those provinces no longer change at all).
 */

export interface DstDay {
  /** YYYY-MM-DD, the local date the clocks change on. */
  ymd: string;
  /** "Sun, Mar 14" */
  label: string;
}

type DayRule = (year: number) => { month: number; day: number };

export interface DstRegion {
  id: string;
  /** "United States and eastern Canada" */
  name: string;
  /** Who else follows the same rule, or who is left out. */
  note: string;
  /** "Second Sunday in March" */
  forwardRule: string;
  backRule: string;
  /** Local clock times: "2:00 → 3:00 AM". */
  forwardAt: string;
  backAt: string;
  forward: DayRule;
  back: DayRule;
  /** Southern hemisphere: the clocks go back first in the calendar year. */
  south?: boolean;
  /** A zone the test checks the dates against. */
  zone: string;
}

const SUN = 0;
const THU = 4;
const FRI = 5;
const SAT = 6;

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const weekday = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

/** The nth `wd` (0 = Sunday) of month `m` (1–12). */
export const nth = (y: number, m: number, wd: number, n: number) => ({ month: m, day: 1 + ((wd - weekday(y, m, 1) + 7) % 7) + (n - 1) * 7 });

/** The last `wd` of month `m`. */
export const last = (y: number, m: number, wd: number) => {
  const end = daysIn(y, m);
  return { month: m, day: end - ((weekday(y, m, end) - wd + 7) % 7) };
};

export const DST_REGIONS: DstRegion[] = [
  {
    id: 'us',
    name: 'United States and eastern Canada',
    note: 'Most US states; Ontario, Quebec, Atlantic Canada and Nunavut. Also Bermuda, the Bahamas, Haiti and the Mexican cities on the US border (Tijuana, Ciudad Juárez, Matamoros). Not Arizona (except the Navajo Nation), Hawaii, Saskatchewan, Yukon, or, since 2026, British Columbia, Alberta, the Northwest Territories and Manitoba',
    forwardRule: 'Second Sunday in March',
    backRule: 'First Sunday in November',
    forwardAt: '2:00 → 3:00 AM',
    backAt: '2:00 → 1:00 AM',
    forward: (y) => nth(y, 3, SUN, 2),
    back: (y) => nth(y, 11, SUN, 1),
    zone: 'America/New_York',
  },
  {
    id: 'uk',
    name: 'UK, Ireland and Portugal',
    note: 'At 1:00 AM UTC, the same moment as the rest of Europe. Portugal’s Azores change an hour earlier on the clock (0:00 → 1:00 AM)',
    forwardRule: 'Last Sunday in March',
    backRule: 'Last Sunday in October',
    forwardAt: '1:00 → 2:00 AM',
    backAt: '2:00 → 1:00 AM',
    forward: (y) => last(y, 3, SUN),
    back: (y) => last(y, 10, SUN),
    zone: 'Europe/London',
  },
  {
    id: 'eu',
    name: 'European Union, Norway and Switzerland',
    note: 'All at 1:00 AM UTC: 2:00 → 3:00 AM in Paris, Berlin, Madrid, Rome and Warsaw; 3:00 → 4:00 AM in Athens, Helsinki, Bucharest and the Baltic states. The same days in the Balkans outside the EU',
    forwardRule: 'Last Sunday in March',
    backRule: 'Last Sunday in October',
    forwardAt: '2:00 → 3:00 AM (Central Europe)',
    backAt: '3:00 → 2:00 AM (Central Europe)',
    forward: (y) => last(y, 3, SUN),
    back: (y) => last(y, 10, SUN),
    zone: 'Europe/Paris',
  },
  {
    id: 'israel',
    name: 'Israel',
    note: 'The Friday before Europe in spring, the same Sunday as Europe in autumn',
    forwardRule: 'Friday before the last Sunday in March',
    backRule: 'Last Sunday in October',
    forwardAt: '2:00 → 3:00 AM',
    backAt: '2:00 → 1:00 AM',
    forward: (y) => {
      const s = last(y, 3, SUN);
      return { month: 3, day: s.day - 2 };
    },
    back: (y) => last(y, 10, SUN),
    zone: 'Asia/Jerusalem',
  },
  {
    id: 'egypt',
    name: 'Egypt',
    note: 'Restored in 2023. The clocks go back at midnight at the end of the Thursday',
    forwardRule: 'Last Friday in April',
    backRule: 'Last Thursday in October',
    forwardAt: '12:00 midnight → 1:00 AM',
    backAt: '12:00 midnight → 11:00 PM',
    forward: (y) => last(y, 4, FRI),
    back: (y) => last(y, 10, THU),
    zone: 'Africa/Cairo',
  },
  {
    id: 'australia',
    name: 'Southeast Australia',
    note: 'New South Wales, Victoria, the ACT, Tasmania and South Australia. Not Queensland, Western Australia or the Northern Territory',
    forwardRule: 'First Sunday in October',
    backRule: 'First Sunday in April',
    forwardAt: '2:00 → 3:00 AM',
    backAt: '3:00 → 2:00 AM',
    forward: (y) => nth(y, 10, SUN, 1),
    back: (y) => nth(y, 4, SUN, 1),
    south: true,
    zone: 'Australia/Sydney',
  },
  {
    id: 'nz',
    name: 'New Zealand',
    note: 'The Chatham Islands change at the same moment, 45 minutes ahead on the clock',
    forwardRule: 'Last Sunday in September',
    backRule: 'First Sunday in April',
    forwardAt: '2:00 → 3:00 AM',
    backAt: '3:00 → 2:00 AM',
    forward: (y) => last(y, 9, SUN),
    back: (y) => nth(y, 4, SUN, 1),
    south: true,
    zone: 'Pacific/Auckland',
  },
  {
    id: 'chile',
    name: 'Chile',
    note: 'Mainland Chile, at midnight between Saturday and Sunday. Easter Island changes at the same moment, at 10:00 PM on the Saturday by its clock. Not Magallanes or Aysén, which stay on UTC−3 all year',
    forwardRule: 'Sunday after the first Saturday in September',
    backRule: 'First Saturday in April, at the end of the day',
    forwardAt: '12:00 midnight → 1:00 AM',
    backAt: '12:00 midnight → 11:00 PM',
    forward: (y) => {
      const s = nth(y, 9, SAT, 1);
      return { month: 9, day: s.day + 1 };
    },
    back: (y) => nth(y, 4, SAT, 1),
    south: true,
    zone: 'America/Santiago',
  },
];

/** Places that have stopped changing their clocks, newest first. */
export const STOPPED: Array<{ where: string; since: string }> = [
  { where: 'British Columbia, Alberta, the Northwest Territories and Manitoba', since: '2026' },
  { where: 'Paraguay', since: '2024' },
  { where: 'Mexico (apart from the US border cities)', since: '2022' },
  { where: 'Iran', since: '2022' },
  { where: 'Jordan and Syria', since: '2022' },
  { where: 'Yukon', since: '2020' },
  { where: 'Brazil', since: '2019' },
  { where: 'Turkey', since: '2016' },
  { where: 'Russia', since: '2011' },
];

/** Never change (or not in living memory): the common questions. */
export const NEVER = 'Japan, China, India, South Korea, Singapore, most of Africa and South America, Hawaii, most of Arizona, Saskatchewan, Queensland, Western Australia and the Northern Territory';

export const FIRST_YEAR = 2026;
export const LAST_YEAR = 2035;
export const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function day(y: number, { month, day: d }: { month: number; day: number }): DstDay {
  return {
    ymd: `${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    label: `${DAYS[weekday(y, month, d)]}, ${MONTHS[month - 1]} ${d}`,
  };
}

/** A region's two changes in calendar year `y`. */
export function dstYear(region: DstRegion, y: number): { forward: DstDay; back: DstDay } {
  return { forward: day(y, region.forward(y)), back: day(y, region.back(y)) };
}

export const getDstRegion = (id: string) => DST_REGIONS.find((r) => r.id === id);
