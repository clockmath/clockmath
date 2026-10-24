/**
 * Every event countdown's timer settings in one place: what it counts to,
 * the words on its board and the board's colour. The event pages spread
 * these into EventPage (countdownProps), and the embeddable countdowns
 * (/embed/countdown/<slug>/) read the same entries, so a page and its embed
 * can never disagree about a date.
 *
 * Date tables (Easter, Lunar New Year, Hanukkah…) stay in lib/holidays.ts;
 * this file only points at them. Page copy (FAQs, intros) stays in the pages.
 */
import { EASTER, HANUKKAH, LUNAR_NEW_YEAR } from '@/lib/holidays';
import { buildEventDisclaimer } from '@/lib/disclaimer';
import { GTA6_RELEASE, LAUNCHED as GTA6_LAUNCHED } from '@/app/countdown/gta-6/launch';
import { channels, luminance } from '@/lib/colour';

export interface CountdownSpec {
  /** Fixed one-off target. */
  target?: Date;
  /** Annual date, month 0-indexed. */
  recurring?: { month: number; day: number };
  /** Weekly event, weekday 0 = Sunday. */
  weekly?: { weekday: number; spanDays?: number };
  /** nth weekday of a month (Thanksgiving: 4th Thursday of November). */
  nthWeekday?: { month: number; weekday: number; n: number; offsetDays?: number };
  /** Explicit YYYY-MM-DD ranges for calendars computed elsewhere. */
  dateRanges?: ReadonlyArray<{ start: string; end?: string }>;
  /** "Until {countdownTitle}" and the answer sentence. */
  countdownTitle?: string;
  arrivedLabel?: string;
  disclaimer?: string;
  /** Board colour and the numerals on it (white unless given); >= 4.5:1. */
  board: { color: string; ink?: string };
}

export interface CountdownEntry {
  /** Short name for embed code and credits ("Thanksgiving"). */
  name: string;
  /** The event page. */
  path: string;
  spec: CountdownSpec;
  /** Eclipse pages count to the peak and say where it happens. */
  eclipse?: { peakMs: number; title: string; arrivedLabel: string; where: string };
  /** The clock-change page counts to the viewer's own next change. */
  clockChange?: true;
}

