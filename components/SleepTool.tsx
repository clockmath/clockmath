/**
 * SleepTool component for ClockMath.com
 * Two cards: "How long did I sleep?" (bed → wake duration, overnight-safe)
 * and a sleep-cycle planner (bedtimes for a target wake-up, or wake-ups if
 * you fall asleep now). Cycle math: ~90-minute cycles plus a 15-minute
 * fall-asleep buffer — general guidance, not medical advice.
 */

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { InlineTimePicker } from '@/components/ui/InlineTimePicker';
import { RollingNumber } from '@/components/RollingNumber';
import { toolUsed } from '@/lib/gtag';

const CYCLE_MIN = 90;
const FALL_ASLEEP_MIN = 15;

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop';

/** "HH:MM[:SS]" → minutes since midnight, or null */
export function toMinutes(t: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Minutes slept from bed → wake, crossing midnight when needed.
 * Equal times return null — a 0-minute/24-hour reading is an input error,
 * not an answer (the UI prompts to adjust instead).
 */
export function sleepDuration(bed: string, wake: string): number | null {
  const b = toMinutes(bed);
  const w = toMinutes(wake);
  if (b == null || w == null) return null;
  if (b === w) return null;
  let diff = w - b;
  if (diff < 0) diff += 1440;
  return diff;
}

/** Format minutes-since-midnight as a clock time (wraps across days) */
function clock(mins: number, hour12: boolean): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (!hour12) return `${String(h).padStart(2, '0')}:${mm}`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ampm}`;
}

const hm = (mins: number): string => `${Math.floor(mins / 60)}h ${mins % 60}m`;

/** Sleep quality note against the widely used 7–9h adult guidance */
function durationNote(mins: number): string {
  const h = mins / 60;
  if (h < 7) return 'below the 7–9 hours most adults need';
  if (h <= 9) return 'within the 7–9 hours most adults need';
  return 'above the typical 7–9 hour range';
}

interface SleepToolProps {
  className?: string;
}

export function SleepTool({ className = '' }: SleepToolProps) {
  const toolUsedRef = useRef(false);
  const [hour12, setHour12] = useState(true);
  const [bedTime, setBedTime] = useState('23:00:00');
  const [wakeTime, setWakeTime] = useState('06:30:00');
  const [planMode, setPlanMode] = useState<'wake-at' | 'sleep-now'>('wake-at');
  const [targetWake, setTargetWake] = useState('06:30:00');
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('clockmath-hour12');
    if (saved !== null) setHour12(saved === 'true');
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const markToolUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('sleep', { device: getDevice() });
    }
  }, []);

  const setHourFormat = useCallback((is12: boolean) => {
    setHour12(is12);
    try {
      window.localStorage.setItem('clockmath-hour12', is12.toString());
    } catch {
      /* ignore */
    }
  }, []);

  const slept = useMemo(() => sleepDuration(bedTime, wakeTime), [bedTime, wakeTime]);

  // Planner: cycles counted best-first. Bedtimes work back from the target
  // wake; wake-ups work forward from "now" — both include the buffer.
  const planRows = useMemo(() => {
    const cycles = [6, 5, 4, 3];
    if (planMode === 'wake-at') {
      const w = toMinutes(targetWake);
      if (w == null) return [];
      return cycles.map((c) => ({
        cycles: c,
        time: clock(w - (c * CYCLE_MIN + FALL_ASLEEP_MIN), hour12),
        sleep: hm(c * CYCLE_MIN),
        best: c >= 5,
      }));
    }
    if (nowMs === null) return [];
    const now = new Date(nowMs);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return cycles.map((c) => ({
      cycles: c,
      time: clock(nowMin + FALL_ASLEEP_MIN + c * CYCLE_MIN, hour12),
      sleep: hm(c * CYCLE_MIN),
      best: c >= 5,
    }));
  }, [planMode, targetWake, nowMs, hour12]);

  const modeButton = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
      active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className={className}>
      {/* Shared format toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-muted/50 dark:bg-slate-700/50 rounded-lg p-1">
          <button onClick={() => setHourFormat(true)} aria-pressed={hour12} className={modeButton(hour12)}>
            12h
          </button>
          <button onClick={() => setHourFormat(false)} aria-pressed={!hour12} className={modeButton(!hour12)}>
            24h
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* How long did I sleep */}
        <section
          aria-labelledby="slept-heading"
          className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50"
        >
          <h2 id="slept-heading" className="text-lg font-bold text-foreground mb-4">
            How long did I sleep?
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label id="bed-label" className="block text-sm font-medium text-foreground mb-1">
                Went to bed
              </label>
              <div aria-labelledby="bed-label">
                <InlineTimePicker
                  value={bedTime}
                  onChange={(t) => {
                    setBedTime(t);
                    markToolUsed();
                  }}
                  is24h={!hour12}
                />
              </div>
            </div>
            <div>
              <label id="wake-label" className="block text-sm font-medium text-foreground mb-1">
                Woke up
              </label>
              <div aria-labelledby="wake-label">
                <InlineTimePicker
                  value={wakeTime}
                  onChange={(t) => {
                    setWakeTime(t);
                    markToolUsed();
                  }}
                  is24h={!hour12}
                />
              </div>
            </div>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="text-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 py-4 px-3"
          >
            {slept === null ? (
              <p className="text-sm text-muted-foreground">
                {toMinutes(bedTime) !== null && toMinutes(bedTime) === toMinutes(wakeTime)
                  ? 'Bed and wake times are the same — adjust one to see your sleep duration.'
                  : 'Enter your bed and wake times'}
              </p>
            ) : (
              <>
                <p className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  <RollingNumber value={hm(slept)} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(slept / 60).toFixed(1)} hours — {durationNote(slept)}
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Overnight is handled automatically — 11:00 PM to 6:30 AM counts as 7h 30m.
          </p>
        </section>

        {/* Cycle planner */}
        <section
          aria-labelledby="planner-heading"
          className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50"
        >
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 id="planner-heading" className="text-lg font-bold text-foreground">
              Sleep cycle planner
            </h2>
            <div className="flex bg-muted/50 dark:bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => {
                  setPlanMode('wake-at');
                  markToolUsed();
                }}
                aria-pressed={planMode === 'wake-at'}
                className={modeButton(planMode === 'wake-at')}
              >
                Wake up at…
              </button>
              <button
                onClick={() => {
                  setPlanMode('sleep-now');
                  markToolUsed();
                }}
                aria-pressed={planMode === 'sleep-now'}
                className={modeButton(planMode === 'sleep-now')}
              >
                Sleep now
              </button>
            </div>
          </div>

          {planMode === 'wake-at' ? (
            <div className="mb-4">
              <label id="target-wake-label" className="block text-sm font-medium text-foreground mb-1">
                I need to wake up at
              </label>
              <div aria-labelledby="target-wake-label">
                <InlineTimePicker
                  value={targetWake}
                  onChange={(t) => {
                    setTargetWake(t);
                    markToolUsed();
                  }}
                  is24h={!hour12}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">Go to bed at one of these times:</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              If you go to bed now and fall asleep in about {FALL_ASLEEP_MIN} minutes, aim to wake at:
            </p>
          )}

          <ul className="space-y-2" aria-live="polite">
            {planRows.map((row) => (
              <li
                key={row.cycles}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
                  row.best
                    ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                    : 'border-border/50 dark:border-slate-700/50 bg-background/60 dark:bg-slate-900/40'
                }`}
              >
                <span className="text-lg font-bold font-mono text-foreground">
                  <RollingNumber value={row.time} />
                </span>
                <span className="text-sm text-muted-foreground">
                  {row.cycles} cycles · {row.sleep}
                  {row.best && (
                    <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Recommended
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Based on ~90-minute sleep cycles plus {FALL_ASLEEP_MIN} minutes to fall asleep. Waking at
            the end of a cycle tends to feel easier than mid-cycle.
          </p>
        </section>
      </div>
    </div>
  );
}
