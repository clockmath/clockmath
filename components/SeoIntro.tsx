/**
 * Below-the-tool content for the homepage duration calculator.
 * Static JSX — fully present in the prerendered HTML for crawlers.
 * (Replaces the old sr-only-H1-only version: the brand header carries the
 * page's single H1; these are H2 sections with real, visible content.)
 */

import Link from 'next/link';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';

const FAQS = [
  {
    question: 'How do I calculate the hours between two times?',
    answer:
      'Enter a start and end time and press Calculate Duration. 9:00 AM to 5:30 PM is 8 hours 30 minutes — shown as h:m:s, total minutes, and 8.5 decimal hours.',
  },
  {
    question: 'Does it work across midnight?',
    answer:
      'Yes. When the end time is earlier than the start time, the calculator treats it as the next day: 10:00 PM to 6:00 AM is 8 hours, not negative time.',
  },
  {
    question: 'Can it calculate the duration between two dates?',
    answer:
      'Yes — both ends take a date as well as a time, and the result breaks the duration down calendar-accurately into years, months, days, hours, minutes, and seconds.',
  },
  {
    question: 'What are decimal hours?',
    answer:
      'Decimal hours express minutes as a fraction of an hour (minutes ÷ 60), which is what payroll math needs: 8 hours 30 minutes is 8.5 hours. The result shows both formats.',
  },
  {
    question: 'Can I add up several time periods?',
    answer:
      'Yes. Every calculation is kept in the Recent Calculations list — select any of them and press Sum Selected to total multiple durations, for example separate work sessions in a day.',
  },
];

export default function SeoIntro() {
  return (
    <>
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <section aria-labelledby="about-heading" className="max-w-3xl mx-auto mb-10">
        <h2
          id="about-heading"
          className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3"
        >
          Time duration calculator — hours between two times
        </h2>
        <p className="text-muted-foreground mb-3">
          Enter any two times — or two full dates — and get the exact elapsed time between them:
          9:00 to 17:30 is 8 hours 30 minutes, shown as h:m:s, as total minutes (510), and as
          decimal hours (8.5) for timesheets and payroll. Times that cross midnight are handled
          automatically, so a 10:00 PM to 6:00 AM night shift correctly reads 8 hours.
        </p>
        <p className="text-muted-foreground">
          Common uses: work shifts and{' '}
          <Link href="/tools/timesheet" className="text-primary hover:text-primary/80 font-semibold">
            adding up a week of work hours
          </Link>
          , workout and study session lengths, travel legs, and{' '}
          <Link
            href="/articles/sleep-hours-calculator"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            how long you slept
          </Link>
          . For minutes-to-decimal conversions, see the{' '}
          <Link
            href="/tools/timesheet#decimal-hours"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            decimal hours table
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto mb-10">
        <h2
          id="faq-heading"
          className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-4"
        >
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-card dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-slate-700/50"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="tools-heading" className="max-w-3xl mx-auto mb-10">
        <h2
          id="tools-heading"
          className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3"
        >
          All ClockMath tools
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/tools/timesheet" className="text-primary hover:text-primary/80 font-semibold">
              Work hours &amp; timesheet calculator
            </Link>{' '}
            — total shifts with breaks, decimal hours, and gross pay
          </li>
          <li>
            <Link href="/tools/timezone" className="text-primary hover:text-primary/80 font-semibold">
              Timezone converter
            </Link>{' '}
            — any two places, with automatic daylight-saving handling
          </li>
          <li>
            <Link href="/tools/market-hours" className="text-primary hover:text-primary/80 font-semibold">
              Stock market hours
            </Link>{' '}
            — live open/closed status for major exchanges in your timezone
          </li>
          <li>
            <Link href="/tools/decimal-hours" className="text-primary hover:text-primary/80 font-semibold">
              Decimal hours converter
            </Link>{' '}
            — minutes to decimal (and back) with the full payroll chart
          </li>
          <li>
            <Link href="/tools/countdown" className="text-primary hover:text-primary/80 font-semibold">
              Countdown timer
            </Link>{' '}
            — count down to any date and share it
          </li>
          <li>
            <Link href="/articles" className="text-primary hover:text-primary/80 font-semibold">
              Guides
            </Link>{' '}
            — practical articles on work hours, payroll time math, and timezones
          </li>
        </ul>
      </section>
    </>
  );
}
