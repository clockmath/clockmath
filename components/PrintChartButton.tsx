'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { minutesToDecimal } from '@/components/DecimalHoursTool';
import { event as gaEvent } from '@/lib/gtag';

/**
 * "Print chart" for the minutes-to-decimal chart. Printable charts are what
 * people search for ("minutes to decimal chart": several top results are
 * printables) and what payroll and HR pages link to (Oct 2026).
 *
 * The print sheet is rendered into a portal only while printing, so the
 * static HTML carries the chart once (the on-page table) rather than twice.
 * globals.css hides everything else under html.printing-chart.
 */
export default function PrintChartButton() {
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
          gaEvent({ action: 'print_chart', params: { chart: 'minutes_to_decimal' } });
          setPrinting(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        Print chart
      </button>
      {printing && createPortal(<PrintSheet />, document.body)}
    </>
  );
}

/** One A4/Letter page: 1–60 minutes in four column pairs, black on white. */
function PrintSheet() {
  const cell: CSSProperties = { padding: '4px 10px', borderBottom: '1px solid #ccc', textAlign: 'left' };
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20pt', margin: '0 0 4pt' }}>Minutes to decimal hours chart</h1>
      <p style={{ fontSize: '11pt', margin: '0 0 12pt' }}>
        Decimal hours = minutes ÷ 60, to two decimal places. 7 hours 45 minutes is 7.75 hours, not 7.45.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
        <thead>
          <tr>
            {[0, 1, 2, 3].map((c) => (
              <th key={c} style={{ ...cell, borderBottom: '2px solid #000' }}>
                Min · Decimal
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 15 }, (_, row) => (
            <tr key={row}>
              {[0, 1, 2, 3].map((col) => {
                const minute = row + 1 + col * 15;
                return (
                  <td key={col} style={cell}>
                    <span style={{ display: 'inline-block', width: '3em' }}>{minute}</span>
                    <strong style={{ fontFamily: 'ui-monospace, monospace' }}>{minutesToDecimal(minute).toFixed(2)}</strong>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: '10pt', margin: '14pt 0 0', color: '#333' }}>
        Payroll systems that round punch times (to 6 or 15 minutes) round before converting. Converter and full guide:
        clockmath.com/tools/decimal-hours
      </p>
    </div>
  );
}
