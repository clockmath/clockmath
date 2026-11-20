import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { MonthGrid, MonthPrintButton } from '@/components/MonthCalendar';
import { YearLegend } from '@/components/YearCalendar';
import { generateSEOMetadata } from '@/lib/seo';
import {
  MONTH_NAMES,
  MONTH_SLUGS,
  adjacentMonth,
  andList,
  longDate,
  monthDescription,
  monthFacts,
  monthFromSlug,
  monthMarks,
  monthTitle,
  offName,
  shortDate,
} from '@/lib/yearCalendar';

/**
 * /calendar/<year>/<month>/ (Nov 2026): one static page per month of each
 * year with a calendar page. Each app/calendar/<year>/[month]/page.tsx is a
 * few lines that call these. Every date and count comes from
 * lib/yearCalendar.ts, so the month, the year page and the holidays list
 * agree.
 */
export const monthParams = () => MONTH_SLUGS.map((month) => ({ month }));

export function monthMetadata(year: number, slug: string): Metadata {
  const month = monthFromSlug(slug);
  if (!month) return {};
  const name = `${MONTH_NAMES[month - 1].toLowerCase()} ${year}`;
  return generateSEOMetadata({
    title: monthTitle(year, month),
    description: monthDescription(year, month),
    path: `/calendar/${year}/${slug}`,
    ogImage: '/og/countdown/holidays.png?v=3',
    keywords: [
      `${name} calendar`,
      `calendar ${name}`,
      `${name} calendar with holidays`,
      `${name} calendar printable`,
      `printable ${name} calendar`,
      `${name} holidays`,
      `working days ${name}`,
    ].join(', '),
  });
}

