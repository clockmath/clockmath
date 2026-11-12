/**
 * Today's date (/tools/todays-date/): the date where you are on split-flap
 * tiles, then the day of the year, week numbers, quarter and Julian dates.
 * The maths is lib/todaysDate.ts.
 *
 * Two clocks keep it right. In the browser, the device's own date (checked
 * every second, so it turns over at midnight, and the Julian date ticks).
 * In the static HTML, which is what Bing and Copilot read, every figure is a
 * plain-text span marked data-live-today="<kind>" that the worker rewrites
 * per request in the visitor's zone (scripts/worker/live-counts.js), so the
 * page isn't stuck on deploy day. Those spans hold text only and carry
 * suppressHydrationWarning: the worker's text and the first client render
 * (from the build day) can differ until the mount effect sets today.
 *
 * The tiles (one element per character) can't be rewritten that way, so
 * before mount they show the build day, the same on server and client, as
 * the countdown boards do with buildDayCount.
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Flap } from '@/components/station/Flap';
import { buildDay } from '@/lib/buildDay';
import { copyText } from '@/lib/clipboard';
import { getDevice } from '@/lib/device';
import { toolUsed } from '@/lib/gtag';
import { fromLocalDate, toLocalDate } from '@/lib/dateDiff';
import { dateFacts, julianDate } from '@/lib/todaysDate';

// The zone the build day is in (lib/buildDay: deploys date pages in Eastern
// time), shown until the device's own zone is known
const BUILD_ZONE = 'America/New_York';

/** A worker-rewritten figure: text only, so hydration can let it differ. */
function Live({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <span data-live-today={kind} suppressHydrationWarning>
      {children}
    </span>
  );
}

export function TodaysDateTool() {
  const [now, setNow] = useState<number | null>(null);
  const [zone, setZone] = useState(BUILD_ZONE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    try {
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || BUILD_ZONE);
    } catch {
      // keep the build zone's name
    }
    // Every second: the Julian date's fraction moves, and the date turns
    // over at midnight without a reload
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = fromLocalDate(now === null ? buildDay() : new Date(now));
  const date = toLocalDate(today);
  const f = dateFacts(today);
  const long = format(date, 'EEEE, MMMM d, yyyy');
  const pad = (n: number) => String(n).padStart(2, '0');

  const copy = async () => {
    if (await copyText(long)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    toolUsed('todays_date', { device: getDevice() });
  };

  return (
    <section className="st-calc st-today" aria-label="Today's date">
      <div className="st-answer">
        <div>
          <p className="st-today-cap">Today is</p>
          <p className="st-big long" aria-hidden="true">
            <Flap value={format(date, 'MMM').toUpperCase()} />
            <span className="st-today-gap" />
            <Flap value={String(today.day)} />
            <span className="u">{today.year}</span>
          </p>
          {/* The answer as a sentence: what crawlers read and Copilot quotes */}
          <p className="st-note st-today-sentence">
            Today is <Live kind="long">{long}</Live>. It is day <Live kind="doy">{f.dayOfYear}</Live> of{' '}
            <Live kind="year">{today.year}</Live>, in ISO week <Live kind="week">{f.isoWeek}</Live>. Days left in the year:{' '}
            <Live kind="left">{f.daysLeft}</Live>.
          </p>
          <p className="st-note st-today-zone">
            In <Live kind="zone">{zone}</Live>
          </p>
        </div>
        <div>
          <dl className="st-also">
            <div>
              <dt>Day of the year</dt>
              <dd>
                <Live kind="doy">{f.dayOfYear}</Live>
                <small>
                  {' '}
                  of <Live kind="days-in-year">{f.daysInYear}</Live>
                </small>
              </dd>
            </div>
            <div>
              <dt>Days left in the year</dt>
              <dd>
                <Live kind="left">{f.daysLeft}</Live>
              </dd>
            </div>
            <div>
              <dt>Week (ISO, from Monday)</dt>
              <dd>
                <Live kind="week">{f.isoWeek}</Live>
              </dd>
            </div>
            <div>
              <dt>Week (US, from Sunday)</dt>
              <dd>
                <Live kind="week-us">{f.usWeek}</Live>
              </dd>
            </div>
            <div>
              <dt>Quarter</dt>
              <dd>
                <Live kind="quarter">{`Q${f.quarter}`}</Live>
              </dd>
            </div>
            <div>
              <dt>Julian day number</dt>
              <dd>
                <Live kind="jdn">{f.julianDayNumber}</Live>
              </dd>
            </div>
          </dl>
          <div className="st-actions">
            <button type="button" className="st-btn primary" onClick={copy}>
              {copied ? 'Copied' : 'Copy the date'}
            </button>
          </div>
        </div>
      </div>

      {/* The same date written the ways people need it: forms, files, labels */}
      <h2 className="st-today-h2">Today’s date in other formats</h2>
      <ul className="st-list st-today-formats">
        <li>
          <span>ISO 8601 (year-month-day)</span>
          <Live kind="iso">{`${today.year}-${pad(today.month)}-${pad(today.day)}`}</Live>
        </li>
        <li>
          <span>US (month/day/year)</span>
          <Live kind="us">{`${pad(today.month)}/${pad(today.day)}/${today.year}`}</Live>
        </li>
        <li>
          <span>UK, Europe, most of the world (day/month/year)</span>
          <Live kind="eu">{`${pad(today.day)}/${pad(today.month)}/${today.year}`}</Live>
        </li>
        <li>
          <span>Julian date, year and day (ordinal)</span>
          <span>
            <Live kind="ordinal">{f.ordinal}</Live> · <Live kind="yyddd">{f.yyddd}</Live>
          </span>
        </li>
        <li>
          <span>Astronomical Julian date, right now</span>
          {/* Moves every second, so the page shows it only once it runs */}
          <span>{now === null ? '–' : julianDate(now).toFixed(5)}</span>
        </li>
      </ul>
    </section>
  );
}
