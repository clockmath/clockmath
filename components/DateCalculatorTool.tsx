/**
 * Date calculator (/tools/date-calculator/): a start date plus or minus
 * years, months, weeks and days, or a number of business days. The answer
 * goes on the line's board as you type: the date on split-flap tiles, its
 * weekday, and how many calendar days away it is. The maths is
 * lib/dateAdd.ts, in calendar days (a clock change doesn't move the date).
 *
 * Nov 2026: built for "date calculation" and "calculate dates", which Bing
 * Copilot answered from other sites. Counting the days between two dates is
 * its sibling, /tools/days-between-dates/, on the same maths (lib/dateDiff.ts).
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { Flap } from '@/components/station/Flap';
import { AnswerBar } from '@/components/station/AnswerBar';
import { buildDay } from '@/lib/buildDay';
import { copyText } from '@/lib/clipboard';
import { getDevice } from '@/lib/device';
import { event as gaEvent, toolUsed } from '@/lib/gtag';
import {
  MAX_BUSINESS_DAYS,
  addBusinessDays,
  addOffset,
  fromLocalDate,
  inRange,
  parseCount,
  toIsoDate,
  toLocalDate,
  type CalendarDate,
} from '@/lib/dateAdd';
import { flashClass, useSettledChange } from '@/hooks/use-answer-feedback';

type Mode = 'calendar' | 'business';
type Unit = 'years' | 'months' | 'weeks' | 'days';

const UNITS: Array<{ id: Unit; label: string }> = [
  { id: 'years', label: 'Years' },
  { id: 'months', label: 'Months' },
  { id: 'weeks', label: 'Weeks' },
  { id: 'days', label: 'Days' },
];

const EMPTY: Record<Unit, string> = { years: '', months: '', weeks: '', days: '' };

// The offsets people look up most ("30 days from today", "90 days",
// "6 months from now", "10 business days"), one tap each
const PRESETS: Array<{ label: string; mode: Mode; fields?: Partial<Record<Unit, string>>; business?: string }> = [
  { label: '30 days', mode: 'calendar', fields: { days: '30' } },
  { label: '60 days', mode: 'calendar', fields: { days: '60' } },
  { label: '90 days', mode: 'calendar', fields: { days: '90' } },
  { label: '6 months', mode: 'calendar', fields: { months: '6' } },
  { label: '1 year', mode: 'calendar', fields: { years: '1' } },
  { label: '10 business days', mode: 'business', business: '10' },
];

const long = (c: CalendarDate) => format(toLocalDate(c), 'EEEE, MMMM d, yyyy');
const short = (c: CalendarDate) => format(toLocalDate(c), 'MMM d, yyyy');
const plural = (n: number, unit: string) => `${n.toLocaleString('en-US')} ${unit}${n === 1 ? '' : 's'}`;
/** 30 → "4w 2d", 14 → "2w", 5 → "5d" (zero parts dropped, "0d" if both are zero). */
function weeksAndDays(days: number): string {
  const w = Math.floor(days / 7);
  const parts = [w ? `${w.toLocaleString('en-US')}w` : '', days % 7 || !w ? `${days % 7}d` : ''];
  return parts.filter(Boolean).join(' ');
}