const monthHref = (at: { year: number; month: number }) => `/calendar/${at.year}/${MONTH_SLUGS[at.month - 1]}/`;
const monthLabel = (at: { year: number; month: number }) => `${MONTH_NAMES[at.month - 1]} ${at.year}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function MonthCalendarPage({ year, slug }: { year: number; slug: string }) {
  const month = monthFromSlug(slug);
  if (!month) notFound();
  const name = `${MONTH_NAMES[month - 1]} ${year}`;
  const marks = monthMarks(year, month);
  const facts = monthFacts(year, month);
  const offs = marks.filter((m) => m.kind === 'off');
  // A weekend holiday's day off, with its year when that's another one (New
  // Year's Day 2028 is off on Fri Dec 31, 2027)
  const dayOff = (m: (typeof marks)[number]) => {
    const d = m.observed ?? m.date;
    return d.startsWith(`${year}-`) ? shortDate(d) : `${shortDate(d)}, ${d.slice(0, 4)}`;
  };
  const prev = adjacentMonth(year, month, -1);
  const next = adjacentMonth(year, month, 1);

  const offWords = offs.length
    ? `${plural(offs.length, 'federal day')} off (${andList(offs.map((m) => `${offName(m)}, ${shortDate(m.date)}`))})`
    : 'no federal days off';
  const lede = `${name} starts on a ${facts.starts} and has ${facts.days} days: ${facts.workingDays} working days and ${offWords}.`;

  const holidayWords = marks.length
    ? `${andList(marks.map((m) => `${m.kind === 'off' ? offName(m) : m.name} (${shortDate(m.date)}${m.kind === 'off' ? `, federal day off${m.name.endsWith('(observed)') ? ', observed' : ''}` : m.kind === 'weekend-holiday' ? `, federal, day off ${dayOff(m)}` : ''})`))}.`
    : 'None: no federal holidays or widely marked days fall in it.';
  const FAQS = [
    { question: `What holidays are in ${name}?`, answer: holidayWords },
    {
      question: `How many working days are in ${name}?`,
      answer: `${facts.workingDays}: ${name} has ${facts.weekdays} weekdays (Monday to Friday), less ${offWords}. States and employers add their own holidays, so check your own calendar.`,
    },
    {
      question: `What day does ${name} start on?`,
      answer: `${name} starts on ${longDate(`${year}-${String(month).padStart(2, '0')}-01`)} and ends on ${longDate(`${year}-${String(month).padStart(2, '0')}-${facts.days}`)}. It has ${facts.days} days.`,
    },
  ];

  return (
    <StationChrome currentTool="year-calendar">
      <JsonLd data={getFAQPageSchema(FAQS)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Tools', item: 'https://clockmath.com/tools/' },
            { '@type': 'ListItem', position: 2, name: `${year} calendar`, item: `https://clockmath.com/calendar/${year}/` },
            { '@type': 'ListItem', position: 3, name, item: `https://clockmath.com/calendar/${year}/${slug}/` },
          ],
        }}
      />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / <Link href={`/calendar/${year}/`}>{year} Calendar</Link> / {MONTH_NAMES[month - 1]}
        </nav>
        <h1 className="st-h1">{name} Calendar</h1>
        <p className="st-lede">{lede}</p>
      </div>

      {/* Print first (the lesson of the year pages), then the month either side */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <MonthPrintButton year={year} month={month} />
        <nav aria-label="Other months" className="st-mcal-nav">
          {prev && (
            <Link href={monthHref(prev)} rel="prev">
              ‹ {monthLabel(prev)}
            </Link>
          )}
          {next && (
            <Link href={monthHref(next)} rel="next">
              {monthLabel(next)} ›
            </Link>
          )}
        </nav>
      </div>

      <section className="max-w-3xl mx-auto mb-section st-cal-section" aria-label={`${name} calendar`}>
        <MonthGrid year={year} month={month} />
        <YearLegend />
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Holidays in {name}</h2>
        {marks.length ? (
          <ul className="st-list">
            {marks.map((m) => (
              <li key={m.date + m.name}>
                <span>
                  {m.kind === 'off' ? offName(m) : m.name}
                  {m.kind === 'off' && (m.name.endsWith('(observed)') ? ' (federal day off, observed)' : ' (federal day off)')}
                  {m.kind === 'weekend-holiday' && ` (day off ${dayOff(m)})`}
                </span>
                <span>{shortDate(m.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No US federal holidays or widely marked days fall in {name}.</p>
        )}
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">{name} at a glance</h2>
        <ul className="st-list">
          <li>
            <span>Starts</span>
            <span>{facts.starts}</span>
          </li>
          <li>
            <span>Ends</span>
            <span>{facts.ends}</span>
          </li>
          <li>
            <span>Days</span>
            <span>{facts.days}</span>
          </li>
          <li>
            <span>Weekdays</span>
            <span>{facts.weekdays}</span>
          </li>
          <li>
            <span>Working days (less federal days off)</span>
            <span>{facts.workingDays}</span>
          </li>
        </ul>
        <p className="text-muted-foreground text-sm mt-3">
          Count the working days between any two dates with <Link href="/tools/days-between-dates/">days between dates</Link>.
        </p>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Every month of {year}</h2>
        <ul className="st-mcal-months">
          {MONTH_NAMES.map((m, i) => (
            <li key={m}>
              {i + 1 === month ? (
                <span aria-current="page">{m}</span>
              ) : (
                <Link href={monthHref({ year, month: i + 1 })}>{m}</Link>
              )}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm mt-3">
          The whole year on one page: <Link href={`/calendar/${year}/`}>{year} calendar with holidays</Link>.
        </p>
      </section>

      <StationFold>
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50">
                <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">About this calendar</h2>
          <p className="text-muted-foreground">
            Weeks start on Sunday, as on most US calendars. The federal holidays are the eleven in 5 U.S.C. 6103; when one
            falls on a Saturday the day off is the Friday before, and on a Sunday the Monday after. Banks, schools, states
            and private employers set their own days off. The other days are marked because most calendars show them;
            none is a federal day off.
          </p>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
