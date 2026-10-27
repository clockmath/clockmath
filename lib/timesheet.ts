/**
 * The work hours calculator's maths (/tools/timesheet/). Moved out of
 * components/TimesheetTool.tsx in the Oct 2026 review so it can be tested:
 * the daylight-saving shift lengths, workweek overtime buckets and share
 * links were 200 lines inside a 1,160-line component with no tests.
 */
import { getUserTimeZone, parseDateTimeInZone } from '@/lib/time';

export interface Shift {
  id: string;
  date: Date;
  start: string; // "HH:MM:SS"
  end: string;
  breakMins: number;
}

export interface SavedShift {
  id: string;
  date: string; // "YYYY-MM-DD"
  start: string;
  end: string;
  breakMins: number;
}
export interface SavedTimesheet {
  id: string;
  name: string;
  shifts: SavedShift[];
  rate: string;
}

// Compact shapes used for share links (?d=...).
export interface ShareShift {
  d?: string;
  st?: string;
  en?: string;
  b?: number;
}
export interface ShareDoc {
  n?: string;
  r?: string;
  s?: ShareShift[];
}

export const toDateInputValue = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};
export const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
};

export const toMinutes = (t: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export const isOvernight = (shift: { start: string; end: string }): boolean => {
  const s = toMinutes(shift.start);
  const e = toMinutes(shift.end);
  return s != null && e != null && e < s;
};

/** Minutes between start and end as the clock reads them (overnight = +24h). */
export const clockMinutes = (shift: { start: string; end: string }): number => {
  const s = toMinutes(shift.start);
  const e = toMinutes(shift.end);
  if (s == null || e == null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 1440; // overnight
  return diff;
};

export const nextDayYmd = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
};

/**
 * Minutes actually elapsed, measured in the visitor's own timezone. A shift
 * that spans a daylight-saving change is an hour longer or shorter than the
 * clock says — 10 PM–6 AM is 9 hours on the fall-back night and 7 on the
 * spring-forward night — and pay is owed for hours worked, not clock time.
 *
 * Goes through lib/time, so it also picks up the BC permanent-UTC−7
 * correction for browsers with stale tz data. Falls back to clock time when
 * the date is unusable or the result is implausible.
 */
export const elapsedMinutes = (shift: { date: Date | string; start: string; end: string }): number => {
  const clock = clockMinutes(shift);
  if (clock === 0) return 0;
  const startDay = typeof shift.date === 'string' ? shift.date : toDateInputValue(shift.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDay)) return clock;

  // Fast path: no offset change anywhere from the start day through the next
  // day means no DST transition can fall inside the shift. (The BC correction
  // only ever removes transitions, so a browser that sees none is right.)
  const [y, m, d] = startDay.split('-').map((n) => parseInt(n, 10));
  if (new Date(y, m - 1, d).getTimezoneOffset() === new Date(y, m - 1, d + 2).getTimezoneOffset()) {
    return clock;
  }

  const tz = getUserTimeZone();
  const endDay = isOvernight(shift) ? nextDayYmd(startDay) : startDay;
  const startAt = parseDateTimeInZone(startDay, shift.start, tz).getTime();
  const endAt = parseDateTimeInZone(endDay, shift.end, tz).getTime();
  const real = Math.round((endAt - startAt) / 60000);
  if (!Number.isFinite(real) || real < 0 || Math.abs(real - clock) > 120) return clock;
  return real;
};

/** Signed minutes a daylight-saving change adds to (+60) or removes from (−60) a shift. */
export const dstAdjustment = (shift: { date: Date | string; start: string; end: string }): number =>
  elapsedMinutes(shift) - clockMinutes(shift);

export const dstLabel = (shift: { date: Date | string; start: string; end: string }): string => {
  const adj = dstAdjustment(shift);
  if (adj === 0) return '';
  return `${adj > 0 ? '+' : '−'}${Math.abs(adj) / 60}h clock change`;
};

export const shiftMinutes = (shift: { date: Date | string; start: string; end: string; breakMins: number }): number =>
  Math.max(0, elapsedMinutes(shift) - (shift.breakMins || 0));

export const decimalHours = (mins: number): string => (mins / 60).toFixed(2);
export const hhmm = (mins: number): string => `${Math.floor(mins / 60)}h ${mins % 60}m`;

