import type { ReactNode } from 'react';

/**
 * One table that stacks on phones. A multi-column table doesn't fit at 375px,
 * and the old fix — a second, phone-only copy of every row — put each row in
 * the HTML twice, so crawlers and AI answers read the eclipse and clock-change
 * tables double (found Oct 2026). Here rows are table rows from sm up and
 * stacked blocks below it, from a single markup. Explicit ARIA roles keep the
 * table semantics that browsers drop once cells are restyled as blocks.
 */
export interface StackedColumn {
  key: string;
  header: string;
  /** Right-align on the table layout (numbers). */
  right?: boolean;
  /** Prefix shown before the value when stacked, e.g. "Back:". */
  mobileLabel?: string;
}

type CellRender<R> = (row: R) => ReactNode;

type Row = Record<string, string>;

export default function StackedTable<R extends Row>({
  rows,
  columns,
  firstHeader = 'Where',
  firstKey = 'place',
  renderFirst,
  stack = 'inline',
  minWidth,
  render,
  rowAttrs,
}: {
  rows: ReadonlyArray<R>;
  columns: StackedColumn[];
  firstHeader?: string;
  firstKey?: string;
  /** Custom content for the first cell (defaults to row[firstKey]). */
  renderFirst?: (row: R) => ReactNode;
  /** Phones: 'inline' joins the other values on one line with ·; 'lines' gives each its own line. */
  stack?: 'inline' | 'lines';
  /** Table-layout minimum width, e.g. 'sm:min-w-[34rem]'. */
  minWidth?: string;
  /** Custom cell content per column key (defaults to row[key]). */
  render?: Partial<Record<string, CellRender<R>>>;
  /** Extra attributes for each <tr>, e.g. the worker's data-days-until. */
  rowAttrs?: (row: R) => Record<string, string>;
}) {
  return (
    <div className="sm:overflow-x-auto">
      <table role="table" className={`w-full text-sm ${minWidth ?? ''}`}>
        <thead role="rowgroup" className="hidden sm:table-header-group">
          <tr role="row" className="text-left text-muted-foreground border-b border-border/50 dark:border-slate-700/50">
            <th role="columnheader" className="py-2 px-1 font-semibold">{firstHeader}</th>
            {columns.map((c) => (
              <th key={c.key} role="columnheader" className={`py-2 px-1 font-semibold${c.right ? ' text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="divide-y divide-border/40 dark:divide-slate-700/40">
          {rows.map((r) => (
            <tr key={r[firstKey]} role="row" className="block sm:table-row py-2.5 sm:py-0 align-top" {...rowAttrs?.(r)}>
              <td role="cell" className="block sm:table-cell sm:py-2.5 sm:px-1 font-medium text-foreground dark:text-slate-100">
                {renderFirst ? renderFirst(r) : r[firstKey]}
              </td>
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  role="cell"
                  className={`${stack === 'inline' ? 'inline' : 'block'} sm:table-cell sm:py-2.5 sm:px-1 ${
                    c.right ? 'sm:text-right ' : ''
                  }${
                    stack === 'inline' && i > 0
                      ? 'text-muted-foreground sm:text-foreground dark:sm:text-slate-200'
                      : 'text-foreground dark:text-slate-200'
                  }`}
                >
                  {stack === 'inline' && i > 0 && (
                    <span aria-hidden="true" className="sm:hidden">
                      {' · '}
                    </span>
                  )}
                  {c.mobileLabel && <span className="sm:hidden text-muted-foreground">{c.mobileLabel} </span>}
                  {render?.[c.key] ? render[c.key]!(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
