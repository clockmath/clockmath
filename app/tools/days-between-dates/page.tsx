'use client';

import Link from 'next/link';
import { DaysBetweenTool } from '@/components/DaysBetweenTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import QuickAnswers, { type QuickAnswer } from '@/components/QuickAnswers';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { buildDay } from '@/lib/buildDay';
import { dateDifference, isLeapYear, partsWords, plural, type CalendarDate } from '@/lib/dateDiff';

// Nov 2026: the questions Copilot answers from other sites ("days between
// dates", "calculate days", "count days", "time between dates", "date
// counter", "days count"), answered here in full sentences. Every figure is
// worked out with the tool's own lib/dateDiff.ts, on fixed dates, so the
// static HTML stays true after the day it was built.
const d = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });
const days = (a: CalendarDate, b: CalendarDate, inclusive = false) => dateDifference(a, b, { inclusive }).days;

const YEAR = buildDay().getFullYear();
let nextLeap = YEAR + 1;
while (!isLeapYear(nextLeap)) nextLeap++;

const wholeYear = dateDifference(d(YEAR, 1, 1), d(YEAR + 1, 1, 1));
const weekdaysThisYear = dateDifference(d(YEAR, 1, 1), d(YEAR, 12, 31), { inclusive: true }).businessDays;
const monthEnd = dateDifference(d(2027, 1, 31), d(2027, 2, 28));
const spring = dateDifference(d(2027, 3, 1), d(2027, 6, 1));
const workWeek = dateDifference(d(2026, 11, 9), d(2026, 11, 13));
const workWeekBoth = dateDifference(d(2026, 11, 9), d(2026, 11, 13), { inclusive: true });

const COMMON: QuickAnswer[] = [
  {
    lead: `Jan 1 to Dec 31, ${YEAR}`,
    rest: `is ${plural(days(d(YEAR, 1, 1), d(YEAR, 12, 31)), 'day')}, or ${plural(days(d(YEAR, 1, 1), d(YEAR, 12, 31), true), 'day')} counting both dates.`,
  },
  {
    lead: `Jan 1, ${YEAR} to Jan 1, ${YEAR + 1}`,
    rest: `is ${plural(wholeYear.days, 'day')}: ${partsWords([wholeYear.weeks.weeks, 'week'], [wholeYear.weeks.days, 'day'])}.`,
  },
  {
    lead: 'A year',
    rest: `is 365 days, or 366 in a leap year (${nextLeap} is the next one).`,
  },
  {
    lead: 'A month',
    rest: 'is 28 to 31 days: 30.44 on average.',
  },
  {
    lead: 'Monday to Friday',
    rest: `is ${plural(workWeek.days, 'day')} apart, and ${plural(workWeekBoth.businessDays, 'business day')} counting both.`,
  },
  {
    lead: `Business days in ${YEAR}`,
    rest: `has ${weekdaysThisYear} weekdays (Monday to Friday), before public holidays.`,
  },
  {
    lead: 'Jan 31 to Feb 28, 2027',
    rest: `is ${plural(monthEnd.days, 'day')}, and a whole month: the end of one month to the end of the next.`,
  },
  {
    lead: 'Mar 1 to Jun 1, 2027',
    rest: `is ${plural(spring.days, 'day')}, exactly ${plural(spring.months.months, 'month')}.`,
  },
  {
    lead: 'Feb 1 to Mar 1',
    rest: `is ${plural(days(d(2027, 2, 1), d(2027, 3, 1)), 'day')}, or ${days(d(2028, 2, 1), d(2028, 3, 1))} in a leap year like 2028.`,
  },
  {
    lead: '100 days',
    rest: `is ${partsWords([Math.floor(100 / 7), 'week'], [100 % 7, 'day'])}, a little over 3 months.`,
  },
];

