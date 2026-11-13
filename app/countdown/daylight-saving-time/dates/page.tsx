'use client';

import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import StackedTable from '@/components/StackedTable';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { DstPrintButton, DstRegionLinks, DstRegionTables } from '@/components/DstDatesTable';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { buildDay } from '@/lib/buildDay';
import { DST_REGIONS, FIRST_YEAR, LAST_YEAR, NEVER, STOPPED, dstYear, getDstRegion } from '@/lib/dstDates';

// Nov 2026: every date here comes from lib/dstDates.ts (rules, checked
// against the IANA zone data in tests/dstDates.test.ts), never typed in.
const US = getDstRegion('us')!;
const EU = getDstRegion('eu')!;
const AU = getDstRegion('australia')!;
const long = (ymd: string) =>
  new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

// The year "at a glance" is about: the first whose US autumn change is still
// ahead on the build day (2027 from November 2026). Build day, not today, so
// the static HTML and the first render agree.
const today = buildDay();
const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const FOCUS = Math.min(LAST_YEAR, dstYear(US, today.getFullYear()).back.ymd >= todayYmd ? today.getFullYear() : today.getFullYear() + 1);

const sentence = (y: number) => {
  const us = dstYear(US, y);
  const eu = dstYear(EU, y);
  return `In the US and most of Canada, daylight saving time in ${y} starts on ${long(us.forward.ymd)} and ends on ${long(us.back.ymd)}. In the UK and the EU the clocks go forward on ${long(eu.forward.ymd)} and back on ${long(eu.back.ymd)}.`;
};

const FAQS = [
  { question: `When is daylight saving time in ${FOCUS}?`, answer: sentence(FOCUS) },
  {
    question: `When does daylight saving time end in ${FOCUS}?`,
    answer: `In the US and most of Canada on ${long(dstYear(US, FOCUS).back.ymd)}, when 2:00 AM goes back to 1:00 AM. In the UK and Europe on ${long(dstYear(EU, FOCUS).back.ymd)}. In southeast Australia summer time ends on ${long(dstYear(AU, FOCUS).back.ymd)} and starts again on ${long(dstYear(AU, FOCUS).forward.ymd)}.`,
  },
  { question: `When do the clocks change in ${FOCUS + 1}?`, answer: sentence(FOCUS + 1) },
  {
    question: 'Why is daylight saving time on a different date every year?',
    answer:
      'Because the rules name a weekday, not a date. In the US the clocks go forward on the second Sunday in March and back on the first Sunday in November, so the dates move between March 8–14 and November 1–7. In Europe it is the last Sunday in March and in October.',
  },
  {
    question: 'Is the US getting rid of daylight saving time?',
    answer:
      'Not under current law. Bills to stop the changes, such as the Sunshine Protection Act, have been introduced in Congress, but none has become law, so the US dates in this table apply. States cannot choose permanent summer time on their own; Hawaii and most of Arizona stay on standard time all year. In Canada, British Columbia, Alberta, the Northwest Territories and Manitoba stopped changing in 2026.',
  },
  {
    question: 'Is Europe getting rid of the clock changes?',
    answer:
      'Not yet. The European Parliament voted in 2019 to end them, but EU governments have not agreed on it, so the clocks still go forward on the last Sunday in March and back on the last Sunday in October, everywhere in the EU at the same moment (1:00 AM UTC).',
  },
  {
    question: 'Which countries do not change their clocks?',
    answer: `Most of the world: ${NEVER}. Among the places that stopped recently: ${STOPPED.map((s) => `${s.where} in ${s.since}`).join('; ')}.`,
  },
];

const glance = DST_REGIONS.map((r) => {
  const d = dstYear(r, FOCUS);
  return { where: r.name, forward: d.forward.label, back: d.back.label };
});

export default function DstDatesPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <StationChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/countdown/">Countdowns</Link> /{' '}
          <Link href="/countdown/daylight-saving-time/">Daylight saving time</Link> / Dates
        </nav>
        <h1 className="st-h1">
          Daylight Saving Time Dates {FIRST_YEAR}–{LAST_YEAR}
        </h1>
        <p className="st-lede">When the clocks go forward and back each year, country by country</p>
      </div>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">{FOCUS} at a glance</h2>
        <p className="text-muted-foreground mb-4">{sentence(FOCUS)}</p>
        <StackedTable
          rows={glance}
          firstKey="where"
          firstHeader="Where"
          stack="inline"
          minWidth="sm:min-w-[32rem]"
          columns={[
            { key: 'forward', header: `Forward ${FOCUS}`, mobileLabel: 'Forward' },
            { key: 'back', header: `Back ${FOCUS}`, mobileLabel: 'Back' },
          ]}
        />
        <p className="text-muted-foreground text-sm mt-3">
          Local dates. Forward means the clocks skip an hour (an hour less sleep), back means an hour repeats. Your own
          next change, counted down: <Link href="/countdown/daylight-saving-time/">when do the clocks change?</Link>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DstPrintButton />
          <span className="text-sm text-muted-foreground">Every region and year on one page</span>
        </div>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-2">Every year to {LAST_YEAR}</h2>
        <DstRegionLinks />
      </section>

      <DstRegionTables />

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Places that stopped changing</h2>
        <ul className="st-list">
          {STOPPED.map((s) => (
            <li key={s.where}>
              <span>{s.where}</span>
              <span>{s.since}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm mt-3">
          Never change, or not in living memory: {NEVER}.
        </p>
      </section>

      <StationFold>
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">About these dates</h2>
          <p className="text-muted-foreground mb-3">
            Each date is worked out from the country’s rule (the second Sunday in March, the last Sunday in October…),
            then checked against the IANA time zone database that phones and computers use. They hold as long as the
            rules do: when a country changes its law, the table changes with it.
          </p>
          <p className="text-muted-foreground">
            The changes in Europe happen at the same moment everywhere, 1:00 AM UTC, so the local time differs: 1:00 AM
            in London, 2:00 AM in Paris, 3:00 AM in Athens. In the US each zone changes at 2:00 AM by its own clock, so the
            change sweeps west across the country an hour at a time.
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
              <Link href="/countdown/daylight-saving-time/" className="text-primary hover:text-primary/80 font-semibold">
                When do the clocks change?
              </Link>{' '}
              — a live countdown to the next change where you are
            </li>
            <li>
              <Link href="/time/" className="text-primary hover:text-primary/80 font-semibold">
                Time differences between cities
              </Link>{' '}
              — how the gaps shift when the clocks change
            </li>
            <li>
              <Link href="/tools/timezone/" className="text-primary hover:text-primary/80 font-semibold">
                Time zone converter
              </Link>{' '}
              — any two places, with daylight saving handled
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
