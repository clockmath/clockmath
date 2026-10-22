'use client';

import type { ReactNode } from 'react';
import { useEventCountdown, weeksPhrase, type CountdownTarget } from '@/components/EventCountdown';

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

interface StationBoardProps extends CountdownTarget {
  /** "Until {title}" and the answer sentence. */
  title: string;
  /** Heading once the target has arrived. */
  arrivedLabel?: string;
  /** Trademark/affiliation note (buildEventDisclaimer), set small on the board. */
  disclaimer?: string;
  /** Extra line in the date row, e.g. "Event details last verified …". */
  dateNote?: ReactNode;
  /** A sentence under the date row (eclipse peak time, clock-change detail). */
  children?: ReactNode;
}

// The countdown as a departure board: days set huge and condensed, the rest
// of the last day as h/m/s, then a 60-tick scale under it that sweeps with
// the real second hand. Colours come from --board / --board-ink on an
// ancestor (EventPage sets them per event). The answer sentence carries the
// worker's data-days-until / data-live hooks (scripts/worker/live-counts.js).
export function StationBoard({
  target,
  recurring,
  weekly,
  nthWeekday,
  dateRanges,
  title,
  arrivedLabel,
  disclaimer,
  dateNote,
  children,
}: StationBoardProps) {
  const { ready, noUpcoming, isPast, dateLabel, totalDays, liveSpec, fixedTarget, targetMs, nowMs } = useEventCountdown({
    target,
    recurring,
    weekly,
    nthWeekday,
    dateRanges,
  });

  // The targets are local midnights (or a fixed instant), so whole days left
  // is the calendar count less today; before mount (and in the static HTML)
  // that stands in, so the number doesn't jump when the clock starts.
  const left = ready && !isPast ? (targetMs as number) - (nowMs as number) : null;
  const days = left !== null ? Math.floor(left / DAY) : totalDays !== null ? Math.max(totalDays - 1, 0) : null;
  const clock = left !== null
    ? [Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60]
    : null;
  const hand = nowMs !== null ? new Date(nowMs).getSeconds() : -1;

  return (
    <div>
      <section className="st-board" aria-label={`Countdown to ${title}`}>
        <h2>{isPast ? (arrivedLabel ?? `${title} has released!`) : noUpcoming ? 'No date announced yet' : `Until ${title}`}</h2>
        {noUpcoming ? (
          <p className="st-sentence">This countdown starts again as soon as the next date is announced.</p>
        ) : (
          <>
            {/* Days and the rest of the last day read as one duration, "Time
                left: 35 days 11:26:05"; the calendar-day sentence follows on
                its own line. (Side by side, "35 days" next to "There are 36
                days until…" looked like a mistake; both are right.) */}
            {!isPast && (
              <div>
                <p className="st-left-cap">Time left</p>
                <p className="st-days" suppressHydrationWarning>
                  {days === null ? '--' : days.toLocaleString()}
                  <small>{days === 1 ? 'day' : 'days'}</small>
                </p>
              </div>
            )}
            {!isPast && (
              <dl className="st-clock" aria-live="off">
                {(['hours', 'minutes', 'seconds'] as const).map((unit, i) => (
                  <div key={unit}>
                    <dd suppressHydrationWarning>{clock ? pad(clock[i]) : '--'}</dd>
                    <dt>{unit}</dt>
                  </div>
                ))}
              </dl>
            )}
            {totalDays !== null && (
              <p className="st-sentence" data-days-until={liveSpec} suppressHydrationWarning>
                There{' '}
                <span data-live="verb" suppressHydrationWarning>
                  {totalDays === 1 ? 'is' : 'are'}
                </span>{' '}
                <strong data-live="days" suppressHydrationWarning>
                  {totalDays === 1 ? '1 day' : `${totalDays.toLocaleString()} days`}
                </strong>{' '}
                until {title}.
                <span data-live="weeks" suppressHydrationWarning>
                  {weeksPhrase(totalDays)}
                </span>
              </p>
            )}
          </>
        )}
        {disclaimer && <p className="st-disclaimer">{disclaimer}</p>}
      </section>

      {/* The station clock's second hand: one tick per second of the minute */}
      <div className="st-seconds" aria-hidden="true">
        <svg viewBox="0 0 1000 30" preserveAspectRatio="none">
          {Array.from({ length: 60 }, (_, i) => {
            const x = 3 + (i / 59) * 994;
            return (
              <line
                key={i}
                x1={x}
                x2={x}
                y1={i % 5 === 0 ? 2 : 10}
                y2={28}
                strokeWidth={i % 5 === 0 ? 3 : 2}
                vectorEffect="non-scaling-stroke"
                className={i === hand ? 'now' : i < hand ? 'past' : undefined}
              />
            );
          })}
        </svg>
      </div>

      {!noUpcoming && (
        <div className="st-date">
          <b data-live-date={fixedTarget} suppressHydrationWarning>
            {dateLabel}
          </b>
          {dateNote && <span>{dateNote}</span>}
        </div>
      )}
      {children && <p className="st-board-note">{children}</p>}
    </div>
  );
}

/** A board with no timer, for "your clocks don't change"-style answers. */
export function StationNotice({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="st-board st-notice">
      <h2>{heading}</h2>
      <div className="st-sentence">{children}</div>
    </section>
  );
}
