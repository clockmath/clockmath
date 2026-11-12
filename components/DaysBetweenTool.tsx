/**
 * Days between two dates (/tools/days-between-dates/). Two date fields, the
 * answer on the line's board as you pick: total days on split-flap tiles,
 * then weeks and days, months and days, years/months/days and business
 * days. The maths is lib/dateDiff.ts, in calendar days (a clock change
 * doesn't make a day short).
 *
 * Share links carry ?from=yyyy-mm-dd&to=yyyy-mm-dd (and &inclusive=1). Those
 * are a visitor's own dates (a birthday, a due date), so analytics never sees
 * them: GA gets the address through analyticsSafeUrl, and Clarity doesn't
 * start on a page whose address has them (urlHasVisitorData).
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { Flap } from '@/components/station/Flap';
import { buildDay } from '@/lib/buildDay';
import { copyText } from '@/lib/clipboard';
import { getDevice } from '@/lib/device';
import { event as gaEvent, toolUsed } from '@/lib/gtag';
import {
  dateDifference,
  fromLocalDate,
  parseIsoDate,
  partsWords,
  plural,
  toIsoDate,
  toLocalDate,
  type CalendarDate,
} from '@/lib/dateDiff';
import { flashClass, useSettledChange } from '@/hooks/use-answer-feedback';

/** Today to next New Year's Day: always a few days to count, never zero. */
function defaults(today: CalendarDate): { from: CalendarDate; to: CalendarDate } {
  return { from: today, to: { year: today.year + 1, month: 1, day: 1 } };
}

const long = (c: CalendarDate) => format(toLocalDate(c), 'EEEE, MMM d, yyyy');
const short = (c: CalendarDate) => format(toLocalDate(c), 'MMM d, yyyy');

/** One figure on tiles with its unit letters: [[7, 'w'], [1, 'd']]. Zero parts dropped, except a lone 0. */
function Tiles({ parts }: { parts: Array<[number, string]> }) {
  const kept = parts.filter(([n]) => n !== 0);
  const shown = kept.length ? kept : [parts[parts.length - 1]];
  return (
    <>
      {shown.map(([n, u]) => (
        <span key={u} className="st-dbd-part">
          <Flap value={n.toLocaleString('en-US')} />
          <span className="u">{u}</span>
        </span>
      ))}
    </>
  );
}

