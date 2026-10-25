'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useClockFormat } from '@/hooks/use-clock-format';
import { event as gaEvent, toolUsed } from '@/lib/gtag';
import { InlineTimePicker } from '@/components/ui/InlineTimePicker';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { RollingNumber } from '@/components/RollingNumber';
import { computeWeeklyOvertime, parseAmount } from '@/lib/overtime';
import { getUserTimeZone, parseDateTimeInZone } from '@/lib/time';
import Link from 'next/link';
import { buildDay } from '@/lib/buildDay';
import { Coffee, X } from 'lucide-react';
import InfoTip from '@/components/InfoTip';
import { getDevice } from '@/lib/device';

interface TimesheetToolProps {
  className?: string;
}

interface Shift {
  id: string;
  date: Date;
  start: string; // "HH:MM:SS"
  end: string;
  breakMins: number;
}

interface SavedShift {
  id: string;
  date: string; // "YYYY-MM-DD"
  start: string;
  end: string;
  breakMins: number;
}
interface SavedTimesheet {
  id: string;
  name: string;
  shifts: SavedShift[];
  rate: string;
}

// Compact shapes used for share links (?d=...).
interface ShareShift {
  d?: string;
  st?: string;
  en?: string;
  b?: number;
}
interface ShareDoc {
  n?: string;
  r?: string;
  s?: ShareShift[];
}

const SAVED_KEY = 'clockmath-saved-timesheets';
const DRAFT_KEY = 'clockmath-timesheet-draft';

// Support nudge (Oct 2026): the footer's Buy Me a Coffee button got no clicks
// in months of being on every page, so the ask moves to the moment someone
// has just got value — a copied, downloaded or shared timesheet. At most once
// per visit; dismissing hides it for 30 days.
const SUPPORT_SHOWN_KEY = 'clockmath-support-nudge-shown'; // sessionStorage
const SUPPORT_DISMISSED_KEY = 'clockmath-support-nudge-dismissed'; // localStorage, ms
const SUPPORT_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const SUPPORT_URL = 'https://www.buymeacoffee.com/clockmath?utm_source=clockmath&utm_medium=site&utm_campaign=work_hours_nudge';


const toDateInputValue = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
};

const toMinutes = (t: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const isOvernight = (shift: { start: string; end: string }): boolean => {
  const s = toMinutes(shift.start);
  const e = toMinutes(shift.end);
  return s != null && e != null && e < s;
};

/** Minutes between start and end as the clock reads them (overnight = +24h). */
const clockMinutes = (shift: { start: string; end: string }): number => {
  const s = toMinutes(shift.start);
  const e = toMinutes(shift.end);
  if (s == null || e == null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 1440; // overnight
  return diff;
};

const nextDayYmd = (ymd: string): string => {
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
const elapsedMinutes = (shift: { date: Date | string; start: string; end: string }): number => {
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
const dstAdjustment = (shift: { date: Date | string; start: string; end: string }): number =>
  elapsedMinutes(shift) - clockMinutes(shift);

const dstLabel = (shift: { date: Date | string; start: string; end: string }): string => {
  const adj = dstAdjustment(shift);
  if (adj === 0) return '';
  return `${adj > 0 ? '+' : '−'}${Math.abs(adj) / 60}h clock change`;
};

const shiftMinutes = (shift: { date: Date | string; start: string; end: string; breakMins: number }): number =>
  Math.max(0, elapsedMinutes(shift) - (shift.breakMins || 0));

const decimalHours = (mins: number): string => (mins / 60).toFixed(2);
const hhmm = (mins: number): string => `${Math.floor(mins / 60)}h ${mins % 60}m`;

const newShift = (id: string, date: Date): Shift => ({ id, date, start: '09:00:00', end: '17:00:00', breakMins: 30 });

/**
 * A typed break as minutes: "45", "45m", "1h", "1.5h", "1:00", "1h30",
 * "1h 30m". Empty is no break. Null when it isn't a length of time.
 */
const parseBreak = (text: string): number | null => {
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
const byDate = (list: Shift[]): Shift[] =>
  [...list].sort(
    (a, b) => toDateInputValue(a.date).localeCompare(toDateInputValue(b.date)) || (toMinutes(a.start) ?? 0) - (toMinutes(b.start) ?? 0),
  );

/**
 * The break field: typed freely (it can be empty while you type, and takes
 * "1h" or "1:00" as well as minutes), saved as minutes when it's a length of
 * time. Something else is put back on blur with a note.
 */
function BreakInput({ id, value, onChange }: { id: string; value: number; onChange: (mins: number) => void }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={text}
        placeholder="0"
        aria-invalid={bad || undefined}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setBad(false);
          const mins = parseBreak(e.target.value);
          if (mins !== null) onChange(mins);
        }}
        onBlur={() => {
          setFocused(false);
          if (parseBreak(text) === null) setBad(true);
          setText(String(value));
        }}
        className="w-full px-3 py-2.5 rounded-lg bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
      />
      {bad && (
        <span role="status" className="block mt-1 text-sm text-red-700 dark:text-red-300">
          Minutes, or like 1h or 1:00
        </span>
      )}
    </>
  );
}

const serializeShift = (s: Shift): SavedShift => ({
  id: s.id,
  date: toDateInputValue(s.date),
  start: s.start,
  end: s.end,
  breakMins: s.breakMins,
});
const deserializeShift = (s: SavedShift): Shift => ({
  id: s.id,
  date: parseLocalDate(s.date),
  start: s.start,
  end: s.end,
  breakMins: s.breakMins,
});

// ---- Share-link encoding (compact JSON in a ?d= param) ----
const encodeShareParam = (name: string, rate: string, shifts: Shift[]): string => {
  const doc: ShareDoc = {
    n: name.trim() || undefined,
    r: rate.trim() || undefined,
    s: shifts.map((s) => ({ d: toDateInputValue(s.date), st: s.start.slice(0, 5), en: s.end.slice(0, 5), b: s.breakMins })),
  };
  return encodeURIComponent(JSON.stringify(doc));
};
const decodeShareParam = (param: string): { name: string; rate: string; shifts: Shift[] } | null => {
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
const shareUrlFor = (name: string, rate: string, shifts: Shift[]): string =>
  `${window.location.origin}/tools/timesheet/?d=${encodeShareParam(name, rate, shifts)}`;

const shareOrCopy = async (url: string, title: string) => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: title || 'Timesheet', url });
      return;
    } catch {
      /* fall through */
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!', description: 'Share your timesheet anywhere.' });
  } catch {
    toast({ title: 'Copy this link', description: url });
  }
};

