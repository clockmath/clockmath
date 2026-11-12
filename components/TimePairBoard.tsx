/**
 * The board on a time difference page (/time/<a>-to-<b>/): the time now in
 * both cities on split-flap tiles, and the gap in a sentence.
 *
 * Two clocks keep it right, as on today's date page. In the browser, the
 * device's clock, ticking. In the static HTML (what Bing and Copilot read),
 * the sentence and both times are plain-text spans the worker rewrites per
 * request from the build's offset table on data-pair-spec
 * (scripts/worker/live-counts.js); they carry suppressHydrationWarning, since
 * the worker's text and the first client render (the build's) can differ.
 * The tiles can't be rewritten that way, so before mount they show "--:--",
 * the same on server and client.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flap } from '@/components/station/Flap';
import { useClockFormat } from '@/hooks/use-clock-format';
import { getTimezoneOffset } from '@/lib/time';
import { formatClock, relationSentence, utcLabel, wallClockLabel } from '@/lib/timePairs';

interface Side {
  name: string;
  zone: string;
  /** Short name per UTC offset, e.g. { "-300": "EST" } */
  abbr: Record<number, string>;
}

export function TimePairBoard({
  a,
  b,
  spec,
  build,
  converterHref,
}: {
  a: Side;
  b: Side;
  /** lib/timePairs liveSpec, read by the worker */
  spec: string;
  /** The offsets and instant at build time: the first render's */
  build: { ms: number; a: number; b: number };
  converterHref: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  const [is24h, setIs24h] = useClockFormat();

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = now ?? build.ms;
  const offA = now === null ? build.a : getTimezoneOffset(a.zone, new Date(ms));
  const offB = now === null ? build.b : getTimezoneOffset(b.zone, new Date(ms));
  const gap = offB - offA;

  // The difference as a figure between the clocks: "+5h", "−3h", "+9h 30m"
  // (B against A). From the build's gap until mount, like the tiles' "--"
  const gapH = Math.floor(Math.abs(gap) / 60);
  const gapM = Math.abs(gap) % 60;
  const sign = gap > 0 ? '+' : '−';

  const city = (side: Side, offset: number, area: 'a' | 'b') => {
    const d = new Date(ms + offset * 60_000);
    const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
    const [clock, suffix] = formatClock(minutes, is24h).split(' ');
    const [hh, mm] = now === null ? ['--', '--'] : clock.split(':');
    return (
      <div className={`st-tp-city st-tp-${area}`}>
        <p className="st-tp-place">{side.name}</p>
        <p className="st-big st-tp-time" aria-hidden="true">
          <Flap value={hh} />
          <span className="st-tz-colon">:</span>
          <Flap value={mm} />
          {suffix && now !== null && <span className="u">{suffix}</span>}
        </p>
        <p className="st-tp-zone">
          {now === null ? (
            ' '
          ) : (
            <>
              {wallClockLabel(ms, offset, is24h).split(' ')[0]} · {side.abbr[offset] ?? utcLabel(offset)}
              {side.abbr[offset] && <span className="st-tp-utc"> ({utcLabel(offset)})</span>}
            </>
          )}
        </p>
      </div>
    );
  };

  return (
    <section className="st-calc st-tp" aria-label={`Time in ${a.name} and ${b.name}`}>
      <div className="st-answer st-tp-board">
        {city(a, offA, 'a')}
        <div className="st-tp-diff">
          {gap === 0 ? (
            <p className="st-tp-diff-same">Same time</p>
          ) : (
            <p className="st-big st-tp-diff-fig" aria-hidden="true">
              <Flap value={`${sign}${gapH}`} />
              <span className="u">h</span>
              {gapM > 0 && (
                <>
                  <Flap value={String(gapM)} />
                  <span className="u">m</span>
                </>
              )}
            </p>
          )}
          <p className="st-tp-diff-cap">
            {gap === 0 ? 'No difference' : `${b.name} ${gap > 0 ? 'ahead' : 'behind'}`}
          </p>
        </div>
        {city(b, offB, 'b')}
        {/* The answer as sentences: what crawlers read and Copilot quotes */}
        <div className="st-tp-sentence" data-pair-spec={spec} data-pair-names={`${a.name}|${b.name}`}>
          <p className="st-tp-gap">
            <span data-pair="sentence" suppressHydrationWarning>
              {relationSentence(a.name, b.name, gap)}
            </span>
            .
          </p>
          <p className="st-note">
            It is{' '}
            <span data-pair="time-a" suppressHydrationWarning>
              {wallClockLabel(ms, offA, is24h)}
            </span>{' '}
            in {a.name} and{' '}
            <span data-pair="time-b" suppressHydrationWarning>
              {wallClockLabel(ms, offB, is24h)}
            </span>{' '}
            in {b.name}.
          </p>
        </div>
      </div>
      <div className="st-actions st-tp-actions">
        <Link className="st-btn primary" href={converterHref}>
          Convert another time
        </Link>
        <div className="st-seg st-tp-format" role="group" aria-label="Clock format">
          <button type="button" aria-pressed={!is24h} onClick={() => setIs24h(false)}>
            12h
          </button>
          <button type="button" aria-pressed={is24h} onClick={() => setIs24h(true)}>
            24h
          </button>
        </div>
      </div>
    </section>
  );
}
