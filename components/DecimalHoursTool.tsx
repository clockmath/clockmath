/**
 * DecimalHoursTool component for ClockMath.com
 * Two-way converter between hours:minutes and decimal hours, with the
 * payroll reference chart. Conversions run live as you type.
 */

'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { toolUsed } from '@/lib/gtag';

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop';

interface DecimalHoursToolProps {
  className?: string;
}

/** minutes → decimal hours fraction, 2dp (payroll convention) */
export function minutesToDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

/** decimal hours → whole hours + minutes (minutes rounded to nearest) */
export function decimalToHm(decimal: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(decimal * 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

const parseNum = (s: string): number => {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export function DecimalHoursTool({ className = '' }: DecimalHoursToolProps) {
  const toolUsedRef = useRef(false);
  const [hoursStr, setHoursStr] = useState('7');
  const [minutesStr, setMinutesStr] = useState('45');
  const [decimalStr, setDecimalStr] = useState('8.25');

  const markToolUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('decimal_hours', { device: getDevice() });
    }
  }, []);

  // Time → decimal
  const toDecimal = useMemo(() => {
    const h = hoursStr.trim() === '' ? 0 : parseNum(hoursStr);
    const m = minutesStr.trim() === '' ? 0 : parseNum(minutesStr);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    if (m >= 60) return { error: 'Minutes should be 0–59 — whole hours go in the hours field.' };
    const value = Math.round((h + m / 60) * 100) / 100;
    return { value, h, m };
  }, [hoursStr, minutesStr]);

  // Decimal → time
  const toTime = useMemo(() => {
    if (decimalStr.trim() === '') return null;
    const d = parseNum(decimalStr);
    if (Number.isNaN(d)) return null;
    return { ...decimalToHm(d), d };
  }, [decimalStr]);

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-background dark:bg-slate-900/60 border border-border dark:border-slate-700 text-foreground text-lg font-mono outline-none focus:ring-2 focus:ring-emerald-500/50';

  return (
    <div className={`grid gap-6 sm:grid-cols-2 ${className}`}>
      {/* Time → decimal */}
      <section
        aria-labelledby="to-decimal-heading"
        className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50"
      >
        <h2 id="to-decimal-heading" className="text-lg font-bold text-foreground mb-4">
          Hours &amp; minutes → decimal
        </h2>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label htmlFor="dh-hours" className="block text-sm font-medium text-foreground mb-1">
              Hours
            </label>
            <input
              id="dh-hours"
              type="number"
              inputMode="numeric"
              min={0}
              value={hoursStr}
              onChange={(e) => {
                setHoursStr(e.target.value);
                markToolUsed();
              }}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="dh-minutes" className="block text-sm font-medium text-foreground mb-1">
              Minutes
            </label>
            <input
              id="dh-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={minutesStr}
              onChange={(e) => {
                setMinutesStr(e.target.value);
                markToolUsed();
              }}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex justify-center mb-3" aria-hidden="true">
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="text-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 py-4 px-3"
        >
          {toDecimal === null ? (
            <p className="text-sm text-muted-foreground">Enter hours and minutes above</p>
          ) : 'error' in toDecimal ? (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{toDecimal.error}</p>
          ) : (
            <>
              <p className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {toDecimal.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                decimal hours ({toDecimal.h}h {toDecimal.m}m)
              </p>
            </>
          )}
        </div>
      </section>

      {/* Decimal → time */}
      <section
        aria-labelledby="to-time-heading"
        className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50"
      >
        <h2 id="to-time-heading" className="text-lg font-bold text-foreground mb-4">
          Decimal → hours &amp; minutes
        </h2>
        <div className="mb-4">
          <label htmlFor="dh-decimal" className="block text-sm font-medium text-foreground mb-1">
            Decimal hours
          </label>
          <input
            id="dh-decimal"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={decimalStr}
            onChange={(e) => {
              setDecimalStr(e.target.value);
              markToolUsed();
            }}
            className={inputClass}
          />
        </div>
        <div className="flex justify-center mb-3" aria-hidden="true">
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="text-center rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 py-4 px-3"
        >
          {toTime === null ? (
            <p className="text-sm text-muted-foreground">Enter decimal hours above</p>
          ) : (
            <>
              <p className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {toTime.hours}h {toTime.minutes}m
              </p>
              <p className="text-xs text-muted-foreground mt-1">{toTime.d} decimal hours</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
