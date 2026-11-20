import type { CSSProperties } from 'react';

/**
 * The work hours calculator's timesheet as one printed page (Nov 2026): the
 * shifts as entered, the totals, and signature lines, so it can be handed in
 * as a time card or saved as a PDF. The blank version is
 * /tools/timesheet-template/. Everything arrives as text from TimesheetTool,
 * formatted the way the page shows it (12h or 24h).
 */
export interface PrintRow {
  date: string;
  start: string;
  end: string;
  breakMins: number;
  hours: string;
  clock: string;
}

const cell: CSSProperties = { border: '0.75pt solid #555', padding: '4pt 6pt', fontSize: '10pt', textAlign: 'left' };
const head: CSSProperties = { ...cell, background: '#e6e6e6', fontSize: '9pt', fontWeight: 700 };
const num: CSSProperties = { ...cell, fontVariantNumeric: 'tabular-nums' };

function Sign({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6pt' }}>
      <span style={{ fontSize: '9pt', fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ flex: 1, borderBottom: '0.75pt solid #000', height: '16pt' }} />
    </div>
  );
}

export default function TimesheetPrint({
  name,
  rows,
  total,
  totalClock,
  summary,
}: {
  name: string;
  rows: PrintRow[];
  total: string;
  totalClock: string;
  /** Extra lines under the total: the overtime split, gross pay. */
  summary: string[];
}) {
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12pt' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 800, margin: 0 }}>Timesheet{name ? `: ${name}` : ''}</h1>
        <span style={{ fontSize: '8pt', color: '#444' }}>clockmath.com/tools/timesheet</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={head}>Date</th>
            <th style={head}>Start</th>
            <th style={head}>End</th>
            <th style={head}>Break</th>
            <th style={head}>Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={cell}>{r.date}</td>
              <td style={num}>{r.start}</td>
              <td style={num}>{r.end}</td>
              <td style={num}>{r.breakMins ? `${r.breakMins} min` : '—'}</td>
              <td style={num}>
                <strong>{r.hours}</strong> <span style={{ color: '#444' }}>({r.clock})</span>
              </td>
            </tr>
          ))}
          <tr>
            <th colSpan={4} style={{ ...head, textAlign: 'right' }}>
              Total
            </th>
            <td style={{ ...num, fontWeight: 700, background: '#e6e6e6' }}>
              {total} h <span style={{ fontWeight: 400, color: '#444' }}>({totalClock})</span>
            </td>
          </tr>
        </tbody>
      </table>
      {summary.length > 0 && (
        <p style={{ fontSize: '10pt', margin: '10pt 0 0' }}>
          {summary.map((s) => (
            <span key={s} style={{ display: 'block' }}>
              {s}
            </span>
          ))}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '24pt 18pt', marginTop: '30pt' }}>
        <Sign name="Employee signature" />
        <Sign name="Date" />
        <Sign name="Supervisor signature" />
        <Sign name="Date" />
      </div>
      <p style={{ fontSize: '7.5pt', color: '#333', margin: '16pt 0 0' }}>
        Hours are after unpaid breaks, as decimals (7.75 = 7 h 45 min), with hours and minutes in brackets.
      </p>
    </div>
  );
}
