'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { event as gaEvent } from '@/lib/gtag';
import { InlineTimePicker } from '@/components/ui/InlineTimePicker';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';

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

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches
    ? 'mobile'
    : 'desktop';

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

const shiftMinutes = (shift: { start: string; end: string; breakMins: number }): number => {
  const s = toMinutes(shift.start);
  const e = toMinutes(shift.end);
  if (s == null || e == null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 1440; // overnight
  diff -= shift.breakMins || 0;
  return Math.max(0, diff);
};

const decimalHours = (mins: number): string => (mins / 60).toFixed(2);
const hhmm = (mins: number): string => `${Math.floor(mins / 60)}h ${mins % 60}m`;

const newShift = (id: string, date: Date): Shift => ({ id, date, start: '09:00:00', end: '17:00:00', breakMins: 30 });

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
    const doc = JSON.parse(decodeURIComponent(param)) as ShareDoc;
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
  const [shifts, setShifts] = useState<Shift[]>([newShift('row-1', new Date(2025, 0, 1))]);
  const [is24h, setIs24h] = useState(true);
  const [rate, setRate] = useState('');
  const [saved, setSaved] = useState<SavedTimesheet[]>([]);
  const [saveName, setSaveName] = useState('');
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
      setLoaded(true);
      return;
    }

    let restored = false;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d: { shifts?: SavedShift[]; rate?: string; name?: string } = JSON.parse(raw);
        if (d && Array.isArray(d.shifts) && d.shifts.length) {
          setShifts(d.shifts.map(deserializeShift));
          setRate(d.rate || '');
          setSaveName(d.name || '');
          setSeq(d.shifts.length + 2);
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
        JSON.stringify({ shifts: shifts.map(serializeShift), rate, name: saveName }),
      );
    } catch {
      /* ignore */
    }
  }, [loaded, shifts, rate, saveName]);

  const totalMins = useMemo(() => shifts.reduce((sum, s) => sum + shiftMinutes(s), 0), [shifts]);

  const rateNum = parseFloat(rate);
  const gross = rate.trim() && !Number.isNaN(rateNum) && rateNum > 0 ? (totalMins / 60) * rateNum : null;

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

  const addShift = useCallback(() => {
    setShifts((prev) => {
      const last = prev[prev.length - 1];
      const next = last ? new Date(last.date) : new Date();
      next.setDate(next.getDate() + 1);
      return [...prev, newShift(`row-${seq}`, next)];
    });
    setSeq((n) => n + 1);
  }, [seq]);

  const updateShift = useCallback((id: string, patch: Partial<Shift>) => {
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeShift = useCallback((id: string) => {
    setShifts((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }, []);

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

  const handleShare = useCallback(() => {
    gaEvent({ action: 'timesheet_shared', params: { device: getDevice(), shifts: shifts.length } });
    shareOrCopy(shareUrlFor(saveName, rate, shifts), saveName.trim() || 'Timesheet');
  }, [saveName, rate, shifts]);

  const shareSaved = useCallback((t: SavedTimesheet) => {
    const url = shareUrlFor(t.name, t.rate, t.shifts.map(deserializeShift));
    gaEvent({ action: 'timesheet_shared', params: { device: getDevice(), shifts: t.shifts.length } });
    shareOrCopy(url, t.name);
  }, []);

  const handleExport = useCallback(async () => {
    const lines: string[] = [];
    lines.push(`Timesheet${saveName.trim() ? ` — ${saveName.trim()}` : ''}`);
    shifts.forEach((s) => {
      const mins = shiftMinutes(s);
      const oc = isOvernight(s) ? ' (+1 day)' : '';
      lines.push(
        `${formatShiftDate(s.date)}: ${formatClock(s.start)}–${formatClock(s.end)}${oc} (−${s.breakMins}m) = ${decimalHours(mins)} h`,
      );
    });
    lines.push(`Total: ${decimalHours(totalMins)} h (${hhmm(totalMins)})`);
    if (gross != null) lines.push(`Gross: $${gross.toFixed(2)} (at $${rateNum.toFixed(2)}/h)`);
    const text = lines.join('\n');

    gaEvent({ action: 'timesheet_exported', params: { device: getDevice(), shifts: shifts.length, format: 'text' } });
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard', description: 'Paste your timesheet anywhere.' });
    } catch {
      toast({ title: 'Copy this summary', description: text });
    }
  }, [saveName, shifts, totalMins, gross, rateNum, formatClock]);

  const handleDownloadCsv = useCallback(() => {
    const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const headers = ['Date', 'Start', 'End', 'Break (min)', 'Hours'];
    if (gross != null) headers.push('Pay ($)');

    const rows = shifts.map((s) => {
      const mins = shiftMinutes(s);
      const row = [
        toDateInputValue(s.date),
        formatClock(s.start),
        `${formatClock(s.end)}${isOvernight(s) ? ' (+1 day)' : ''}`,
        String(s.breakMins),
        decimalHours(mins),
      ];
      if (gross != null) row.push(((mins / 60) * rateNum).toFixed(2));
      return row;
    });

    const totalRow = ['Total', '', '', '', decimalHours(totalMins)];
    if (gross != null) totalRow.push(gross.toFixed(2));

    const csv = [headers, ...rows, totalRow].map((r) => r.map(csvEscape).join(',')).join('\r\n');
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
  }, [shifts, totalMins, gross, rateNum, saveName, formatClock]);

  return (
    <div className={className}>
      {/* Shifts (input) */}
      <div className="relative z-20 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-border/50 dark:border-slate-700/50 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground dark:text-slate-200 uppercase tracking-wide">Shifts</h2>
          <div className="flex bg-muted/50 dark:bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setIs24h(false)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                !is24h ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              12h
            </button>
            <button
              onClick={() => setIs24h(true)}
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
            return (
              <div
                key={shift.id}
                className="rounded-xl border border-border/50 dark:border-slate-700/50 bg-background/60 dark:bg-slate-900/40 p-3 flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="sm:w-36">
                  <label className="block text-xs text-muted-foreground mb-1">Date</label>
                  <InlineDatePicker value={shift.date} onChange={(d) => updateShift(shift.id, { date: d })} startOnCalendar />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-muted-foreground mb-1">Start</label>
                  <InlineTimePicker value={shift.start} onChange={(v) => updateShift(shift.id, { start: v })} is24h={is24h} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    End
                    {overnight && <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">+1 day</span>}
                  </label>
                  <InlineTimePicker value={shift.end} onChange={(v) => updateShift(shift.id, { end: v })} is24h={is24h} />
                </div>
                <div className="sm:w-24">
                  <label className="block text-xs text-muted-foreground mb-1">Break (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={shift.breakMins}
                    onChange={(e) => updateShift(shift.id, { breakMins: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="sm:w-20 text-center">
                  <div className="text-xs text-muted-foreground mb-1 sm:mb-2">Hours</div>
                  <div className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{decimalHours(mins)}</div>
                  <div className="text-[11px] text-muted-foreground">{hhmm(mins)}</div>
                </div>
                <button
                  onClick={() => removeShift(shift.id)}
                  aria-label={`Remove shift ${i + 1}`}
                  disabled={shifts.length === 1}
                  className="shrink-0 self-center p-2.5 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-muted/60 dark:hover:bg-slate-700/60 transition-colors"
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
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border dark:border-slate-600 text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add shift
        </button>

        <p className="mt-3 text-xs text-muted-foreground/80 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved automatically on this device — your shifts are here when you come back.
        </p>
      </div>

      {/* Result (this is what export/share captures) */}
      <div className="relative z-10 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-xl border border-emerald-100 dark:border-slate-700/50">
        {/* Header: name + rate */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-foreground dark:text-slate-100">
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
                type="number"
                min={0}
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className="w-full pl-6 pr-8 py-2 rounded-lg bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/h</span>
            </div>
          </div>
        </div>

        {/* Breakdown — stacked cards on mobile */}
        <div className="sm:hidden space-y-2">
          {shifts.map((s) => {
            const mins = shiftMinutes(s);
            const pay = gross != null ? (mins / 60) * rateNum : null;
            return (
              <div
                key={s.id}
                className="rounded-xl border border-border/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/30 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{formatShiftDate(s.date)}</span>
                  <span className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {decimalHours(mins)} h
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatClock(s.start)}–{formatClock(s.end)}
                  {isOvernight(s) && <span className="text-amber-600 dark:text-amber-400"> +1d</span>}
                  {' · '}
                  {s.breakMins} min break
                  {pay != null && <span className="text-foreground"> · ${pay.toFixed(2)}</span>}
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border-2 border-border dark:border-slate-600 bg-white/60 dark:bg-slate-900/40 px-3 py-2.5 flex items-center justify-between font-bold">
            <span className="text-foreground dark:text-slate-100">
              Total <span className="font-normal text-muted-foreground text-xs">({hhmm(totalMins)})</span>
            </span>
            <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
              {decimalHours(totalMins)} h{gross != null && <span className="text-foreground"> · ${gross.toFixed(2)}</span>}
            </span>
          </div>
        </div>

        {/* Breakdown table (desktop) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/50 dark:border-slate-700/50">
                <th className="text-left font-medium px-3 py-2">Date</th>
                <th className="text-left font-medium px-3 py-2">Shift</th>
                <th className="text-right font-medium px-3 py-2 whitespace-nowrap">Break</th>
                <th className="text-right font-medium px-3 py-2">Hours</th>
                {gross != null && <th className="text-right font-medium px-3 py-2">Pay</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 dark:divide-slate-700/40">
              {shifts.map((s) => {
                const mins = shiftMinutes(s);
                const pay = gross != null ? (mins / 60) * rateNum : null;
                return (
                  <tr key={s.id} className="text-foreground">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{formatShiftDate(s.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatClock(s.start)}–{formatClock(s.end)}
                      {isOvernight(s) && <span className="text-amber-600 dark:text-amber-400 text-xs"> +1d</span>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">
                      {s.breakMins} min
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
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
              <tr className="border-t-2 border-border dark:border-slate-600 font-bold text-foreground dark:text-slate-100">
                <td className="px-3 py-2.5" colSpan={2}>
                  Total <span className="font-normal text-muted-foreground text-xs">({hhmm(totalMins)})</span>
                </td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400 text-base">
                  {decimalHours(totalMins)}
                </td>
                {gross != null && (
                  <td className="px-3 py-2.5 text-right tabular-nums text-base">${gross.toFixed(2)}</td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

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
              className="w-full px-3 py-2.5 rounded-lg bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium rounded-lg shadow transition-all duration-200"
          >
            Save
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium rounded-lg shadow transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card dark:bg-slate-700 hover:bg-muted dark:hover:bg-slate-600 text-foreground font-medium rounded-lg border border-border/50 dark:border-slate-600 shadow transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card dark:bg-slate-700 hover:bg-muted dark:hover:bg-slate-600 text-foreground font-medium rounded-lg border border-border/50 dark:border-slate-600 shadow transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* Saved timesheets */}
      {saved.length > 0 && (
        <div className="relative z-0 mt-6 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-foreground dark:text-slate-200 uppercase tracking-wide mb-3">
            Saved timesheets
          </h3>
          <ul className="space-y-2">
            {saved.map((t) => {
              const mins = t.shifts.reduce((sum, s) => sum + shiftMinutes(s), 0);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl border border-border/50 dark:border-slate-700/50 bg-background/60 dark:bg-slate-900/40 px-3 sm:px-4 py-2.5"
                >
                  <button onClick={() => loadSaved(t)} className="flex-1 text-left min-w-0">
                    <span className="block font-medium text-foreground truncate">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.shifts.length} shift{t.shifts.length !== 1 ? 's' : ''} · {decimalHours(mins)} h
                    </span>
                  </button>
                  <button
                    onClick={() => loadSaved(t)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/60 dark:bg-slate-700/60 hover:bg-muted dark:hover:bg-slate-700 text-foreground transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => shareSaved(t)}
                    aria-label={`Share ${t.name}`}
                    className="shrink-0 p-2.5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-muted/60 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteSaved(t.id)}
                    aria-label={`Delete ${t.name}`}
                    className="shrink-0 p-2.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted/60 dark:hover:bg-slate-700/60 transition-colors"
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
