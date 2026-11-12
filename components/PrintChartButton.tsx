'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { decimalToMinutes, formatMinutes, minutesToDecimal, roundingBands } from '@/lib/decimalTime';
import { event as gaEvent } from '@/lib/gtag';

/**
 * "Print chart" for the decimal hours charts. Printable charts are what
 * people search for ("minutes to decimal chart": several top results are
 * printables) and what payroll and HR pages link to (Oct 2026). Nov 2026:
 * one button per chart (minutes → decimal, decimal → minutes, rounding).
 *
 * The print sheet is rendered into a portal only while printing, so the
 * static HTML carries each chart once (the on-page table) rather than twice.
 * globals.css hides everything else under html.printing-chart.
 */
export type PrintableChart = 'minutes_to_decimal' | 'decimal_to_minutes' | 'rounding';

export default function PrintChartButton({ chart = 'minutes_to_decimal' }: { chart?: PrintableChart }) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    const root = document.documentElement;
    root.classList.add('printing-chart');
    const done = () => {
      root.classList.remove('printing-chart');
      setPrinting(false);
    };
    window.addEventListener('afterprint', done, { once: true });
    // Wait a frame so the portal is in the DOM before the print dialog opens.
    const id = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', done);
      root.classList.remove('printing-chart');
    };
  }, [printing]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          gaEvent({ action: 'print_chart', params: { chart } });
          setPrinting(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        Print chart
      </button>
      {printing && createPortal(<PrintSheet chart={chart} />, document.body)}
    </>
  );
}

const cell: CSSProperties = { padding: '4px 10px', borderBottom: '1px solid #ccc', textAlign: 'left' };
const figure: CSSProperties = { fontFamily: 'ui-monospace, monospace' };

/** Pairs laid out in `cols` column pairs, filled top to bottom like the on-page board. */
function PairGrid({ pairs, cols, head, size = '12pt' }: { pairs: Array<[ReactNode, ReactNode]>; cols: number; head: string; size?: string }) {
  const rows = Math.ceil(pairs.length / cols);
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: size }}>
      <thead>
        <tr>
          {Array.from({ length: cols }, (_, c) => (
            <th key={c} style={{ ...cell, borderBottom: '2px solid #000' }}>
              {head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: cols }, (_, col) => {
              const pair = pairs[row + col * rows];
              return (
                <td key={col} style={cell}>
                  {pair && (
                    <>
                      <span style={{ display: 'inline-block', width: '3.2em' }}>{pair[0]}</span>
                      <strong style={figure}>{pair[1]}</strong>
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One A4/Letter page per chart, black on white. */
function PrintSheet({ chart }: { chart: PrintableChart }) {
  let title: string;
  let intro: string;
  let body: ReactNode;
  if (chart === 'decimal_to_minutes') {
    title = 'Decimal hours to minutes chart';
    intro = 'Minutes = decimal × 60. 0.25 hours is 15 minutes; 7.80 hours is 7 hours 48 minutes.';
    body = (
      <PairGrid
        head="Dec · Min"
        cols={4}
        size="11pt"
        pairs={Array.from({ length: 100 }, (_, i) => [((i + 1) / 100).toFixed(2), formatMinutes(decimalToMinutes((i + 1) / 100))])}
      />
    );
  } else if (chart === 'rounding') {
    title = 'Payroll rounding charts';
    intro = 'Minutes past the hour, rounded to the nearest tenth (6 minutes) or quarter (15 minutes) of an hour.';
    const band = (step: number) =>
      roundingBands(step).map((b): [ReactNode, ReactNode] => [`${b.from}–${b.to}`, b.decimal.toFixed(step === 6 ? 1 : 2)]);
    body = (
      <>
        <h2 style={{ fontSize: '14pt', margin: '0 0 6pt' }}>Tenths of an hour</h2>
        <PairGrid head="Min · Hours" cols={2} pairs={band(6)} />
        <h2 style={{ fontSize: '14pt', margin: '16pt 0 6pt' }}>Quarter hours (7-minute rule)</h2>
        <PairGrid head="Min · Hours" cols={1} pairs={band(15)} />
      </>
    );
  } else {
    title = 'Minutes to decimal hours chart';
    intro = 'Decimal hours = minutes ÷ 60, to two decimal places. 7 hours 45 minutes is 7.75 hours, not 7.45.';
    body = <PairGrid head="Min · Decimal" cols={4} pairs={Array.from({ length: 60 }, (_, i) => [i + 1, minutesToDecimal(i + 1).toFixed(2)])} />;
  }
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20pt', margin: '0 0 4pt' }}>{title}</h1>
      <p style={{ fontSize: '11pt', margin: '0 0 12pt' }}>{intro}</p>
      {body}
      <p style={{ fontSize: '10pt', margin: '14pt 0 0', color: '#333' }}>
        Payroll systems that round punch times (to 6 or 15 minutes) round before converting. Converter and full guide:
        clockmath.com/tools/decimal-hours
      </p>
    </div>
  );
}
