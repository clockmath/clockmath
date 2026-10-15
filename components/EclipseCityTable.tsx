/**
 * City timings table shared by the eclipse countdown pages. Rows come from
 * each page's generated eclipseData.ts. Phones get stacked rows (a 3–4 column
 * table doesn't fit at 375px); the table appears from sm up.
 */
type Row = { place: string } & Record<string, string>;

export interface EclipseColumn {
  key: string;
  header: string;
  /** Right-align (numbers). */
  right?: boolean;
}

export default function EclipseCityTable({ rows, columns }: { rows: ReadonlyArray<Row>; columns: EclipseColumn[] }) {
  const [first, ...rest] = columns;
  return (
    <>
      <div className="sm:hidden divide-y divide-border/40 dark:divide-slate-700/40">
        {rows.map((r) => (
          <div key={r.place} className="py-2.5">
            <div className="font-medium text-foreground dark:text-slate-100">{r.place}</div>
            <div className="text-sm text-foreground dark:text-slate-200">
              {r[first.key]}
              {rest.map((c) => (
                <span key={c.key}>
                  {' '}
                  · <span className="text-muted-foreground">{r[c.key]}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <table className="hidden sm:table w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border/50 dark:border-slate-700/50">
            <th className="py-2 px-1 font-semibold">Where</th>
            {columns.map((c) => (
              <th key={c.key} className={`py-2 px-1 font-semibold${c.right ? ' text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 dark:divide-slate-700/40">
          {rows.map((r) => (
            <tr key={r.place}>
              <td className="py-2 px-1 font-medium text-foreground dark:text-slate-100">{r.place}</td>
              {columns.map((c) => (
                <td key={c.key} className={`py-2 px-1 text-foreground dark:text-slate-200${c.right ? ' text-right' : ''}`}>
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
