'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildDay } from '@/lib/buildDay';
import { fromLocalDate, toIsoDate, toLocalDate, type CalendarDate } from '@/lib/dateDiff';
import { countWorkingDays } from '@/lib/workingDays';

/**
 * "Working days until Christmas" and the like: the weekdays (less US federal
 * days off) and weekends left from today through a holiday's last working
 * day. Nov 2026: the big holiday pages lose "days until X" to established
 * sites, while these narrower questions have no good answers. The build
 * day's count first (server and client agree, and the line names the day it
 * counts from), the visitor's today after mount.
 */
export default function WorkingDays({
  title,
  through,
  throughLabel,
  children,
}: {
  title: string;
  /** The last day counted, given today. */
  through: (today: CalendarDate) => CalendarDate;
  /** "Christmas Eve" */
  throughLabel: string;
  /** A sentence after the count (what to make of it). */
  children?: React.ReactNode;
}) {
  const [today, setToday] = useState<CalendarDate>(() => fromLocalDate(buildDay()));
  useEffect(() => setToday(fromLocalDate(new Date())), []);

  const end = through(today);
  const { workingDays, weekends, holidays } = countWorkingDays(today, end);
  const label = (c: CalendarDate, opts: Intl.DateTimeFormatOptions) => toLocalDate(c).toLocaleDateString('en-US', opts);
  const from = label(today, { weekday: 'long', month: 'long', day: 'numeric' });
  const to = label(end, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const off = [...new Set(holidays)];

  return (
    <section className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6">
      <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-3">{title}</h2>
      <p className="text-muted-foreground dark:text-slate-400 mb-3">
        From {from} through {throughLabel}, {to}, there {workingDays === 1 ? 'is' : 'are'}{' '}
        <strong className="text-foreground dark:text-slate-200">
          {workingDays === 1 ? '1 working day' : `${workingDays.toLocaleString('en-US')} working days`}
        </strong>{' '}
        and{' '}
        <strong className="text-foreground dark:text-slate-200">{weekends === 1 ? '1 weekend' : `${weekends} weekends`}</strong>{' '}
        left. Working days are Monday to Friday, today included
        {off.length > 0 && `, not counting ${holidayPhrase(off)}`}
        .
        {children && <> {children}</>}
      </p>
      <p className="text-muted-foreground dark:text-slate-400 text-sm">
        Count a different span, or without the holidays, with the{' '}
        <Link
          href={`/tools/days-between-dates/?from=${toIsoDate(today)}&to=${toIsoDate(end)}&inclusive=1`}
          className="text-primary hover:text-primary/80 font-semibold"
        >
          days between dates calculator
        </Link>
        , which shows business days too.
      </p>
    </section>
  );
}

// One or two named; a long span (Halloween, a year ahead) gets a count instead.
function holidayPhrase(names: string[]): string {
  if (names.length === 1) return `${names[0]} (a US federal holiday)`;
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} (US federal holidays)`;
  return `${names.length} US federal holidays`;
}
