'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEventCountdown, weeksPhrase } from '@/components/EventCountdown';
import { POPULAR_COUNTDOWNS, useShareCountdown, type EventPageProps } from '@/components/EventPage';
import StationChrome from '@/components/station/StationChrome';
import SiteFooter from '@/components/SiteFooter';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { Toaster } from '@/components/ui/toaster';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { event as gaEvent } from '@/lib/gtag';

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

interface StationEventPageProps extends EventPageProps {
  /** The event's own colour for the countdown board, and the numerals on it. */
  board?: { color: string; ink?: string };
}

// EventPage in the station-clock design (design/station-clock preview): the
// countdown is a coloured departure board, days set huge and condensed, and
// a 60-tick scale under it sweeps with the real second hand. Same props as
// EventPage, so moving a page over is a one-line import change.
export default function StationEventPage({
  heading,
  tagline,
  breadcrumb,
  target,
  recurring,
  weekly,
  nthWeekday,
  dateRanges,
  countdownTitle,
  arrivedLabel,
  disclaimer,
  lastUpdated,
  extraContent,
  facts,
  intro,
  faqs,
  board,
}: StationEventPageProps) {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const pathname = usePathname();
  const handleShare = useShareCountdown();
  const title = countdownTitle ?? breadcrumb;
  const { ready, noUpcoming, isPast, dateLabel, totalDays, liveSpec, fixedTarget, targetMs, nowMs } = useEventCountdown({
    target,
    recurring,
    weekly,
    nthWeekday,
    dateRanges,
  });

  // Whole days left, then the rest of the last day as h/m/s. The targets are
  // local midnights, so whole days is the calendar count less today; before
  // mount (and in the static HTML) that stands in, so the number doesn't
  // jump when the clock starts.
  const left = ready && !isPast ? (targetMs as number) - (nowMs as number) : null;
  const days = left !== null ? Math.floor(left / DAY) : Math.max((totalDays ?? 1) - 1, 0);
  const clock = left !== null
    ? [Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60]
    : null;
  const hand = nowMs !== null ? new Date(nowMs).getSeconds() : -1;

  const verified =
    lastUpdated && facts && facts.length > 0
      ? new Date(`${lastUpdated}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

  return (
    <StationChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(faqs)} />

      <div className="st-intro" style={{ paddingBottom: 0 }}>
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/countdown/">Countdowns</Link> / {breadcrumb}
        </nav>
        <h1 className="st-h1">{heading}</h1>
        <p className="st-lede">{tagline}</p>
      </div>

      <section
        className="st-board"
        style={board ? ({ '--board': board.color, '--board-ink': board.ink ?? '#ffffff' } as React.CSSProperties) : undefined}
        aria-label={`Countdown to ${title}`}
      >
        <h2>{isPast ? (arrivedLabel ?? `${title} has released!`) : noUpcoming ? 'No date announced yet' : `Until ${title}`}</h2>
        {noUpcoming ? (
          <p className="st-sentence">This countdown starts again as soon as the next date is announced.</p>
        ) : (
          <>
            {!isPast && (
              <p className="st-days" suppressHydrationWarning>
                {days.toLocaleString()}
                <small>{days === 1 ? 'day' : 'days'}</small>
              </p>
            )}
            <div>
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
            </div>
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
          {verified && <span>Event details last verified {verified}</span>}
        </div>
      )}

      <div className="st-cta">
        <button type="button" className="st-btn primary" onClick={handleShare}>
          Share this countdown
        </button>
        <Link href="/tools/countdown/" className="st-btn quiet">
          Make your own countdown
        </Link>
      </div>
      <p className="st-nudge">
        While you wait,{' '}
        <Link href="/tools/quiz" onClick={() => gaEvent({ action: 'quiz_nudge_click', params: { from: pathname ?? 'countdown' } })}>
          try today&apos;s 60-second time quiz
        </Link>
        .
      </p>

      {facts && facts.length > 0 && (
        <section className="st-more">
          <h2>Key dates</h2>
          <div>
            <ul className="st-list">
              {facts.map((f) => (
                <li key={f.label}>
                  <span>{f.label}</span>
                  <span>{f.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="st-more">
        <h2>About this countdown</h2>
        <div>
          <p style={{ margin: 0 }}>{intro}</p>
        </div>
      </section>

      {extraContent}

      <section className="st-more">
        <h2>Questions</h2>
        <div className="st-faq">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="st-more">
        <h2>More countdowns</h2>
        <div className="st-chips">
          {POPULAR_COUNTDOWNS.filter((c) => !pathname?.startsWith(c.href.replace(/\/$/, ''))).map((c) => (
            <Link key={c.href} href={c.href}>
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 56 }}>
        <SiteFooter />
      </div>
      <Toaster />
    </StationChrome>
  );
}