export function DaysBetweenTool() {
  // Before mount: the build day, so the server's HTML and the first client
  // render show the same tiles (Flap can't hydrate a different answer). The
  // visitor's own today, or a shared link's dates, replace it on mount.
  const [from, setFrom] = useState<CalendarDate>(() => defaults(fromLocalDate(buildDay())).from);
  const [to, setTo] = useState<CalendarDate>(() => defaults(fromLocalDate(buildDay())).to);
  const [inclusive, setInclusive] = useState(false);
  const [linkNote, setLinkNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<'result' | 'link' | null>(null);
  const toolUsedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedFrom = parseIsoDate(params.get('from'));
    const sharedTo = parseIsoDate(params.get('to'));
    const today = fromLocalDate(new Date());
    if (sharedFrom || sharedTo) {
      // A link with one date counts from (or to) today
      setFrom(sharedFrom ?? today);
      setTo(sharedTo ?? today);
      setInclusive(params.get('inclusive') === '1');
      gaEvent({ action: 'days_between_opened_from_link', params: { device: getDevice() } });
    } else {
      const d = defaults(today);
      setFrom(d.from);
      setTo(d.to);
      if (params.has('from') || params.has('to')) {
        setLinkNote('This link’s dates couldn’t be read, so it counts from today. Pick the dates below.');
      }
    }
  }, []);

  const result = useMemo(() => dateDifference(from, to, { inclusive }), [from, to, inclusive]);
  const [first, last] = result.reversed ? [to, from] : [from, to];

  const markUsed = useCallback(() => {
    setLinkNote(null);
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('days_between', { device: getDevice() });
    }
  }, []);

  const pickFrom = useCallback((d: Date) => { setFrom(fromLocalDate(d)); markUsed(); }, [markUsed]);
  const pickTo = useCallback((d: Date) => { setTo(fromLocalDate(d)); markUsed(); }, [markUsed]);
  const setToday = (which: 'from' | 'to') => (which === 'from' ? pickFrom : pickTo)(new Date());
  const swap = () => { setFrom(to); setTo(from); markUsed(); };

  // The board glows once a change settles; each settled answer is one
  // calculation in analytics (the day count only, never the dates)
  const key = `${toIsoDate(from)}|${toIsoDate(to)}|${inclusive}`;
  const settled = useSettledChange(key);
  useEffect(() => {
    if (!settled) return;
    gaEvent({
      action: 'calculation_completed',
      params: { page: 'days_between', duration_days: result.days, inclusive, reversed: result.reversed, device: getDevice() },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  const weeksText = partsWords([result.weeks.weeks, 'week'], [result.weeks.days, 'day']);
  const monthsText = partsWords([result.months.months, 'month'], [result.months.days, 'day']);
  const ymdText = partsWords([result.ymd.years, 'year'], [result.ymd.months, 'month'], [result.ymd.days, 'day']);
  const summary =
    `${short(first)} to ${short(last)}${inclusive ? ', counting both dates' : ''}: ${plural(result.days, 'day')}` +
    ` (${weeksText}; ${monthsText}${result.ymd.years ? `; ${ymdText}` : ''}; ${plural(result.businessDays, 'business day')})`;

  const flash = (what: 'result' | 'link') => {
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };
  const copyResult = async () => {
    if (await copyText(summary)) flash('result');
  };
  const copyLink = async () => {
    const params = new URLSearchParams({ from: toIsoDate(from), to: toIsoDate(to) });
    if (inclusive) params.set('inclusive', '1');
    if (await copyText(`${window.location.origin}/tools/days-between-dates/?${params}`)) flash('link');
    gaEvent({ action: 'days_between_shared', params: { device: getDevice() } });
  };

  const big = result.days.toLocaleString('en-US');

  return (
    <section className="st-calc st-dbd" aria-label="Days between dates calculator">
      <div className="st-fields">
        <div className="st-field">
          <div className="st-field-head">
            <span>Start date</span>
            <button type="button" className="st-now" onClick={() => setToday('from')} aria-label="Count from today">
              From today
            </button>
          </div>
          <div className="st-pair">
            <InlineDatePicker ariaLabel="Start date" value={toLocalDate(from)} onChange={pickFrom} startOnCalendar relative={false} />
          </div>
        </div>
        <div className="st-field">
          <div className="st-field-head">
            <span>End date</span>
            <button type="button" className="st-now" onClick={() => setToday('to')} aria-label="Count to today">
              To today
            </button>
          </div>
          <div className="st-pair">
            <InlineDatePicker ariaLabel="End date" value={toLocalDate(to)} onChange={pickTo} startOnCalendar relative={false} />
          </div>
        </div>
      </div>

      <div className="st-dbd-options">
        <label>
          <input
            type="checkbox"
            checked={inclusive}
            onChange={(e) => {
              setInclusive(e.target.checked);
              markUsed();
            }}
          />
          Include the end date (count both days)
        </label>
        <button type="button" className="st-link-btn" onClick={swap}>
          Swap the dates
        </button>
      </div>
      {linkNote && <p className="st-note" role="status">{linkNote}</p>}

      <div className={`st-answer${flashClass(settled)}`} aria-live="polite">
        <div>
          <p className={`st-big${big.length > 5 ? ' long' : ''}`} aria-hidden="true">
            <Flap value={big} />
            <span className="u">{result.days === 1 ? 'day' : 'days'}</span>
          </p>
          <span className="sr-only">{summary}</span>
          <p className="st-note st-dbd-span" aria-hidden="true">
            {long(first)} to {long(last)}
          </p>
        </div>
        <div>
          <dl className="st-also st-dbd-also" aria-hidden="true">
            <div>
              <dt>Weeks and days</dt>
              <dd><Tiles parts={[[result.weeks.weeks, 'w'], [result.weeks.days, 'd']]} /></dd>
            </div>
            <div>
              <dt>Months and days</dt>
              <dd><Tiles parts={[[result.months.months, 'mo'], [result.months.days, 'd']]} /></dd>
            </div>
            <div>
              <dt>Years, months, days</dt>
              <dd><Tiles parts={[[result.ymd.years, 'y'], [result.ymd.months, 'mo'], [result.ymd.days, 'd']]} /></dd>
            </div>
            <div>
              <dt>Business days (Mon–Fri)</dt>
              <dd><Tiles parts={[[result.businessDays, 'd']]} /></dd>
            </div>
          </dl>
          {result.reversed && (
            <p className="st-note">The end date is before the start date, so this counts from {short(first)} forward.</p>
          )}
          <p className="st-note">
            {inclusive
              ? `Counting both ${short(first)} and ${short(last)}. Without the end date: ${plural(result.days - 1, 'day')}.`
              : `Not counting the end date. Counting both days: ${plural(result.days + 1, 'day')}.`}{' '}
            {result.weekendDays === 0
              ? 'None of them falls on a weekend'
              : result.weekendDays === 1
                ? '1 of them is a Saturday or Sunday'
                : `${result.weekendDays.toLocaleString('en-US')} of them are Saturdays or Sundays`}
            ; business days don’t take off public holidays.
          </p>
          <div className="st-actions">
            <button type="button" className="st-btn primary" onClick={copyResult}>
              {copied === 'result' ? 'Copied' : 'Copy result'}
            </button>
            <button type="button" className="st-btn quiet" onClick={copyLink}>
              {copied === 'link' ? 'Link copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
