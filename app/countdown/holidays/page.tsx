'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventPage from '@/components/EventPage';
import StackedTable from '@/components/StackedTable';
import { buildDay } from '@/lib/buildDay';
import {
  EASTER,
  HANUKKAH,
  LUNAR_NEW_YEAR,
  US_CLOCK_CHANGES,
  fixedDates,
  nthWeekdayDates,
  usFederalHolidays,
  type DateRange,
} from '@/lib/holidays';

// Every holiday and event with a countdown page. Rows carry their date list
// for the worker (data-days-until + data-keep), which rewrites each row's
// next date and days left per request — so the list stays current between
// deploys. Row ORDER is fixed at build (sorted from the build day): a
// holiday that has just passed keeps its place, showing next year's date,
// until the next deploy re-sorts.
const ITEMS: Array<{ name: string; href: string; ranges: DateRange[] }> = [
  { name: 'Halloween', href: '/countdown/halloween/', ranges: fixedDates(9, 31) },
  { name: 'US clocks change', href: '/countdown/daylight-saving-time/', ranges: US_CLOCK_CHANGES },
  { name: 'GTA 6 release', href: '/countdown/gta-6/', ranges: [{ start: '2026-11-19' }] },
  { name: 'Thanksgiving', href: '/countdown/thanksgiving/', ranges: nthWeekdayDates(10, 4, 4) },
  { name: 'Black Friday', href: '/countdown/black-friday/', ranges: nthWeekdayDates(10, 4, 4, 1) },
  { name: 'Hanukkah', href: '/countdown/hanukkah/', ranges: HANUKKAH },
  { name: 'Avengers: Doomsday', href: '/countdown/avengers-doomsday/', ranges: [{ start: '2026-12-18' }] },
  { name: 'Christmas', href: '/countdown/christmas/', ranges: fixedDates(11, 25) },
  { name: "New Year's Day", href: '/countdown/new-year/', ranges: fixedDates(0, 1) },
  { name: 'Lunar New Year', href: '/countdown/lunar-new-year/', ranges: LUNAR_NEW_YEAR },
  { name: "Valentine's Day", href: '/countdown/valentines-day/', ranges: fixedDates(1, 14) },
  { name: 'Super Bowl LXI', href: '/countdown/super-bowl/', ranges: [{ start: '2027-02-14' }] },
  { name: 'Easter', href: '/countdown/easter/', ranges: EASTER.map((e) => ({ start: e.easter })) },
  { name: 'Canada Day', href: '/countdown/canada-day/', ranges: fixedDates(6, 1) },
  { name: '4th of July', href: '/countdown/july-4th/', ranges: fixedDates(6, 4) },
];

const DAY_MS = 86400000;
const toUtc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateLabel = (s: string) =>
  new Date(toUtc(s)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtDate = (d: Date, withYear = false) =>
  d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: withYear ? 'numeric' : undefined });

/** Current-or-next range and the days until it — same rules as the worker. */
function nextOf(ranges: DateRange[], today: string): { start: string; days: number | null } | null {
  for (const r of ranges) {
    if (r.start > today) return { start: r.start, days: Math.round((toUtc(r.start) - toUtc(today)) / DAY_MS) };
    if ((r.end ?? r.start) >= today) return { start: r.start, days: null };
  }
  return null;
}

const spec = (ranges: DateRange[]) => `d:${ranges.map((r) => (r.end && r.end !== r.start ? `${r.start}/${r.end}` : r.start)).join(',')}`;

const BUILD_TODAY = ymdLocal(buildDay());
const ORDERED = ITEMS.map((it) => ({ ...it, buildNext: nextOf(it.ranges, BUILD_TODAY) }))
  .filter((it) => it.buildNext)
  .sort((a, b) => a.buildNext!.start.localeCompare(b.buildNext!.start));

const FEDERAL_YEAR = buildDay().getFullYear() + 1;
const FEDERAL = usFederalHolidays(FEDERAL_YEAR).map((h) => ({
  name: h.name,
  date: fmtDate(h.date),
  observed: h.observed ? fmtDate(h.observed, h.observed.getUTCFullYear() !== FEDERAL_YEAR) : 'Same day',
}));
const REST_OF_YEAR = usFederalHolidays(FEDERAL_YEAR - 1).filter((h) => h.date.toISOString().slice(0, 10) >= BUILD_TODAY);

