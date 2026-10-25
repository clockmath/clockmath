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
import InfoTip from '@/components/InfoTip';
import { storageGet, storageSet } from '@/lib/safeStorage';
import { useClockFormat } from '@/hooks/use-clock-format';
import { getDevice } from '@/lib/device';

export const CYCLE_MIN = 90;
export const FALL_ASLEEP_MIN = 15;
/** Choices for "I fall asleep in about"; 15 is the default */
const FALL_ASLEEP_CHOICES = [5, 10, 15, 20, 30];
const SAVED_KEY = 'clockmath-sleep';

const pad = (n: number) => String(n).padStart(2, '0');
const nowValue = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};


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
export function clock(mins: number, hour12: boolean): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (!hour12) return `${String(h).padStart(2, '0')}:${mm}`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ampm}`;
}

const hm = (mins: number): string => (mins % 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins / 60}h`);

/** Sleep quality note against the widely used 7–9h adult guidance */
/**
 * A likely AM/PM slip: over 14 hours "slept", where the other half of the day
 * for bed or wake gives a normal night (4–12 hours). "11am" for bed with a
 * 6:30 AM wake read as 19h 30m, above the 7–9 hour range, with no hint.
 */
export function ampmSlip(bed: string, wake: string): { field: 'bed' | 'wake'; value: string } | null {
  const slept = sleepDuration(bed, wake);
  if (slept === null || slept <= 14 * 60) return null;
  const flip = (t: string) => {
    const m = toMinutes(t);
    return m === null ? null : `${pad(Math.floor(((m + 720) % 1440) / 60))}:${pad((m + 720) % 60)}:00`;
  };
  const normal = (b: string, w: string) => {
    const d = sleepDuration(b, w);
    return d !== null && d >= 4 * 60 && d <= 12 * 60;
  };
  const bed2 = flip(bed);
  if (bed2 && normal(bed2, wake)) return { field: 'bed', value: bed2 };
  const wake2 = flip(wake);
  if (wake2 && normal(bed, wake2)) return { field: 'wake', value: wake2 };
  return null;
}

