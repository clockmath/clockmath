'use client';

import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { MONTH_NAMES, dayKey, monthWeeks, shortDate, yearFacts, yearMarks, type CalendarMark } from '@/lib/yearCalendar';
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
export function YearGrid({ year }: { year: number }) {
  const marks = byDate(yearMarks(year));
  return (
    <div className="st-cal">
      {MONTH_NAMES.map((name, i) => (
        <section key={name} className="st-cal-month" aria-label={`${name} ${year}`}>
          <h3>{name}</h3>
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

/** The key under the grids. */
export function YearLegend() {
  return (
    <p className="st-cal-legend">
      <span>
        <i className="st-cal-key st-cal-off" aria-hidden="true" /> Federal day off
      </span>
      <span>
        <i className="st-cal-key st-cal-weekend" aria-hidden="true" /> Federal holiday on a weekend
      </span>
      <span>
        <i className="st-cal-key st-cal-other" aria-hidden="true" /> Other days and clock changes
      </span>
    </p>
  );
}

export function YearPrintButton({ year }: { year: number }) {
  const [printing, print] = usePrintSheet();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          gaEvent({ action: 'print_chart', params: { chart: `calendar_${year}` } });
          print();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        Print the {year} calendar
      </button>
      {printing && createPortal(<PrintSheet year={year} />, document.body)}
    </>
  );
}

const cellStyle: CSSProperties = { width: '14.28%', textAlign: 'center', padding: '1.6pt 0', fontSize: '9pt' };

/** One A4/Letter page: twelve months, four a row, then the days off. */
function PrintSheet({ year }: { year: number }) {
  const marks = byDate(yearMarks(year));
  const offs = yearMarks(year).filter((m) => m.kind === 'off');
  const facts = yearFacts(year);
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20pt', margin: '0 0 6pt' }}>{year} calendar</h1>
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
        US federal days off in {year}: {facts.federalDaysOff} days off, {facts.workingDays} working days
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
        Shaded: federal day off. Outlined: federal holiday on a weekend (observed the Friday before or Monday after).
        Weeks start on Sunday. Holidays and days until each: clockmath.com/calendar/{year}
      </p>
    </div>
  );
}
