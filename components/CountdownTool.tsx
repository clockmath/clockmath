'use client';

/**
 * CountdownTool: name a date, press Start countdown, share or save it.
 *
 * Oct 2026 audit: the form opened on today at 12:00 AM, which had always
 * passed, so pressing Start showed "… has passed"; it now opens on 9:00 AM
 * tomorrow and a past time says so under the fields. Shared links read a
 * bare date as local midnight (lib/wallClock.ts), an unreadable link says
 * so, the board fades when the fields no longer match it, the name is
 * optional (as the page's FAQ always said), and Enter starts the countdown.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClockFormat } from '@/hooks/use-clock-format';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { event as gaEvent, toolUsed } from '@/lib/gtag';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { InlineTimePicker } from '@/components/ui/InlineTimePicker';
import { StationBoard } from '@/components/station/StationBoard';
import { EmbedCode } from '@/components/embed/EmbedCode';
import { buildDay } from '@/lib/buildDay';
import { getDevice } from '@/lib/device';
import { copyText } from '@/lib/clipboard';
import { parseWallClock, toWallClock } from '@/lib/wallClock';
import { useCalculateFeedback } from '@/hooks/use-answer-feedback';

// Curated event countdowns (each is its own SEO landing page).
const POPULAR_COUNTDOWNS: Array<{ title: string; href: string; note: string }> = [
  { title: 'All holidays', href: '/countdown/holidays/', note: 'Every upcoming holiday, with days left' },
  { title: 'Weekend', href: '/countdown/weekend/', note: 'Every Saturday' },
  { title: 'Christmas', href: '/countdown/christmas/', note: 'December 25' },
  { title: 'New Year', href: '/countdown/new-year/', note: 'January 1' },
  { title: "Valentine's Day", href: '/countdown/valentines-day/', note: 'February 14' },
  { title: 'Super Bowl', href: '/countdown/super-bowl/', note: 'Super Bowl LXI, Feb 14, 2027' },
  { title: 'Lunar New Year', href: '/countdown/lunar-new-year/', note: 'Feb 6, 2027' },
  { title: 'Easter', href: '/countdown/easter/', note: 'March 28, 2027' },
  { title: 'Halloween', href: '/countdown/halloween/', note: 'October 31' },
  { title: 'Thanksgiving', href: '/countdown/thanksgiving/', note: '4th Thursday in November' },
  { title: 'Black Friday', href: '/countdown/black-friday/', note: 'Day after Thanksgiving' },
  { title: 'Hanukkah', href: '/countdown/hanukkah/', note: 'Begins at sundown, Dec 4, 2026' },
  { title: 'Clocks change', href: '/countdown/daylight-saving-time/', note: 'Next clock change' },
  { title: '4th of July', href: '/countdown/july-4th/', note: 'July 4' },
  { title: 'Canada Day', href: '/countdown/canada-day/', note: 'July 1' },
  { title: 'Retirement', href: '/countdown/retirement/', note: 'Your date' },
  { title: 'Avengers: Doomsday', href: '/countdown/avengers-doomsday/', note: 'December 18, 2026' },
  { title: 'GTA 6', href: '/countdown/gta-6/', note: 'November 19, 2026' },
  { title: '2027 solar eclipse', href: '/countdown/solar-eclipse-2027/', note: 'August 2, 2027' },
  { title: '2028 annular eclipse', href: '/countdown/annular-eclipse-2028/', note: 'January 26, 2028' },
  { title: '2028 solar eclipse', href: '/countdown/solar-eclipse-2028/', note: 'July 22, 2028' },
  { title: 'LA 2028 Olympics', href: '/countdown/olympics-2028/', note: 'July 14, 2028' },
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

/** Where the form starts: 9:00 AM tomorrow (today at 12:00 AM had always passed) */
const tomorrow = (from: Date) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
const DEFAULT_TIME = '09:00:00';
/** The time picker's "HH:MM:SS" for a Date */
const timeValue = (d: Date) => `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}:00`;

// Board colours offered for an embedded countdown (each >= 4.5:1 with the
// numerals the embed picks for it).
const EMBED_COLORS = [
  { name: 'Blue', hex: '#1849a9' },
  { name: 'Rust', hex: '#b5541c' },
  { name: 'Pine', hex: '#1f5f3f' },
  { name: 'Crimson', hex: '#a3123a' },
  { name: 'Black', hex: '#000000' },
  { name: 'Sun', hex: '#f3c64a' },
];

