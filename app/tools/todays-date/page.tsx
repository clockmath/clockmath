'use client';

import Link from 'next/link';
import { TodaysDateTool } from '@/components/TodaysDateTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { isoWeek, julianDayNumber, ordinalDate } from '@/lib/todaysDate';

// Nov 2026: the questions Copilot answers from other sites. Today's figures
// are on the board above, kept current by the worker; the FAQ schema is a
// script the worker doesn't touch, so these answers say how to read the
// date, with worked examples on fixed dates, and never "today is …".
const FAQS = [
  {
    question: 'What is today’s date?',
    answer:
      'Today’s date is at the top of this page, read from your device’s clock in your time zone, with the day of the week and the day of the year. It changes at midnight where you are, so it can be a day ahead of or behind the date somewhere else.',
  },
  {
    question: 'What day of the year is it?',
    answer:
      'The board shows today’s day number, from 1 on January 1 to 365 on December 31 (366 in a leap year), and how many days are left. To work it out, add up the days in the months before this one and add today’s date: November 12, 2026 is 304 + 12 = day 316.',
  },
  {
    question: 'What week number is it?',
    answer: `There are two common systems. ISO 8601 weeks (used in Europe and in most software) start on Monday, and week 1 is the one with the year’s first Thursday, so January 1 can fall in the last week of the year before. US calendars start weeks on Sunday, with week 1 the one that holds January 1. The board shows both; they often match. A year has 52 ISO weeks, or 53: December 31, 2026 is in week ${isoWeek({ year: 2026, month: 12, day: 31 }).week}.`,
  },
  {
    question: 'What is today’s Julian date?',
    answer: `“Julian date” means two different things. On food packaging, in the military and on mainframes it is the year and the day of the year: November 12, 2026 is ${ordinalDate({ year: 2026, month: 11, day: 12 }).iso}, or ${ordinalDate({ year: 2026, month: 11, day: 12 }).yyddd} in the 5-digit YYDDD form. In astronomy it is the count of days since noon on January 1, 4713 BC, with a fraction for the time of day. The board shows both for today.`,
  },
  {
    question: 'What is the Julian day number?',
    answer: `The whole number of days since the start of the astronomical Julian period (noon UTC, January 1, 4713 BC). Each calendar date has one: January 1, 2000 is ${julianDayNumber({ year: 2000, month: 1, day: 1 }).toLocaleString('en-US')}, and November 12, 2026 is ${julianDayNumber({ year: 2026, month: 11, day: 12 }).toLocaleString('en-US')}. Astronomers use it because subtracting two of them gives the days between the dates.`,
  },
  {
    question: 'Is it the same date everywhere?',
    answer:
      'No. The date changes at midnight in each time zone, so for most of each day two dates are in use somewhere: when it is 8 PM Tuesday in New York, it is already Wednesday in Tokyo. Kiribati (UTC+14) and Baker Island (UTC−12) are 26 hours apart, so for two hours a day three dates are in use.',
  },
  {
    question: 'How many days are in this year?',
    answer:
      '365, or 366 in a leap year. Leap years are the ones divisible by 4, except century years not divisible by 400: 2028 is a leap year, 2100 will not be, 2000 was.',
  },
];

export default function TodaysDatePage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <StationChrome currentTool="todays-date" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: "ClockMath Today's Date",
          description:
            "Today's date in your time zone, with the day of the year, days left, ISO and US week numbers, quarter, Julian date and Julian day number.",
          url: 'https://clockmath.com/tools/todays-date/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / Today’s Date
        </nav>
        <h1 className="st-h1">Today’s Date</h1>
        <p className="st-lede">What day it is where you are, with the day of the year, week number and Julian date</p>
      </div>

      <TodaysDateTool />

      <p className="st-nudge">
        Counting from today?{' '}
        <Link href="/tools/days-between-dates/">Days between dates</Link> counts to any date, the{' '}
        <Link href="/tools/date-calculator/">date calculator</Link> adds days, weeks or months, and the{' '}
        <Link href="/countdown/holidays/">holidays list</Link> has the days left until each.
      </p>

      <StationFold>
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground mb-3">
            The date comes from your device’s clock and time zone, and the page turns over at midnight while it’s open.
            The <strong className="text-foreground">day of the year</strong> counts from January 1 as day 1. The{' '}
            <strong className="text-foreground">ISO week</strong> runs Monday to Sunday, numbered so week 1 holds the
            year’s first Thursday; the <strong className="text-foreground">US week</strong> runs Sunday to Saturday,
            with week 1 the one holding January 1.
          </p>
          <p className="text-muted-foreground">
            The <strong className="text-foreground">Julian date</strong> on labels and in logistics is the year and the
            day of the year (2026-316, or 26316). The astronomical <strong className="text-foreground">Julian day
            number</strong> counts whole days since 4713 BC, and the Julian date adds the fraction of the day since noon
            UTC, so it ticks on as you watch.
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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Related tools</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/tools/days-between-dates/" className="text-primary hover:text-primary/80 font-semibold">
                Days between dates calculator
              </Link>{' '}
              — how many days, weeks and business days from today to any date
            </li>
            <li>
              <Link href="/tools/date-calculator/" className="text-primary hover:text-primary/80 font-semibold">
                Date calculator
              </Link>{' '}
              — today plus or minus days, weeks, months or business days
            </li>
            <li>
              <Link href="/tools/timezone/" className="text-primary hover:text-primary/80 font-semibold">
                Time zone converter
              </Link>{' '}
              — the time and date somewhere else right now
            </li>
            <li>
              <Link href="/countdown/holidays/" className="text-primary hover:text-primary/80 font-semibold">
                Holidays 2026–2027
              </Link>{' '}
              — upcoming holidays and the days left until each
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