export function DateCalculatorTool() {
  // Before mount: the build day, so the server's HTML and the first client
  // render show the same tiles (Flap can't hydrate a different answer). The
  // visitor's own today replaces it on mount.
  const [start, setStart] = useState<CalendarDate>(() => fromLocalDate(buildDay()));
  const [sign, setSign] = useState<1 | -1>(1);
  const [mode, setMode] = useState<Mode>('calendar');
  const [fields, setFields] = useState<Record<Unit, string>>({ ...EMPTY, days: '30' });
  const [businessStr, setBusinessStr] = useState('10');
  const [skipHolidays, setSkipHolidays] = useState(false);
  const [copied, setCopied] = useState(false);
  const toolUsedRef = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStart(fromLocalDate(new Date()));
  }, []);

  const markUsed = useCallback(() => {
    if (!toolUsedRef.current) {
      toolUsedRef.current = true;
      toolUsed('date_calculator', { device: getDevice() });
    }
  }, []);

  const counts = useMemo(() => {
    const parsed = Object.fromEntries(UNITS.map((u) => [u.id, parseCount(fields[u.id])])) as Record<Unit, number | null>;
    return { parsed, business: parseCount(businessStr) };
  }, [fields, businessStr]);

  // The answer, or why there isn't one
  const answer = useMemo(() => {
    if (mode === 'business') {
      const n = counts.business;
      if (n === null) return { kind: 'error', error: 'Business days takes a whole number, like 10.' } as const;
      if (n > MAX_BUSINESS_DAYS) return { kind: 'error', error: `Up to ${MAX_BUSINESS_DAYS.toLocaleString('en-US')} business days (about 40 years).` } as const;
      const r = addBusinessDays(start, n, sign, { skipHolidays });
      if (!inRange(r.date)) return { kind: 'error', error: 'That goes past the years 100 to 9999.' } as const;
      return { kind: 'business', n, ...r } as const;
    }
    const p = counts.parsed;
    if (UNITS.some((u) => p[u.id] === null)) return { kind: 'error', error: 'Each field takes a whole number, like 3. Leave a field empty for none.' } as const;
    const offset = { years: p.years!, months: p.months!, weeks: p.weeks!, days: p.days! };
    if (offset.years > 9999 || offset.months > 120_000) return { kind: 'error', error: 'That goes past the years 100 to 9999.' } as const;
    const r = addOffset(start, offset, sign);
    if (!inRange(r.date)) return { kind: 'error', error: 'That goes past the years 100 to 9999.' } as const;
    return { kind: 'calendar', offset, ...r } as const;
  }, [mode, counts, start, sign, skipHolidays]);

  // What was added, in words: "3 months 10 days", "10 business days"
  const offsetWords =
    answer.kind === 'error'
      ? ''
      : answer.kind === 'business'
        ? plural(answer.n, 'business day')
        : (['years', 'months', 'weeks', 'days'] as const)
            .filter((u) => answer.offset[u] > 0)
            .map((u) => plural(answer.offset[u], u.slice(0, -1)))
            .join(' ') || '0 days';
  const summary =
    answer.kind === 'error'
      ? answer.error
      : `${short(start)} ${sign === 1 ? '+' : '−'} ${offsetWords} = ${long(answer.date)}`;

  // The board glows once a change settles; each settled answer is one
  // calculation in analytics (the offset only, never the dates)
  const key = answer.kind === 'error' ? `error|${answer.error}` : `${toIsoDate(answer.date)}|${summary}`;
  const settled = useSettledChange(key);
  useEffect(() => {
    if (!settled || answer.kind === 'error') return;
    gaEvent({
      action: 'calculation_completed',
      params: { page: 'date_calculator', mode, direction: sign === 1 ? 'add' : 'subtract', calendar_days: answer.calendarDays, device: getDevice() },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  const setField = (u: Unit, v: string) => {
    setFields((f) => ({ ...f, [u]: v }));
    markUsed();
  };
  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setMode(p.mode);
    if (p.fields) setFields({ ...EMPTY, ...p.fields });
    if (p.business) setBusinessStr(p.business);
    markUsed();
  };

  const copyResult = async () => {
    if (answer.kind === 'error') return;
    if (await copyText(summary)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const fieldNote = (bad: boolean, id: string) =>
    bad ? (
      <p id={id} className="st-dc-bad">
        Whole number
      </p>
    ) : null;

  return (
    <section className="st-calc st-dc" aria-label="Date calculator">
      <div ref={formRef}>
        <div className="st-dc-top">
          <div className="st-field">
            <div className="st-field-head">
              <span>Start date</span>
              <button
                type="button"
                className="st-now"
                onClick={() => {
                  setStart(fromLocalDate(new Date()));
                  markUsed();
                }}
                aria-label="Start from today"
              >
                Today
              </button>
            </div>
            <div className="st-pair">
              <InlineDatePicker
                ariaLabel="Start date"
                value={toLocalDate(start)}
                onChange={(d) => {
                  setStart(fromLocalDate(d));
                  markUsed();
                }}
                startOnCalendar
                relative={false}
              />
            </div>
          </div>
          <div className="st-field">
            <span id="dc-direction">Add or subtract</span>
            <div className="st-seg" role="group" aria-labelledby="dc-direction">
              {([1, -1] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sign === s}
                  onClick={() => {
                    setSign(s);
                    markUsed();
                  }}
                >
                  {s === 1 ? 'Add' : 'Subtract'}
                </button>
              ))}
            </div>
          </div>
          <div className="st-field">
            <span id="dc-mode">Count in</span>
            <div className="st-seg" role="group" aria-labelledby="dc-mode">
              {(['calendar', 'business'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m);
                    markUsed();
                  }}
                >
                  {m === 'calendar' ? 'Calendar' : 'Business days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mode === 'calendar' ? (
          <div className="st-dc-amounts">
            {UNITS.map((u) => {
              const bad = counts.parsed[u.id] === null;
              return (
                <label key={u.id}>
                  <span>{u.label}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    value={fields[u.id]}
                    aria-invalid={bad || undefined}
                    aria-describedby={bad ? `dc-${u.id}-note` : undefined}
                    onChange={(e) => setField(u.id, e.target.value)}
                  />
                  {fieldNote(bad, `dc-${u.id}-note`)}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="st-dc-amounts st-dc-business">
            <label>
              <span>Business days</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={businessStr}
                aria-invalid={counts.business === null || undefined}
                aria-describedby={counts.business === null ? 'dc-business-note' : undefined}
                onChange={(e) => {
                  setBusinessStr(e.target.value);
                  markUsed();
                }}
              />
              {fieldNote(counts.business === null, 'dc-business-note')}
            </label>
            <label className="st-dc-check">
              <input
                type="checkbox"
                checked={skipHolidays}
                onChange={(e) => {
                  setSkipHolidays(e.target.checked);
                  markUsed();
                }}
              />
              Skip US federal holidays
            </label>
          </div>
        )}

        <div className="st-dc-presets" role="group" aria-label="Common amounts">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="st-link-btn" onClick={() => applyPreset(p)}>
              {sign === 1 ? '+' : '−'} {p.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={answerRef} className={`st-answer${flashClass(settled)}`} aria-live="polite">
        {answer.kind === 'error' ? (
          <p className="st-error">{answer.error}</p>
        ) : (
          <>
            <div>
              <p className="st-big long" aria-hidden="true">
                {/* Month and day as two runs of tiles, capitals like a
                    departures board: one Flap with a space showed a blank tile */}
                <Flap value={format(toLocalDate(answer.date), 'MMM').toUpperCase()} />
                <span className="st-dc-gap" />
                <Flap value={String(answer.date.day)} />
                <span className="u">{answer.date.year}</span>
              </p>
              <span className="sr-only">{summary}</span>
              <p className="st-note st-dc-long" aria-hidden="true">
                {long(answer.date)}
              </p>
            </div>
            <div>
              <dl className="st-also" aria-hidden="true">
                <div>
                  <dt>{answer.calendarDays < 0 ? 'Calendar days back' : 'Calendar days later'}</dt>
                  <dd>{Math.abs(answer.calendarDays).toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt>Weeks and days</dt>
                  <dd>{weeksAndDays(Math.abs(answer.calendarDays))}</dd>
                </div>
                {answer.kind === 'business' && (
                  <>
                    <div>
                      <dt>Weekend days skipped</dt>
                      <dd>{answer.weekendDays.toLocaleString('en-US')}</dd>
                    </div>
                    <div>
                      <dt>Holidays skipped</dt>
                      <dd>{skipHolidays ? answer.holidays.length.toLocaleString('en-US') : '–'}</dd>
                    </div>
                  </>
                )}
              </dl>
              <p className="st-note">
                {short(start)} {sign === 1 ? 'plus' : 'minus'} {offsetWords}.
                {answer.kind === 'calendar' && answer.clamped && (
                  <>
                    {' '}
                    {format(toLocalDate({ ...answer.date, day: 1 }), 'MMMM')} has no {format(toLocalDate(start), 'do')}, so the
                    month step lands on its last day, as spreadsheets do.
                  </>
                )}
                {answer.kind === 'business' &&
                  (skipHolidays
                    ? answer.holidays.length > 0 &&
                      ` Skipped ${answer.holidays
                        .slice(0, 3)
                        .map((h) => `${h.name} (${format(toLocalDate(h.date), 'MMM d')})`)
                        .join(', ')}${answer.holidays.length > 3 ? ` and ${answer.holidays.length - 3} more` : ''}.`
                    : ' Weekends only; holidays count as working days.')}
              </p>
              <div className="st-actions">
                <button type="button" className="st-btn primary" onClick={copyResult}>
                  {copied ? 'Copied' : 'Copy result'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnswerBar formRef={formRef} answerRef={answerRef}>
        {answer.kind === 'error' ? 'Check the fields' : short(answer.date)}
      </AnswerBar>
    </section>
  );
}
