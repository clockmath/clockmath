'use client';

import { useEffect, useState } from 'react';
import { Archivo, BigShoulders } from '@/components/station/fonts';
import { Flap } from '@/components/station/Flap';
import { getTimezoneOffset } from '@/lib/time';
import { tileShade } from '@/lib/colour';
import { formatClock, formatGap, getTimePair, utcLabel, type PairPlace } from '@/lib/timePairs';
import '@/components/station/station.css';
import '@/components/station/type.css';
import './embed.css';

const CREDIT_QUERY = 'utm_source=embed&utm_medium=time_widget';
// The Time zones line's colour (components/station/lines.css)
const BOARD = { color: '#0a6b74', ink: '#ffffff' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * A time difference embed (/embed/time/<a>-to-<b>/, Nov 2026): the time now
 * in both cities and the gap, for remote teams, families and schools with a
 * sister city. Offsets from the device's clock through lib/time's
 * getTimezoneOffset, as on the pair page's board (it corrects browsers that
 * still have the cancelled 2026 Canadian clock changes). Before mount the
 * tiles read "--", the same on server and client; no analytics run here
 * (NotOnEmbed). `?h=24` shows a 24-hour clock.
 */
export function TimeEmbed({ slug }: { slug: string }) {
  const pair = getTimePair(slug);
  const [now, setNow] = useState<number | null>(null);
  const [is24h, setIs24h] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount: the static HTML has no query
    setIs24h(new URLSearchParams(window.location.search).get('h') === '24');
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!pair) return null;
  const { a, b } = pair;
  const offA = now === null ? null : getTimezoneOffset(a.zone, new Date(now));
  const offB = now === null ? null : getTimezoneOffset(b.zone, new Date(now));
  const gap = offA === null || offB === null ? null : offB - offA;

  const city = (place: PairPlace, offset: number | null) => {
    let hh = '--';
    let mm = '--';
    let suffix = '';
    let day = ' ';
    if (now !== null && offset !== null) {
      const d = new Date(now + offset * 60_000);
      const [clock, s = ''] = formatClock(d.getUTCHours() * 60 + d.getUTCMinutes(), is24h).split(' ');
      [hh, mm] = clock.split(':');
      suffix = s;
      day = `${WEEKDAYS[d.getUTCDay()]} · ${place.abbr[offset] ?? utcLabel(offset)}`;
    }
    return (
      <div className="st-embed-city">
        <p className="st-embed-place">{place.name}</p>
        <p className="st-embed-time">
          <Flap value={hh} />
          <span className="st-embed-colon">:</span>
          <Flap value={mm} />
          {suffix && <small>{suffix}</small>}
        </p>
        <p className="st-embed-day">{day}</p>
      </div>
    );
  };

  const sentence =
    gap === null ? ' ' : gap === 0 ? `${a.name} and ${b.name} are on the same time` : `${b.name} is ${formatGap(gap)} ${gap > 0 ? 'ahead of' : 'behind'} ${a.name}`;

  return (
    <div
      className={`station st-embed st-embed-tp ${Archivo.variable} ${BigShoulders.variable}`}
      style={{ '--board': BOARD.color, '--board-ink': BOARD.ink, '--tile': tileShade(BOARD.color) } as React.CSSProperties}
    >
      <div className="st-embed-in">
        <div className="st-embed-top">
          <p className="st-embed-title">
            {a.name} and {b.name}
          </p>
          <a className="st-embed-credit" href={`https://clockmath.com/time/${slug}/?${CREDIT_QUERY}`} target="_blank" rel="noopener">
            ClockMath
          </a>
        </div>
        {now !== null && offA !== null && offB !== null && (
          <p className="sr-only">
            {(() => {
              const t = (o: number) => {
                const d = new Date(now + o * 60_000);
                return formatClock(d.getUTCHours() * 60 + d.getUTCMinutes(), is24h);
              };
              return `It is ${t(offA)} in ${a.name} and ${t(offB)} in ${b.name}.`;
            })()}
          </p>
        )}
        <div className="st-embed-clocks" aria-hidden="true">
          {city(a, offA)}
          {city(b, offB)}
        </div>
        <p className="st-embed-date" aria-live="off">
          {sentence}
        </p>
      </div>
    </div>
  );
}