const FAQS = [
  {
    question: 'How do I calculate the number of days between two dates?',
    answer: `Pick the start and end dates above and the count appears at once, with weeks, months and business days. By hand: take the days left in the starting month, add the length of each full month in between, then add the end date's day. March 1 to April 15, 2026 is 30 + 15 = ${days(d(2026, 3, 1), d(2026, 4, 15))} days.`,
  },
  {
    question: 'Does the count include the start date and the end date?',
    answer: `By default the start date counts and the end date doesn't, which is what "how many days until" means: Monday to Friday is ${workWeek.days} days. Tick "Include the end date" to count both, as for a leave period or an event that runs on both days: Monday to Friday is then ${workWeekBoth.days} days.`,
  },
  {
    question: 'How many business days are between two dates?',
    answer: `The answer counts Mondays to Fridays. Monday, November 9 to Friday, November 13, 2026 is ${workWeekBoth.businessDays} business days counting both dates, ${workWeek.businessDays} without the end date. Public holidays aren't taken off, since they differ by country and employer: subtract any that fall in the span.`,
  },
  {
    question: 'How do I count the days from today?',
    answer:
      'Press "From today" over the start date and pick the end date: the answer is the days until it. For the days since a date in the past, pick it as the start date and press "To today" over the end date. Copy link saves both dates, to share or come back to.',
  },
  {
    question: 'How are months counted when the months have different lengths?',
    answer: `A month is counted from the start date to the same date of a later month: March 15 to April 15 is one month. When that date doesn't exist, the month's last day stands in for it, so January 31 to February 28, 2027 is a whole month (${monthEnd.days} days), and January 31 to March 1 is 1 month 1 day. The remainder is shown in days.`,
  },
  {
    question: 'Do leap years and daylight saving time change the count?',
    answer: `Leap years do, when the span includes February 29: Jan 1, 2028 to Jan 1, 2029 is ${days(d(2028, 1, 1), d(2029, 1, 1))} days, a year later ${days(d(2029, 1, 1), d(2030, 1, 1))}. Daylight saving time doesn't: the calculator counts calendar days, so the day the clocks change still counts as one day, even though it is 23 or 25 hours long.`,
  },
  {
    question: 'How many weeks are between two dates?',
    answer: `Divide the days by 7: the whole number is the weeks and the remainder is the extra days. ${plural(wholeYear.days, 'day')} is ${partsWords([wholeYear.weeks.weeks, 'week'], [wholeYear.weeks.days, 'day'])}. The calculator shows this under "Weeks and days".`,
  },
  {
    question: 'How do I calculate days between dates in Excel or Google Sheets?',
    answer:
      'With the start date in A2 and the end date in B2, =B2-A2 (or =DAYS(B2,A2)) gives the days between them; add 1 to count both dates. =NETWORKDAYS(A2,B2) gives the business days, counting both dates. =DATEDIF(A2,B2,"m") gives whole months, but it counts January 31 to February 28 as 0 months, where this calculator counts a month.',
  },
];

export default function DaysBetweenDatesPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <StationChrome currentTool="days-between-dates" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Days Between Dates Calculator',
          description:
            'Count the days between two dates, with weeks and days, months and days, years, months and days, and business days. Include the end date or not.',
          url: 'https://clockmath.com/tools/days-between-dates/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / Days Between Dates
        </nav>
        <h1 className="st-h1">How Many Days Between Two Dates?</h1>
        <p className="st-lede">
          Pick two dates for the days between them, plus weeks, months, years and business days. Leap years counted,
          end date in or out.
        </p>
      </div>

      <DaysBetweenTool />

      <p className="st-nudge">
        Need the hours too?{' '}
        <Link href="/">The time duration calculator</Link> takes a time of day on each date.
      </p>

      <StationFold>
        <QuickAnswers heading="Common date spans" items={COMMON} />

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">How the days are counted</h2>
          <p className="text-muted-foreground mb-3">
            The calculator counts calendar days from the start date up to the end date:{' '}
            <strong className="text-foreground">the start date counts and the end date doesn&rsquo;t</strong>, so
            today to tomorrow is 1 day. Tick &ldquo;Include the end date&rdquo; to count both, which adds one. Swap the
            dates and the answer stays the same; it always counts from the earlier date.
          </p>
          <p className="text-muted-foreground mb-3">
            The same span is also shown in <strong className="text-foreground">weeks and days</strong> (the days
            divided by 7), in <strong className="text-foreground">months and days</strong> and in{' '}
            <strong className="text-foreground">years, months and days</strong>, counting whole months from the
            start date&rsquo;s day of the month, and in <strong className="text-foreground">business days</strong>,
            the Mondays to Fridays in it.
          </p>
          <p className="text-muted-foreground">
            Leap years are built in: February has 29 days in {nextLeap} and every fourth year, except century years
            not divisible by 400 (1900 wasn&rsquo;t a leap year, 2000 was). Clock changes make no difference, as each
            date counts as one day. To work a count out on paper, see{' '}
            <Link href="/articles/time-between-dates-calculator/" className="text-primary hover:text-primary/80 font-semibold">
              how to calculate the time between two dates
            </Link>
            .
          </p>
        </section>

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">Questions</h2>
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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Related tools and guides</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
                Time duration calculator
              </Link>{' '}
              — the time between two dates and times, to the minute
            </li>
            <li>
              <Link href="/tools/date-calculator/" className="text-primary hover:text-primary/80 font-semibold">
                Date calculator
              </Link>{' '}
              — the other way round: a date plus or minus days, weeks, months or business days
            </li>
            <li>
              <Link href="/tools/countdown/" className="text-primary hover:text-primary/80 font-semibold">
                Countdown timer
              </Link>{' '}
              — watch the days, hours and minutes run down to a date, and share it
            </li>
            <li>
              <Link href="/articles/time-between-dates-calculator/" className="text-primary hover:text-primary/80 font-semibold">
                How to calculate the time between two dates
              </Link>{' '}
              — month lengths, leap years and inclusive counting, by hand
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
