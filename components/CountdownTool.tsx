'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { intervalToDuration, formatDistance } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { event as gaEvent } from '@/lib/gtag';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { InlineTimePicker } from '@/components/ui/InlineTimePicker';

// Curated event countdowns (each is its own SEO landing page).
const POPULAR_COUNTDOWNS: Array<{ title: string; href: string; note: string }> = [
  { title: 'GTA 6 Release', href: '/countdown/gta-6/', note: 'November 19, 2026' },
];

interface CountdownToolProps {
  className?: string;
}

interface SavedCountdown {
  id: string;
  title: string;
  to: string; // local wall-clock "YYYY-MM-DDTHH:MM"
}

interface ActiveCountdown {
  ms: number;
  title: string;
}

const SAVED_KEY = 'clockmath-saved-countdowns';

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

// Local wall-clock string "YYYY-MM-DDTHH:MM" from a Date.
const toWallClock = (date: Date): string =>
  `${toDateInputValue(date)}T${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;

const nextOccurrence = (month0: number, day: number): Date => {
  const now = new Date();
  let d = new Date(now.getFullYear(), month0, day);
  if (d.getTime() <= now.getTime()) d = new Date(now.getFullYear() + 1, month0, day);
  return d;
};

const nextSaturday = (): Date => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const add = (6 - d.getDay() + 7) % 7 || 7; // upcoming Saturday (never today)
  d.setDate(d.getDate() + add);
  return d;
};

const QUICK_PICKS: Array<{ label: string; build: () => { date: Date; title: string } }> = [
  { label: 'New Year', build: () => ({ date: nextOccurrence(0, 1), title: 'New Year' }) },
  { label: "Valentine's", build: () => ({ date: nextOccurrence(1, 14), title: "Valentine's Day" }) },
  { label: 'Halloween', build: () => ({ date: nextOccurrence(9, 31), title: 'Halloween' }) },
  { label: 'Christmas', build: () => ({ date: nextOccurrence(11, 25), title: 'Christmas' }) },
  { label: 'Weekend', build: () => ({ date: nextSaturday(), title: 'The weekend' }) },
];

export function CountdownTool({ className = '' }: CountdownToolProps) {
  // Draft inputs (the form) — only committed to `active` on Start countdown.
  const [dateValue, setDateValue] = useState<Date>(() => new Date(2025, 0, 1));
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [title, setTitle] = useState('');
  const [is24h, setIs24h] = useState(true);

  // The live countdown being displayed.
  const [active, setActive] = useState<ActiveCountdown | null>(null);

  const [nowMs, setNowMs] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [userTz, setUserTz] = useState('');
  const [saved, setSaved] = useState<SavedCountdown[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Compute a target timestamp from the current draft inputs.
  const draftTargetMs = useMemo(() => {
    if (!dateValue || Number.isNaN(dateValue.getTime())) return NaN;
    const [h, m] = (timeStr || '0:0').split(':').map((n) => parseInt(n, 10));
    return new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
      Number.isNaN(h) ? 0 : h,
      Number.isNaN(m) ? 0 : m,
      0,
      0,
    ).getTime();
  }, [dateValue, timeStr]);

  // On mount: detect timezone, load saved, hydrate from a shared link, else
  // default to a (titleless) live New Year countdown.
  useEffect(() => {
    try {
      setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch {
      /* ignore */
    }

    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (raw) {
        const parsed: SavedCountdown[] = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed.filter((s) => s && s.to));
      }
    } catch {
      /* ignore */
    }

    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    const sharedTitle = params.get('title');
    const parsed = to ? new Date(to) : null;

    if (parsed && !Number.isNaN(parsed.getTime())) {
      setDateValue(parsed);
      setTimeStr(
        `${`${parsed.getHours()}`.padStart(2, '0')}:${`${parsed.getMinutes()}`.padStart(2, '0')}:00`,
      );
      if (sharedTitle) setTitle(sharedTitle);
      setActive({ ms: parsed.getTime(), title: sharedTitle?.trim() || '' });
      gaEvent({
        action: 'countdown_opened_from_link',
        params: { device: getDevice(), has_title: Boolean(sharedTitle) },
      });
    } else {
      // No active countdown yet — show zeros until the user starts one.
      setDateValue(new Date());
      setTimeStr('00:00:00');
      setTitle('');
    }

    setNowMs(Date.now());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mounted]);

  const activeMs = active?.ms ?? NaN;
  const isPast = mounted && !Number.isNaN(activeMs) && activeMs < nowMs;

  // Calendar-aware breakdown of the ACTIVE countdown.
  const tiles = useMemo<Array<{ label: string; value: number }>>(() => {
    // No active countdown: show a ready row of zeros.
    if (Number.isNaN(activeMs)) {
      return [
        { label: 'Days', value: 0 },
        { label: 'Hours', value: 0 },
        { label: 'Minutes', value: 0 },
        { label: 'Seconds', value: 0 },
      ];
    }
    const start = isPast ? activeMs : nowMs;
    const end = isPast ? nowMs : activeMs;
    const d = intervalToDuration({ start, end });
    const years = d.years ?? 0;
    const months = d.months ?? 0;
    const list: Array<{ label: string; value: number }> = [];
    if (years > 0) list.push({ label: 'Years', value: years });
    if (years > 0 || months > 0) list.push({ label: 'Months', value: months });
    list.push({ label: 'Days', value: d.days ?? 0 });
    list.push({ label: 'Hours', value: d.hours ?? 0 });
    list.push({ label: 'Minutes', value: d.minutes ?? 0 });
    list.push({ label: 'Seconds', value: d.seconds ?? 0 });
    return list;
  }, [activeMs, nowMs, isPast]);

  const targetLabel = useMemo(() => {
    if (Number.isNaN(activeMs)) return '';
    return new Date(activeMs).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [activeMs]);

  const activeTitle = active?.title.trim() ?? '';

  const startCountdown = useCallback(() => {
    if (!title.trim()) {
      toast({
        title: 'Name your countdown',
        description: 'Please enter what you’re counting down to before starting.',
        variant: 'destructive',
      });
      titleInputRef.current?.focus();
      return;
    }
    if (Number.isNaN(draftTargetMs)) return;
    setActive({ ms: draftTargetMs, title: title.trim() });
    gaEvent({
      action: 'countdown_created',
      params: { device: getDevice(), has_title: true },
    });
  }, [draftTargetMs, title]);

  const handleClear = useCallback(() => {
    setTitle('');
    setDateValue(new Date());
    setTimeStr('00:00:00');
    setActive(null);
    titleInputRef.current?.focus();
  }, []);

  const handleQuickPick = useCallback((date: Date, presetTitle: string, label: string) => {
    setDateValue(date);
    setTimeStr('00:00:00');
    setTitle(presetTitle);
    const ms = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
    setActive({ ms, title: presetTitle });
    gaEvent({ action: 'countdown_preset', params: { preset: label, device: getDevice() } });
  }, []);

  const buildShareUrl = useCallback(() => {
    if (!active) return '';
    const params = new URLSearchParams();
    params.set('to', toWallClock(new Date(active.ms)));
    if (active.title.trim()) params.set('title', active.title.trim());
    return `${window.location.origin}/tools/countdown/?${params.toString()}`;
  }, [active]);

  const handleShare = useCallback(async () => {
    if (!active) return;
    const url = buildShareUrl();
    gaEvent({
      action: 'countdown_shared',
      params: { device: getDevice(), has_title: Boolean(active.title.trim()) },
    });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: active.title.trim() || 'Countdown', url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Share your countdown anywhere.' });
    } catch {
      toast({ title: 'Copy this link', description: url });
    }
  }, [active, buildShareUrl]);

  const persistSaved = useCallback((next: SavedCountdown[]) => {
    setSaved(next);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!active) return;
    const to = toWallClock(new Date(active.ms));
    const savedTitle = active.title.trim() || 'Untitled countdown';
    const entry: SavedCountdown = { id: `${nowMs}-${to}-${savedTitle}`, title: savedTitle, to };
    const next = [entry, ...saved.filter((s) => !(s.to === to && s.title === savedTitle))].slice(0, 12);
    persistSaved(next);
    gaEvent({ action: 'countdown_saved', params: { device: getDevice(), has_title: Boolean(active.title.trim()) } });
    toast({ title: 'Countdown saved', description: 'Find it below under “Saved countdowns”.' });
  }, [active, saved, nowMs, persistSaved]);

  const loadSaved = useCallback((item: SavedCountdown) => {
    const d = new Date(item.to);
    if (Number.isNaN(d.getTime())) return;
    setDateValue(d);
    setTimeStr(`${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}:00`);
    const loadedTitle = item.title === 'Untitled countdown' ? '' : item.title;
    setTitle(loadedTitle);
    setActive({ ms: d.getTime(), title: loadedTitle });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deleteSaved = useCallback(
    (id: string) => persistSaved(saved.filter((s) => s.id !== id)),
    [saved, persistSaved],
  );

  return (
    <div className={className}>
      {/* Countdown display — only shown once a countdown is active */}
      {active && (
      <div className="relative z-10 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-100 dark:border-slate-700/50 text-center mb-6">
        {activeTitle && (
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-1">
            {isPast ? 'Since' : 'Until'} {activeTitle}
          </h2>
        )}
        {targetLabel && (
          <p className="text-sm text-muted-foreground dark:text-slate-400 mb-1">{targetLabel}</p>
        )}
        {active && userTz ? (
          <p className="text-xs text-muted-foreground/80 dark:text-slate-500 mb-6">
            Based on your time zone ({userTz})
          </p>
        ) : (
          !active && (
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">
              Name your countdown and pick a date, then press Start countdown.
            </p>
          )
        )}

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {tiles.map((unit) => (
            <div
              key={unit.label}
              className="flex-1 min-w-[64px] max-w-[120px] bg-white dark:bg-slate-900/60 rounded-xl py-4 sm:py-5 border border-slate-200 dark:border-slate-700/60 shadow-sm"
            >
              <div className="text-2xl sm:text-4xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                {unit.value.toLocaleString()}
              </div>
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
        {active && isPast && (
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-4">
            This date has already passed.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={handleShare}
            disabled={!active}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-medium rounded-xl shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </button>
          <button
            onClick={handleSave}
            disabled={!active}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white font-medium rounded-xl shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h8.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5z M9 3v4h6V3 M9 21v-6h6v6"
              />
            </svg>
            Save
          </button>
        </div>
      </div>
      )}

      {/* Configuration */}
      <div className="relative z-20 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 dark:border-slate-700/50">
        <div className="mb-4">
          <label htmlFor="cd-title" className="block text-sm font-medium text-foreground mb-1.5">
            What are you counting down to?
          </label>
          <input
            id="cd-title"
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My vacation, Exam day, New Year"
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-xl bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Target date &amp; time</label>
          <div className="flex bg-muted/50 dark:bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setIs24h(false)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                !is24h
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              12h
            </button>
            <button
              onClick={() => setIs24h(true)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                is24h
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              24h
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <InlineDatePicker value={dateValue} onChange={setDateValue} placeholder="Select date" startOnCalendar />
          </div>
          <div className="flex-1">
            <InlineTimePicker value={timeStr} onChange={setTimeStr} is24h={is24h} placeholder="Time" />
          </div>
        </div>

        {/* Commit the draft inputs — the countdown only updates on click. */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={startCountdown}
            disabled={Number.isNaN(draftTargetMs)}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Start countdown
          </button>
          <button
            onClick={handleClear}
            className="px-5 py-4 bg-muted dark:bg-slate-700 hover:bg-muted/80 dark:hover:bg-slate-600 text-foreground font-medium rounded-xl border border-border/50 dark:border-slate-600 transition-all duration-200"
          >
            Clear
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Quick pick:</span>
          {QUICK_PICKS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                const { date, title: t } = p.build();
                handleQuickPick(date, t, p.label);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-muted/60 dark:bg-slate-700/60 hover:bg-muted dark:hover:bg-slate-700 text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Saved countdowns */}
      {saved.length > 0 && (
        <div className="relative z-0 mt-6 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-foreground dark:text-slate-200 uppercase tracking-wide mb-3">
            Saved countdowns
          </h3>
          <ul className="space-y-2">
            {saved.map((item) => {
              const d = new Date(item.to);
              const valid = !Number.isNaN(d.getTime());
              const label = valid
                ? d.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : item.to;
              const itemPast = valid && d.getTime() < nowMs;
              const relative = valid ? formatDistance(d, new Date(nowMs || Date.now()), { addSuffix: true }) : '';
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 dark:border-slate-700/50 bg-background/60 dark:bg-slate-900/40 px-3 sm:px-4 py-3"
                >
                  <button onClick={() => loadSaved(item)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <span
                      className={`shrink-0 grid place-items-center w-9 h-9 rounded-lg ${
                        itemPast
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 2h12M6 22h12M8 2v3a4 4 0 004 4 4 4 0 004-4V2M8 22v-3a4 4 0 014-4 4 4 0 014 4v3"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground truncate">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{label}</span>
                    </span>
                  </button>
                  {relative && (
                    <span
                      className={`hidden sm:inline-block shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        itemPast
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {relative}
                    </span>
                  )}
                  <button
                    onClick={() => deleteSaved(item.id)}
                    aria-label={`Delete ${item.title}`}
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

      {/* Popular countdowns */}
      <div className="relative z-0 mt-6 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 dark:border-slate-700/50">
        <h3 className="text-sm font-semibold text-foreground dark:text-slate-200 uppercase tracking-wide mb-3">
          Popular countdowns
        </h3>
        <ul className="space-y-2">
          {POPULAR_COUNTDOWNS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 dark:border-slate-700/50 bg-background/60 dark:bg-slate-900/40 px-4 py-2.5 hover:border-primary/50 hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-foreground truncate">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.note}</span>
                </span>
                <svg className="w-4 h-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
