'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventPage from '@/components/EventPage';
import StackedTable from '@/components/StackedTable';
import { buildDay } from '@/lib/buildDay';
import { eventColour } from '@/lib/countdowns';
import {
  EASTER,
  HANUKKAH,
  LUNAR_NEW_YEAR,
  US_CLOCK_CHANGES,
  fixedDates,
  holidayList,
  nthWeekdayDates,
  usFederalHolidays,
  type DateRange,
  type HolidayId,
  type ListedHoliday,
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
  { name: 'Beyond the Spider-Verse', href: '/countdown/beyond-the-spider-verse/', ranges: [{ start: '2027-06-18' }] },
  { name: "Valentine's Day", href: '/countdown/valentines-day/', ranges: fixedDates(1, 14) },
  { name: 'Super Bowl LXI', href: '/countdown/super-bowl/', ranges: [{ start: '2027-02-14' }] },
  { name: 'Fable release', href: '/countdown/fable/', ranges: [{ start: '2027-02-23' }] },
  { name: 'Easter', href: '/countdown/easter/', ranges: EASTER.map((e) => ({ start: e.easter })) },
  { name: 'FF7 Revelation release', href: '/countdown/final-fantasy-7-revelation/', ranges: [{ start: '2027-04-08' }] },
  { name: 'Canada Day', href: '/countdown/canada-day/', ranges: fixedDates(6, 1) },
  { name: 'God of War Laufey release', href: '/countdown/god-of-war-laufey/', ranges: [{ start: '2027-05-20' }] },
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

// Nov 2026: the full year lists, this year's and next ("holidays in 2026"
// drew 1K–5K Copilot citations to other sites while the page had only next
// year's federal holidays, inside the closed fold). On the page, under the
// board, not in the fold. A year list keeps its past rows: it's a calendar,
// not a countdown.
const LIST_YEARS = [FEDERAL_YEAR - 1, FEDERAL_YEAR];
const PAGE_FOR: Partial<Record<HolidayId, string>> = {
  'new-year': '/countdown/new-year/',
  'lunar-new-year': '/countdown/lunar-new-year/',
  valentines: '/countdown/valentines-day/',
  easter: '/countdown/easter/',
  'july-4th': '/countdown/july-4th/',
  halloween: '/countdown/halloween/',
  thanksgiving: '/countdown/thanksgiving/',
  'black-friday': '/countdown/black-friday/',
  hanukkah: '/countdown/hanukkah/',
  christmas: '/countdown/christmas/',
};
const listRows = (year: number) =>
  holidayList(year).map((h: ListedHoliday) => ({
    key: h.id,
    name: h.name,
    date: dateLabel(h.date),
    federal: h.federal ? 'yes' : '',
    // One column, so a phone row is two lines: "Sat, Jul 4, 2026 · Federal
    // holiday, off Fri, Jul 3". The observed day carries its year when it is
    // in the year before (New Year's Day on a Saturday).
    type: !h.federal
      ? 'Observance'
      : h.observed
        ? `Federal holiday, off ${h.observed.startsWith(`${year}-`) ? dateLabel(h.observed).replace(/, \d{4}$/, '') : dateLabel(h.observed)}`
        : 'Federal holiday',
  }));
const LISTS = LIST_YEARS.map((year) => ({ year, rows: listRows(year), all: holidayList(year) }));

const fmtShort = (s: string) => new Date(toUtc(s)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });

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
      dot: eventColour(it.href) ?? '',
      spec: spec(it.ranges),
      date: dateLabel(n.start),
      days: n.days === null ? 'Today' : n.days === 1 ? '1 day' : `${n.days.toLocaleString('en-US')} days`,
    };
  });

  return (
    <EventPage
      heading={'Holidays 2026–2027'}
      tagline="Upcoming holidays and events, with the days left until each — updated daily"
      lastUpdated="2026-11-12"
      breadcrumb="Holidays"
      countdownSlot={
        <>
        {/* A departures board: every countdown in date order, days left set
            large. Its own table, not StackedTable: rows lay out as a grid on
            phones (name and date left, days right). Explicit roles keep the
            table semantics that display changes drop. */}
        <section className="st-departures" aria-labelledby="st-coming-up">
          <h2 id="st-coming-up">Coming up</h2>
          <table role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader" scope="col">Holiday or event</th>
                <th role="columnheader" scope="col">Next date</th>
                <th role="columnheader" scope="col">Days left</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => (
                <tr key={r.key} role="row" data-days-until={r.spec} data-keep="">
                  <th role="rowheader" scope="row">
                    <Link href={r.href}>
                      {r.dot && <span className="st-dot" style={{ '--dot': r.dot } as React.CSSProperties} aria-hidden="true" />}
                      {r.name}
                    </Link>
                  </th>
                  <td role="cell">
                    <span data-live="next-date" suppressHydrationWarning>
                      {r.date}
                    </span>
                  </td>
                  <td role="cell">
                    <span data-live="days" suppressHydrationWarning>
                      {r.days}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Days are counted to the start of each date in your own timezone. Each name links to its live countdown.</p>
        </section>

        {LISTS.map(({ year, rows }) => (
          <section key={year} className="max-w-3xl mx-auto mb-section" aria-labelledby={`holidays-${year}`} id={`holidays-${year}`}>
            <h2 id={`holidays-${year}`} className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
              Holidays {year}
            </h2>
            <div>
              <p className="text-muted-foreground mb-3">
                The 11 US federal holidays in {year} and the other days most calendars mark, in date order.
              </p>
              <StackedTable
                rows={rows}
                firstKey="key"
                firstHeader="Holiday"
                renderFirst={(r) =>
                  PAGE_FOR[r.key as HolidayId] ? (
                    <Link href={PAGE_FOR[r.key as HolidayId]!} className="text-primary hover:text-primary/80">
                      {r.name}
                    </Link>
                  ) : (
                    r.name
                  )
                }
                columns={[
                  { key: 'date', header: 'Date' },
                  { key: 'type', header: 'Federal holiday or observance' },
                ]}
                rowAttrs={(r): Record<string, string> => (r.federal ? { 'data-federal': '' } : {})}
              />
            </div>
          </section>
        ))}
        </>
      }
      intro={
        <>
          Every holiday and event ClockMath counts down to, in date order, with the <strong>days left until each</strong>,
          plus the <strong>full lists of holidays for {LIST_YEARS.join(' and ')}</strong>: the 11 US federal holidays with
          the days they are observed when they fall on a weekend, and the other days most calendars mark. When a federal
          holiday falls on a Saturday it is observed on the Friday before; on a Sunday, the Monday after.
        </>
      }
      faqs={[
        ...LISTS.map(({ year, all }) => ({
          question: `What are the holidays in ${year}?`,
          answer: `In ${year}: ${all.map((h) => `${h.name.replace(/ \(.*\)$/, '')} (${fmtShort(h.date)}${h.federal ? ', federal' : ''})`).join(', ')}. Federal holidays are days off for federal workers, banks and most schools; the rest are observances.`,
        })),
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
