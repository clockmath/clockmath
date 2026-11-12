'use client';

import { useEffect, useState, type ReactNode } from 'react';
import StackedTable from '@/components/StackedTable';
import { buildDay } from '@/lib/buildDay';

/**
 * The dates around an event (early access and launch, Selection Sunday to
 * the title game, the first day of Ramadan to Eid) with the days left until
 * each. Nov 2026: event pages had one board for one date, and these
 * in-between dates are what people search for ("when is selection sunday",
 * "fable early access"). Rows carry the worker's data-days-until + data-keep
 * (scripts/worker/live-counts.js), so "Days left" is right on every request,
 * not just on deploy day; the build day's figures are the fallback.
 */
export interface KeyDate {
  what: string;
  /** YYYY-MM-DD, the visitor's local calendar day. */
  date: string;
  /** Last day, for spans (a group stage); inclusive. */
  end?: string;
  note?: string;
}

const DAY_MS = 86400000;
const toUtc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const label = (s: string) =>
  new Date(toUtc(s)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const shortLabel = (s: string) => new Date(toUtc(s)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });

/** Same wording as the worker: "N days", "Today" during the date or span. */
function daysLeft(k: KeyDate, today: string): string {
  if (k.date > today) {
    const n = Math.round((toUtc(k.date) - toUtc(today)) / DAY_MS);
    return n === 1 ? '1 day' : `${n.toLocaleString('en-US')} days`;
  }
  return (k.end ?? k.date) >= today ? 'Today' : 'Passed';
}

export default function KeyDates({
  title,
  dates,
  children,
  footnote,
}: {
  title: string;
  dates: ReadonlyArray<KeyDate>;
  /** Paragraph above the table. */
  children?: ReactNode;
  footnote?: ReactNode;
}) {
  // Build day first (server and client agree), the visitor's today after mount
  const [today, setToday] = useState(() => ymd(buildDay()));
  useEffect(() => setToday(ymd(new Date())), []);

  const rows = dates.map((k) => ({
    what: k.what,
    note: k.note ?? '',
    when: k.end && k.end !== k.date ? `${shortLabel(k.date)} – ${label(k.end)}` : label(k.date),
    days: daysLeft(k, today),
    spec: `d:${k.end && k.end !== k.date ? `${k.date}/${k.end}` : k.date}`,
  }));

  return (
    <section className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6">
      <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-3">{title}</h2>
      {children && <p className="text-muted-foreground dark:text-slate-400 mb-3">{children}</p>}
      <StackedTable
        rows={rows}
        firstKey="what"
        firstHeader="Event"
        stack="inline"
        minWidth="sm:min-w-[30rem]"
        renderFirst={(r) => (
          <>
            {r.what}
            {r.note && <span className="block text-xs font-normal text-muted-foreground mb-1 sm:mb-0">{r.note}</span>}
          </>
        )}
        columns={[
          { key: 'when', header: 'When' },
          { key: 'days', header: 'Days left', right: true },
        ]}
        render={{
          days: (r) => (
            <span data-live="days" suppressHydrationWarning>
              {r.days}
            </span>
          ),
        }}
        rowAttrs={(r) => ({ 'data-days-until': r.spec, 'data-keep': '' })}
      />
      {footnote && <p className="text-muted-foreground dark:text-slate-400 text-sm mt-3">{footnote}</p>}
    </section>
  );
}
