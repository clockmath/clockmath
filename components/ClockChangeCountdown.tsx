'use client';

import { useEffect, useState } from 'react';
import { StationBoard, StationNotice } from '@/components/station/StationBoard';
import { getUserTimeZone, getTimezoneOffset } from '@/lib/time';

interface ClockChange {
  /** Instant the clocks change (ms). */
  at: number;
  /** UTC offsets in minutes either side of it. */
  before: number;
  after: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The next instant `timeZone` changes its UTC offset, within ~13 months.
 * Scans a day at a time, then narrows to the minute. Goes through lib/time's
 * getTimezoneOffset, so places that stopped changing clocks in 2026 (BC,
 * Alberta, the Northwest Territories, Manitoba) correctly show no change even on browsers with stale tz data.
 */
export function nextClockChange(timeZone: string, fromMs: number): ClockChange | null {
  let lo = fromMs;
  let loOffset = getTimezoneOffset(timeZone, new Date(lo));
  for (let day = 0; day < 400; day++) {
    const hi = lo + DAY_MS;
    const hiOffset = getTimezoneOffset(timeZone, new Date(hi));
    if (hiOffset !== loOffset) {
      // Narrow to the millisecond: `b` ends as the first instant on the new
      // offset. (Stopping at a minute and rounding overshoots by one when the
      // search lands just past the boundary.)
      let a = lo;
      let b = hi;
      while (b - a > 1) {
        const mid = Math.floor((a + b) / 2);
        if (getTimezoneOffset(timeZone, new Date(mid)) === loOffset) a = mid;
        else b = mid;
      }
      return { at: b, before: loOffset, after: hiOffset };
    }
    lo = hi;
    loOffset = hiOffset;
  }
  return null;
}

/** Wall-clock time an instant shows at a given UTC offset, e.g. "2:00 AM". */
const wallTime = (ms: number, offsetMinutes: number): string =>
  new Date(ms + offsetMinutes * 60_000).toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  });

const shiftLabel = (minutes: number): string => {
  const m = Math.abs(minutes);
  if (m === 60) return 'one hour';
  if (m % 60 === 0) return `${m / 60} hours`;
  return `${m} minutes`;
};

export const clockPlaceName = (tz: string): string => tz.split('/').pop()?.replace(/_/g, ' ') || tz;
const placeName = clockPlaceName;

const NO_CHANGE_NOTES: Record<string, string> = {
  'America/Vancouver':
    'British Columbia stopped changing its clocks in 2026 and now stays on UTC−7 all year, so there is no change on November 1.',
  'America/Edmonton':
    'Alberta stopped changing its clocks in 2026 and now stays on UTC−6 all year, so there is no change on November 1.',
  'America/Yellowknife':
    'The Northwest Territories stopped changing their clocks in 2026 and now stay on UTC−6 all year, like Alberta, so there is no change on November 1.',
  'America/Inuvik':
    'The Northwest Territories stopped changing their clocks in 2026 and now stay on UTC−6 all year, like Alberta, so there is no change on November 1.',
  'America/Winnipeg':
    'Manitoba stopped changing its clocks in 2026 and now stays on UTC−5 all year, so there is no change on November 1.',
};

export type ClockChangeState =
  | { status: 'pending' }
  | { status: 'none'; tz: string }
  | { status: 'change'; tz: string; change: ClockChange };

/** The visitor's next clock change, resolved on the client (their timezone). */
export function useNextClockChange(): ClockChangeState {
  const [state, setState] = useState<ClockChangeState>({ status: 'pending' });
  useEffect(() => {
    const tz = getUserTimeZone();
    const change = nextClockChange(tz, Date.now());
    setState(change ? { status: 'change', tz, change } : { status: 'none', tz });
  }, []);
  return state;
}

/** "back" when the offset drops (autumn), "forward" when it rises. */
export const changeDirection = (change: ClockChange): 'back' | 'forward' => (change.after < change.before ? 'back' : 'forward');

export default function ClockChangeCountdown() {
  const state = useNextClockChange();

  if (state.status === 'pending') {
    // Stable skeleton until the visitor's own timezone is known (no hydration mismatch).
    return <StationBoard key="pending" title="the clocks change" />;
  }

  if (state.status === 'none') {
    return (
      <StationNotice heading="Your clocks don&apos;t change">
        <p>
          {placeName(state.tz)} stays on the same time all year — there is no clock change in the next twelve months.
        </p>
        {NO_CHANGE_NOTES[state.tz] && <p>{NO_CHANGE_NOTES[state.tz]}</p>}
        <p>Dates for places that do change are in the table below.</p>
      </StationNotice>
    );
  }

  const { tz, change } = state;
  const direction = changeDirection(change);
  const day = new Date(change.at).toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <StationBoard
      key={change.at}
      target={new Date(change.at)}
      title={`the clocks go ${direction}`}
      arrivedLabel="The clocks have changed"
    >
      In <strong>{placeName(tz)}</strong>, on <strong>{day}</strong>, at{' '}
      <strong>{wallTime(change.at, change.before)}</strong> the clocks go {direction}{' '}
      {shiftLabel(change.after - change.before)} to <strong>{wallTime(change.at, change.after)}</strong> —{' '}
      {shiftLabel(change.after - change.before)} {direction === 'back' ? 'extra' : 'less'} that night.
    </StationBoard>
  );
}
