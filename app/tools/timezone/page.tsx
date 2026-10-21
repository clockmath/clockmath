'use client';

/* eslint-disable react/no-unescaped-entities */

import { TimezoneConverter } from '@/components/TimezoneConverter';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import QuickAnswers, { type QuickAnswer } from '@/components/QuickAnswers';
import { useDarkMode } from '@/hooks/use-dark-mode';

// Year-round differences, checked against tzdata for Oct 2026–Oct 2027 — stated
// with their seasonal ranges so they stay true whatever day the page is read.
const DIFFERENCES: QuickAnswer[] = [
  { lead: 'New York and London', rest: 'are 5 hours apart, except for about three weeks a year (a week around the start of November, two weeks in March) when it is 4.' },
  { lead: 'Los Angeles and New York', rest: 'are always 3 hours apart. Both change their clocks on the same days.' },
  { lead: 'Chicago and New York', rest: 'are always 1 hour apart.' },
  { lead: 'London and Paris or Berlin', rest: 'are always 1 hour apart. The UK and the EU change on the same days.' },
  { lead: 'New York and Tokyo', rest: 'are 14 hours apart from November to March and 13 hours the rest of the year. Japan does not change its clocks.' },
  { lead: 'New York and India', rest: 'are 10 hours 30 minutes apart from November to March and 9 hours 30 minutes the rest of the year.' },
  { lead: 'London and Sydney', rest: 'are 11 hours apart in the northern winter, 9 hours in the northern summer, and 10 for a few weeks in between.' },
  { lead: 'Vancouver and Seattle', rest: 'are on the same time in summer; from November 2026, Vancouver is 1 hour ahead in winter, because British Columbia stopped changing its clocks.' },
];

const FAQS = [
  {
    question: 'How do I convert a time between two timezones?',
    answer:
      'Search for the two places (a city, region or country), pick the date and time on the "from" side, and press Calculate. The result shows the matching time and date in the other place, and how far ahead or behind it is.',
  },
  {
    question: 'Does it handle daylight saving time?',
    answer:
      "Yes. The converter uses the rules in force on the date you pick, so a meeting in March can show a different difference from one in January. That matters most around the clock changes: New York and London are usually 5 hours apart, but only 4 for about three weeks a year because the US and UK change on different dates.",
  },
  {
    question: 'Can I convert a time on a future date?',
    answer:
      "Yes — pick any date. The converter applies that date's daylight-saving rules on both sides, which is what you need for scheduling a call or a flight weeks ahead.",
  },
  {
    question: 'What is the difference between UTC and GMT?',
    answer:
      'For everyday purposes they are the same time. UTC is the world time standard that clocks and computers use; GMT is the time zone of the UK in winter. In summer the UK moves to BST, one hour ahead of UTC.',
  },
  {
    question: 'Why is Vancouver an hour ahead of Seattle this winter?',
    answer:
      'British Columbia stopped changing its clocks in 2026 and stays on UTC−7 all year. Seattle still goes back an hour on November 1, so from November to March Vancouver is an hour ahead; in summer they line up again.',
  },
];


export default function TimezonePage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();



  return (
    <StationChrome currentTool="timezone" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Time Zone Converter',
          description: 'Convert time between any timezone instantly. Auto-detects your location, supports all global timezones, and handles daylight saving time.',
          url: 'https://clockmath.com/tools/timezone/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />
      <Toaster />

        <div className="st-intro">

          <nav className="st-crumbs" aria-label="Breadcrumb">

            <Link href="/tools/">Tools</Link> / Time Zone Converter

          </nav>

          <h1 className="st-h1">Time Zone Converter</h1>

          <p className="st-lede">Convert time between any two places — DST handled automatically</p>

        </div>

        {/* Tools Navigation */}
        {/* Timezone Converter */}
        <TimezoneConverter className="mb-section" />

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          How the timezone converter works
        </h2>
        <p className="text-muted-foreground mb-3">
          Pick where you are and where the other person is, then a date and time. The converter looks up both places&apos;
          timezone rules <strong className="text-foreground">for that exact date</strong>, including daylight saving time,
          and shows the matching time on the other side, the date there (it may already be tomorrow), and how many hours
          one place is ahead of the other.
        </p>
        <p className="text-muted-foreground">
          The date matters because clocks don&apos;t all change on the same day. The US changes in March and November, the UK
          and EU on the last Sundays of March and October, and most of the world never changes. So the gap between two
          cities can be different next month from what it is today. For the next change where you are, see{' '}
          <Link href="/countdown/daylight-saving-time" className="text-primary hover:text-primary/80 font-semibold">
            when the clocks change
          </Link>
          .
        </p>
      </section>

      <QuickAnswers heading="Common time differences" intro="These stay true all year, including the seasonal changes:" items={DIFFERENCES} />

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          Related tools and guides
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/tools/market-hours" className="text-primary hover:text-primary/80 font-semibold">
              Stock market hours
            </Link>{' '}
            — when the world&apos;s major exchanges open, in your timezone
          </li>
          <li>
            <Link href="/articles/timezone-converter-remote-work-meetings" className="text-primary hover:text-primary/80 font-semibold">
              Scheduling meetings across timezones
            </Link>{' '}
            — finding a time that works for a remote team
          </li>
          <li>
            <Link href="/articles/travel-timezone-converter" className="text-primary hover:text-primary/80 font-semibold">
              Travel and timezones
            </Link>{' '}
            — flights, arrival times and jet lag
          </li>
        </ul>
      </section>


        <SiteFooter />
    </StationChrome>
  );
}
