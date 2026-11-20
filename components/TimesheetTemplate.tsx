'use client';

import { useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer } from 'lucide-react';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { event as gaEvent } from '@/lib/gtag';
import { usePrintSheet } from '@/hooks/use-print-sheet';
import {
  TEMPLATE_COLUMNS,
  periodLabel,
  shortDay,
  templateCsv,
  templateDays,
  weekStart,
  type FirstDay,
  type Period,
  type TemplateDay,
} from '@/lib/timesheetTemplate';

const line: CSSProperties = { borderBottom: '0.75pt solid #000', minHeight: '15pt', flex: 1 };
const label: CSSProperties = { fontSize: '8.5pt', fontWeight: 600, whiteSpace: 'nowrap', color: '#000' };
// Colours and font set on every cell: on the page the sheet sits inside the
// station's table styles, and the preview should look like the print
const cell: CSSProperties = { border: '0.75pt solid #555', padding: '0 5pt', fontSize: '9.5pt', color: '#000', fontFamily: 'inherit', letterSpacing: 0, textTransform: 'none' };

function Field({ name, value = '' }: { name: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6pt' }}>
      <span style={label}>{name}</span>
      <span style={{ ...line, fontSize: '10pt', paddingLeft: '2pt' }}>{value}</span>
    </div>
  );
}

/**
 * The sheet itself, black on white in print units: the same component is the
 * preview on the page and the printed page, so what you see is what prints.
 * Letter and A4 portrait; a biweekly sheet has shorter rows to fit one page.
 */