export function CountdownTool({ className = '' }: CountdownToolProps) {
  // Draft inputs (the form) — only committed to `active` on Start countdown.
  const [dateValue, setDateValue] = useState<Date>(() => tomorrow(buildDay()));
  const [timeStr, setTimeStr] = useState(DEFAULT_TIME);
  const [title, setTitle] = useState('');
  const [is24h, setIs24h] = useClockFormat();

  // The live countdown being displayed.
  const [active, setActive] = useState<ActiveCountdown | null>(null);

  const [nowMs, setNowMs] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [userTz, setUserTz] = useState('');
  const [saved, setSaved] = useState<SavedCountdown[]>([]);
  // Said under the fields when a shared link's date can't be read
  const [linkNote, setLinkNote] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  // Start countdown shows it worked, even for the same date: the board's
  // tiles flip again, the button says so, and the board comes into view
  const boardRef = useRef<HTMLDivElement>(null);
  const { round, updated, confirm } = useCalculateFeedback(boardRef);
  const toolUsedRef = useRef(false);

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
    const sharedTitle = params.get('title')?.trim().slice(0, 80) || '';
    const parsed = parseWallClock(to);

    if (parsed) {
      // To the minute, as the time field holds it, so the board and the
      // fields agree (a link's seconds would mark the board as changed)
      parsed.setSeconds(0, 0);
      setDateValue(parsed);
      setTimeStr(timeValue(parsed));
      setTitle(sharedTitle);
      setActive({ ms: parsed.getTime(), title: sharedTitle });
      gaEvent({
        action: 'countdown_opened_from_link',
        params: { device: getDevice(), has_title: Boolean(sharedTitle) },
      });
    } else {
      // No active countdown yet: the board appears when one is started
      setDateValue(tomorrow(new Date()));
      setTimeStr(DEFAULT_TIME);
      setTitle(sharedTitle);
      if (to) setLinkNote('This link’s date couldn’t be read. Pick the date below and press Start countdown.');
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

  // The board shows the date; the time it counts to goes in its note.
  const targetTime = useMemo(() => {
    if (Number.isNaN(activeMs)) return '';
    return new Date(activeMs).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: !is24h });
  }, [activeMs, is24h]);

  const activeTitle = active?.title.trim() ?? '';

  // A countdown to a time already gone is only ever "… has passed"
  const draftPast = mounted && !Number.isNaN(draftTargetMs) && draftTargetMs <= nowMs;
  // The fields no longer match the board: it fades until Start is pressed
  const stale = !!active && (draftTargetMs !== active.ms || title.trim() !== activeTitle);

  const startCountdown = useCallback(() => {
    if (Number.isNaN(draftTargetMs)) return;
    if (draftTargetMs <= Date.now()) {
      // The note under the fields says why
      document.getElementById('cd-date')?.focus();
      return;
    }
    setLinkNote(null);
    setActive({ ms: draftTargetMs, title: title.trim() });
    confirm();
    gaEvent({
      action: 'countdown_created',
      params: { device: getDevice(), has_title: Boolean(title.trim()) },
    });
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('countdown', { device: getDevice() });
    }
  }, [draftTargetMs, title, confirm]);

  // Start countdown and Enter submit the form. A time typed and entered in
  // the same keystroke reaches state in that event, so the countdown starts
  // in an effect, on the render that has it (as on the homepage).
  const [submits, setSubmits] = useState(0);
  useEffect(() => {
    if (submits) startCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submits]);

  const handleClear = useCallback(() => {
    setTitle('');
    setDateValue(tomorrow(new Date()));
    setTimeStr(DEFAULT_TIME);
    setActive(null);
    setLinkNote(null);
    titleInputRef.current?.focus();
  }, []);

  const buildShareUrl = useCallback(() => {
    if (!active) return '';
    const params = new URLSearchParams();
    params.set('to', toWallClock(new Date(active.ms)));
    if (active.title.trim()) params.set('title', active.title.trim());
    return `${window.location.origin}/tools/countdown/?${params.toString()}`;
  }, [active]);

  // Embed code for the active countdown: the share link's parameters plus a
  // board colour (the embed picks black or white numerals to suit it).
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedColor, setEmbedColor] = useState(EMBED_COLORS[0].hex);
  const embedQuery = useMemo(() => {
    if (!active) return '';
    const params = new URLSearchParams();
    params.set('to', toWallClock(new Date(active.ms)));
    if (active.title.trim()) params.set('title', active.title.trim());
    params.set('color', embedColor);
    return params.toString();
  }, [active, embedColor]);

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
    if (await copyText(url)) toast({ title: 'Link copied!', description: 'Share your countdown anywhere.' });
    else toast({ title: 'Copy this link', description: url });
  }, [active, buildShareUrl]);

  const persistSaved = useCallback((update: (prev: SavedCountdown[]) => SavedCountdown[]) => {
    setSaved((prev) => {
      const next = update(prev);
      try {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!active) return;
    const to = toWallClock(new Date(active.ms));
    const savedTitle = active.title.trim() || 'Untitled countdown';
    const entry: SavedCountdown = { id: `${nowMs}-${to}-${savedTitle}`, title: savedTitle, to };
    persistSaved((prev) => [entry, ...prev.filter((s) => !(s.to === to && s.title === savedTitle))].slice(0, 12));
    gaEvent({ action: 'countdown_saved', params: { device: getDevice(), has_title: Boolean(active.title.trim()) } });
    toast({ title: 'Countdown saved', description: 'Find it below under “Saved countdowns”.' });
  }, [active, nowMs, persistSaved]);

  const loadSaved = useCallback((item: SavedCountdown) => {
    const d = parseWallClock(item.to);
    if (!d) return;
    setDateValue(d);
    setTimeStr(timeValue(d));
    const loadedTitle = item.title === 'Untitled countdown' ? '' : item.title;
    setTitle(loadedTitle);
    setLinkNote(null);
    setActive({ ms: d.getTime(), title: loadedTitle });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Deleting says so, with an Undo that puts it back where it was
  const deleteSaved = useCallback(
    (id: string) => {
      const index = saved.findIndex((s) => s.id === id);
      if (index < 0) return;
      const item = saved[index];
      persistSaved((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: 'Countdown deleted',
        description: item.title,
        action: (
          <ToastAction
            altText="Undo deleting the countdown"
            onClick={() =>
              persistSaved((prev) =>
                prev.some((s) => s.id === item.id)
                  ? prev
                  : [...prev.slice(0, Math.min(index, prev.length)), item, ...prev.slice(Math.min(index, prev.length))],
              )
            }
          >
            Undo
          </ToastAction>
        ),
      });
    },
    [saved, persistSaved],
  );

  return (
    <div className={className}>
      {/* Countdown display — only shown once a countdown is active */}
      {active && (
      <div ref={boardRef} className="relative z-10 mb-6" style={{ '--board': 'var(--line, #1849a9)', '--board-ink': 'var(--line-ink, #ffffff)' } as React.CSSProperties}>
        {/* The same departures board as the event pages, in the Countdowns line colour */}
        <div className={stale ? 'st-faded' : undefined}>
        <StationBoard
          key={`${activeMs}-${round}`}
          target={new Date(activeMs)}
          title={activeTitle || 'your date'}
          arrivedLabel={`${activeTitle || 'Your date'} has passed`}
          dateNote={
            <>
              At {targetTime}
              {userTz && <>, on your own clock ({userTz.split('/').pop()?.replace(/_/g, ' ')} time); a shared link counts down on each viewer&apos;s clock</>}
            </>
          }
        />
        </div>

        <div className="st-cta">
          <button
            onClick={handleShare}
            disabled={!active || stale}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-primary-foreground font-medium rounded-xl shadow-sm transition-all duration-200"
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
            disabled={!active || stale}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-primary-foreground font-medium rounded-xl shadow-sm transition-all duration-200"
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
          <button
            type="button"
            onClick={() => setShowEmbed((v) => !v)}
            aria-expanded={showEmbed}
            className="st-btn quiet"
          >
            Embed on your site
          </button>
        </div>
        {showEmbed && active && (
          <div className="mt-6">
            <div className="st-swatches" role="group" aria-label="Board colour">
              {EMBED_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  style={{ background: c.hex }}
                  aria-label={c.name}
                  aria-pressed={embedColor === c.hex}
                  onClick={() => setEmbedColor(c.hex)}
                />
              ))}
            </div>
            <EmbedCode
              src={`/embed/countdown/?${embedQuery}`}
              creditHref={buildShareUrl().replace(window.location.origin, 'https://clockmath.com')}
              label={`Countdown to ${activeTitle || 'the big day'}`}
              id="custom"
            />
          </div>
        )}
      </div>
      )}

      {/* Configuration: a form, so Enter in a field starts the countdown as the button does */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
        aria-label="Countdown settings"
        className="st-panel relative z-20 bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50"
      >
        <div className="mb-4">
          {/* Question label + auto-scrolling Popular marquee share one row;
              the marquee chips are duplicated for a seamless right-to-left loop. */}
          <div className="flex flex-col gap-2 mb-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label htmlFor="cd-title" className="block text-sm font-medium text-foreground shrink-0">
              What are you counting down to? <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="flex w-full min-w-0 items-center gap-2 sm:flex-1">
              <span className="text-sm text-muted-foreground shrink-0">Popular:</span>
              <div className="relative flex-1 min-w-0 overflow-hidden marquee-mask">
                <div className="flex w-max gap-2 animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] active:[animation-play-state:paused]">
                  {/* The loop's second copy is added after mount, so the static HTML lists each countdown once. */}
                  {(mounted ? [...POPULAR_COUNTDOWNS, ...POPULAR_COUNTDOWNS] : POPULAR_COUNTDOWNS).map((item, i) => (
                    <Link
                      key={`${item.href}-${i}`}
                      href={item.href}
                      title={item.note}
                      aria-hidden={i >= POPULAR_COUNTDOWNS.length}
                      tabIndex={i >= POPULAR_COUNTDOWNS.length ? -1 : undefined}
                      className="shrink-0 inline-flex items-center min-h-[44px] whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-lg border bg-background border-slate-300 text-slate-700 shadow-sm hover:border-primary hover:text-primary dark:bg-muted/60 dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-white transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <input
            id="cd-title"
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My vacation, Exam day, New Year"
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-xl bg-background dark:bg-background/60 border border-border dark:border-border text-foreground outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span id="cd-when-label" className="block text-sm font-medium text-foreground">
            Target date &amp; time
          </span>
          <div className="flex bg-muted/50 dark:bg-muted/50 rounded-lg p-1" role="group" aria-label="Clock format">
            <button
              type="button"
              onClick={() => setIs24h(false)}
              aria-pressed={!is24h}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                !is24h
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setIs24h(true)}
              aria-pressed={is24h}
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
        {/* The date gets the wider column: "Oct 31, 2026" fits on one line on a phone */}
        <div className="grid grid-cols-[1.25fr_1fr] gap-2" role="group" aria-labelledby="cd-when-label">
          <div className="min-w-0">
            <InlineDatePicker
              id="cd-date"
              ariaLabel="Target date"
              value={dateValue}
              onChange={(d) => {
                setDateValue(d);
                setLinkNote(null);
              }}
              placeholder="Select date"
              startOnCalendar
            />
          </div>
          <div className="min-w-0">
            <InlineTimePicker id="cd-time" ariaLabel="Target time" value={timeStr} onChange={setTimeStr} is24h={is24h} placeholder="Time" />
          </div>
        </div>
        {(linkNote || draftPast) && (
          <p role="status" className="mt-2 mb-0 text-sm text-red-700 dark:text-red-300">
            {linkNote ?? 'That time has passed. Pick a later date or time.'}
          </p>
        )}

        {/* Commit the draft inputs — the countdown only updates on click. */}
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={Number.isNaN(draftTargetMs)}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            {updated ? 'Counting down' : 'Start countdown'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-5 py-4 bg-muted dark:bg-muted hover:bg-muted/80 dark:hover:bg-muted text-foreground font-medium rounded-xl border border-border/50 dark:border-border transition-all duration-200"
          >
            Clear
          </button>
        </div>
        <span className="sr-only" role="status">{updated ? 'Countdown started' : ''}</span>
        {stale && (
          <p role="status" className="mt-2 mb-0 text-sm text-muted-foreground">
            Changed. Press Start countdown to update the board.
          </p>
        )}
      </form>

      {/* Saved countdowns */}
      {saved.length > 0 && (
        <div className="st-panel relative z-0 mt-6 bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50">
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground uppercase tracking-wide mb-3">
            Saved countdowns
          </h3>
          <ul className="space-y-2">
            {saved.map((item) => {
              const d = parseWallClock(item.to);
              const valid = d !== null;
              const label = d
                ? d.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: !is24h,
                  })
                : item.to;
              const itemPast = valid && d.getTime() < nowMs;
              const relative = d ? formatDistance(d, new Date(nowMs || Date.now()), { addSuffix: true }) : '';
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 dark:border-border/50 bg-background/60 dark:bg-background/40 px-3 sm:px-4 py-3"
                >
                  <button type="button" onClick={() => loadSaved(item)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <span
                      className={`shrink-0 grid place-items-center w-9 h-9 rounded-lg ${
                        itemPast
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary  '
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
                      {/* Phones have no room for the pill on the right */}
                      {relative && <span className="block text-xs text-muted-foreground sm:hidden">{relative}</span>}
                    </span>
                  </button>
                  {relative && (
                    <span
                      className={`hidden sm:inline-block shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        itemPast
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary  '
                      }`}
                    >
                      {relative}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteSaved(item.id)}
                    aria-label={`Delete ${item.title}`}
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
