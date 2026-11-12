/**
 * City-to-city time difference pages (/time/<a>-to-<b>/): the places, the
 * pairs, and every figure the pages show, computed here so the page, the
 * worker and the tests agree.
 *
 * Nov 2026: the time zone converter's 1,907 Bing queries (24 months) are
 * conversational ("if it's 7pm in Tulsa what time is it in Lusaka") and
 * mostly name US states, Canada, the UK and Europe. Copilot now answers most
 * of them itself, so each page gives it something specific to cite: the gap
 * now, the exact dates it changes, working-hour overlap and an hour table.
 * One page per pair of clocks: two pairs whose offsets match all year
 * (Toronto and New York) would be near-duplicates, so the other places on
 * the same clock are named on the page instead.
 *
 * Offsets go through lib/time's getTimezoneOffset, so the 2026 Canadian
 * changes (BC, Alberta, Manitoba on permanent time) come out right even on a
 * build machine or browser with stale tz data. The worker never needs tz
 * data: the page carries the build's table of offsets (liveSpec) and the
 * worker picks the row for the request's instant.
 */

import { getTimezoneOffset, nextClockChange } from '@/lib/time';

export interface PairPlace {
  slug: string;
  /** "New York" */
  name: string;
  /** IANA zone */
  zone: string;
  /** "New York, USA" */
  full: string;
  /** Short name per UTC offset (minutes), e.g. { -300: 'EST', -240: 'EDT' } */
  abbr: Record<number, string>;
  /** Places on the same clock all year, for "also the time in …". */
  sameTime: string[];
  /** Its clock rules in one sentence. */
  rules: string;
}

export interface TimePair {
  slug: string;
  a: PairPlace;
  b: PairPlace;
  /** Why people compare these two, one sentence written for the pair. */
  context: string;
}

