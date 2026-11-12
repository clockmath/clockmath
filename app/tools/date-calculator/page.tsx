'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { DateCalculatorTool } from '@/components/DateCalculatorTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import QuickAnswers, { type QuickAnswer } from '@/components/QuickAnswers';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { addBusinessDays, addOffset, toLocalDate, type CalendarDate } from '@/lib/dateAdd';

// Nov 2026: the questions Copilot answers from other sites ("date
// calculation", "calculate dates", "add days to a date", "what is one month
// after January 31"), answered in full sentences. Every date is worked out
// with the tool's own lib/dateAdd.ts on fixed dates, not today, so the
// static HTML stays true after the day it was built.
const d = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });
const off = (o: Partial<{ years: number; months: number; weeks: number; days: number }>) => ({ years: 0, months: 0, weeks: 0, days: 0, ...o });
const add = (c: CalendarDate, o: Parameters<typeof off>[0], sign: 1 | -1 = 1) => addOffset(c, off(o), sign).date;
const show = (c: CalendarDate) => format(toLocalDate(c), 'EEEE, MMM d, yyyy');
const md = (c: CalendarDate) => format(toLocalDate(c), 'MMM d, yyyy');

const bizPlain = addBusinessDays(d(2026, 11, 16), 10).date;
const bizHoliday = addBusinessDays(d(2026, 11, 16), 10, 1, { skipHolidays: true }).date;
const xmasPlain = addBusinessDays(d(2026, 12, 18), 5).date;
const xmasHoliday = addBusinessDays(d(2026, 12, 18), 5, 1, { skipHolidays: true }).date;

const COMMON: QuickAnswer[] = [
  { lead: '90 days from Jan 1, 2027', rest: `is ${show(add(d(2027, 1, 1), { days: 90 }))}.` },
  { lead: '30 days from Dec 1, 2026', rest: `is ${show(add(d(2026, 12, 1), { days: 30 }))}.` },
  { lead: '100 days from Jan 1, 2027', rest: `is ${show(add(d(2027, 1, 1), { days: 100 }))}.` },
  { lead: '30 days before Mar 1, 2027', rest: `is ${show(add(d(2027, 3, 1), { days: 30 }, -1))}.` },
  { lead: 'Jan 31, 2027 + 1 month', rest: `is ${md(add(d(2027, 1, 31), { months: 1 }))}: February has no 31st.` },
  { lead: 'Jan 31, 2028 + 1 month', rest: `is ${md(add(d(2028, 1, 31), { months: 1 }))}, as 2028 is a leap year.` },
  { lead: 'Feb 29, 2028 + 1 year', rest: `is ${md(add(d(2028, 2, 29), { years: 1 }))}, and + 4 years is ${md(add(d(2028, 2, 29), { years: 4 }))}.` },
  { lead: '6 months from Nov 30, 2026', rest: `is ${md(add(d(2026, 11, 30), { months: 6 }))}.` },
  {
    lead: '10 business days from Mon, Nov 16, 2026',
    rest: `is ${show(bizPlain)}, or ${md(bizHoliday)} skipping Thanksgiving.`,
  },
  {
    lead: '5 business days from Fri, Dec 18, 2026',
    rest: `is ${md(xmasPlain)}, or ${show(xmasHoliday)} skipping Christmas Day.`,
  },
];

