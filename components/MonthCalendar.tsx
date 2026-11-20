'use client';

import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { MONTH_NAMES, dayKey, monthFacts, monthMarks, monthWeeks, shortDate, type CalendarMark } from '@/lib/yearCalendar';
import { event as gaEvent } from '@/lib/gtag';
import { usePrintSheet } from '@/hooks/use-print-sheet';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const byDate = (marks: CalendarMark[]) => {
  const map = new Map<string, CalendarMark[]>();
  for (const m of marks) map.set(m.date, [...(map.get(m.date) ?? []), m]);
  return map;
};

const kindOf = (here: CalendarMark[]) =>
  here.some((m) => m.kind === 'off') ? 'off' : here.some((m) => m.kind === 'weekend-holiday') ? 'weekend' : here.length ? 'other' : '';

/**
 * One month as a wall-calendar grid (/calendar/<year>/<month>/, Nov 2026):
 * the same marks and colours as the year grid, with the holiday names in the
 * day boxes from 640px up (a dot below that; the list under the grid names
 * them). Built from the year and month alone, so server and client match.
 */
export function MonthGrid({ year, month }: { year: number; month: number }) {
  const marks = byDate(monthMarks(year, month));
  return (
    <div className="st-mcal">
      <table>
        <caption className="sr-only">
          {MONTH_NAMES[month - 1]} {year}
        </caption>
        <thead>
          <tr>
            {DAY_NAMES.map((d) => (
              <th key={d} scope="col" abbr={d}>
                <span aria-hidden="true">{d.slice(0, 3)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(year, month).map((week, w) => (
            <tr key={w}>
              {week.map((day, j) => {
                if (!day) return <td key={j} className="st-mcal-blank" />;
                const here = marks.get(dayKey(year, month, day)) ?? [];
                const kind = kindOf(here);
                return (
                  <td key={j} className={kind ? `st-cal-${kind}` : undefined}>
                    <span className="st-mcal-day">{day}</span>
                    {here.length > 0 && (
                      <span className="st-mcal-names">
                        <span className="sr-only">: </span>
                        {here.map((m) => m.name).join(', ')}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MonthPrintButton({ year, month }: { year: number; month: number }) {
  const [printing, print] = usePrintSheet();
  const name = MONTH_NAMES[month - 1];
  return (
    <>
      <button
        type="button"
        onClick={() => {
          gaEvent({ action: 'print_chart', params: { chart: `calendar_${year}_${String(month).padStart(2, '0')}` } });
          print();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        Print {name} {year}
      </button>
      {printing && createPortal(<PrintSheet year={year} month={month} />, document.body)}
    </>
  );
}

const cell: CSSProperties = { border: '0.6pt solid #888', verticalAlign: 'top', padding: '3pt 4pt', height: '68pt', width: '14.28%' };

/** One A4/Letter page: the month with room to write in, then its days. */
function PrintSheet({ year, month }: { year: number; month: number }) {
  const all = monthMarks(year, month);
  const marks = byDate(all);
  const facts = monthFacts(year, month);
  const weeks = monthWeeks(year, month);
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24pt', margin: '0 0 8pt' }}>
        {MONTH_NAMES[month - 1]} {year}
      </h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {DAY_NAMES.map((d) => (
              <th key={d} style={{ fontSize: '9pt', fontWeight: 600, color: '#444', textAlign: 'left', padding: '0 4pt 3pt' }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, j) => {
                const here = day ? (marks.get(dayKey(year, month, day)) ?? []) : [];
                const kind = kindOf(here);
                return (
                  <td
                    key={j}
                    style={{
                      ...cell,
                      // Six-week months get shorter boxes so the page still fits
                      height: weeks.length > 5 ? '58pt' : cell.height,
                      background: kind === 'off' ? '#e4e4e4' : undefined,
                      outline: kind === 'weekend' ? '1.2pt solid #000' : undefined,
                      outlineOffset: '-1.8pt',
                    }}
                  >
                    {day && (
                      <>
                        <div style={{ fontSize: '12pt', fontWeight: kind === 'off' ? 800 : 500, color: j === 0 || j === 6 ? '#555' : '#000' }}>{day}</div>
                        {here.length > 0 && <div style={{ fontSize: '7pt', lineHeight: 1.2, marginTop: '2pt' }}>{here.map((m) => m.name).join(', ')}</div>}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: '9pt', margin: '10pt 0 0', lineHeight: 1.5 }}>
        {facts.workingDays} working days ({facts.weekdays} weekdays less {facts.federalDaysOff} federal day{facts.federalDaysOff === 1 ? '' : 's'} off).
        {all.length > 0 && <> {all.map((m) => `${shortDate(m.date)}: ${m.name}`).join(' · ')}</>}
      </p>
      <p style={{ fontSize: '7.5pt', margin: '6pt 0 0', color: '#333' }}>
        Shaded: federal day off. Outlined: federal holiday on a weekend (observed the Friday before or Monday after).
        clockmath.com/calendar/{year}/{MONTH_NAMES[month - 1].toLowerCase()}
      </p>
    </div>
  );
}