export function TemplateSheet({ days, period }: { days: TemplateDay[]; period: Period }) {
  // Measured Nov 2026: biweekly at 23pt is about 830px tall at 96 dpi, inside
  // Letter's 943px and A4's 1009px printable height (15mm margins)
  const rowHeight = period === 'weekly' ? '30pt' : '23pt';
  const weeks = period === 'weekly' ? [1] : [1, 2];
  const dated = days[0]?.date != null;
  return (
    <div style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.25 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10pt' }}>
        <h2 style={{ fontFamily: 'inherit', fontSize: '20pt', fontWeight: 800, letterSpacing: 0, textTransform: 'none', color: '#000', margin: 0 }}>{period === 'weekly' ? 'Weekly Timesheet' : 'Biweekly Timesheet'}</h2>
        <span style={{ fontSize: '8pt', color: '#444' }}>clockmath.com/tools/timesheet-template</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9pt 18pt', marginBottom: '12pt' }}>
        <Field name="Employee name" />
        <Field name="Employee ID" />
        <Field name="Company" />
        <Field name="Manager" />
        <Field name="Pay period" value={periodLabel(days)} />
        <Field name="Hourly rate" />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '17%' }} />
          <col style={{ width: '11%' }} />
          <col span={4} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr>
            {['Day', 'Date', ...TEMPLATE_COLUMNS].map((h) => (
              <th key={h} scope="col" style={{ ...cell, background: '#e6e6e6', fontSize: '8.5pt', fontWeight: 700, textAlign: 'left', height: '18pt' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {weeks.map((w) => (
          <tbody key={w}>
            {days
              .filter((d) => d.week === w)
              .map((d, i) => (
                <tr key={i} style={{ height: rowHeight }}>
                  <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>
                    {d.name}
                  </th>
                  <td style={cell}>{d.date ? shortDay(d.date) : ''}</td>
                  <td style={cell} />
                  <td style={cell} />
                  <td style={cell} />
                  <td style={cell} />
                  <td style={cell} />
                </tr>
              ))}
            {weeks.length > 1 && (
              <tr style={{ height: '18pt' }}>
                <th scope="row" colSpan={6} style={{ ...cell, textAlign: 'right', fontWeight: 600, fontSize: '8.5pt', background: '#f3f3f3' }}>
                  Week {w} total
                </th>
                <td style={{ ...cell, background: '#f3f3f3' }} />
              </tr>
            )}
          </tbody>
        ))}
      </table>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18pt', margin: '14pt 0 22pt' }}>
        <Field name="Total hours" />
        <Field name="Regular" />
        <Field name="Overtime" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '22pt 18pt' }}>
        <Field name="Employee signature" />
        <Field name="Date" />
        <Field name="Supervisor signature" />
        <Field name="Date" />
      </div>
      <p style={{ fontSize: '7.5pt', color: '#333', margin: '14pt 0 0' }}>
        Write times as on a clock (8:00 AM, 4:30 PM). Total hours = time out − time in − the lunch break, as a decimal: 7 h 45 min is
        7.75. {dated ? '' : 'Write the dates in the Date column. '}Add them up at clockmath.com/tools/timesheet
      </p>
    </div>
  );
}

const SEG_BTN = 'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200';
const segClass = (on: boolean) => `${SEG_BTN} ${on ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`;

function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex bg-muted/50 dark:bg-muted/50 rounded-lg p-1">
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={segClass(value === v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** The options, the preview, and Print / CSV. Blank by default, so server and client render the same sheet. */
export default function TimesheetTemplateTool() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [first, setFirst] = useState<FirstDay>(0);
  // null: a blank sheet. A date: the first day of the pay period, any weekday.
  const [start, setStart] = useState<Date | null>(null);
  const [printing, print] = usePrintSheet();
  const days = templateDays(period, first, start);
  const kind = `${period}_${start ? 'dated' : 'blank'}`;

  const downloadCsv = () => {
    const blob = new Blob([templateCsv(days)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${period}-timesheet${start ? `-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    gaEvent({ action: 'timesheet_template_csv', params: { template: kind } });
  };

  return (
    <section className="max-w-3xl mx-auto mb-section" aria-label="Timesheet template">
      <div className="st-panel bg-card dark:bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border/50 dark:border-border/50 mb-6">
        <div className="st-tpl-options">
          <div>
            <span className="st-tpl-label">Period</span>
            <Seg
              label="Period"
              value={period}
              options={[
                ['weekly', 'Weekly'],
                ['biweekly', 'Biweekly'],
              ]}
              onChange={setPeriod}
            />
          </div>
          <div>
            <span className="st-tpl-label">Dates</span>
            <Seg
              label="Dates"
              value={start ? 'dated' : 'blank'}
              options={[
                ['blank', 'Blank'],
                ['dated', 'Filled in'],
              ]}
              onChange={(v) => setStart(v === 'blank' ? null : weekStart(new Date(), first))}
            />
          </div>
          {start ? (
            <div>
              <label className="st-tpl-label" htmlFor="tpl-start">
                Period starts
              </label>
              <InlineDatePicker id="tpl-start" value={start} onChange={setStart} relative={false} startOnCalendar ariaLabel="Period starts" />
            </div>
          ) : (
            <div>
              <span className="st-tpl-label">Week starts</span>
              <Seg
                label="Week starts"
                value={first}
                options={[
                  [0, 'Sunday'],
                  [1, 'Monday'],
                ]}
                onChange={setFirst}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            type="button"
            onClick={() => {
              gaEvent({ action: 'print_chart', params: { chart: `timesheet_template_${kind}` } });
              print();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow transition-all duration-200"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Print or save as PDF
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card dark:bg-muted hover:bg-muted dark:hover:bg-muted text-foreground font-medium rounded-lg border border-border/50 dark:border-border shadow transition-all duration-200"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Excel or Sheets (CSV)
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          To save a PDF, choose “Save as PDF” as the printer. The CSV adds up the hours for you in Excel or Google Sheets.
        </p>
      </div>

      <div className="st-tpl-preview" aria-label="Preview of the printed timesheet" role="figure">
        <div className="st-tpl-paper">
          <TemplateSheet days={days} period={period} />
        </div>
      </div>

      {printing &&
        createPortal(
          <div id="print-chart">
            <TemplateSheet days={days} period={period} />
          </div>,
          document.body,
        )}
    </section>
  );
}