export const COUNTDOWNS = {
  thanksgiving: {
    name: 'Thanksgiving',
    path: '/countdown/thanksgiving/',
    spec: { nthWeekday: { month: 10, weekday: 4, n: 4 }, countdownTitle: 'Thanksgiving', arrivedLabel: 'Happy Thanksgiving! 🦃', board: { color: '#b5541c' } },
  },
  'black-friday': {
    name: 'Black Friday',
    path: '/countdown/black-friday/',
    spec: { nthWeekday: { month: 10, weekday: 4, n: 4, offsetDays: 1 }, countdownTitle: 'Black Friday', arrivedLabel: "It's Black Friday! 🛍️", board: { color: '#000000' } },
  },
  christmas: {
    name: 'Christmas',
    path: '/countdown/christmas/',
    spec: { recurring: { month: 11, day: 25 }, countdownTitle: 'Christmas', arrivedLabel: 'Merry Christmas! 🎄', board: { color: '#1f5f3f' } },
  },
  halloween: {
    name: 'Halloween',
    path: '/countdown/halloween/',
    spec: { recurring: { month: 9, day: 31 }, countdownTitle: 'Halloween', arrivedLabel: 'Happy Halloween! 🎃', board: { color: '#000000', ink: '#ff8a1f' } },
  },
  'new-year': {
    name: 'New Year',
    path: '/countdown/new-year/',
    spec: { recurring: { month: 0, day: 1 }, countdownTitle: 'New Year', arrivedLabel: 'Happy New Year! 🎉', board: { color: '#14234b', ink: '#f3c74f' } },
  },
  'valentines-day': {
    name: "Valentine's Day",
    path: '/countdown/valentines-day/',
    spec: { recurring: { month: 1, day: 14 }, countdownTitle: "Valentine's Day", arrivedLabel: "Happy Valentine's Day! ❤️", board: { color: '#a3123a' } },
  },
  'july-4th': {
    name: '4th of July',
    path: '/countdown/july-4th/',
    spec: { recurring: { month: 6, day: 4 }, countdownTitle: 'the 4th of July', arrivedLabel: 'Happy 4th of July! 🎆', board: { color: '#1c2f6b' } },
  },
  'canada-day': {
    name: 'Canada Day',
    path: '/countdown/canada-day/',
    spec: { recurring: { month: 6, day: 1 }, countdownTitle: 'Canada Day', arrivedLabel: 'Happy Canada Day! 🍁', board: { color: '#c8102e' } },
  },
  weekend: {
    name: 'The Weekend',
    path: '/countdown/weekend/',
    spec: { weekly: { weekday: 6, spanDays: 2 }, countdownTitle: 'the weekend', arrivedLabel: "It's the weekend! 🎉", board: { color: '#f3c64a', ink: '#000000' } },
  },
  easter: {
    name: 'Easter',
    path: '/countdown/easter/',
    spec: { dateRanges: EASTER.map((y) => ({ start: y.easter })), countdownTitle: 'Easter', arrivedLabel: 'Happy Easter! 🐣', board: { color: '#e7defa', ink: '#3b2a6b' } },
  },
  'lunar-new-year': {
    name: 'Lunar New Year',
    path: '/countdown/lunar-new-year/',
    spec: { dateRanges: LUNAR_NEW_YEAR.map((y) => ({ start: y.start })), countdownTitle: 'Lunar New Year', arrivedLabel: 'Happy Lunar New Year! 🧧', board: { color: '#b71c1c', ink: '#ffd36b' } },
  },
  hanukkah: {
    name: 'Hanukkah',
    path: '/countdown/hanukkah/',
    spec: { dateRanges: HANUKKAH, countdownTitle: 'Hanukkah', arrivedLabel: 'Happy Hanukkah! 🕎', board: { color: '#1d4f91' } },
  },
  'super-bowl': {
    name: 'Super Bowl',
    path: '/countdown/super-bowl/',
    spec: {
      dateRanges: [{ start: '2027-02-14' }],
      countdownTitle: 'Super Bowl LXI',
      arrivedLabel: "It's Super Bowl Sunday! 🏈",
      disclaimer: buildEventDisclaimer('Super Bowl', 'the National Football League (NFL)'),
      board: { color: '#2f5d2a' },
    },
  },
  'gta-6': {
    name: 'GTA 6',
    path: '/countdown/gta-6/',
    spec: {
      target: GTA6_RELEASE,
      countdownTitle: 'GTA 6',
      arrivedLabel: 'GTA 6 is out! 🎮',
      disclaimer: buildEventDisclaimer('Grand Theft Auto', 'Rockstar Games or Take-Two Interactive', { released: GTA6_LAUNCHED }),
      board: { color: '#b0215f' },
    },
  },
  'avengers-doomsday': {
    name: 'Avengers: Doomsday',
    path: '/countdown/avengers-doomsday/',
    spec: {
      target: new Date(2026, 11, 18),
      countdownTitle: 'Avengers: Doomsday',
      arrivedLabel: 'Avengers: Doomsday is here! 💥',
      disclaimer: buildEventDisclaimer('Avengers', 'Marvel Studios or The Walt Disney Company'),
      board: { color: '#23402f' },
    },
  },
  'olympics-2028': {
    name: 'LA 2028 Olympics',
    path: '/countdown/olympics-2028/',
    spec: {
      target: new Date(2028, 6, 14),
      countdownTitle: 'the 2028 Olympics',
      arrivedLabel: 'The 2028 Olympics have begun! 🏅',
      disclaimer:
        'ClockMath is not affiliated with, endorsed by, or sponsored by the International Olympic Committee (IOC) or the LA28 organizing committee. “Olympic” and related names are trademarks of their respective owners. Dates subject to change.',
      board: { color: '#0e5a8a' },
    },
  },
  'solar-eclipse-2027': {
    name: '2027 solar eclipse',
    path: '/countdown/solar-eclipse-2027/',
    spec: { arrivedLabel: 'The 2027 eclipse has passed — the next total eclipse is July 22, 2028', board: { color: '#10142b', ink: '#f5d76e' } },
    eclipse: {
      peakMs: Date.UTC(2027, 7, 2, 10, 6, 37),
      title: 'the 2027 total solar eclipse',
      arrivedLabel: 'The 2027 eclipse has passed — the next total eclipse is July 22, 2028',
      where: 'near Luxor, Egypt',
    },
  },
  'solar-eclipse-2028': {
    name: '2028 solar eclipse',
    path: '/countdown/solar-eclipse-2028/',
    spec: { arrivedLabel: 'The 2028 eclipse has passed — the next total eclipse is November 25, 2030', board: { color: '#10142b', ink: '#f5d76e' } },
    eclipse: {
      peakMs: Date.UTC(2028, 6, 22, 2, 55, 23),
      title: 'the 2028 total solar eclipse',
      arrivedLabel: 'The 2028 eclipse has passed — the next total eclipse is November 25, 2030',
      where: 'in the Kimberley, Western Australia',
    },
  },
  'annular-eclipse-2028': {
    name: '2028 annular eclipse',
    path: '/countdown/annular-eclipse-2028/',
    spec: { arrivedLabel: 'The January 2028 eclipse has passed — next: a total eclipse on July 22, 2028', board: { color: '#10142b', ink: '#ffb347' } },
    eclipse: {
      peakMs: Date.UTC(2028, 0, 26, 15, 7, 43),
      title: 'the 2028 annular solar eclipse',
      arrivedLabel: 'The January 2028 eclipse has passed — next: a total eclipse on July 22, 2028',
      where: 'over the Atlantic off northern Brazil',
    },
  },
  'daylight-saving-time': {
    name: 'the clock change',
    path: '/countdown/daylight-saving-time/',
    spec: { board: { color: '#2b3270' } },
    clockChange: true,
  },
} satisfies Record<string, CountdownEntry>;

