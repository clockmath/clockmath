/**
 * Shift lengths for /tools/shift-hours-chart/: how many hours common shifts
 * are, with and without an unpaid lunch.
 *
 * Nov 2026: the homepage drew ~79K Google impressions in a week (Oct 18–24)
 * for one-off questions like "how many hours is 9 to 5:30" and "7am to
 * 4:15pm is how many hours", at about position 8.5 and almost no clicks:
 * Google's AI Overview answers the sum, then adds that paid hours depend on
 * the lunch break. The pages it cites are shift-length charts with break
 * columns. On Bing, "how many hours is 9-5" and its variants are ~1.4K
 * impressions a quarter, and the top results there are charts too. So this
 * is the full answer in one table: every common shift, three ways.
 */
import { minutesToDecimal } from '@/lib/decimalTime';

const DAY = 24 * 60;

export type ShiftGroup = 'day' | 'late' | 'night' | 'long' | 'short';

export const SHIFT_GROUPS: ReadonlyArray<{ id: ShiftGroup; name: string }> = [
  { id: 'day', name: 'Day shifts' },
  { id: 'late', name: 'Afternoon and evening' },
  { id: 'night', name: 'Overnight' },
  { id: 'long', name: '10- and 12-hour shifts' },
  { id: 'short', name: 'Short and part-time shifts' },
];

/** Shifts under this many minutes get no lunch columns (no meal break is usual, or required, that short). */
export const LUNCH_FROM = 6 * 60;

/** The unpaid lunch lengths the chart takes off. */
export const LUNCHES = [30, 60] as const;

export interface Shift {
  /** Start, minutes after midnight. */
  start: number;
  /** End, minutes after midnight; earlier than start means the next day. */
  end: number;
  group: ShiftGroup;
}

const hm = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

// The starts and ends people ask about (GSC homepage queries, Oct–Nov 2026;
// Bing keyword research), in the order a reader scans for theirs.
const LIST: ReadonlyArray<[string, string, ShiftGroup]> = [
  ['6:00', '14:00', 'day'],
  ['6:00', '14:30', 'day'],
  ['6:00', '15:00', 'day'],
  ['7:00', '15:00', 'day'],
  ['7:00', '15:30', 'day'],
  ['7:00', '16:00', 'day'],
  ['7:30', '16:00', 'day'],
  ['7:30', '16:30', 'day'],
  ['8:00', '16:00', 'day'],
  ['8:00', '16:30', 'day'],
  ['8:00', '17:00', 'day'],
  ['8:30', '16:30', 'day'],
  ['8:30', '17:00', 'day'],
  ['8:30', '17:30', 'day'],
  ['9:00', '16:30', 'day'],
  ['9:00', '17:00', 'day'],
  ['9:00', '17:30', 'day'],
  ['9:00', '18:00', 'day'],
  ['9:30', '17:30', 'day'],
  ['10:00', '18:00', 'day'],
  ['10:00', '19:00', 'day'],
  ['11:00', '19:00', 'late'],
  ['12:00', '20:00', 'late'],
  ['13:00', '21:00', 'late'],
  ['14:00', '22:00', 'late'],
  ['15:00', '23:00', 'late'],
  ['16:00', '0:00', 'late'],
  ['22:00', '6:00', 'night'],
  ['23:00', '7:00', 'night'],
  ['0:00', '8:00', 'night'],
  ['6:00', '16:30', 'long'],
  ['7:00', '17:30', 'long'],
  ['6:00', '18:00', 'long'],
  ['7:00', '19:00', 'long'],
  ['18:00', '6:00', 'long'],
  ['19:00', '7:00', 'long'],
  ['9:00', '13:00', 'short'],
  ['9:00', '14:00', 'short'],
  ['10:00', '14:00', 'short'],
  ['10:00', '15:00', 'short'],
  ['16:00', '20:00', 'short'],
  ['16:30', '22:00', 'short'],
  ['17:00', '21:00', 'short'],
];

export const SHIFTS: ReadonlyArray<Shift> = LIST.map(([s, e, group]) => ({ start: hm(s), end: hm(e), group }));

/** Clock minutes from start to end, the next day when end is earlier (10 PM to 6 AM is 480). */
export function shiftMinutes(start: number, end: number): number {
  return (end - start + DAY) % DAY;
}

/** Paid minutes after an unpaid break, or null when the shift is too short for one. */
export function paidMinutes(start: number, end: number, unpaidBreak: number): number | null {
  const mins = shiftMinutes(start, end);
  if (unpaidBreak > 0 && mins < LUNCH_FROM) return null;
  return mins - unpaidBreak;
}

/** 9:00 → "9 AM", 17:30 → "5:30 PM", 0:00 → "12 AM" (as the homepage's answers write them). */
export function clock12(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

/** 9:00 → "09:00", 0:00 → "00:00". */
export function clock24(mins: number): string {
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** The way people type it: 9:00–17:30 → "9 to 5:30". */
export function shortName(start: number, end: number): string {
  const bare = (mins: number) => clock12(mins).replace(/ [AP]M$/, '');
  return `${bare(start)} to ${bare(end)}`;
}

/** 510 → "8h 30m", 480 → "8h", 30 → "30m". */
export function hoursMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** 510 → "8.50" (decimal hours to 2 places, as timesheets write them). */
export function decimalHours(mins: number): string {
  return minutesToDecimal(mins).toFixed(2);
}

/** Does the shift run past midnight? */
export function isOvernight(shift: Shift): boolean {
  return shift.end < shift.start || (shift.end === 0 && shift.start > 0);
}

export interface WeekSchedule {
  shift: Shift;
  days: number;
  /** Unpaid break per shift, minutes. */
  unpaidBreak: number;
  /** Paid minutes for the week. */
  weekMinutes: number;
}

/**
 * The shifts in the chart that make a 40-hour week over five days, and with
 * which unpaid lunch: 9 to 5:30 with half an hour, 8 to 5 with an hour…
 * "How many hours is 9 to 5 a week" is the follow-up question.
 */
export function fortyHourWeeks(): WeekSchedule[] {
  const out: WeekSchedule[] = [];
  for (const shift of SHIFTS) {
    for (const unpaidBreak of [0, ...LUNCHES]) {
      const paid = paidMinutes(shift.start, shift.end, unpaidBreak);
      if (paid !== null && paid * 5 === 40 * 60) out.push({ shift, days: 5, unpaidBreak, weekMinutes: paid * 5 });
    }
  }
  return out;
}

/** A shift by its 24-hour start and end ("9:00", "17:30"), for the page's worked examples. */
export function findShift(start: string, end: string): Shift {
  const s = SHIFTS.find((x) => x.start === hm(start) && x.end === hm(end));
  if (!s) throw new Error(`No ${start}–${end} shift in the chart`);
  return s;
}
