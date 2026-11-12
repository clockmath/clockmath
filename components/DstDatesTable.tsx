'use client';

import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { DST_REGIONS, FIRST_YEAR, LAST_YEAR, YEARS, dstYear, type DstRegion } from '@/lib/dstDates';
import { event as gaEvent } from '@/lib/gtag';
import { usePrintSheet } from '@/hooks/use-print-sheet';

const H2 = 'text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-1';
const BODY = 'text-muted-foreground dark:text-muted-foreground';

/**
 * The year-by-year table for one region. Southern-hemisphere regions list
 * the April change first: that is the order within a calendar year.
 * Built from constants only (no "today"), so server and client match.
 */
function RegionTable({ region }: { region: DstRegion }) {
  const cols = region.south
    ? ([['back', 'Clocks go back', region.backAt], ['forward', 'Clocks go forward', region.forwardAt]] as const)
    : ([['forward', 'Clocks go forward', region.forwardAt], ['back', 'Clocks go back', region.backAt]] as const);
  return (
    <section id={region.id} className="max-w-3xl mx-auto mb-section st-dst-region">
      <h2 className={H2}>{region.name}</h2>
      <p className={`${BODY} text-sm mb-3`}>
        Forward on the {lower(region.forwardRule)}, {region.forwardAt}; back on the {lower(region.backRule)},{' '}
        {region.backAt}. {region.note}.
      </p>
      <table className="w-full text-sm st-dst-table">
        <caption className="sr-only">
          Daylight saving time dates for {region.name}, {FIRST_YEAR} to {LAST_YEAR}
        </caption>
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border/50 dark:border-border/50">
            <th scope="col" className="py-2 pr-2 font-semibold">Year</th>
            {cols.map(([key, header]) => (
              <th key={key} scope="col" className="py-2 px-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {YEARS.map((y) => {
            const d = dstYear(region, y);
            return (
              <tr key={y} className="border-b border-border/30 dark:border-border/30">
                <th scope="row" className="py-2 pr-2 font-semibold text-foreground text-left">
                  {y}
                </th>
                {cols.map(([key]) => (
                  <td key={key} className="py-2 px-2 text-foreground">
                    <time dateTime={d[key].ymd}>{d[key].label}</time>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function DstRegionTables() {
  return (
    <>
      {DST_REGIONS.map((r) => (
        <RegionTable key={r.id} region={r} />
      ))}
    </>
  );
}

/** "Jump to": the regions as links to their tables. */
export function DstRegionLinks() {
  return (
    <nav aria-label="Regions" className="st-chips st-dst-jump">
      {DST_REGIONS.map((r) => (
        <a key={r.id} href={`#${r.id}`}>
          {r.name}
        </a>
      ))}
    </nav>
  );
}

export function DstPrintButton() {
  const [printing, print] = usePrintSheet();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          gaEvent({ action: 'print_chart', params: { chart: 'dst_dates' } });
          print();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        Print the table
      </button>
      {printing && createPortal(<PrintSheet />, document.body)}
    </>
  );
}

const cell: CSSProperties = { padding: '0.5pt 3pt', borderBottom: '0.5pt solid #ccc', textAlign: 'left', whiteSpace: 'nowrap' };

/** Every region on one A4/Letter page, black on white: three blocks a row. */
function PrintSheet() {
  return (
    <div id="print-chart" style={{ color: '#000', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '17pt', margin: '0 0 2pt' }}>
        Daylight saving time dates {FIRST_YEAR}–{LAST_YEAR}
      </h1>
      <p style={{ fontSize: '9pt', margin: '0 0 8pt' }}>
        The days the clocks go forward (+1 hour) and back (−1 hour), local time, under each country’s current rules.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8pt 12pt' }}>
        {DST_REGIONS.map((r) => (
          <div key={r.id} style={{ breakInside: 'avoid' }}>
            <h2 style={{ fontSize: '10pt', margin: '0 0 1pt' }}>{r.name}</h2>
            <p style={{ fontSize: '7pt', margin: '0 0 2pt', color: '#333', minHeight: '2.4em' }}>
              Forward {r.forwardAt} · back {r.backAt}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
              <thead>
                <tr>
                  <th style={{ ...cell, borderBottom: '1pt solid #000' }}>Year</th>
                  <th style={{ ...cell, borderBottom: '1pt solid #000' }}>{r.south ? 'Back' : 'Forward'}</th>
                  <th style={{ ...cell, borderBottom: '1pt solid #000' }}>{r.south ? 'Forward' : 'Back'}</th>
                </tr>
              </thead>
              <tbody>
                {YEARS.map((y) => {
                  const d = dstYear(r, y);
                  const [a, b] = r.south ? [d.back, d.forward] : [d.forward, d.back];
                  return (
                    <tr key={y}>
                      <td style={{ ...cell, fontWeight: 600 }}>{y}</td>
                      <td style={cell}>{a.label}</td>
                      <td style={cell}>{b.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '8pt', margin: '8pt 0 0', color: '#333' }}>
        Not changing: British Columbia, Alberta, the Northwest Territories and Manitoba (since 2026), Yukon,
        Saskatchewan, Arizona, Hawaii, Mexico, Paraguay, Brazil, Turkey, Russia, Japan, China, India. Live countdown to
        your next change: clockmath.com/countdown/daylight-saving-time
      </p>
    </div>
  );
}