const PLACES: Record<string, PairPlace> = {
  'new-york': {
    slug: 'new-york',
    name: 'New York',
    zone: 'America/New_York',
    full: 'New York, USA',
    abbr: { [-300]: 'EST', [-240]: 'EDT' },
    sameTime: ['Toronto', 'Montreal', 'Boston', 'Washington, DC', 'Miami', 'Atlanta', 'Detroit', 'most of Florida, Georgia, Michigan, Ohio, Ontario and Quebec'],
    rules: 'New York is on Eastern Time: EST (UTC−5) in winter, EDT (UTC−4) from the second Sunday in March to the first Sunday in November.',
  },
  'los-angeles': {
    slug: 'los-angeles',
    name: 'Los Angeles',
    zone: 'America/Los_Angeles',
    full: 'Los Angeles, USA',
    abbr: { [-480]: 'PST', [-420]: 'PDT' },
    sameTime: ['San Francisco', 'San Diego', 'Seattle', 'Portland', 'Las Vegas', 'all of California, Washington and Nevada'],
    rules: 'Los Angeles is on Pacific Time: PST (UTC−8) in winter, PDT (UTC−7) from the second Sunday in March to the first Sunday in November.',
  },
  chicago: {
    slug: 'chicago',
    name: 'Chicago',
    zone: 'America/Chicago',
    full: 'Chicago, USA',
    abbr: { [-360]: 'CST', [-300]: 'CDT' },
    sameTime: ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Minneapolis', 'New Orleans', 'St. Louis', 'most of Texas, Illinois, Minnesota, Louisiana, Oklahoma and Wisconsin'],
    rules: 'Chicago is on Central Time: CST (UTC−6) in winter, CDT (UTC−5) from the second Sunday in March to the first Sunday in November.',
  },
  phoenix: {
    slug: 'phoenix',
    name: 'Phoenix',
    zone: 'America/Phoenix',
    full: 'Phoenix, Arizona, USA',
    abbr: { [-420]: 'MST' },
    sameTime: ['Tucson', 'Scottsdale', 'Mesa', 'most of Arizona (not the Navajo Nation)', 'Vancouver and British Columbia since 2026', 'Whitehorse, Yukon'],
    rules: 'Phoenix stays on MST (UTC−7) all year: Arizona, apart from the Navajo Nation, does not change its clocks.',
  },
  calgary: {
    slug: 'calgary',
    name: 'Calgary',
    zone: 'America/Edmonton',
    full: 'Calgary, Alberta, Canada',
    abbr: { [-420]: 'MST', [-360]: 'UTC−6' },
    sameTime: ['Edmonton', 'all of Alberta', 'Yellowknife', 'Regina and Saskatoon (Saskatchewan)', 'Mexico City'],
    rules: 'Calgary stays on UTC−6 all year: Alberta kept its summer time in 2026 and no longer changes its clocks (it did not fall back on November 1, 2026).',
  },
  toronto: {
    slug: 'toronto',
    name: 'Toronto',
    zone: 'America/Toronto',
    full: 'Toronto, Ontario, Canada',
    abbr: { [-300]: 'EST', [-240]: 'EDT' },
    sameTime: ['Ottawa', 'Montreal', 'Quebec City', 'New York', 'most of Ontario and Quebec'],
    rules: 'Toronto is on Eastern Time: EST (UTC−5) in winter, EDT (UTC−4) from the second Sunday in March to the first Sunday in November.',
  },
  london: {
    slug: 'london',
    name: 'London',
    zone: 'Europe/London',
    full: 'London, UK',
    abbr: { 0: 'GMT', 60: 'BST' },
    sameTime: ['Edinburgh', 'Manchester', 'Dublin', 'Lisbon', 'all of the UK, Ireland and Portugal'],
    rules: 'London is on GMT (UTC+0) in winter and BST (UTC+1) from the last Sunday in March to the last Sunday in October.',
  },
  berlin: {
    slug: 'berlin',
    name: 'Berlin',
    zone: 'Europe/Berlin',
    full: 'Berlin, Germany',
    abbr: { 60: 'CET', 120: 'CEST' },
    sameTime: ['Paris', 'Madrid', 'Rome', 'Amsterdam', 'Brussels', 'Vienna', 'Zurich', 'Stockholm', 'Warsaw', 'Prague', 'most of the EU'],
    rules: 'Berlin is on CET (UTC+1) in winter and CEST (UTC+2) from the last Sunday in March to the last Sunday in October.',
  },
  sydney: {
    slug: 'sydney',
    name: 'Sydney',
    zone: 'Australia/Sydney',
    full: 'Sydney, Australia',
    abbr: { 600: 'AEST', 660: 'AEDT' },
    sameTime: ['Melbourne', 'Canberra', 'Hobart', 'New South Wales, Victoria, the ACT and Tasmania (not Brisbane, which stays on AEST)'],
    rules: 'Sydney is on AEST (UTC+10) from the first Sunday in April and AEDT (UTC+11) from the first Sunday in October: its summer is the northern winter.',
  },
  // Used by the tests (half-hour offsets, no clock changes); no page yet
  mumbai: {
    slug: 'mumbai',
    name: 'Mumbai',
    zone: 'Asia/Kolkata',
    full: 'Mumbai, India',
    abbr: { 330: 'IST' },
    sameTime: ['Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'all of India'],
    rules: 'Mumbai stays on IST (UTC+5:30) all year: India has one time zone and does not change its clocks.',
  },
  tokyo: {
    slug: 'tokyo',
    name: 'Tokyo',
    zone: 'Asia/Tokyo',
    full: 'Tokyo, Japan',
    abbr: { 540: 'JST' },
    sameTime: ['Osaka', 'Seoul', 'all of Japan and South Korea'],
    rules: 'Tokyo stays on JST (UTC+9) all year: Japan does not change its clocks.',
  },
};

// Canonical order: the order the pair is usually searched. The reverse
// order 301s here (scripts/worker/api.js, generated by reverseRedirects).
const PAIR_LIST: Array<[string, string, string]> = [
  ['los-angeles', 'london', 'California and the UK: film and TV, tech and family calls, and Premier League kickoffs at breakfast time on the West Coast.'],
  ['new-york', 'london', 'The busiest business pair across the Atlantic: the two financial centres overlap for a few hours every working morning in New York.'],
  ['chicago', 'los-angeles', 'Central and Pacific Time: Texas and the Midwest calling California, two hours apart all year.'],
  ['new-york', 'los-angeles', 'East Coast and West Coast: the US’s two biggest cities, always three hours apart.'],
  ['chicago', 'london', 'Central Time and the UK: Chicago, Dallas and Houston calling London, six hours apart most of the year.'],
  ['new-york', 'chicago', 'Eastern and Central Time: an hour apart all year, the most common time difference inside the US.'],
  ['phoenix', 'los-angeles', 'Arizona never changes its clocks, so it matches California in summer and is an hour ahead in winter.'],
  ['calgary', 'toronto', 'Alberta stopped changing its clocks in 2026, so Calgary and Toronto are now one hour apart in winter and two in summer, the reverse of what many people expect.'],
  ['chicago', 'berlin', 'Central Time and central Europe: the US Midwest and Texas calling Germany, France, Spain or Italy, seven hours apart most of the year.'],
  ['los-angeles', 'sydney', 'California and Australia: summer and winter are swapped, so the gap changes four times a year, between 17 and 19 hours.'],
];

export const TIME_PAIRS: TimePair[] = PAIR_LIST.map(([a, b, context]) => ({
  slug: `${a}-to-${b}`,
  a: PLACES[a],
  b: PLACES[b],
  context,
}));

export const getPlace = (slug: string): PairPlace | undefined => PLACES[slug];
export const getTimePair = (slug: string): TimePair | undefined => TIME_PAIRS.find((p) => p.slug === slug);

/** The other order of each pair → its page, for the worker's redirects. */
export function reverseRedirects(): Record<string, string> {
  return Object.fromEntries(TIME_PAIRS.map((p) => [`/time/${p.b.slug}-to-${p.a.slug}`, `/time/${p.slug}/`]));
}

// ---- Offsets over time -----------------------------------------------------

/** From `from` on (ms), A is at UTC+a and B at UTC+b (minutes). */
export interface Segment {
  from: number;
  a: number;
  b: number;
}

/** The offsets of two zones from `fromMs` to `toMs`, one row per change. */
export function segments(zoneA: string, zoneB: string, fromMs: number, toMs: number): Segment[] {
  const out: Segment[] = [];
  let t = fromMs;
  while (t < toMs) {
    out.push({ from: t, a: getTimezoneOffset(zoneA, new Date(t)), b: getTimezoneOffset(zoneB, new Date(t)) });
    const next = [nextClockChange(zoneA, t), nextClockChange(zoneB, t)]
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => c.at);
    if (next.length === 0) break;
    t = Math.min(...next);
  }
  return out;
}

