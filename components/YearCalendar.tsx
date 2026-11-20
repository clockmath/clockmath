'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { MONTH_NAMES, MONTH_SLUGS, dayKey, monthWeeks, shortDate, yearFacts, yearMarks, type CalendarMark } from '@/lib/yearCalendar';
import { event as gaEvent } from '@/lib/gtag';
import { usePrintSheet } from '@/hooks/use-print-sheet';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const byDate = (marks: CalendarMark[]) => {
  const map = new Map<string, CalendarMark[]>();
  for (const m of marks) map.set(m.date, [...(map.get(m.date) ?? []), m]);
  return map;
};

/**
 * Twelve month grids, Sunday first, with the federal days off filled in the
 * line colour, federal holidays that fall on a weekend ringed, and other
 * days dotted. Built from the year alone (no "today"), so server and client
 * render the same markup.
 */
export function YearGrid({ year, marks: given, monthLinks = true }: { year: number; marks?: CalendarMark[]; monthLinks?: boolean }) {
  // Other countries pass their own marks (lib/regionCalendar.ts, Nov 2026);
  // only the US months have pages of their own
  const marks = byDate(given ?? yearMarks(year));
  return (
    <div className="st-cal">
      {MONTH_NAMES.map((name, i) => (
        <section key={name} className="st-cal-month" aria-label={`${name} ${year}`}>
          {/* Each month has its own page (Nov 2026) */}
          <h3>{monthLinks ? <Link href={`/calendar/${year}/${MONTH_SLUGS[i]}/`}>{name}</Link> : name}</h3>
          <table>
            <thead>
              <tr>
                {DAY_LETTERS.map((d, j) => (
                  <th key={j} scope="col" abbr={DAY_NAMES[j]}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks(year, i + 1).map((week, w) => (
                <tr key={w}>
                  {week.map((day, j) => {
                    if (!day) return <td key={j} />;
                    const here = marks.get(dayKey(year, i + 1, day)) ?? [];
                    const kind = here.find((m) => m.kind === 'off') ? 'off' : here.find((m) => m.kind === 'weekend-holiday') ? 'weekend' : here.length ? 'other' : '';
                    return (
                      <td key={j} className={kind ? `st-cal-${kind}` : undefined} title={here.map((m) => m.name).join(' · ') || undefined}>
                        {day}
                        {here.length > 0 && <span className="sr-only">: {here.map((m) => m.name).join(', ')}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

/** The key under the grids; other countries name their own days off */
export function YearLegend({ off = 'Federal day off', weekend = 'Federal holiday on a weekend', other = 'Other days and clock changes' }: { off?: string; weekend?: string; other?: string }) {
  return (
    <p className="st-cal-legend">
      <span>
        <i className="st-cal-key st-cal-off" aria-hidden="true" /> {off}
      </span>
      <span>
        <i className="st-cal-key st-cal-weekend" aria-hidden="true" /> {weekend}
      </span>
      <span>
        <i className="st-cal-key st-cal-other" aria-hidden="true" /> {other}
      </span>
    </p>
  );
}

/** What another country's print sheet says in place of the US lines */
export interface PrintText {
  /** "2027 UK calendar" */
  title: string;
  /** "Bank holidays in England and Wales in 2027: 8 days off, 253 working days" */
  summary: string;
  /** Shaded / outlined key */
  key: string;
  /** "clockmath.com/calendar/2027/uk" */
  url: string;
  /** GA chart name */
  chart: string;
}

export function YearPrintButton({ year, marks, text, label }: { year: number; marks?: CalendarMark[]; text?: PrintText; label?: string }) {
  const [printing, print] = usePrintSheet();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          gaEvent({ action: 'print_chart', params: { chart: text?.chart ?? `calendar_${year}` } });
          print();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        {label ?? `Print the ${year} calendar`}
      </button>
      {printing && createPortal(<PrintSheet year={year} marks={marks} text={text} />, document.body)}
    </>
  );
}

const cellStyle: CSSProperties = { width: '14.28%', textAlign: 'center', padding: '1.6pt 0', fontSize: '9pt' };

/** One A4/Letter page: twelve months, four a row, then the days off. */
function PrintSheet({ year, marks: given, text }: { year: number; marks?: CalendarMark[]; text?: PrintText }) {
  const all = given ?? yearMarks(year);
  const marks = byDate(all);
  const offs = all.filter((m) => m.kind === 'off' && m.date.startsWith(`${year}-`));
  const facts = yearFacts(year);
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20pt', margin: '0 0 6pt' }}>{text?.title ?? `${year} calendar`}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12pt 14pt' }}>
        {MONTH_NAMES.map((name, i) => (
          <div key={name} style={{ breakInside: 'avoid' }}>
            <div style={{ fontSize: '11pt', fontWeight: 700, margin: '0 0 2pt' }}>{name}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {DAY_LETTERS.map((d, j) => (
                    <th key={j} style={{ ...cellStyle, fontWeight: 600, color: '#555', borderBottom: '0.5pt solid #999' }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthWeeks(year, i + 1).map((week, w) => (
                  <tr key={w}>
                    {week.map((day, j) => {
                      const here = day ? (marks.get(dayKey(year, i + 1, day)) ?? []) : [];
                      const off = here.some((m) => m.kind === 'off');
                      const weekend = here.some((m) => m.kind === 'weekend-holiday');
                      return (
                        <td
                          key={j}
                          style={{
                            ...cellStyle,
                            fontWeight: off ? 800 : 400,
                            background: off ? '#ddd' : undefined,
                            outline: weekend ? '0.6pt solid #000' : undefined,
                            outlineOffset: '-0.6pt',
                            color: j === 0 || j === 6 ? '#555' : '#000',
                          }}
                        >
                          {day ?? ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: '11pt', margin: '12pt 0 3pt' }}>
        {text?.summary ?? `US federal days off in ${year}: ${facts.federalDaysOff} days off, ${facts.workingDays} working days`}
      </h2>
      <div style={{ columns: 2, columnGap: '16pt', fontSize: '9pt', lineHeight: 1.5 }}>
        {offs.map((m) => (
          <div key={m.date + m.name}>
            <strong style={{ display: 'inline-block', width: '7.2em', whiteSpace: 'nowrap' }}>{shortDate(m.date)}</strong>
            {m.name}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '7.5pt', margin: '8pt 0 0', color: '#333' }}>
        {text ? (
          <>
            {text.key} Weeks start on Sunday. {text.url}
          </>
        ) : (
          <>
            Shaded: federal day off. Outlined: federal holiday on a weekend (observed the Friday before or Monday after).
            Weeks start on Sunday. Holidays and days until each: clockmath.com/calendar/{year}
          </>
        )}
      </p>
    </div>
  );
}
