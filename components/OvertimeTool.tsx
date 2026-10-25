/**
 * OvertimeTool — regular vs overtime split with optional pay breakdown.
 * Live calculation as you type, matching the decimal-hours tool's feel.
 *
 * Oct 2026 audit: the fields are plain text read by parseHours/parseAmount
 * (lib/overtime.ts), not type="number" — that dropped commas and colons, so
 * a "18,50" rate was $1,850 an hour and "46:30" hours were 4630. A field
 * that can't be read says so under itself; the threshold, multiplier and
 * rate are remembered on this device.
 */

'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { RollingNumber } from '@/components/RollingNumber';
import { computeOvertime, decimalToHmLabel, parseAmount, parseHours } from '@/lib/overtime';
import { toolUsed } from '@/lib/gtag';
import InfoTip from '@/components/InfoTip';
import { getDevice } from '@/lib/device';
import { storageGet, storageSet } from '@/lib/safeStorage';

const MULTIPLIERS = [
  { value: 1.5, label: '1.5× (time and a half)' },
  { value: 2, label: '2× (double time)' },
];
const SAVED_KEY = 'clockmath-overtime';

/** $74,000.00, not $74000.00 */
const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface OvertimeToolProps {
  className?: string;
}

export function OvertimeTool({ className = '' }: OvertimeToolProps) {
  const toolUsedRef = useRef(false);
  const [hoursStr, setHoursStr] = useState('46.5');
  const [thresholdStr, setThresholdStr] = useState('40');
  const [multiplier, setMultiplier] = useState(1.5);
  const [rateStr, setRateStr] = useState('');
  const [loaded, setLoaded] = useState(false);

  // The same rate and threshold most weeks: remembered on this device
  useEffect(() => {
    try {
      const saved = JSON.parse(storageGet(SAVED_KEY) || 'null');
      if (saved) {
        if (typeof saved.threshold === 'string') setThresholdStr(saved.threshold);
        if (MULTIPLIERS.some((m) => m.value === saved.multiplier)) setMultiplier(saved.multiplier);
        if (typeof saved.rate === 'string') setRateStr(saved.rate);
      }
    } catch {
      /* ignore a damaged entry */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) storageSet(SAVED_KEY, JSON.stringify({ threshold: thresholdStr, multiplier, rate: rateStr }));
  }, [loaded, thresholdStr, multiplier, rateStr]);

  const markToolUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('overtime', { device: getDevice() });
    }
  }, []);

  const hours = parseHours(hoursStr);
  const threshold = thresholdStr.trim() === '' ? 40 : parseAmount(thresholdStr);
  const rate = parseAmount(rateStr);

  // A note under each field that can't be read (the old catch-all asked to
  // "Enter your hours" even when they were entered)
  const notes = {
    hours:
      hours === null
        ? hoursStr.trim()
          ? 'Use hours like 46.5, 46:30 or 46h 30m.'
          : null
        : Number.isNaN(hours)
          ? "Hours can't be negative."
          : hours > 168
            ? 'A week only has 168 hours. Check the hours worked.'
            : null,
    threshold:
      threshold === null || Number.isNaN(threshold) ? 'Use a number of hours, like 40.' : null,
    rate: rateStr.trim() && (rate === null || Number.isNaN(rate)) ? 'Use a rate like 18.50.' : null,
  };

  const split = useMemo(() => {
    if (hours === null || Number.isNaN(hours) || hours > 168) return null;
    if (threshold === null || Number.isNaN(threshold)) return null;
    if (notes.rate) return null;
    return computeOvertime({ hoursWorked: hours, threshold, multiplier, rate: rate ?? null });
  }, [hours, threshold, multiplier, rate, notes.rate]);

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-lg font-mono outline-none focus:ring-2 focus:ring-primary/50';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';
  const noteFor = (id: string, note: string | null) =>
    note && (
      <p id={`${id}-note`} role="status" className="mt-1 mb-0 text-sm text-red-700 dark:text-red-300">
        {note}
      </p>
    );

  return (
    <div className={className}>
      <section
        aria-labelledby="overtime-form-heading"
        className="st-panel bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50 mb-6"
      >
        <h2 id="overtime-form-heading" className="sr-only">
          Overtime inputs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1">
              <label htmlFor="ot-hours" className={labelClass}>
                Hours worked this week
              </label>
              <InfoTip label="hours worked">
                As 46.5, 46:30 or 46h 30m. Adding up shifts first?{' '}
                <Link href="/tools/timesheet" className="underline underline-offset-2 hover:text-foreground">
                  Use the work hours calculator
                </Link>
                .
              </InfoTip>
            </span>
            <input
              id="ot-hours"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={hoursStr}
              aria-invalid={notes.hours ? true : undefined}
              aria-describedby={notes.hours ? 'ot-hours-note' : undefined}
              onChange={(e) => {
                setHoursStr(e.target.value);
                markToolUsed();
              }}
              className={inputClass}
            />
            {noteFor('ot-hours', notes.hours)}
          </div>
          <div>
            <label htmlFor="ot-threshold" className={labelClass}>
              Overtime starts after
            </label>
            <div className="relative">
              <input
                id="ot-threshold"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={thresholdStr}
                aria-invalid={notes.threshold ? true : undefined}
                aria-describedby={notes.threshold ? 'ot-threshold-note' : undefined}
                onChange={(e) => {
                  setThresholdStr(e.target.value);
                  markToolUsed();
                }}
                className={inputClass}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                hours/week
              </span>
            </div>
            {noteFor('ot-threshold', notes.threshold)}
          </div>
          <div>
            <span className={labelClass} id="ot-multiplier-label">
              Overtime rate
            </span>
            <div className="flex gap-2" role="group" aria-labelledby="ot-multiplier-label">
              {MULTIPLIERS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={multiplier === m.value}
                  onClick={() => {
                    setMultiplier(m.value);
                    markToolUsed();
                  }}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    multiplier === m.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground dark:text-muted-foreground border-border dark:border-border hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="ot-rate" className={labelClass}>
              Hourly rate <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                $
              </span>
              <input
                id="ot-rate"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 18.50"
                value={rateStr}
                aria-invalid={notes.rate ? true : undefined}
                aria-describedby={notes.rate ? 'ot-rate-note' : undefined}
                onChange={(e) => {
                  setRateStr(e.target.value);
                  markToolUsed();
                }}
                className={`${inputClass} pl-8`}
              />
            </div>
            {noteFor('ot-rate', notes.rate)}
          </div>
        </div>
      </section>

      {/* Results */}
      <section
        aria-labelledby="overtime-result-heading"
        aria-live="polite"
        className="st-panel bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50"
      >
        <h2 id="overtime-result-heading" className="text-lg font-bold text-foreground mb-4">
          Your split
        </h2>

        {split === null && (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {notes.hours || notes.threshold || notes.rate
              ? 'Check the field marked above to see the split.'
              : 'Enter your hours worked to see the regular vs overtime breakdown.'}
          </p>
        )}

        {split && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="st-result rounded-xl bg-background dark:bg-background/40 border border-border/50 dark:border-border/50 p-4 text-center">
                <div className="st-figure text-2xl font-bold text-foreground">
                  <RollingNumber value={split.regularHours} />
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  regular hours ({decimalToHmLabel(split.regularHours)})
                </div>
              </div>
              <div className="st-result rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
                <div className="st-figure text-2xl font-bold text-primary">
                  <RollingNumber value={split.overtimeHours} />
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  overtime hours ({decimalToHmLabel(split.overtimeHours)})
                </div>
              </div>
            </div>

            {split.totalPay !== null && rate !== null ? (
              <dl className="mt-4 divide-y divide-border/50 dark:divide-border/50 text-sm">
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground dark:text-muted-foreground">
                    Regular pay ({decimalToHmLabel(split.regularHours)} × ${money(rate)})
                  </dt>
                  <dd className="font-mono font-medium text-foreground">
                    $<RollingNumber value={money(split.regularPay!)} />
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground dark:text-muted-foreground">
                    Overtime pay ({decimalToHmLabel(split.overtimeHours)} × ${money(split.overtimeRate!)})
                  </dt>
                  <dd className="font-mono font-medium text-foreground">
                    $<RollingNumber value={money(split.overtimePay!)} />
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="font-medium text-foreground">Total gross pay</dt>
                  <dd className="font-mono text-lg font-bold text-primary">
                    $<RollingNumber value={money(split.totalPay)} />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-3">
                Add your hourly rate to see the pay breakdown.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