const listJoin = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// "In 2027, Juneteenth is observed on Fri, Jun 18, …" — computed, so the FAQ
// stays right whichever year the page is built in.
const shifted = usFederalHolidays(FEDERAL_YEAR).filter((h) => h.observed);
const nextNewYear = usFederalHolidays(FEDERAL_YEAR + 1)[0];
const WEEKEND_EXAMPLES =
  (shifted.length
    ? ` In ${FEDERAL_YEAR}, ${listJoin(shifted.map((h) => `${h.name} is observed on ${fmtDate(h.observed!)}`))}.`
    : '') +
  (nextNewYear.observed && nextNewYear.observed.getUTCFullYear() === FEDERAL_YEAR
    ? ` New Year's Day ${FEDERAL_YEAR + 1} falls on a Saturday, so it is observed on ${fmtDate(nextNewYear.observed, true)}.`
    : '');

const LINK = 'text-primary hover:text-primary/80 font-semibold';

export default function HolidaysPage() {
  // Build-day values first (identical on server and client), then the
  // visitor's real today after mount. The worker has already rewritten the
  // HTML to today's values, so this only matters if React re-renders.
  const [today, setToday] = useState(BUILD_TODAY);
  useEffect(() => setToday(ymdLocal(new Date())), []);

  const rows = ORDERED.map((it) => {
    const n = nextOf(it.ranges, today) ?? it.buildNext!;
    return {
      key: it.href,
      name: it.name,
      href: it.href,
      spec: spec(it.ranges),
      date: dateLabel(n.start),
      days: n.days === null ? 'Today' : n.days === 1 ? '1 day' : `${n.days.toLocaleString('en-US')} days`,
    };
  });

  return (
    <EventPage
      heading={'Holidays 2026–2027'}
      tagline="Upcoming holidays and events, with the days left until each — updated daily"
      lastUpdated="2026-10-16"
      breadcrumb="Holidays"
      countdownSlot={
        <section className="bg-card dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">Coming up</h2>
          <StackedTable
            rows={rows}
            firstKey="key"
            firstHeader="Holiday or event"
            columns={[
              { key: 'date', header: 'Next date' },
              { key: 'days', header: 'Days left', right: true },
            ]}
            renderFirst={(r) => (
              <Link href={r.href} className={LINK}>
                {r.name}
              </Link>
            )}
            render={{
              date: (r) => (
                <span data-live="next-date" suppressHydrationWarning>
                  {r.date}
                </span>
              ),
              days: (r) => (
                <span data-live="days" suppressHydrationWarning>
                  {r.days}
                </span>
              ),
            }}
            rowAttrs={(r) => ({ 'data-days-until': r.spec, 'data-keep': '' })}
          />
          <p className="text-sm text-muted-foreground mt-3">
            Days are counted to the start of each date in your own timezone. Each name links to its live countdown.
          </p>
        </section>
      }
      intro={
        <>
          Every holiday and event ClockMath counts down to, in date order, with the <strong>days left until each</strong>,
          plus the full list of <strong>US federal holidays for {FEDERAL_YEAR}</strong> and the days they are observed when
          they fall on a weekend.
        </>
      }
      extraContent={
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
            US federal holidays {FEDERAL_YEAR}
          </h2>
          <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50 px-4 py-2">
            <StackedTable
              rows={FEDERAL}
              firstKey="name"
              firstHeader="Holiday"
              stack="lines"
              columns={[
                { key: 'date', header: 'Date', mobileLabel: 'Date:' },
                { key: 'observed', header: 'Observed', mobileLabel: 'Observed:' },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {REST_OF_YEAR.length > 0 && (
              <>
                Still to come in {FEDERAL_YEAR - 1}:{' '}
                {REST_OF_YEAR.map((h) => `${h.name} (${fmtDate(h.date)})`).join(', ')}.{' '}
              </>
            )}
            When a federal holiday falls on a Saturday it is observed on the Friday before; on a Sunday, the Monday after.
          </p>
        </section>
      }
      faqs={[
        {
          question: `What are the US federal holidays in ${FEDERAL_YEAR}?`,
          answer: `There are 11: ${usFederalHolidays(FEDERAL_YEAR)
            .map((h) => `${h.name} (${fmtDate(h.date)})`)
            .join(', ')}.`,
        },
        {
          question: 'What happens when a federal holiday falls on a weekend?',
          answer: `A Saturday holiday is observed on the Friday before and a Sunday holiday on the Monday after.${WEEKEND_EXAMPLES}`,
        },
        {
          question: 'Are Black Friday and Good Friday federal holidays?',
          answer:
            'No. Neither is a federal holiday, though many employers give Black Friday off. US stock markets close early (1:00 PM Eastern) on Black Friday and stay closed all day on Good Friday.',
        },
        {
          question: "Are Easter, Valentine's Day and Halloween public holidays?",
          answer:
            "Not in the US. Easter Sunday always falls on a weekend; Valentine's Day and Halloween are celebrations, not days off. Easter Monday is a public holiday in the UK (except Scotland), Ireland and Australia.",
        },
      ]}
    />
  );
}
