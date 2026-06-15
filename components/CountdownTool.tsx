'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { event as gaEvent } from '@/lib/gtag';

interface CountdownToolProps {
  className?: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
}

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches
    ? 'mobile'
    : 'desktop';

// Build a YYYY-MM-DD string from a Date in local time.
const toDateInputValue = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const computeRemaining = (targetMs: number, nowMs: number): Remaining => {
  const isPast = targetMs - nowMs < 0;
  const totalSeconds = Math.floor(Math.abs(targetMs - nowMs) / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    isPast,
  };
};

export function CountdownTool({ className = '' }: CountdownToolProps) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('00:00');
  const [title, setTitle] = useState('');
  const [nowMs, setNowMs] = useState(0);
  const [mounted, setMounted] = useState(false);

  // On mount: hydrate from a shared link if present, else default to a live
  // countdown to the next New Year so the page is never empty.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    const sharedTitle = params.get('title');

    const parsed = to ? new Date(to) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
      setDateStr(toDateInputValue(parsed));
      setTimeStr(`${`${parsed.getHours()}`.padStart(2, '0')}:${`${parsed.getMinutes()}`.padStart(2, '0')}`);
      if (sharedTitle) setTitle(sharedTitle);
      gaEvent({
        action: 'countdown_opened_from_link',
        params: { device: getDevice(), has_title: Boolean(sharedTitle) },
      });
    } else {
      const nextNewYear = new Date(new Date().getFullYear() + 1, 0, 1);
      setDateStr(toDateInputValue(nextNewYear));
      setTimeStr('00:00');
      setTitle('New Year');
    }

    setNowMs(Date.now());
    setMounted(true);
  }, []);

  // Tick once per second.
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mounted]);

  const targetMs = useMemo(() => {
    if (!dateStr) return NaN;
    return new Date(`${dateStr}T${timeStr || '00:00'}`).getTime();
  }, [dateStr, timeStr]);

  const remaining = useMemo(
    () => (mounted && !Number.isNaN(targetMs) ? computeRemaining(targetMs, nowMs) : null),
    [mounted, targetMs, nowMs],
  );

  const targetLabel = useMemo(() => {
    if (Number.isNaN(targetMs)) return '';
    return new Date(targetMs).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [targetMs]);

  const applyPresetNextNewYear = useCallback(() => {
    const nextNewYear = new Date(new Date().getFullYear() + 1, 0, 1);
    setDateStr(toDateInputValue(nextNewYear));
    setTimeStr('00:00');
    setTitle('New Year');
    gaEvent({ action: 'countdown_preset', params: { preset: 'new_year', device: getDevice() } });
  }, []);

  const buildShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('to', `${dateStr}T${timeStr || '00:00'}`);
    if (title.trim()) params.set('title', title.trim());
    return `${window.location.origin}/tools/countdown/?${params.toString()}`;
  }, [dateStr, timeStr, title]);

  const handleShare = useCallback(async () => {
    if (Number.isNaN(targetMs)) return;
    const url = buildShareUrl();
    gaEvent({
      action: 'countdown_shared',
      params: { device: getDevice(), has_title: Boolean(title.trim()) },
    });

    // Prefer the native share sheet on mobile; fall back to clipboard.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: title.trim() || 'Countdown', url });
        return;
      } catch {
        /* user cancelled or share failed — fall through to copy */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Share your countdown anywhere.' });
    } catch {
      toast({ title: 'Copy this link', description: url });
    }
  }, [buildShareUrl, targetMs, title]);

  const units: Array<{ label: string; value: number }> = remaining
    ? [
        { label: 'Days', value: remaining.days },
        { label: 'Hours', value: remaining.hours },
        { label: 'Minutes', value: remaining.minutes },
        { label: 'Seconds', value: remaining.seconds },
      ]
    : [];

  return (
    <div className={className}>
      {/* Countdown display */}
      <div className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-border/50 dark:border-slate-700/50 text-center mb-6">
        {title.trim() && (
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-1">
            {remaining?.isPast ? 'Since' : 'Until'} {title.trim()}
          </h2>
        )}
        {targetLabel && (
          <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">{targetLabel}</p>
        )}

        {remaining ? (
          <>
            <div className="grid grid-cols-4 gap-2 sm:gap-4" aria-live="polite">
              {units.map((unit) => (
                <div
                  key={unit.label}
                  className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-700/60 dark:to-slate-800/60 rounded-xl py-4 sm:py-6 border border-border/50 dark:border-slate-700/50"
                >
                  <div className="text-3xl sm:text-5xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {unit.value.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
            {remaining.isPast && (
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-4">
                This date has already passed.
              </p>
            )}
          </>
        ) : (
          <div className="text-muted-foreground py-8">Pick a date below to start your countdown.</div>
        )}

        <button
          onClick={handleShare}
          disabled={Number.isNaN(targetMs)}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-white font-medium rounded-xl shadow-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share this countdown
        </button>
      </div>

      {/* Configuration */}
      <div className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 dark:border-slate-700/50">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cd-title" className="block text-sm font-medium text-foreground mb-1.5">
              What are you counting down to?
            </label>
            <input
              id="cd-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My vacation, Exam day, New Year"
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label htmlFor="cd-date" className="block text-sm font-medium text-foreground mb-1.5">
              Target date
            </label>
            <input
              id="cd-date"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label htmlFor="cd-time" className="block text-sm font-medium text-foreground mb-1.5">
              Target time
            </label>
            <input
              id="cd-time"
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Quick pick:</span>
          <button
            onClick={applyPresetNextNewYear}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted/60 dark:bg-slate-700/60 hover:bg-muted dark:hover:bg-slate-700 text-foreground transition-colors"
          >
            New Year
          </button>
        </div>
      </div>
    </div>
  );
}
