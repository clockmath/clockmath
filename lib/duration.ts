/**
 * The time duration calculator's maths (the homepage). Moved out of
 * app/page.tsx in the Oct 2026 review so it can be tested: it lived inside
 * the component as useCallbacks, with nothing checking overnight spans or
 * clock changes.
 */
import { intervalToDuration, type Duration } from 'date-fns';

/** "HH:MM" or "HH:MM:SS" as seconds after midnight, or NaN. */
export function parseTimeToSeconds(str: string): number {
  if (!str) return Number.NaN;
  const parts = str.split(':');
  if (parts.length < 2) return Number.NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts[2] !== undefined ? parseInt(parts[2], 10) : 0;
  if ([hours, minutes, seconds].some(Number.isNaN)) return Number.NaN;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return Number.NaN;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * A calendar-accurate breakdown (from date-fns intervalToDuration) as a
 * friendly summary: "1 day 2h 30m". Single source of truth for the summary.
 */
export function formatDurationParts(d: Duration): string {
  const years = d.years ?? 0;
  const months = d.months ?? 0;
  const days = d.days ?? 0;
  const hours = d.hours ?? 0;
  const minutes = d.minutes ?? 0;
  const seconds = d.seconds ?? 0;

  const parts: string[] = [];
  if (years) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  // Show seconds only for sub-day durations (avoids noise on long spans).
  if (seconds && !years && !months && !days) parts.push(`${seconds}s`);
  return parts.length ? parts.join(' ') : '0s';
}

/**
 * Calendar-accurate duration between two datetimes (handles real month
 * lengths, leap years, DST) — replaces average-constant division.
 */
export function formatDuration(start: Date, end: Date): string {
  if (end.getTime() < start.getTime()) return 'Invalid';
  return formatDurationParts(intervalToDuration({ start, end }));
}

/** A length of time in every unit, rounded for display. Null for a bad length. */
export function formatDetailedDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return null;

  // Calculate all time units with appropriate precision
  const years = seconds / (365.25 * 24 * 3600);
  const months = seconds / (30.44 * 24 * 3600);
  const weeks = seconds / (7 * 24 * 3600);
  const days = seconds / (24 * 3600);
  const hours = seconds / 3600;
  const minutes = seconds / 60;

  return {
    years: parseFloat(years.toFixed(4)),
    months: parseFloat(months.toFixed(3)),
    weeks: parseFloat(weeks.toFixed(2)),
    days: parseFloat(days.toFixed(2)),
    hours: parseFloat(hours.toFixed(2)),
    minutes: parseFloat(minutes.toFixed(1)),
    seconds: Math.round(seconds),
  };
}

export interface SpanInputs {
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
}

/**
 * The span between a set of inputs, in the device's timezone. Same date with
 * an earlier end time is an overnight span (22:00 → 06:00), as the FAQ
 * promises: the end is the next day. A genuinely earlier end date is an error.
 */
export function spanBetween({ startDate, startTime, endDate, endTime }: SpanInputs) {
  const startSeconds = parseTimeToSeconds(startTime);
  const endSeconds = parseTimeToSeconds(endTime);
  if (isNaN(startSeconds) || isNaN(endSeconds)) return { error: 'Enter a start and end time, like 09:00.' } as const;

  const at = (date: Date, secs: number) => {
    const d = new Date(date);
    d.setHours(Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60, 0);
    return d;
  };
  const start = at(startDate, startSeconds);
  const end = at(endDate, endSeconds);
  let overnight = false;
  if (end < start && end.toDateString() === start.toDateString()) {
    end.setDate(end.getDate() + 1);
    overnight = true;
  }
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (seconds < 0) return { error: 'The end is before the start. Pick a later end date or time.' } as const;
  // Oct 2026 review: noon to noon across the fall-back night showed
  // "1 day" beside 25.00 decimal hours, unexplained. Real time less
  // clock-face time is the clock change in between (+60 back, -60 forward).
  const wall = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
  const clockShift = Math.round((seconds - (wall(end) - wall(start)) / 1000) / 60);
  return {
    start,
    end,
    seconds,
    overnight,
    clockShift,
    parts: intervalToDuration({ start, end }),
    summary: formatDuration(start, end),
    detailed: formatDetailedDuration(seconds),
  };
}
