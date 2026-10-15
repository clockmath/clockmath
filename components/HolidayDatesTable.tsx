import { buildDay } from '@/lib/buildDay';

/**
 * "What day is Christmas 2028?" — the weekday of a fixed-date holiday for
 * the next few years, computed rather than typed, plus the day it is
 * observed when a weekend shifts it. Years start at the next occurrence
 * after the build day (lib/buildDay), so server and client render the same
 * table.
 */

/** US federal rule: Saturday → the Friday before, Sunday → the Monday after. */
export function usFederalObserved(d: Date): Date | null {
  const wd = d.getUTCDay();
  if (wd === 6) return new Date(d.getTime() - 86400000);
  if (wd === 0) return new Date(d.getTime() + 86400000);
  return null;
}

/** Canada Day: when July 1 is a Sunday, the holiday is Monday, July 2. */
export function sundayToMonday(d: Date): Date | null {
  return d.getUTCDay() === 0 ? new Date(d.getTime() + 86400000) : null;
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

export default function HolidayDatesTable({
  name,
  month,
  day,
  years = 6,
  observed,
  observedLabel = 'Observed',
  note,
}: {
  name: string;
  /** 0-indexed month, like the countdown props. */
  month: number;
  day: number;
  years?: number;
  /** Returns the observed date when it differs from the holiday itself. */
  observed?: (d: Date) => Date | null;
  observedLabel?: string;
  note?: string;
}) {
  // Start at the next occurrence: on Oct 15 the New Year table begins with
  // the coming January 1, not the one already gone.
  const today = buildDay();
  const passed = today.getMonth() > month || (today.getMonth() === month && today.getDate() > day);
  const first = today.getFullYear() + (passed ? 1 : 0);
  const rows = Array.from({ length: years }, (_, i) => {
    const d = new Date(Date.UTC(first + i, month, day));
    return { year: first + i, d, obs: observed ? observed(d) : null };
  });
  return (
    <section className="max-w-3xl mx-auto mb-section">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
        {name} dates, {first}–{first + years - 1}
      </h2>
      <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border/50 dark:border-slate-700/50">
              <th scope="col" className="py-2 px-4 font-semibold">Year</th>
              <th scope="col" className="py-2 px-4 font-semibold">Day</th>
              {observed && <th scope="col" className="py-2 px-4 font-semibold">{observedLabel}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 dark:divide-slate-700/40">
            {rows.map((r) => (
              <tr key={r.year}>
                <td className="py-2 px-4 font-medium text-foreground tabular-nums">{r.year}</td>
                <td className="py-2 px-4 text-foreground">{fmt(r.d, { weekday: 'long', month: 'long', day: 'numeric' })}</td>
                {observed && (
                  <td className="py-2 px-4 text-muted-foreground">
                    {r.obs ? fmt(r.obs, { weekday: 'long', month: 'long', day: 'numeric', year: r.obs.getUTCFullYear() !== r.year ? 'numeric' : undefined }) : 'Same day'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-sm text-muted-foreground mt-3">{note}</p>}
    </section>
  );
}
