'use client';

import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import StackedTable from '@/components/StackedTable';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { YearGrid, YearLegend, YearPrintButton } from '@/components/YearCalendar';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { longDate, shortDate, yearFacts, yearMarks } from '@/lib/yearCalendar';

/**
 * /calendar/<year>/: one page per year, from app/calendar/<year>/page.tsx.
 * Every date and count is computed (lib/yearCalendar.ts on lib/holidays.ts).
 */
export default function YearCalendarPage({ year }: { year: number }) {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const marks = yearMarks(year);
  const facts = yearFacts(year);
  const federal = marks.filter((m) => m.kind !== 'other' && !m.name.endsWith('(observed)'));
  const offFor = (name: string) => marks.find((m) => m.kind === 'off' && (m.name === name || m.name === `${name} (observed)`));
  const rows = federal.map((h) => {
    const off = offFor(h.name);
    return { holiday: h.name, date: shortDate(h.date), off: off ? (off.date === h.date ? 'Same day' : shortDate(off.date)) : '' };
  });
  const nextNewYear = marks.find((m) => m.kind === 'off' && m.name.includes(`${year + 1}`));
  const others = marks.filter((m) => m.kind === 'other');
  const weekendOnes = federal.filter((h) => h.kind === 'weekend-holiday');

  const FAQS = [
    {
      question: `How many federal holidays are there in ${year}?`,
      answer:
        `There are 11 US federal holidays, and ${facts.federalDaysOff} federal days off fall in ${year}.` +
        (nextNewYear
          ? ` The extra one is ${longDate(nextNewYear.date)}: New Year's Day ${year + 1} is a Saturday, so it is observed on the Friday before, in ${year}.`
          : '') +
        (weekendOnes.length
          ? ` ${weekendOnes.map((h) => h.name).join(', ')} fall on a weekend, so the day off is the Friday before (Saturday) or the Monday after (Sunday).`
          : ''),
    },
    {
      question: `How many working days are there in ${year}?`,
      answer: `${facts.workingDays}: there are ${facts.weekdays} weekdays (Monday to Friday) in ${year}, less ${facts.federalDaysOff} federal days off. States and employers add their own holidays, so check your own calendar.`,
    },
    ...weekendOnes.map((h) => {
      const off = offFor(h.name);
      return {
        question: `When is ${h.name} observed in ${year}?`,
        // Banks follow the Federal Reserve, which closes on the Monday after a
        // Sunday holiday but stays open on the Friday before a Saturday one
        answer:
          `${h.name} falls on ${longDate(h.date)}, so federal employees have ${off ? longDate(off.date) : 'the nearest weekday'} off instead.` +
          (new Date(`${h.date}T12:00:00Z`).getUTCDay() === 6
            ? ' Banks usually stay open that Friday: the Federal Reserve does not move Saturday holidays.'
            : ' Banks usually close that Monday too, as the Federal Reserve does.'),
      };
    }),
    {
      question: `What day of the week does ${year} start on?`,
      answer: `${year} starts on a ${facts.starts} and ends on a ${facts.ends}. It has ${facts.days} days${facts.leap ? `: it is a leap year, with February 29` : `, as it is not a leap year`}.`,
    },
    {
      question: `When do the clocks change in ${year}?`,
      answer: `In the US, the clocks go forward on ${longDate(others.find((m) => m.name === 'Clocks go forward (US)')?.date ?? `${year}-03-01`)} and back on ${longDate(others.find((m) => m.name === 'Clocks go back (US)')?.date ?? `${year}-11-01`)}. The daylight saving page has the dates for other countries.`,
    },
  ];

  return (
    <StationChrome currentTool="year-calendar" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / {year} Calendar
        </nav>
        <h1 className="st-h1">{year} Calendar with Holidays</h1>
        <p className="st-lede">
          Every month of {year} with the US federal days off marked, the holidays that fall on a weekend, and the days
          most calendars note
        </p>
      </div>

      <section className="max-w-3xl mx-auto mb-section st-cal-section" aria-label={`${year} calendar`}>
        <YearGrid year={year} />
        <YearLegend />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <YearPrintButton year={year} />
          <span className="text-sm text-muted-foreground">All twelve months and the days off, on one page</span>
        </div>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">US federal holidays {year}</h2>
        <StackedTable
          rows={rows}
          firstKey="holiday"
          firstHeader="Holiday"
          stack="inline"
          minWidth="sm:min-w-[30rem]"
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'off', header: 'Day off', mobileLabel: 'Day off:' },
          ]}
        />
        {nextNewYear && (
          <p className="text-muted-foreground text-sm mt-3">
            Also off in {year}: {longDate(nextNewYear.date)}, for New Year&apos;s Day {year + 1}.
          </p>
        )}
        <p className="text-muted-foreground text-sm mt-3">
          {facts.federalDaysOff} federal days off and {facts.workingDays} working days in {year}. Count the working days
          between any two dates with <Link href="/tools/days-between-dates/">days between dates</Link>, or see the days
          left until each holiday on the <Link href="/countdown/holidays/">holidays list</Link>.
        </p>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Other days in {year}</h2>
        <ul className="st-list">
          {others.map((m) => (
            <li key={m.date + m.name}>
              <span>{m.name}</span>
              <span>{shortDate(m.date)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">{year} at a glance</h2>
        <ul className="st-list">
          <li>
            <span>Starts</span>
            <span>{longDate(`${year}-01-01`)}</span>
          </li>
          <li>
            <span>Ends</span>
            <span>{longDate(`${year}-12-31`)}</span>
          </li>
          <li>
            <span>Days</span>
            <span>{facts.days}{facts.leap ? ' (leap year)' : ''}</span>
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
      </section>

      <StationFold>
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">About this calendar</h2>
          <p className="text-muted-foreground">
            Weeks start on Sunday, as on most US calendars. The federal holidays are the eleven in 5 U.S.C. 6103; when
            one falls on a Saturday the day off is the Friday before, and on a Sunday the Monday after. Banks, schools,
            states and private employers set their own days off, which often follow these but not always. The other days are marked because most calendars show them;
            none is a federal day off.
          </p>
        </section>

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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Related</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/countdown/holidays/" className="text-primary hover:text-primary/80 font-semibold">
                Holidays list
              </Link>{' '}
              — every holiday and the days left until each
            </li>
            <li>
              <Link href="/tools/days-between-dates/" className="text-primary hover:text-primary/80 font-semibold">
                Days between dates
              </Link>{' '}
              — days, weeks and business days between any two dates
            </li>
            <li>
              <Link href="/countdown/daylight-saving-time/dates/" className="text-primary hover:text-primary/80 font-semibold">
                Daylight saving time dates
              </Link>{' '}
              — when the clocks change in each country, to 2035
            </li>
            <li>
              <Link href="/tools/todays-date/" className="text-primary hover:text-primary/80 font-semibold">
                Today&apos;s date
              </Link>{' '}
              — the day of the year and the week number
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