export function TimesheetTool({ className = '' }: TimesheetToolProps) {
  const [shifts, setShifts] = useState<Shift[]>([newShift('row-1', buildDay())]);
  const [is24h, setIs24h] = useClockFormat();
  const [rate, setRate] = useState('');
  const [saved, setSaved] = useState<SavedTimesheet[]>([]);
  const [saveName, setSaveName] = useState('');
  // Optional weekly overtime split — reuses the standalone /tools/overtime engine.
  const [otEnabled, setOtEnabled] = useState(false);
  const [otThreshold, setOtThreshold] = useState('40');
  const [otMultiplier, setOtMultiplier] = useState(1.5);
  const [seq, setSeq] = useState(2);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Named saved-timesheets list.
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (raw) {
        const parsed: SavedTimesheet[] = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed.filter((t) => t && Array.isArray(t.shifts)));
      }
    } catch {
      /* ignore */
    }

    // Priority: shared link (?d) > in-progress draft > default.
    const shared = new URLSearchParams(window.location.search).get('d');
    const decoded = shared ? decodeShareParam(shared) : null;
    if (decoded) {
      setShifts(decoded.shifts);
      setRate(decoded.rate);
      setSaveName(decoded.name);
      setSeq(decoded.shifts.length + 2);
      gaEvent({ action: 'timesheet_opened_from_link', params: { device: getDevice(), shifts: decoded.shifts.length } });
      // The shared shifts (names, pay, times) now live in the draft that
      // auto-saves below, so take them out of the address bar: analytics
      // and session recordings capture the URL. Only when storage works —
      // otherwise a reload would lose the timesheet.
      try {
        window.localStorage.setItem('clockmath-ts-probe', '1');
        window.localStorage.removeItem('clockmath-ts-probe');
        const clean = new URL(window.location.href);
        clean.searchParams.delete('d');
        window.history.replaceState(window.history.state, '', clean.pathname + clean.search + clean.hash);
      } catch {
        /* storage blocked: keep the link so a reload still shows the timesheet */
      }
      setLoaded(true);
      return;
    }

    let restored = false;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d: {
          shifts?: SavedShift[];
          rate?: string;
          name?: string;
          otEnabled?: boolean;
          otThreshold?: string;
          otMultiplier?: number;
        } = JSON.parse(raw);
        if (d && Array.isArray(d.shifts) && d.shifts.length) {
          setShifts(d.shifts.map(deserializeShift));
          setRate(d.rate || '');
          setSaveName(d.name || '');
          setSeq(d.shifts.length + 2);
          if (d.otEnabled) setOtEnabled(true);
          if (d.otThreshold) setOtThreshold(d.otThreshold);
          if (d.otMultiplier === 1.5 || d.otMultiplier === 2) setOtMultiplier(d.otMultiplier);
          restored = true;
        }
      }
    } catch {
      /* ignore */
    }
    if (!restored) {
      setShifts((prev) => prev.map((s, i) => (i === 0 ? { ...s, date: new Date() } : s)));
    }
    setLoaded(true);
  }, []);

  // Auto-save the in-progress timesheet on every change (after initial load).
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          shifts: shifts.map(serializeShift),
          rate,
          name: saveName,
          otEnabled,
          otThreshold,
          otMultiplier,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [loaded, shifts, rate, saveName, otEnabled, otThreshold, otMultiplier]);

  const totalMins = useMemo(() => shifts.reduce((sum, s) => sum + shiftMinutes(s), 0), [shifts]);
  const ordered = useMemo(() => byDate(shifts), [shifts]);

  // Track real timesheet usage: fire once per session when the user has entered
  // shifts that produce a non-zero total (the tool's primary action).
  const calcTrackedRef = useRef(false);
  useEffect(() => {
    if (calcTrackedRef.current || totalMins <= 0) return;
    calcTrackedRef.current = true;
    const device = getDevice();
    gaEvent({
      action: 'timesheet_calculated',
      params: { device, shifts: shifts.length, total_minutes: totalMins },
    });
    toolUsed('timesheet', { device });
  }, [totalMins, shifts.length]);

  // Read as the overtime tool reads it (parseAmount): the number field made
  // a "18,50" rate $1,850 an hour
  const parsedRate = parseAmount(rate);
  const rateNum = parsedRate ?? NaN;
  const rateNote = rate.trim() && (parsedRate === null || Number.isNaN(parsedRate)) ? 'Use a rate like 18.50.' : null;
  const flatGross = rate.trim() && !Number.isNaN(rateNum) && rateNum > 0 ? (totalMins / 60) * rateNum : null;

  // Weekly overtime split (optional). The threshold applies to each
  // Sunday–Saturday workweek on its own: until Oct 2026 it was applied to the
  // whole sheet, so a two-week 40 h + 40 h sheet showed 40 h of overtime
  // (FLSA: none). A shift counts in the week it starts. Pay comes from the OT
  // engine so each week matches /tools/overtime penny for penny; per-shift
  // pay stays at base rate since overtime belongs to the week, not a shift.
  const weeklyMins = useMemo(() => {
    const byWeek = new Map<string, number>();
    for (const s of shifts) {
      const sunday = new Date(s.date.getFullYear(), s.date.getMonth(), s.date.getDate() - s.date.getDay());
      const key = toDateInputValue(sunday);
      byWeek.set(key, (byWeek.get(key) ?? 0) + shiftMinutes(s));
    }
    return [...byWeek.values()].filter((m) => m > 0);
  }, [shifts]);

  const otSplit = useMemo(() => {
    if (!otEnabled || totalMins <= 0) return null;
    const threshold = otThreshold.trim() === '' ? 40 : (parseAmount(otThreshold) ?? NaN);
    if (Number.isNaN(threshold) || threshold < 0) return null;
    return computeWeeklyOvertime(
      weeklyMins.map((m) => m / 60),
      { threshold, multiplier: otMultiplier, rate: flatGross != null ? rateNum : null },
    );
  }, [otEnabled, totalMins, weeklyMins, otThreshold, otMultiplier, flatGross, rateNum]);

  const gross = otSplit && otSplit.totalPay != null ? otSplit.totalPay : flatGross;

  const formatClock = useCallback(
    (t: string): string => {
      const m = toMinutes(t);
      if (m == null) return t.slice(0, 5);
      const h = Math.floor(m / 60);
      const mm = `${m % 60}`.padStart(2, '0');
      if (is24h) return `${`${h}`.padStart(2, '0')}:${mm}`;
      const period = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${mm} ${period}`;
    },
    [is24h],
  );

  const formatShiftDate = (date: Date): string =>
    date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  // A new shift is the day after the last one, with its times and break:
  // most weeks repeat, and every added row used to come back as 9–5 with 30 min
  const addShift = useCallback(() => {
    setShifts((prev) => {
      const last = prev[prev.length - 1];
      const next = last ? new Date(last.date) : new Date();
      next.setDate(next.getDate() + 1);
      const fresh = newShift(`row-${seq}`, next);
      return [...prev, last ? { ...fresh, start: last.start, end: last.end, breakMins: last.breakMins } : fresh];
    });
    setSeq((n) => n + 1);
  }, [seq]);

  const updateShift = useCallback((id: string, patch: Partial<Shift>) => {
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  // One tap removes a shift, so the toast offers it back
  const removeShift = useCallback(
    (id: string) => {
      const index = shifts.findIndex((s) => s.id === id);
      if (shifts.length <= 1 || index < 0) return;
      const shift = shifts[index];
      setShifts((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: 'Shift removed',
        description: `${shift.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${formatClock(shift.start)}–${formatClock(shift.end)}`,
        action: (
          <ToastAction
            altText="Undo removing the shift"
            onClick={() =>
              setShifts((prev) =>
                prev.some((s) => s.id === shift.id)
                  ? prev
                  : [...prev.slice(0, Math.min(index, prev.length)), shift, ...prev.slice(Math.min(index, prev.length))],
              )
            }
          >
            Undo
          </ToastAction>
        ),
      });
    },
    [shifts, formatClock],
  );

  const persistSaved = useCallback((next: SavedTimesheet[]) => {
    setSaved(next);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const handleSave = useCallback(() => {
    const name = saveName.trim() || 'Untitled timesheet';
    const entry: SavedTimesheet = { id: `${name}-${shifts.length}-${totalMins}`, name, shifts: shifts.map(serializeShift), rate };
    const next = [entry, ...saved.filter((t) => t.name !== name)].slice(0, 20);
    persistSaved(next);
    gaEvent({ action: 'timesheet_saved', params: { device: getDevice(), shifts: shifts.length } });
    toast({ title: 'Timesheet saved', description: `“${name}” is in your saved timesheets below.` });
  }, [saveName, shifts, totalMins, rate, saved, persistSaved]);

  const loadSaved = useCallback((t: SavedTimesheet) => {
    setShifts(t.shifts.map(deserializeShift));
    setRate(t.rate || '');
    setSaveName(t.name === 'Untitled timesheet' ? '' : t.name);
    setSeq(t.shifts.length + 2);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deleteSaved = useCallback((id: string) => persistSaved(saved.filter((t) => t.id !== id)), [saved, persistSaved]);

  const [supportNudge, setSupportNudge] = useState(false);

  const offerSupport = useCallback((trigger: 'copy' | 'csv' | 'share') => {
    try {
      const dismissed = Number(window.localStorage.getItem(SUPPORT_DISMISSED_KEY) || 0);
      if (dismissed && Date.now() - dismissed < SUPPORT_SNOOZE_MS) return;
      if (window.sessionStorage.getItem(SUPPORT_SHOWN_KEY)) return;
      window.sessionStorage.setItem(SUPPORT_SHOWN_KEY, '1');
    } catch {
      return; // storage blocked (private mode etc.): skip the ask rather than repeat it
    }
    setSupportNudge(true);
    gaEvent({ action: 'support_nudge_shown', params: { tool: 'timesheet', trigger, device: getDevice() } });
  }, []);

  const dismissSupport = useCallback(() => {
    setSupportNudge(false);
    try {
      window.localStorage.setItem(SUPPORT_DISMISSED_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    gaEvent({ action: 'support_nudge_dismissed', params: { tool: 'timesheet', device: getDevice() } });
  }, []);

  const handleShare = useCallback(() => {
    gaEvent({ action: 'timesheet_shared', params: { device: getDevice(), shifts: shifts.length } });
    shareOrCopy(shareUrlFor(saveName, rate, shifts), saveName.trim() || 'Timesheet');
    offerSupport('share');
  }, [saveName, rate, shifts, offerSupport]);

  const shareSaved = useCallback((t: SavedTimesheet) => {
    const url = shareUrlFor(t.name, t.rate, t.shifts.map(deserializeShift));
    gaEvent({ action: 'timesheet_shared', params: { device: getDevice(), shifts: t.shifts.length } });
    shareOrCopy(url, t.name);
  }, []);

  const handleExport = useCallback(async () => {
    const lines: string[] = [];
    lines.push(`Timesheet${saveName.trim() ? ` — ${saveName.trim()}` : ''}`);
    ordered.forEach((s) => {
      const mins = shiftMinutes(s);
      const dst = dstLabel(s);
      const oc = `${isOvernight(s) ? ' (+1 day)' : ''}${dst ? ` (${dst})` : ''}`;
      lines.push(
        `${formatShiftDate(s.date)}: ${formatClock(s.start)}–${formatClock(s.end)}${oc} (−${s.breakMins}m) = ${decimalHours(mins)} h`,
      );
    });
    lines.push(`Total: ${decimalHours(totalMins)} h (${hhmm(totalMins)})`);
    if (otSplit) {
      lines.push(`Regular: ${otSplit.regularHours} h · Overtime: ${otSplit.overtimeHours} h at ${otMultiplier}×`);
    }
    if (gross != null) {
      lines.push(
        otSplit && otSplit.totalPay != null
          ? `Gross: $${gross.toFixed(2)} (at $${rateNum.toFixed(2)}/h + overtime)`
          : `Gross: $${gross.toFixed(2)} (at $${rateNum.toFixed(2)}/h)`,
      );
    }
    const text = lines.join('\n');

    gaEvent({ action: 'timesheet_exported', params: { device: getDevice(), shifts: shifts.length, format: 'text' } });
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard', description: 'Paste your timesheet anywhere.' });
      offerSupport('copy');
    } catch {
      toast({ title: 'Copy this summary', description: text });
    }
  }, [saveName, shifts, ordered, totalMins, gross, rateNum, formatClock, otSplit, otMultiplier, offerSupport]);

  const handleDownloadCsv = useCallback(() => {
    const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const headers = ['Date', 'Start', 'End', 'Break (min)', 'Hours'];
    if (gross != null) headers.push('Pay ($)');

    const rows = ordered.map((s) => {
      const mins = shiftMinutes(s);
      const row = [
        toDateInputValue(s.date),
        formatClock(s.start),
        `${formatClock(s.end)}${isOvernight(s) ? ' (+1 day)' : ''}${dstLabel(s) ? ` (${dstLabel(s)})` : ''}`,
        String(s.breakMins),
        decimalHours(mins),
      ];
      if (gross != null) row.push(((mins / 60) * rateNum).toFixed(2));
      return row;
    });

    const totalRow = ['Total', '', '', '', decimalHours(totalMins)];
    if (gross != null) totalRow.push(gross.toFixed(2));

    // With the overtime split on, per-shift Pay stays at base rate while the
    // Total reflects overtime — these rows make the difference auditable.
    const otRows: string[][] = [];
    if (otSplit) {
      const reg = ['Regular', '', '', '', String(otSplit.regularHours)];
      const ot = [`Overtime (${otMultiplier}x)`, '', '', '', String(otSplit.overtimeHours)];
      if (otSplit.regularPay != null) reg.push(otSplit.regularPay.toFixed(2));
      if (otSplit.overtimePay != null) ot.push(otSplit.overtimePay.toFixed(2));
      otRows.push(reg, ot);
    }

    const csv = [headers, ...rows, ...otRows, totalRow].map((r) => r.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(saveName.trim() || 'timesheet').replace(/[^a-z0-9-_]+/gi, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    gaEvent({ action: 'timesheet_exported', params: { device: getDevice(), shifts: shifts.length, format: 'csv' } });
    toast({ title: 'CSV downloaded', description: 'Open it in Excel or Google Sheets.' });
    offerSupport('csv');
  }, [shifts, ordered, totalMins, gross, rateNum, saveName, formatClock, otSplit, otMultiplier, offerSupport]);

  return (
    <div className={className}>
      {/* Shifts (input) */}
      <div className="st-panel relative z-20 bg-card dark:bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border/50 dark:border-border/50 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground dark:text-foreground inline-flex items-center gap-1">
            Shifts
            <InfoTip label="saving">
              Saved automatically on this device, so your shifts are here when you come back. Nothing is uploaded.
            </InfoTip>
          </h2>
          <div className="flex bg-muted/50 dark:bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setIs24h(false)}
            aria-pressed={!is24h}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                !is24h ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              12h
            </button>
            <button
              onClick={() => setIs24h(true)}
            aria-pressed={is24h}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                is24h ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              24h
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {shifts.map((shift, i) => {
            const mins = shiftMinutes(shift);
            const overnight = isOvernight(shift);
            const fid = `ts-${shift.id}`;
            // A break as long as the shift (600 typed for 60) left 0 hours, silently
            const breakTooLong = shift.breakMins > 0 && shift.breakMins >= elapsedMinutes(shift) && elapsedMinutes(shift) > 0;
            return (
              // Phones: date across the top, then start and end side by side,
              // then break and hours (a shift was 417px tall; a week, 3,000)
              <div
                key={shift.id}
                className="relative rounded-xl border border-border/50 dark:border-border/50 bg-background/60 dark:bg-background/40 p-3 grid grid-cols-2 gap-x-2 gap-y-2 sm:flex sm:flex-row sm:flex-wrap sm:items-end"
              >
                <div className="col-span-2 pr-10 sm:pr-0 sm:w-48">
                  <label htmlFor={`${fid}-date`} className="block text-xs text-muted-foreground mb-1">Date</label>
                  <InlineDatePicker id={`${fid}-date`} ariaLabel={`Shift ${i + 1} date`} value={shift.date} onChange={(d) => updateShift(shift.id, { date: d })} startOnCalendar />
                </div>
                <div className="min-w-0 sm:flex-1">
                  <label htmlFor={`${fid}-start`} className="block text-xs text-muted-foreground mb-1">Start</label>
                  <InlineTimePicker id={`${fid}-start`} ariaLabel={`Shift ${i + 1} start time`} value={shift.start} onChange={(v) => updateShift(shift.id, { start: v })} is24h={is24h} />
                </div>
                <div className="min-w-0 sm:flex-1">
                  <label htmlFor={`${fid}-end`} className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    End
                    {overnight && <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">+1 day</span>}
                  </label>
                  <InlineTimePicker id={`${fid}-end`} ariaLabel={`Shift ${i + 1} end time`} value={shift.end} onChange={(v) => updateShift(shift.id, { end: v })} is24h={is24h} />
                </div>
                <div className="min-w-0 sm:w-24">
                  <label htmlFor={`${fid}-break`} className="block text-xs text-muted-foreground mb-1">Break (min)</label>
                  <BreakInput id={`${fid}-break`} value={shift.breakMins} onChange={(m) => updateShift(shift.id, { breakMins: m })} />
                </div>
                <div className="self-end sm:self-auto sm:w-20 sm:text-center">
                  <div className="text-xs text-muted-foreground mb-1 sm:mb-2">Hours</div>
                  <div className="font-bold tabular-nums text-primary"><RollingNumber value={decimalHours(mins)} /></div>
                  <div className="text-[11px] text-muted-foreground">{hhmm(mins)}</div>
                  {dstLabel(shift) && (
                    <div
                      className="text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                      title="The clocks changed during this shift, so the hours worked differ from the clock difference."
                    >
                      {dstLabel(shift)}
                    </div>
                  )}
                </div>
                {breakTooLong && (
                  <p role="status" className="col-span-2 sm:basis-full sm:order-last m-0 text-sm text-red-700 dark:text-red-300">
                    The break is as long as the shift, so it counts as 0 hours. Did you mean a shorter break?
                  </p>
                )}
                <button
                  onClick={() => removeShift(shift.id)}
                  aria-label={`Remove shift ${i + 1}`}
                  disabled={shifts.length === 1}
                  className="absolute top-2 right-2 sm:static sm:self-center shrink-0 p-2.5 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-muted/60 dark:hover:bg-muted/60 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={addShift}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border dark:border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add shift
        </button>

      </div>

      {/* Result (this is what export/share captures) */}
      <div className="st-panel relative z-10 bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-primary/30 dark:border-border/50">
        {/* Header: name + rate */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-foreground dark:text-foreground">
            {saveName.trim() || 'Summary'}
          </h2>
          <div className="flex items-center gap-1.5">
            <label htmlFor="ts-rate" className="text-xs text-muted-foreground">
              Rate
            </label>
            <div className="relative w-28">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                id="ts-rate"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={rateNote ? true : undefined}
                aria-describedby={rateNote ? 'ts-rate-note' : undefined}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className="w-full pl-6 pr-8 py-2 rounded-lg bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/h</span>
            </div>
          </div>
        </div>
        {rateNote && (
          <p id="ts-rate-note" role="status" className="-mt-1 mb-3 text-sm text-right text-red-700 dark:text-red-300">
            {rateNote}
          </p>
        )}

        {/* Optional weekly overtime split */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 text-sm">
          <label className="flex items-center gap-2 min-h-11 cursor-pointer select-none text-muted-foreground dark:text-muted-foreground">
            <input
              type="checkbox"
              checked={otEnabled}
              onChange={(e) => {
                setOtEnabled(e.target.checked);
                gaEvent({ action: 'timesheet_overtime_toggled', params: { enabled: e.target.checked } });
              }}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            Split overtime
          </label>
          {otEnabled && (
            <>
              <span className="text-muted-foreground dark:text-muted-foreground">after</span>
              <div className="relative w-20">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={otThreshold}
                  onChange={(e) => setOtThreshold(e.target.value)}
                  aria-label="Overtime threshold in hours"
                  className="w-full pl-2.5 pr-6 py-1.5 rounded-lg bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">h</span>
              </div>
              <span className="text-muted-foreground dark:text-muted-foreground">a week</span>
              <select
                value={otMultiplier}
                onChange={(e) => setOtMultiplier(Number(e.target.value))}
                aria-label="Overtime rate multiplier"
                className="py-1.5 px-2 rounded-lg bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value={1.5}>at 1.5×</option>
                <option value={2}>at 2×</option>
              </select>
              <Link
                href="/tools/overtime"
                className="text-xs text-muted-foreground dark:text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Overtime calculator
              </Link>
              {otSplit && otSplit.weeks > 1 && (
                <p className="basis-full text-xs text-muted-foreground dark:text-muted-foreground">
                  Worked out separately for each of the {otSplit.weeks} weeks (Sunday to Saturday), as US overtime law requires.
                </p>
              )}
            </>
          )}
        </div>

        {/* The answer on the line's board, as on every tool: the hours payroll
            wants, the same in hours and minutes, and the pay once there's a rate */}
        <div className="st-result st-ts-board mb-3" aria-live="polite">
          <div>
            <p className="st-figure text-5xl font-bold m-0">
              <RollingNumber value={decimalHours(totalMins)} />
            </p>
            <p className="text-sm mt-2 mb-0">
              hours ({hhmm(totalMins)}) across {ordered.length} {ordered.length === 1 ? 'shift' : 'shifts'}
            </p>
          </div>
          {gross != null && (
            <div>
              <p className="st-figure text-5xl font-bold m-0">
                $<RollingNumber value={gross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
              </p>
              <p className="text-sm mt-2 mb-0">
                gross pay{otSplit && otSplit.overtimeHours > 0 ? `, with ${otSplit.overtimeHours} h of overtime` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Breakdown — stacked cards on mobile */}
        <div className="sm:hidden space-y-2">
          {ordered.map((s) => {
            const mins = shiftMinutes(s);
            const pay = gross != null ? (mins / 60) * rateNum : null;
            return (
              <div
                key={s.id}
                className="rounded-xl border border-border/50 dark:border-border/50 bg-background/50 dark:bg-background/30 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{formatShiftDate(s.date)}</span>
                  <span className="tabular-nums font-semibold text-primary">
                    {decimalHours(mins)} h
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatClock(s.start)}–{formatClock(s.end)}
                  {isOvernight(s) && <span className="text-amber-600 dark:text-amber-400"> +1d</span>}
                  {dstLabel(s) && <span className="text-amber-600 dark:text-amber-400"> · {dstLabel(s)}</span>}
                  {' · '}
                  {s.breakMins} min break
                  {pay != null && <span className="text-foreground"> · ${pay.toFixed(2)}</span>}
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border-2 border-border dark:border-border bg-background/60 dark:bg-background/40 px-3 py-2.5 flex items-center justify-between font-bold">
            <span className="text-foreground dark:text-foreground">
              Total <span className="font-normal text-muted-foreground text-xs">({hhmm(totalMins)})</span>
            </span>
            <span className="tabular-nums text-primary">
              {decimalHours(totalMins)} h{gross != null && <span className="text-foreground"> · ${gross.toFixed(2)}</span>}
            </span>
          </div>
        </div>

        {/* Breakdown table (desktop) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50 dark:border-border/50 bg-background/50 dark:bg-background/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground border-b border-border/50 dark:border-border/50">
                <th className="text-left font-medium px-3 py-2">Date</th>
                <th className="text-left font-medium px-3 py-2">Shift</th>
                <th className="text-right font-medium px-3 py-2 whitespace-nowrap">Break</th>
                <th className="text-right font-medium px-3 py-2">Hours</th>
                {gross != null && <th className="text-right font-medium px-3 py-2">Pay</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 dark:divide-border/40">
              {ordered.map((s) => {
                const mins = shiftMinutes(s);
                const pay = gross != null ? (mins / 60) * rateNum : null;
                return (
                  <tr key={s.id} className="text-foreground">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{formatShiftDate(s.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatClock(s.start)}–{formatClock(s.end)}
                      {isOvernight(s) && <span className="text-amber-600 dark:text-amber-400 text-xs"> +1d</span>}
                      {dstLabel(s) && <span className="text-amber-600 dark:text-amber-400 text-xs"> · {dstLabel(s)}</span>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">
                      {s.breakMins} min
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-primary">
                      {decimalHours(mins)}
                    </td>
                    {pay != null && (
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">${pay.toFixed(2)}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border dark:border-border font-bold text-foreground dark:text-foreground">
                <td className="px-3 py-2.5" colSpan={2}>
                  Total <span className="font-normal text-muted-foreground text-xs">({hhmm(totalMins)})</span>
                </td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-right tabular-nums text-primary text-base">
                  <RollingNumber value={decimalHours(totalMins)} />
                </td>
                {gross != null && (
                  <td className="px-3 py-2.5 text-right tabular-nums text-base">${gross.toFixed(2)}</td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Overtime split summary — per workweek, not per shift */}
        {otSplit && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-left">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-muted-foreground dark:text-muted-foreground">
                Regular{' '}
                <strong className="text-foreground tabular-nums">{otSplit.regularHours} h</strong>
                {otSplit.regularPay != null && (
                  <span className="tabular-nums"> · ${otSplit.regularPay.toFixed(2)}</span>
                )}
              </span>
              <span className="text-muted-foreground dark:text-muted-foreground">
                Overtime{' '}
                <strong className="text-primary tabular-nums">
                  {otSplit.overtimeHours} h
                </strong>{' '}
                at {otMultiplier}×
                {otSplit.overtimePay != null && (
                  <span className="tabular-nums"> · ${otSplit.overtimePay.toFixed(2)}</span>
                )}
              </span>
            </div>
            {otSplit.overtimeHours > 0 && gross != null && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                Per-shift pay above uses the base rate — overtime is applied to each week’s total.
              </p>
            )}
          </div>
        )}

        {/* Name + actions */}
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="w-56 text-left">
            <label htmlFor="ts-name" className="block text-xs text-muted-foreground mb-1">Name this timesheet</label>
            <input
              id="ts-name"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Pay period 1"
              maxLength={40}
              className="w-full px-3 py-2.5 rounded-lg bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow transition-all duration-200"
          >
            Save
          </button>
          {/* Secondary: outlined — Save is the single primary in this row */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card dark:bg-muted hover:bg-muted dark:hover:bg-muted text-foreground font-medium rounded-lg border border-border/50 dark:border-border shadow transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card dark:bg-muted hover:bg-muted dark:hover:bg-muted text-foreground font-medium rounded-lg border border-border/50 dark:border-border shadow transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card dark:bg-muted hover:bg-muted dark:hover:bg-muted text-foreground font-medium rounded-lg border border-border/50 dark:border-border shadow transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            CSV
          </button>
        </div>

        {supportNudge && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/50 dark:border-border/50 bg-muted/40 dark:bg-background/40 px-3 py-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Saved you some time?{' '}
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => gaEvent({ action: 'support_nudge_click', params: { tool: 'timesheet', device: getDevice() } })}
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Buy me a coffee
                </a>
              </span>
            </p>
            <button
              onClick={dismissSupport}
              aria-label="Dismiss"
              className="shrink-0 p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Saved timesheets */}
      {saved.length > 0 && (
        <div className="st-panel relative z-0 mt-6 bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50">
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">
            Saved timesheets
          </h3>
          <ul className="space-y-2">
            {saved.map((t) => {
              const mins = t.shifts.reduce((sum, s) => sum + shiftMinutes(s), 0);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl border border-border/50 dark:border-border/50 bg-background/60 dark:bg-background/40 px-3 sm:px-4 py-2.5"
                >
                  <button onClick={() => loadSaved(t)} className="flex-1 text-left min-w-0">
                    <span className="block font-medium text-foreground truncate">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.shifts.length} shift{t.shifts.length !== 1 ? 's' : ''} · {decimalHours(mins)} h
                    </span>
                  </button>
                  <button
                    onClick={() => loadSaved(t)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/60 dark:bg-muted/60 hover:bg-muted dark:hover:bg-muted text-foreground transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => shareSaved(t)}
                    aria-label={`Share ${t.name}`}
                    className="shrink-0 p-2.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted/60 dark:hover:bg-muted/60 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteSaved(t.id)}
                    aria-label={`Delete ${t.name}`}
                    className="shrink-0 p-2.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted/60 dark:hover:bg-muted/60 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