/** The segment in force at `ms` (the first one before the table starts). */
export function segmentAt(segs: Segment[], ms: number): Segment {
  let current = segs[0];
  for (const s of segs) if (s.from <= ms) current = s;
  return current;
}

/** How far B's clock is ahead of A's, in minutes (negative: behind). */
export const gapOf = (s: { a: number; b: number }): number => s.b - s.a;

/**
 * The table the worker reads (data-pair-spec): "from:a:b" rows joined by
 * commas, the first row's start replaced by 0 so any earlier instant uses it.
 */
export function liveSpec(segs: Segment[]): string {
  return segs.map((s, i) => `${i === 0 ? 0 : s.from}:${s.a}:${s.b}`).join(',');
}

// ---- Words -----------------------------------------------------------------

/** "5 hours", "1 hour", "9 hours 30 minutes", "45 minutes" (sign ignored). */
export function formatGap(minutes: number): string {
  const m = Math.abs(minutes);
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hours = h === 1 ? '1 hour' : `${h} hours`;
  if (r === 0) return hours;
  if (h === 0) return `${r} minutes`;
  return `${hours} ${r} minutes`;
}

/** "London is 5 hours ahead of New York", or "… are on the same time". */
export function relationSentence(aName: string, bName: string, gap: number): string {
  if (gap === 0) return `${aName} and ${bName} are on the same time`;
  return gap > 0 ? `${bName} is ${formatGap(gap)} ahead of ${aName}` : `${bName} is ${formatGap(gap)} behind ${aName}`;
}

