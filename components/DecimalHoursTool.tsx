/**
 * DecimalHoursTool component for ClockMath.com
 * Two-way converter between hours:minutes and decimal hours, with the
 * payroll reference chart. Conversions run live as you type.
 *
 * Oct 2026 audit: the fields are plain text read by parseAmount/parseHours
 * (lib/overtime.ts), not type="number" — that dropped commas and colons, so
 * "8,25" read 825h and "7:45" in the hours box read 745.75 hours. A time in
 * the hours box converts whole; minutes past 59 carry into the hours; a
 * field that can't be read says so under itself.
 */

'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { RollingNumber } from '@/components/RollingNumber';
import { toolUsed } from '@/lib/gtag';
import { getDevice } from '@/lib/device';
import { parseAmount, parseHours } from '@/lib/overtime';
import { copyText } from '@/lib/clipboard';


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

/** A time written out ("7:45", "7h 45m"), as opposed to a plain number */
const isWrittenTime = (s: string) => /[:h]/i.test(s);

/** Copy a result, saying "Copied" for a moment (the decimal usually goes into a payroll form) */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="st-copy mt-3 inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium"
      aria-label={label}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

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

  // Time → decimal. A written time in the hours box ("7:45") is the whole
  // time, and the minutes box is set aside; minutes past 59 carry (90 → 1h 30m).
  const timeInHoursBox = isWrittenTime(hoursStr);
  const toDecimal = useMemo(() => {
    const h = hoursStr.trim() === '' ? 0 : timeInHoursBox ? parseHours(hoursStr) : parseAmount(hoursStr);
    const m = timeInHoursBox || minutesStr.trim() === '' ? 0 : parseAmount(minutesStr);
    const hoursNote =
      h === null ? (timeInHoursBox ? 'Use a time like 7:45 or 7h 45m.' : 'Use a number of hours, like 7.') : Number.isNaN(h) ? "Hours can't be negative." : null;
    const minutesNote = m === null ? 'Use a number of minutes, like 45.' : Number.isNaN(m) ? "Minutes can't be negative." : null;
    if (hoursNote || minutesNote || h === null || m === null) return { hoursNote, minutesNote };
    const totalMinutes = Math.round(h * 60 + m);
    return {
      hoursNote: null,
      minutesNote: null,
      value: Math.round((totalMinutes / 60) * 100) / 100,
      h: Math.floor(totalMinutes / 60),
      m: totalMinutes % 60,
    };
  }, [hoursStr, minutesStr, timeInHoursBox]);

  // Decimal → time
  const toTime = useMemo(() => {
    if (decimalStr.trim() === '') return null;
    const d = parseAmount(decimalStr);
    if (d === null) return { note: 'Use decimal hours, like 8.25.' };
    if (Number.isNaN(d)) return { note: "Hours can't be negative." };
    return { ...decimalToHm(d), d };
  }, [decimalStr]);

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-background dark:bg-background/60 border border-border dark:border-border text-foreground text-lg font-mono outline-none focus:ring-2 focus:ring-primary/50';
  const noteFor = (id: string, note: string | null | undefined) =>
    note && (
      <p id={`${id}-note`} role="status" className="mt-1 mb-0 text-sm text-red-700 dark:text-red-300">
        {note}
      </p>
    );

  return (
    <div className={`grid gap-6 sm:grid-cols-2 ${className}`}>
      {/* Time → decimal */}
      <section
        aria-labelledby="to-decimal-heading"
        className="st-panel bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50"
      >
        <h2 id="to-decimal-heading" className="text-lg font-bold text-foreground mb-4">
          Hours &amp; minutes → decimal
        </h2>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="dh-hours" className="block text-sm font-medium text-foreground mb-1">
              Hours
            </label>
            <input
              id="dh-hours"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={hoursStr}
              aria-invalid={toDecimal.hoursNote ? true : undefined}
              aria-describedby={toDecimal.hoursNote ? 'dh-hours-note' : undefined}
              onChange={(e) => {
                setHoursStr(e.target.value);
                markToolUsed();
              }}
              className={inputClass}
            />
            {noteFor('dh-hours', toDecimal.hoursNote)}
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="dh-minutes" className="block text-sm font-medium text-foreground mb-1">
              Minutes
            </label>
            <input
              id="dh-minutes"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={minutesStr}
              disabled={timeInHoursBox}
              aria-invalid={toDecimal.minutesNote ? true : undefined}
              aria-describedby={timeInHoursBox ? 'dh-minutes-aside' : toDecimal.minutesNote ? 'dh-minutes-note' : undefined}
              onChange={(e) => {
                setMinutesStr(e.target.value);
                markToolUsed();
              }}
              className={`${inputClass} disabled:opacity-50`}
            />
            {timeInHoursBox ? (
              <p id="dh-minutes-aside" className="mt-1 mb-0 text-sm text-muted-foreground">
                Not needed: the hours box has the whole time.
              </p>
            ) : (
              noteFor('dh-minutes', toDecimal.minutesNote)
            )}
          </div>
        </div>
        <div className="flex justify-center mb-3" aria-hidden="true">
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="st-result text-center rounded-xl bg-primary/10 border border-primary/30 py-4 px-3"
        >
          {'value' in toDecimal && toDecimal.value !== undefined ? (
            <>
              <p className="st-figure text-3xl font-bold font-mono text-primary">
                {/* Always two places, as payroll writes it: 1.50, not 1.5 */}
                <RollingNumber value={toDecimal.value.toFixed(2)} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                decimal hours ({toDecimal.h}h {toDecimal.m}m)
              </p>
              <CopyButton text={toDecimal.value.toFixed(2)} label={`Copy ${toDecimal.value.toFixed(2)} decimal hours`} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Check the field marked above to see the decimal.</p>
          )}
        </div>
      </section>

      {/* Decimal → time */}
      <section
        aria-labelledby="to-time-heading"
        className="st-panel bg-card dark:bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-border/50"
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
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={decimalStr}
            aria-invalid={toTime && 'note' in toTime ? true : undefined}
            aria-describedby={toTime && 'note' in toTime ? 'dh-decimal-note' : undefined}
            onChange={(e) => {
              setDecimalStr(e.target.value);
              markToolUsed();
            }}
            className={inputClass}
          />
          {noteFor('dh-decimal', toTime && 'note' in toTime ? toTime.note : null)}
        </div>
        <div className="flex justify-center mb-3" aria-hidden="true">
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="st-result text-center rounded-xl bg-primary/10 border border-primary/30 py-4 px-3"
        >
          {toTime === null ? (
            <p className="text-sm text-muted-foreground">Enter decimal hours above</p>
          ) : 'note' in toTime ? (
            <p className="text-sm text-muted-foreground">Check the field marked above to see the time.</p>
          ) : (
            <>
              <p className="st-figure text-3xl font-bold font-mono text-primary">
                <RollingNumber value={`${toTime.hours}h ${toTime.minutes}m`} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">{toTime.d} decimal hours</p>
              <CopyButton
                text={`${toTime.hours}:${String(toTime.minutes).padStart(2, '0')}`}
                label={`Copy ${toTime.hours}:${String(toTime.minutes).padStart(2, '0')}`}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