export type CountdownSlug = keyof typeof COUNTDOWNS;

export const COUNTDOWN_SLUGS = Object.keys(COUNTDOWNS) as CountdownSlug[];

export function getCountdown(slug: string): CountdownEntry | undefined {
  return (COUNTDOWNS as Record<string, CountdownEntry>)[slug];
}

/** An event page's timer props, spread into EventPage. */
export function countdownProps(slug: CountdownSlug): CountdownSpec {
  return COUNTDOWNS[slug].spec;
}

/** An eclipse page's EclipseCountdown props. */
export function eclipseProps(slug: 'solar-eclipse-2027' | 'solar-eclipse-2028' | 'annular-eclipse-2028') {
  return COUNTDOWNS[slug].eclipse;
}

/** The retirement page's board: it counts to the visitor's own date, so it
 * has no entry above, but it is one of the countdowns all the same. */
export const RETIREMENT_BOARD = { color: '#1f5c6b' };

/**
 * The colour that stands for a countdown in lists of them (the dots in
 * "More countdowns" and on the holidays board): its board colour, or for a
 * near-black board with coloured numerals (Halloween's orange, the eclipses'
 * gold), those numerals, since a black dot says little. Null for links that
 * are not one event's page (the holidays hub).
 */
export function eventColour(href: string): string | null {
  const path = href.endsWith('/') ? href : `${href}/`;
  if (path === '/countdown/retirement/') return RETIREMENT_BOARD.color;
  const entry = (Object.values(COUNTDOWNS) as CountdownEntry[]).find((e) => e.path === path);
  if (!entry) return null;
  const { color, ink } = entry.spec.board;
  return ink && luminance(channels(color)) < 0.02 ? ink : color;
}