/** Minutes after midnight as "9:00 AM" (or "09:00"). Wraps past 24 hours. */
export function formatClock(minutes: number, is24h = false): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (is24h) return `${String(h).padStart(2, '0')}:${mm}`;
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The wall clock at UTC+offset for instant `ms`: "Thursday 3:15 PM". */
export function wallClockLabel(ms: number, offset: number, is24h = false): string {
  const d = new Date(ms + offset * 60_000);
  return `${WEEKDAYS[d.getUTCDay()]} ${formatClock(d.getUTCHours() * 60 + d.getUTCMinutes(), is24h)}`;
}

/** The calendar date at UTC+offset for instant `ms`: "Sunday, March 14, 2027". */
export function wallDateLabel(ms: number, offset: number): string {
  const d = new Date(ms + offset * 60_000);
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "March 14" (no year), for date ranges in a sentence. */
export function shortDate(ms: number, offset: number): string {
  const d = new Date(ms + offset * 60_000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** The place's name for an offset: "EST", or "UTC−6" when it has none. */
export function abbrFor(place: PairPlace, offset: number): string {
  return place.abbr[offset] ?? utcLabel(offset);
}

/** "UTC−5", "UTC+5:30", "UTC+0". */
export function utcLabel(offset: number): string {
  const sign = offset < 0 ? '−' : '+';
  const m = Math.abs(offset);
  const h = Math.floor(m / 60);
  return `UTC${sign}${h}${m % 60 ? `:${String(m % 60).padStart(2, '0')}` : ''}`;
}

// ---- The year ahead ----------------------------------------------------------

const DAY = 86_400_000;

/**
 * The table without the overnight blips: US zones change at 2 AM local
 * time, so New York moves an hour before Chicago and the gap is "wrong" for
 * an hour that night. A row shorter than a day whose neighbours have the same
 * gap is folded into the change after it, so the summaries say "always 1
 * hour" and list one change, made by both. (liveSpec keeps the real rows.)
 */
export function smoothed(segs: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const next = segs[i + 1];
    const prev = out[out.length - 1];
    if (prev && next && next.from - s.from < DAY && gapOf(prev) === gapOf(next)) {
      // Skip the blip; the next row starts where the blip did
      out.push({ ...next, from: s.from });
      i++;
      continue;
    }
    out.push(s);
  }
  return out;
}

export interface GapPeriod {
  gap: number;
  from: number;
  to: number;
}

export interface GapShare {
  gap: number;
  days: number;
  periods: GapPeriod[];
}

/**
 * The gaps over the year from `fromMs`, longest first: "5 hours for 344
 * days, 4 hours for 21". Rows are smoothed first, periods with the same gap
 * that touch are merged, and a season cut in two by the start and end of the
 * year (November to March, read in November) is joined back into one.
 */
export function yearOfGaps(segs: Segment[], fromMs: number): GapShare[] {
  const rows = smoothed(segs);
  const end = fromMs + 365 * DAY;
  const periods: GapPeriod[] = [];
  rows.forEach((s, i) => {
    const from = Math.max(s.from, fromMs);
    const to = Math.min(rows[i + 1]?.from ?? end, end);
    if (to <= from) return;
    const last = periods[periods.length - 1];
    if (last && last.gap === gapOf(s) && last.to === from) last.to = to;
    else periods.push({ gap: gapOf(s), from, to });
  });
  const byGap = new Map<number, GapShare>();
  for (const p of periods) {
    const share = byGap.get(p.gap) ?? { gap: p.gap, days: 0, periods: [] };
    share.days += (p.to - p.from) / DAY;
    share.periods.push(p);
    byGap.set(p.gap, share);
  }
  for (const share of byGap.values()) {
    const first = share.periods[0];
    const last = share.periods[share.periods.length - 1];
    if (share.periods.length > 1 && first.from === fromMs && last.to === end) {
      // One season read across the new year: from its start later this year
      // to its end early next year (the dates are shown without a year)
      share.periods = [{ gap: share.gap, from: last.from, to: first.to }, ...share.periods.slice(1, -1)];
    }
    share.periods.sort((x, y) => x.from - y.from);
  }
  return [...byGap.values()]
    .map((s) => ({ ...s, days: Math.round(s.days) }))
    .sort((x, y) => y.days - x.days);
}

export interface GapChange {
  at: number;
  /** Who changed their clocks: one city, or both at once. */
  moved: 'a' | 'b' | 'both';
  before: Segment;
  after: Segment;
}

/** Every change in the (smoothed) table after its first row. */
export function gapChanges(segs: Segment[]): GapChange[] {
  const rows = smoothed(segs);
  const out: GapChange[] = [];
  for (let i = 1; i < rows.length; i++) {
    const before = rows[i - 1];
    const after = rows[i];
    const movedA = before.a !== after.a;
    const movedB = before.b !== after.b;
    out.push({ at: after.from, moved: movedA && movedB ? 'both' : movedA ? 'a' : 'b', before, after });
  }
  return out;
}

// ---- Working hours and meetings ---------------------------------------------

export interface Window {
  /** Start and end in A's local minutes after midnight (end may pass 1440). */
  aStart: number;
  aEnd: number;
  /** B's day relative to A's at aStart: -1 yesterday, 0 same day, 1 tomorrow. */
  bDayShift: number;
}

/**
 * The longest stretch when both clocks read between `start` and `end`
 * (minutes after midnight), in A's local time; null if they never do.
 * B's local time is A's plus `gap`, so B's window in A's time is
 * [start − gap, end − gap], on the day before, the same day or the next.
 */
export function overlap(gap: number, start = 9 * 60, end = 17 * 60): Window | null {
  let best: Window | null = null;
  for (const day of [-1, 0, 1]) {
    const bStart = start - gap + day * 1440;
    const bEnd = end - gap + day * 1440;
    const s = Math.max(start, bStart);
    const e = Math.min(end, bEnd);
    if (e > s && (!best || e - s > best.aEnd - best.aStart)) {
      best = { aStart: s, aEnd: e, bDayShift: Math.floor((s + gap) / 1440) };
    }
  }
  return best;
}

export interface MeetingAdvice {
  /** Both inside 9 to 5 */
  work: Window | null;
  /** Both inside 8 AM to 8 PM: early for one, late for the other */
  stretch: Window | null;
  /** Both awake (7 AM to 11 PM) */
  awake: Window | null;
}

export function meetingAdvice(gap: number): MeetingAdvice {
  return {
    work: overlap(gap, 9 * 60, 17 * 60),
    stretch: overlap(gap, 8 * 60, 20 * 60),
    awake: overlap(gap, 7 * 60, 23 * 60),
  };
}

export type HourKind = 'work' | 'awake' | 'night';

/** Working hours 9–5, awake 7 AM–11 PM, otherwise night. */
export function hourKind(minutes: number): HourKind {
  const m = ((minutes % 1440) + 1440) % 1440;
  if (m >= 9 * 60 && m < 17 * 60) return 'work';
  if (m >= 7 * 60 && m < 23 * 60) return 'awake';
  return 'night';
}

export interface HourRow {
  a: number;
  b: number;
  bDayShift: number;
  aKind: HourKind;
  bKind: HourKind;
}

/** Each hour of A's day and the time in B (hours on the hour in A). */
export function hourRows(gap: number): HourRow[] {
  return Array.from({ length: 24 }, (_, h) => {
    const a = h * 60;
    const raw = a + gap;
    return { a, b: ((raw % 1440) + 1440) % 1440, bDayShift: Math.floor(raw / 1440), aKind: hourKind(a), bKind: hourKind(raw) };
  });
}

/** "the next day", "the day before", or "" for the same day. */
export function dayShiftWords(shift: number): string {
  return shift > 0 ? ' the next day' : shift < 0 ? ' the day before' : '';
}

// ---- Page text ------------------------------------------------------------------

/** 65 characters or fewer (Bing flags longer titles); checked in the tests. */
export function pairTitle(p: TimePair): string {
  return `${p.a.name} to ${p.b.name} Time: Difference & Best Meeting Times`;
}

/** Example question times ("If it's 8 PM in New York…"), chosen per pair. */
function exampleTime(p: TimePair, gap: number): number {
  // 9 AM in A unless that is night in B, then 8 PM, then noon
  for (const t of [9 * 60, 20 * 60, 12 * 60]) if (hourKind(t + gap) !== 'night') return t;
  return 9 * 60;
}

/** "London is 5 hours ahead of New York", for a clause inside a sentence. */
function gapClause(p: TimePair, gap: number): string {
  return relationSentence(p.a.name, p.b.name, gap);
}

/** The date a change falls on, on the calendar of the city that changed. */
function changeDate(p: TimePair, ms: number): string {
  const zone = offsetAt(p.b.zone, ms - 1) !== offsetAt(p.b.zone, ms) && offsetAt(p.a.zone, ms - 1) === offsetAt(p.a.zone, ms) ? p.b.zone : p.a.zone;
  return shortDate(ms, offsetAt(zone, ms));
}

const spans = (p: TimePair, share: GapShare) =>
  share.periods.map((x) => `from ${changeDate(p, x.from)} to ${changeDate(p, x.to)}`).join(' and ');

/**
 * The pair's gaps over the year in words: "London is 5 hours ahead of New
 * York for most of the year, and 4 hours ahead from March 14 to March 28 and
 * from October 31 to November 7."
 */
export function yearSentence(p: TimePair, year: GapShare[]): string {
  const [main, ...rest] = year;
  if (!main) return '';
  if (rest.length === 0) {
    return main.gap === 0
      ? `${p.a.name} and ${p.b.name} are on the same time all year.`
      : `${gapClause(p, main.gap)} all year: the gap never changes.`;
  }
  const short = (gap: number) => (gap === 0 ? 'on the same time' : `${formatGap(gap)} ${gap > 0 ? 'ahead' : 'behind'}`);
  // Same direction throughout: "…, and 4 hours ahead from …"; otherwise each
  // part is its own clause
  const sameWay = year.every((g) => Math.sign(g.gap) === Math.sign(main.gap) && g.gap !== 0);
  const lead = main.days > 300 ? `${gapClause(p, main.gap)} for most of the year` : `${gapClause(p, main.gap)} ${spans(p, main)}`;
  const tail = rest.map((r) => (sameWay ? `${short(r.gap)} ${spans(p, r)}` : `${gapClause(p, r.gap)} ${spans(p, r)}`));
  return `${lead}, and ${tail.join(', and ')}.`;
}

const offsetAt = (zone: string, ms: number) => getTimezoneOffset(zone, new Date(ms));

export interface Faq {
  question: string;
  answer: string;
}

/**
 * The conversational questions, answered from the pair's own figures. No
 * answer says "right now": the FAQ schema is a script the worker doesn't
 * rewrite, so the answers give the year's pattern instead.
 */
export function pairFaqs(p: TimePair, year: GapShare[], changes: GapChange[]): Faq[] {
  const main = year[0]?.gap ?? 0;
  const t = exampleTime(p, main);
  const tB = t + main;
  const other = year[1];
  // "for most of the year", or the dates when the main gap is only one season
  const when = (share: GapShare | undefined) => (!share || share.days > 300 ? 'for most of the year' : spans(p, share));
  const otherTime = other ? `, or ${formatClock(t + other.gap)}${dayShiftWords(Math.floor((t + other.gap) / 1440))} ${spans(p, other)}` : '';
  const advice = meetingAdvice(main);
  const faqs: Faq[] = [
    {
      question: `What is the time difference between ${p.a.name} and ${p.b.name}?`,
      answer: yearSentence(p, year),
    },
    {
      question: `If it is ${formatClock(t)} in ${p.a.name}, what time is it in ${p.b.name}?`,
      answer: `It is ${formatClock(tB)}${dayShiftWords(Math.floor(tB / 1440))} in ${p.b.name} ${when(year[0])}${otherTime}. The table on this page has every hour of the day.`,
    },
    {
      question: `If it is ${formatClock(t)} in ${p.b.name}, what time is it in ${p.a.name}?`,
      answer: `It is ${formatClock(t - main)}${dayShiftWords(Math.floor((t - main) / 1440))} in ${p.a.name} ${when(year[0])}${other ? `, or ${formatClock(t - other.gap)}${dayShiftWords(Math.floor((t - other.gap) / 1440))} ${spans(p, other)}` : ''}.`,
    },
  ];
  if (main !== 0) {
    faqs.push({
      question: `Is ${p.b.name} ahead of or behind ${p.a.name}?`,
      answer: `${main > 0 ? 'Ahead' : 'Behind'}. ${relationSentence(p.a.name, p.b.name, main)} ${when(year[0])}, so the day starts ${formatGap(main)} ${main > 0 ? 'earlier' : 'later'} in ${p.b.name}.`,
    });
  }
  faqs.push({
    question: `When is the best time for a call between ${p.a.name} and ${p.b.name}?`,
    answer: advice.work
      ? `Between ${formatClock(advice.work.aStart)} and ${formatClock(advice.work.aEnd)} in ${p.a.name} (${formatClock(advice.work.aStart + main)} to ${formatClock(advice.work.aEnd + main)}${dayShiftWords(advice.work.bDayShift)} in ${p.b.name}), when both are in normal 9-to-5 working hours.`
      : advice.stretch
        ? `There is no time when both are between 9 and 5. The least awkward is ${formatClock(advice.stretch.aStart)} to ${formatClock(advice.stretch.aEnd)} in ${p.a.name}, which is ${formatClock(advice.stretch.aStart + main)} to ${formatClock(advice.stretch.aEnd + main)}${dayShiftWords(advice.stretch.bDayShift)} in ${p.b.name}: early for one, late for the other.`
        : `Working hours never overlap. Both are awake from ${formatClock(advice.awake?.aStart ?? 0)} to ${formatClock(advice.awake?.aEnd ?? 0)} in ${p.a.name}${advice.awake ? ` (${formatClock(advice.awake.aStart + main)} to ${formatClock(advice.awake.aEnd + main)}${dayShiftWords(advice.awake.bDayShift)} in ${p.b.name})` : ''}.`,
  });
  const next = changes[0];
  faqs.push({
    question: `Do ${p.a.name} and ${p.b.name} change their clocks on the same day?`,
    answer: changes.length === 0
      ? `Neither changes its clocks, so the difference never changes. ${p.a.rules} ${p.b.rules}`
      : changes.every((c) => c.moved === 'both') || year.length === 1
        ? `They change on the same days, so the difference stays the same. ${p.a.rules} ${p.b.rules}`
        : `No. ${p.a.rules} ${p.b.rules} So the difference changes${next ? `, next on ${wallDateLabel(next.at, next.after.a)}` : ''}.`,
  });
  faqs.push({
    question: `What other places have the same time as ${p.b.name}?`,
    answer: `${p.b.sameTime.join(', ')}. The same difference applies to anywhere on ${p.a.name}’s clock too, including ${p.a.sameTime.slice(0, 2).join(', ')} and ${p.a.sameTime[2]}.`,
  });
  return faqs;
}

/** The meta description, from the year's main gap. */
export function pairDescription(p: TimePair, year: GapShare[]): string {
  const main = year[0]?.gap ?? 0;
  const changes = year.length > 1 ? `, when it changes` : '';
  const rel = main === 0 ? `${p.a.name} and ${p.b.name} are usually on the same time` : `${relationSentence(p.a.name, p.b.name, main)} most of the year`;
  return `${rel}. The time in both now${changes}, overlapping work hours, the best meeting times and an hour-by-hour chart.`;
}