export function durationNote(mins: number): string {
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
  const [is24h, setIs24h] = useClockFormat();
  const hour12 = !is24h;
  const [bedTime, setBedTime] = useState('23:00:00');
  const [wakeTime, setWakeTime] = useState('06:30:00');
  const [planMode, setPlanMode] = useState<'wake-at' | 'sleep-now'>('wake-at');
  const [targetWake, setTargetWake] = useState('06:30:00');
  const [fallAsleep, setFallAsleep] = useState(FALL_ASLEEP_MIN);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // The times are remembered on this device, so tomorrow's alarm check is
  // one look, not three fields
  useEffect(() => {
    try {
      const saved = JSON.parse(storageGet(SAVED_KEY) || 'null');
      const isTime = (t: unknown): t is string => typeof t === 'string' && toMinutes(t) !== null;
      if (saved) {
        if (isTime(saved.bed)) setBedTime(saved.bed);
        if (isTime(saved.wake)) setWakeTime(saved.wake);
        if (isTime(saved.target)) setTargetWake(saved.target);
        if (FALL_ASLEEP_CHOICES.includes(saved.fallAsleep)) setFallAsleep(saved.fallAsleep);
      }
    } catch {
      /* ignore a damaged entry */
    }
    setLoaded(true);
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storageSet(SAVED_KEY, JSON.stringify({ bed: bedTime, wake: wakeTime, target: targetWake, fallAsleep }));
  }, [loaded, bedTime, wakeTime, targetWake, fallAsleep]);

  const markToolUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('sleep', { device: getDevice() });
    }
  }, []);

  const setHourFormat = useCallback((is12: boolean) => setIs24h(!is12), [setIs24h]);

  const slept = useMemo(() => sleepDuration(bedTime, wakeTime), [bedTime, wakeTime]);
  const slip = useMemo(() => ampmSlip(bedTime, wakeTime), [bedTime, wakeTime]);

  // Planner: cycles counted best-first. Bedtimes work back from the target
  // wake; wake-ups work forward from "now" — both include the buffer.
  const planRows = useMemo(() => {
    const cycles = [6, 5, 4, 3];
    if (planMode === 'wake-at') {
      const w = toMinutes(targetWake);
      if (w == null) return [];
      return cycles.map((c) => ({
        cycles: c,
        time: clock(w - (c * CYCLE_MIN + fallAsleep), hour12),
        sleep: hm(c * CYCLE_MIN),
        best: c >= 5,
      }));
    }
    if (nowMs === null) return [];
    const now = new Date(nowMs);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return cycles.map((c) => ({
      cycles: c,
      time: clock(nowMin + fallAsleep + c * CYCLE_MIN, hour12),
      sleep: hm(c * CYCLE_MIN),
      best: c >= 5,
    }));
  }, [planMode, targetWake, nowMs, hour12, fallAsleep]);

  const modeButton = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
      active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className={className}>
      {/* Shared format toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-muted/50 dark:bg-muted/50 rounded-lg p-1">
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
          className="st-panel bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50"
        >
          <h2 id="slept-heading" className="text-lg font-bold text-foreground mb-4">
            How long did I sleep?
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <label htmlFor="sleep-bed" className="block text-sm font-medium text-foreground">
                  Went to bed
                </label>
                <button
                  type="button"
                  className="st-now"
                  aria-label="Set “went to bed” to now"
                  onClick={() => {
                    setBedTime(nowValue());
                    markToolUsed();
                  }}
                >
                  Now
                </button>
              </div>
              <div>
                <InlineTimePicker
                  id="sleep-bed"
                  ariaLabel="Went to bed"
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
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <label htmlFor="sleep-wake" className="block text-sm font-medium text-foreground">
                  Woke up
                </label>
                <button
                  type="button"
                  className="st-now"
                  aria-label="Set “woke up” to now"
                  onClick={() => {
                    setWakeTime(nowValue());
                    markToolUsed();
                  }}
                >
                  Now
                </button>
              </div>
              <div>
                <InlineTimePicker
                  id="sleep-wake"
                  ariaLabel="Woke up"
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
            className="st-result text-center rounded-xl bg-primary/10 border border-primary/30 py-4 px-3"
          >
            {slept === null ? (
              <p className="text-sm text-muted-foreground">
                {toMinutes(bedTime) !== null && toMinutes(bedTime) === toMinutes(wakeTime)
                  ? 'Bed and wake times are the same — adjust one to see your sleep duration.'
                  : 'Enter your bed and wake times'}
              </p>
            ) : (
              <>
                <p className="st-figure text-3xl font-bold font-mono text-primary">
                  <RollingNumber value={hm(slept)} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(slept / 60).toFixed(1)} hours — {durationNote(slept)}
                </p>
                {slip && (
                  <p className="st-slip mt-2 text-sm">
                    Did you mean {slip.field === 'bed' ? 'bed' : 'waking'} at{' '}
                    <button
                      type="button"
                      className="st-slip-fix"
                      onClick={() => {
                        if (slip.field === 'bed') setBedTime(slip.value);
                        else setWakeTime(slip.value);
                        // This button goes once used: keep the keyboard on the
                        // field it fixed, not the top of the page, once the field
                        // shows the fixed time (focused sooner, it kept the old
                        // text and put it back on leaving). Not on touch screens,
                        // where focusing a time field can open its wheel.
                        const field = slip.field;
                        if (!window.matchMedia('(pointer: coarse)').matches)
                          setTimeout(() => document.getElementById(`sleep-${field}`)?.focus(), 0);
                      }}
                    >
                      {clock(toMinutes(slip.value) ?? 0, hour12)}
                    </button>
                    ?
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* Cycle planner */}
        <section
          aria-labelledby="planner-heading"
          className="st-panel bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50"
        >
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 id="planner-heading" className="text-lg font-bold text-foreground inline-flex items-center gap-1.5">
              Sleep cycle planner
              <InfoTip label="sleep cycles">
                Based on ~90-minute sleep cycles plus the time you take to fall asleep. Waking at the end of a cycle
                tends to feel easier than waking mid-cycle.
              </InfoTip>
            </h2>
            <div className="flex bg-muted/50 dark:bg-muted/50 rounded-lg p-1">
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

          {/* People differ: the planner was fixed at 15 minutes */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <label htmlFor="sleep-fall-asleep" className="text-muted-foreground">
              I fall asleep in about
            </label>
            <select
              id="sleep-fall-asleep"
              value={fallAsleep}
              onChange={(e) => {
                setFallAsleep(Number(e.target.value));
                markToolUsed();
              }}
              className="py-1.5 px-2 rounded-lg bg-background dark:bg-background/60 border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              {FALL_ASLEEP_CHOICES.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>

          {planMode === 'wake-at' ? (
            <div className="mb-4">
              <label htmlFor="sleep-target" className="block text-sm font-medium text-foreground mb-1">
                I need to wake up at
              </label>
              <div>
                <InlineTimePicker
                  id="sleep-target"
                  ariaLabel="Wake-up time"
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
              If you go to bed now and fall asleep in about {fallAsleep} minutes, aim to wake at:
            </p>
          )}

          {/* A small departures board in the night line's colour: the times
              on flap tiles, the recommended ones at full strength */}
          <ul className="st-result st-sleep-board" aria-live="polite">
            {planRows.map((row) => (
              <li key={row.cycles} className={row.best ? 'best' : undefined}>
                <span className="st-figure">
                  {/* AM/PM set small beside the tiles, as on the time zone board */}
                  <RollingNumber value={row.time.replace(/\s*[AP]M$/, '')} />
                  {/[AP]M$/.test(row.time) && <span className="st-sleep-ap">{row.time.slice(-2)}</span>}
                </span>
                <span className="st-sleep-sub">
                  {row.cycles} cycles · {row.sleep}
                  {row.best && <span className="st-sleep-best">Recommended</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