const FAQS = [
  {
    question: 'How do I calculate a date from a number of days?',
    answer: `Pick the start date, choose Add or Subtract and type the days; the date appears at once. By hand, count forward month by month: 90 days from January 1, 2027 is 30 days to January 31, 28 more to February 28, 31 more to March 31 (89 in all) and one more, so ${md(add(d(2027, 1, 1), { days: 90 }))}.`,
  },
  {
    question: 'What date is 90 days from today?',
    answer:
      'The calculator starts on today’s date, so tap “+ 90 days” (or type 90 in Days) and it shows the date and its weekday. Ninety days is 12 weeks and 6 days, so the answer is always the weekday before today’s, about three months on.',
  },
  {
    question: 'Does adding days count the start date?',
    answer:
      'No. Day 1 is the day after the start date, so 30 days from November 1 is December 1, and 1 day from today is tomorrow. If a deadline is “within 30 days, counting today”, subtract one day from the answer.',
  },
  {
    question: 'What is one month after January 31?',
    answer: `February 28 (${md(add(d(2027, 1, 31), { months: 1 }))}), or February 29 in a leap year. Adding months keeps the day of the month, and when the new month is shorter it stops at its last day, as Excel’s EDATE and most date libraries do. Two months after January 31 is March 31.`,
  },
  {
    question: 'How does the calculator handle leap years?',
    answer: `February has 29 days in years divisible by 4, except century years not divisible by 400 (2000 was a leap year, 2100 won’t be). Adding a year to February 29 gives February 28 (${md(add(d(2028, 2, 29), { years: 1 }))}), and adding days counts February 29 as a day like any other.`,
  },
  {
    question: 'How do I add business days to a date?',
    answer: `Choose Business days, type the number and the calculator skips Saturdays and Sundays. The start day doesn’t count, so Friday plus 1 business day is Monday. Tick “Skip US federal holidays” to skip those as well, on their observed dates: 10 business days from Monday, November 16, 2026 is ${md(bizPlain)}, or ${md(bizHoliday)} skipping Thanksgiving.`,
  },
  {
    question: 'In what order are years, months, weeks and days added?',
    answer: `Years and months first, then weeks and days, the way “1 month and 1 day from January 31” is meant: January 31 + 1 month is February 28, then + 1 day is ${md(add(d(2027, 1, 31), { months: 1, days: 1 }))}. Subtracting works the same way backwards.`,
  },
  {
    question: 'Does daylight saving time change the answer?',
    answer:
      'No. The calculator counts whole calendar days, so the day the clocks change counts as one day even though it is 23 or 25 hours long.',
  },
];

export default function DateCalculatorPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <StationChrome currentTool="date-calculator" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Date Calculator',
          description:
            'Add or subtract days, weeks, months, years or business days from a date, with month-end, leap-year and US federal holiday handling.',
          url: 'https://clockmath.com/tools/date-calculator/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / Date Calculator
        </nav>
        <h1 className="st-h1">Date Calculator</h1>
        <p className="st-lede">Add or subtract days, weeks, months or business days from any date</p>
      </div>

      <DateCalculatorTool />

      <p className="st-nudge">
        Counting the days between two dates?{' '}
        <Link href="/tools/days-between-dates/">The days between dates calculator</Link> does that, business days too.
      </p>

      <StationFold>
        <QuickAnswers heading="Common date calculations" items={COMMON} />

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground mb-3">
            Days and weeks are counted on the calendar: <strong className="text-foreground">day 1 is the day after the start date</strong>, and a
            week is 7 days. Months and years keep the day of the month, so 6 months from May 15 is November 15. When the
            new month is shorter, the date stops at its last day: January 31 plus a month is February 28.
          </p>
          <p className="text-muted-foreground">
            Business days are Monday to Friday. With “Skip US federal holidays” ticked, the 11 federal holidays are
            skipped on the day they’re observed (a Saturday holiday on the Friday before, a Sunday one on the Monday
            after). State holidays and other countries’ holidays aren’t included.
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
              — how many days, weeks, months and business days from one date to another
            </li>
            <li>
              <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
                Time duration calculator
              </Link>{' '}
              — the exact time between two dates and times
            </li>
            <li>
              <Link href="/tools/countdown" className="text-primary hover:text-primary/80 font-semibold">
                Countdown timer
              </Link>{' '}
              — count down to the date you found, and share it
            </li>
            <li>
              <Link href="/countdown/holidays" className="text-primary hover:text-primary/80 font-semibold">
                Holidays 2026–2027
              </Link>{' '}
              — upcoming holidays and the US federal holiday dates
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
