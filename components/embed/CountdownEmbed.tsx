'use client';

import { buildDayCount, useEventCountdown, type CountdownTarget } from '@/components/EventCountdown';
import { changeDirection, clockPlaceName, useNextClockChange } from '@/components/ClockChangeCountdown';
import { Archivo, BigShoulders } from '@/components/station/fonts';
import { parseWallClock } from '@/lib/wallClock';
import { Flap } from '@/components/station/Flap';
import { tileShade } from '@/lib/colour';
import { getCountdown, type CountdownEntry } from '@/lib/countdowns';
import '@/components/station/station.css';
import '@/components/station/type.css';
import './embed.css';

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');
const CREDIT_QUERY = 'utm_source=embed&utm_medium=countdown_widget';

interface BoardProps extends CountdownTarget {
  title: string;
  arrivedLabel?: string;
  board: { color: string; ink?: string };
  /** Where the ClockMath credit links (an event page or a shared countdown). */
  href: string;
  /** Shown instead of the timer (e.g. "Your clocks don't change"). */
  notice?: string;
  /** Trademark note for brand events, one small line at the foot. */
  disclaimer?: string;
}

// The board, sized to whatever box the host page gives the iframe: days big,
// the rest of the day as h/m/s, the date, and the second-hand ticks. No
// analytics run here (the root layout skips them on /embed/), so an embed
// sets no cookies on someone else's site.
function EmbedBoard({ title, arrivedLabel, board, href, notice, disclaimer, ...target }: BoardProps) {
  const { ready, noUpcoming, isPast, dateLabel, targetMs, nowMs } = useEventCountdown(target);
  const left = ready && !isPast ? (targetMs as number) - (nowMs as number) : null;
  const clock = left !== null ? [Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60] : null;
  const hand = nowMs !== null ? new Date(nowMs).getSeconds() : -1;
  // Before the clock starts (and in the static HTML) the count from the build
  // day stands in, as on the event pages: the same on server and client, which
  // the tiles need to hydrate. Blank if unknown.
  const fromBuild = buildDayCount(target);
  const days = left !== null ? Math.floor(left / DAY) : fromBuild !== null ? Math.max(fromBuild - 1, 0) : null;
  const heading = notice ?? (isPast ? (arrivedLabel ?? `${title} is here`) : noUpcoming ? 'No date announced yet' : `Until ${title}`);
  const showTimer = !notice && !isPast && !noUpcoming;

  return (
    <div
      className={`station st-embed ${Archivo.variable} ${BigShoulders.variable}`}
      style={{ '--board': board.color, '--board-ink': board.ink ?? '#ffffff', '--tile': tileShade(board.color) } as React.CSSProperties}
    >
      <div className="st-embed-in">
        <div className="st-embed-top">
          <p className="st-embed-title">{heading}</p>
          <a className="st-embed-credit" href={href} target="_blank" rel="noopener">
            ClockMath
          </a>
        </div>
        {showTimer && (
          <div className="st-embed-row" aria-live="off">
            <p className="st-embed-days">
              {days !== null && <Flap value={String(days)} />}
              <small>{days === 1 ? 'day' : 'days'}</small>
            </p>
            <dl className="st-embed-clock">
              {(['hours', 'minutes', 'seconds'] as const).map((unit, i) => (
                <div key={unit}>
                  <dd>{clock ? <Flap value={pad(clock[i])} /> : '\u00a0'}</dd>
                  <dt>{unit}</dt>
                </div>
              ))}
            </dl>
          </div>
        )}
        {!notice && !noUpcoming && <p className="st-embed-date">{dateLabel}</p>}
        {showTimer && (
          <svg className="st-embed-ticks" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 60 }, (_, i) => {
              const x = 3 + (i / 59) * 994;
              return (
                <line
                  key={i}
                  x1={x}
                  x2={x}
                  y1={i === hand ? 0 : i % 5 === 0 ? 4 : 10}
                  y2={22}
                  strokeWidth={i % 5 === 0 || i === hand ? 3 : 2}
                  vectorEffect="non-scaling-stroke"
                  className={i <= hand ? 'past' : undefined}
                />
              );
            })}
          </svg>
        )}
        {disclaimer && <p className="st-embed-note" title={disclaimer}>{disclaimer}</p>}
      </div>
    </div>
  );
}

function ClockChangeEmbed({ entry }: { entry: CountdownEntry }) {
  const state = useNextClockChange();
  const href = `https://clockmath.com${entry.path}?${CREDIT_QUERY}`;
  if (state.status === 'none') {
    return <EmbedBoard title="the clocks change" board={entry.spec.board} href={href} notice={`Clocks don't change in ${clockPlaceName(state.tz)}`} />;
  }
  if (state.status === 'pending') return <EmbedBoard key="pending" title="the clocks change" board={entry.spec.board} href={href} />;
  return (
    <EmbedBoard
      key={state.change.at}
      target={new Date(state.change.at)}
      title={`the clocks go ${changeDirection(state.change)}`}
      arrivedLabel="The clocks have changed"
      board={entry.spec.board}
      href={href}
    />
  );
}

/** An event countdown's embed (/embed/countdown/<slug>/). */
export function EventCountdownEmbed({ slug }: { slug: string }) {
  const entry = getCountdown(slug);
  if (!entry) return null;
  if (entry.clockChange) return <ClockChangeEmbed entry={entry} />;
  const href = `https://clockmath.com${entry.path}?${CREDIT_QUERY}`;
  if (entry.eclipse) {
    return (
      <EmbedBoard
        target={new Date(entry.eclipse.peakMs)}
        title={entry.eclipse.title}
        arrivedLabel={entry.eclipse.arrivedLabel}
        board={entry.spec.board}
        href={href}
      />
    );
  }
  const { countdownTitle, arrivedLabel, board, disclaimer, ...target } = entry.spec;
  return (
    <EmbedBoard {...target} title={countdownTitle ?? entry.name} arrivedLabel={arrivedLabel} board={board} href={href} disclaimer={disclaimer} />
  );
}

/** Readable numerals for a visitor-picked board colour: black or white. */
function inkFor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.179 ? '#000000' : '#ffffff';
}

/**
 * A countdown someone made in the countdown tool (/embed/countdown/?to=…).
 * Same parameters as the tool's share link, plus an optional board colour.
 */
export function CustomCountdownEmbed({ to, title, color }: { to: string | null; title: string | null; color: string | null }) {
  const parsed = parseWallClock(to);
  const board = color && /^#[0-9a-f]{6}$/i.test(color) ? { color, ink: inkFor(color) } : { color: '#1849a9' };
  const share = new URLSearchParams();
  if (to) share.set('to', to);
  if (title) share.set('title', title);
  const href = `https://clockmath.com/tools/countdown/?${share.toString()}&${CREDIT_QUERY}`;
  if (!parsed) {
    return <EmbedBoard title="your date" board={board} href="https://clockmath.com/tools/countdown/" notice="This countdown's date is missing" />;
  }
  const name = title?.trim().slice(0, 80) || 'the big day';
  return <EmbedBoard target={parsed} title={name} arrivedLabel={`${name} is here`} board={board} href={href} />;
}
