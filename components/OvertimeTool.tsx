/**
 * OvertimeTool — regular vs overtime split with optional pay breakdown.
 * Live calculation as you type, matching the decimal-hours tool's feel.
 */

'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { RollingNumber } from '@/components/RollingNumber';
import { computeOvertime, decimalToHmLabel } from '@/lib/overtime';
import { toolUsed } from '@/lib/gtag';

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop';

const parseNum = (s: string): number => {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

const MULTIPLIERS = [
  { value: 1.5, label: '1.5× (time and a half)' },
  { value: 2, label: '2× (double time)' },
];

interface OvertimeToolProps {
  className?: string;
}

export function OvertimeTool({ className = '' }: OvertimeToolProps) {
  const toolUsedRef = useRef(false);
  const [hoursStr, setHoursStr] = useState('46.5');
  const [thresholdStr, setThresholdStr] = useState('40');
  const [multiplier, setMultiplier] = useState(1.5);
  const [rateStr, setRateStr] = useState('');

  const markToolUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('overtime', { device: getDevice() });
    }
  }, []);

  const result = useMemo(() => {
    const hours = parseNum(hoursStr);
    const threshold = thresholdStr.trim() === '' ? 40 : parseNum(thresholdStr);
    if (Number.isNaN(hours) || Number.isNaN(threshold)) return null;
    if (hours > 168) return { error: 'A week only has 168 hours — check the hours worked.' } as const;
    const rate = rateStr.trim() === '' ? null : parseNum(rateStr);
    if (rate !== null && Number.isNaN(rate)) return null;
    return computeOvertime({ hoursWorked: hours, threshold, multiplier, rate });
  }, [hoursStr, thresholdStr, multiplier, rateStr]);

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground text-lg font-mono outline-none focus:ring-2 focus:ring-emerald-500/50';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';

  const hasError = result !== null && 'error' in result;
  const split = result !== null && !('error' in result) ? result : null;

  return (
    <div className={className}>
      <section
        aria-labelledby="overtime-form-heading"
        className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6"
      >
        <h2 id="overtime-form-heading" className="sr-only">
          Overtime inputs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ot-hours" className={labelClass}>
              Hours worked this week
            </label>
            <input
              id="ot-hours"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.25"
              value={hoursStr}
              onChange={(e) => {
                setHoursStr(e.target.value);
                markToolUsed();
              }}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
              Decimal hours — 46.5 means 46h 30m. Adding up shifts?{' '}
              <Link href="/tools/timesheet" className="underline underline-offset-2 hover:text-foreground">
                Use the timesheet calculator
              </Link>
              .
            </p>
          </div>
          <div>
            <label htmlFor="ot-threshold" className={labelClass}>
              Overtime starts after
            </label>
            <div className="relative">
              <input
                id="ot-threshold"
                type="number"
                inputMode="decimal"
                min={0}
                value={thresholdStr}
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
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-transparent text-muted-foreground dark:text-slate-400 border-border dark:border-slate-600 hover:text-foreground'
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
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="18.50"
                value={rateStr}
                onChange={(e) => {
                  setRateStr(e.target.value);
                  markToolUsed();
                }}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section
        aria-labelledby="overtime-result-heading"
        aria-live="polite"
        className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50"
      >
        <h2 id="overtime-result-heading" className="text-lg font-bold text-foreground mb-4">
          Your split
        </h2>

        {hasError && result && 'error' in result && (
          <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
        )}

        {!hasError && split === null && (
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            Enter your hours worked to see the regular vs overtime breakdown.
          </p>
        )}

        {split && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="rounded-xl bg-background dark:bg-slate-900/40 border border-border/50 dark:border-slate-700/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  <RollingNumber value={split.regularHours} />
                </div>
                <div className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                  regular hours ({decimalToHmLabel(split.regularHours)})
                </div>
              </div>
              <div className="rounded-xl bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-600/30 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  <RollingNumber value={split.overtimeHours} />
                </div>
                <div className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                  overtime hours ({decimalToHmLabel(split.overtimeHours)})
                </div>
              </div>
            </div>

            {split.totalPay !== null ? (
              <dl className="mt-4 divide-y divide-border/50 dark:divide-slate-700/50 text-sm">
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground dark:text-slate-400">
                    Regular pay ({decimalToHmLabel(split.regularHours)} × ${Number(rateStr).toFixed(2)})
                  </dt>
                  <dd className="font-mono font-medium text-foreground">
                    $<RollingNumber value={split.regularPay!.toFixed(2)} />
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground dark:text-slate-400">
                    Overtime pay ({decimalToHmLabel(split.overtimeHours)} × ${split.overtimeRate!.toFixed(2)})
                  </dt>
                  <dd className="font-mono font-medium text-foreground">
                    $<RollingNumber value={split.overtimePay!.toFixed(2)} />
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="font-medium text-foreground">Total gross pay</dt>
                  <dd className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    $<RollingNumber value={split.totalPay.toFixed(2)} />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-3">
                Add your hourly rate to see the pay breakdown.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