export const newShift = (id: string, date: Date): Shift => ({ id, date, start: '09:00:00', end: '17:00:00', breakMins: 30 });

/**
 * A typed break as minutes: "45", "45m", "1h", "1.5h", "1:00", "1h30",
 * "1h 30m". Empty is no break. Null when it isn't a length of time.
 */
export const parseBreak = (text: string): number | null => {
  const t = text.trim().toLowerCase().replace(/\s+/g, '');
  if (t === '') return 0;
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^(\d{1,3})(?:m|min|mins)?$/))) return Number(m[1]);
  if ((m = t.match(/^(\d{1,2}):(\d{2})$/))) return Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null;
  if ((m = t.match(/^(\d{1,2}(?:\.\d+)?)h$/))) return Math.round(Number(m[1]) * 60);
  if ((m = t.match(/^(\d{1,2})h(\d{1,2})(?:m|min|mins)?$/))) return Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null;
  return null;
};

/** Shifts in date and start-time order, for the summary, copy and CSV (the
 * rows above stay in the order they were entered, so nothing jumps while
 * editing). */
export const byDate = (list: Shift[]): Shift[] =>
  [...list].sort(
    (a, b) => toDateInputValue(a.date).localeCompare(toDateInputValue(b.date)) || (toMinutes(a.start) ?? 0) - (toMinutes(b.start) ?? 0),
  );

export const serializeShift = (s: Shift): SavedShift => ({
  id: s.id,
  date: toDateInputValue(s.date),
  start: s.start,
  end: s.end,
  breakMins: s.breakMins,
});
export const deserializeShift = (s: SavedShift): Shift => ({
  id: s.id,
  date: parseLocalDate(s.date),
  start: s.start,
  end: s.end,
  breakMins: s.breakMins,
});

// ---- Share-link encoding (compact JSON in a ?d= param) ----
export const encodeShareParam = (name: string, rate: string, shifts: Shift[]): string => {
  const doc: ShareDoc = {
    n: name.trim() || undefined,
    r: rate.trim() || undefined,
    s: shifts.map((s) => ({ d: toDateInputValue(s.date), st: s.start.slice(0, 5), en: s.end.slice(0, 5), b: s.breakMins })),
  };
  return encodeURIComponent(JSON.stringify(doc));
};
export const decodeShareParam = (param: string): { name: string; rate: string; shifts: Shift[] } | null => {
  try {
    // URLSearchParams.get already decodes once. Decoding again (as until Oct
    // 2026) threw on any "%" in a name or rate, so the link wouldn't open;
    // the second decode is only a fallback for a doubly-encoded param.
    let doc: ShareDoc;
    try {
      doc = JSON.parse(param) as ShareDoc;
    } catch {
      doc = JSON.parse(decodeURIComponent(param)) as ShareDoc;
    }
    if (!doc || !Array.isArray(doc.s) || doc.s.length === 0) return null;
    const shifts: Shift[] = doc.s.slice(0, 60).map((x, i) => ({
      id: `row-${i + 1}`,
      date: parseLocalDate(String(x.d ?? '')),
      start: `${String(x.st ?? '00:00')}:00`,
      end: `${String(x.en ?? '00:00')}:00`,
      breakMins: Math.max(0, Number(x.b) || 0),
    }));
    return { name: typeof doc.n === 'string' ? doc.n : '', rate: typeof doc.r === 'string' ? doc.r : '', shifts };
  } catch {
    return null;
  }
};

/**
 * Minutes worked in each Sunday–Saturday workweek, for weekly overtime: the
 * threshold applies to each week on its own (until Oct 2026 it was applied
 * to the whole sheet, so a two-week 40 h + 40 h sheet showed 40 h of
 * overtime; FLSA: none). A shift counts in the week it starts. Empty weeks
 * are left out.
 */
export function workweekMinutes(shifts: ReadonlyArray<Shift>): number[] {
  const byWeek = new Map<string, number>();
  for (const s of shifts) {
    const sunday = new Date(s.date.getFullYear(), s.date.getMonth(), s.date.getDate() - s.date.getDay());
    const key = toDateInputValue(sunday);
    byWeek.set(key, (byWeek.get(key) ?? 0) + shiftMinutes(s));
  }
  return [...byWeek.values()].filter((m) => m > 0);
}
