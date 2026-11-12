/**
 * The hour-by-hour chart on a time difference page: each hour of the first
 * city's day and the time in the second, shaded for working hours, waking
 * hours and night. One chart per gap the pair has in a year (New York and
 * London: 5 hours, and 4 for three weeks), the year's main gap first; that
 * one is in the static HTML, so it never goes stale between deploys.
 * Follows the site's 12h/24h setting (12-hour until mount, as everywhere).
 */

'use client';

import { useState } from 'react';
import { useClockFormat } from '@/hooks/use-clock-format';
import { dayShiftWords, formatClock, formatGap, hourRows, type HourKind } from '@/lib/timePairs';

const KIND_LABEL: Record<HourKind, string> = { work: 'Working hours', awake: 'Awake', night: 'Night' };

export function TimePairHours({
  aName,
  bName,
  gaps,
}: {
  aName: string;
  bName: string;
  /** The gaps (minutes) with a label each, e.g. "most of the year" */
  gaps: Array<{ gap: number; label: string }>;
}) {
  const [is24h] = useClockFormat();
  const [shown, setShown] = useState(0);
  const { gap, label } = gaps[shown] ?? gaps[0];
  const rows = hourRows(gap);

  return (
    <div className="st-tp-hours">
      {gaps.length > 1 && (
        <div className="st-seg st-tp-gaps" role="group" aria-label={`Time difference between ${aName} and ${bName}`}>
          {gaps.map((g, i) => (
            <button key={g.gap} type="button" aria-pressed={i === shown} onClick={() => setShown(i)}>
              {g.gap === 0 ? 'Same time' : formatGap(g.gap).replace(' minutes', 'm').replace(' hours', 'h').replace(' hour', 'h')}
            </button>
          ))}
        </div>
      )}
      <p className="st-tp-hours-cap">
        {gap === 0 ? `${aName} and ${bName} on the same time` : `${bName} ${formatGap(gap)} ${gap > 0 ? 'ahead' : 'behind'}`}: {label}
      </p>
      <table className="st-tp-table">
        <thead>
          <tr>
            <th scope="col">{aName}</th>
            <th scope="col">{bName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.a}>
              <td data-kind={r.aKind}>
                {formatClock(r.a, is24h)}
                <span className="sr-only">, {KIND_LABEL[r.aKind]}</span>
              </td>
              <td data-kind={r.bKind}>
                {formatClock(r.b, is24h)}
                {r.bDayShift !== 0 && <small>{dayShiftWords(r.bDayShift).replace(' the ', ' ')}</small>}
                <span className="sr-only">, {KIND_LABEL[r.bKind]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="st-tp-key" aria-hidden="true">
        <span data-kind="work">Working hours, 9 to 5</span>
        <span data-kind="awake">Awake, 7 AM to 11 PM</span>
        <span data-kind="night">Night</span>
      </p>
    </div>
  );
}
