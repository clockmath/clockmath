'use client';

import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import QuickAnswers, { durationWords, type QuickAnswer } from '@/components/QuickAnswers';
import PrintChartButton from '@/components/PrintChartButton';
import { useDarkMode } from '@/hooks/use-dark-mode';
import {
  LUNCHES,
  SHIFTS,
  SHIFT_GROUPS,
  clock12,
  clock24,
  decimalHours,
  findShift,
  fortyHourWeeks,
  hoursMinutes,
  isOvernight,
  paidMinutes,
  shiftMinutes,
  type Shift,
} from '@/lib/shiftHours';

// Nov 2026: every figure here comes from lib/shiftHours.ts (tested), never
// typed in. The board is the page: Google's answer to "how many hours is 9 to
// 5:30" stops at the sum and says paid hours depend on the lunch break, so
// each row gives both, in hours and minutes and in decimal hours.

const range12 = (s: Shift) => `${clock12(s.start)} – ${clock12(s.end)}`;
const range24 = (s: Shift) => `${clock24(s.start)}–${clock24(s.end)}`;
const dec = (mins: number) => String(Number(decimalHours(mins)));

/** "8 hours. With a 30-minute unpaid lunch it is 7.5 paid hours…" for the FAQs. */
function shiftAnswer(start: string, end: string, week = true): string {
  const s = findShift(start, end);
  const clock = shiftMinutes(s.start, s.end);
  const half = paidMinutes(s.start, s.end, 30)!;
  const hour = paidMinutes(s.start, s.end, 60)!;
  const perWeek = (mins: number) => (week ? ` (${dec(mins * 5)} a week over five days)` : '');
  return `${clock12(s.start)} to ${clock12(s.end)} is ${durationWords(clock)}${clock % 60 ? ` (${dec(clock)} hours)` : ''}. With a 30-minute unpaid lunch it is ${dec(half)} paid hours${perWeek(half)}; with an hour’s unpaid lunch, ${dec(hour)}${perWeek(hour)}.`;
}

const TWELVE = findShift('7:00', '19:00');
const twelvePaid = paidMinutes(TWELVE.start, TWELVE.end, 30)!;

const FAQS = [
  { question: 'How many hours is 9 to 5?', answer: shiftAnswer('9:00', '17:00') },
  { question: 'How many hours is 9 to 5:30?', answer: shiftAnswer('9:00', '17:30') },
  { question: 'How many hours is 8 to 5?', answer: shiftAnswer('8:00', '17:00') },
  { question: 'How many hours is 7 to 3:30?', answer: shiftAnswer('7:00', '15:30') },
  {
    question: 'How many hours is a 7 to 7 shift?',
    answer: `7 AM to 7 PM (or 7 PM to 7 AM) is ${durationWords(shiftMinutes(TWELVE.start, TWELVE.end))}, ${dec(twelvePaid)} paid hours with a 30-minute unpaid lunch. Three of them make a ${dec(shiftMinutes(TWELVE.start, TWELVE.end) * 3)}-hour week, or ${dec(twelvePaid * 3)} paid hours if the lunches are unpaid.`,
  },
  {
    question: 'Is the lunch break counted in hours worked?',
    answer:
      'Only if it is paid. In the US, federal law doesn’t require breaks, but short rest breaks (5 to 20 minutes) count as paid work time, while a meal break of 30 minutes or more, when you are fully relieved of duty, can be unpaid. Some states require meal breaks: California’s is 30 minutes before the end of the fifth hour. In the UK you are entitled to a 20-minute rest break when you work more than 6 hours, paid only if your contract says so.',
  },
  {
    question: 'How do I work out the hours for a shift that isn’t in the chart?',
    answer:
      'Count from the start to the next whole hour, then the whole hours, then the minutes after the last one. 8:15 AM to 4:45 PM is 45 minutes to 9, 7 hours to 4 PM, and 45 more minutes: 8 hours 30 minutes, or 8.5 hours. Take off any unpaid break. For an overnight shift, count to midnight and add the morning.',
  },
  {
    question: 'Why does the chart show decimal hours?',
    answer:
      'Because pay is hours × hourly rate, and that needs a decimal: 7 hours 30 minutes is 7.50 hours, not 7.30. At $20 an hour, 7.50 hours is $150.00; reading it as 7.30 would pay $146.00.',
  },
];

// The 40-hour weeks, by lunch: "how many hours is 9 to 5 a week" is the next
// question. Day shifts only for the no-break line (every 8-hour shift fits).
const forty = fortyHourWeeks();
const fortyList = (unpaidBreak: number) =>
  forty
    .filter((w) => w.unpaidBreak === unpaidBreak && (unpaidBreak > 0 || w.shift.group === 'day'))
    .map((w) => range12(w.shift).replace(' – ', '–'))
    .join(', ');
const tens = SHIFTS.filter((s) => paidMinutes(s.start, s.end, 30) === 600)
  .map((s) => range12(s).replace(' – ', '–'))
  .join(' or ');
const WEEKS: QuickAnswer[] = [
  { lead: 'With a 30-minute unpaid lunch:', rest: `${fortyList(30)}. Each is 8 hours 30 minutes on the clock and 8 paid.` },
  { lead: 'With a 1-hour unpaid lunch:', rest: `${fortyList(60)}. Each is 9 hours on the clock and 8 paid.` },
  { lead: 'With paid breaks only:', rest: `any 8-hour shift, such as ${fortyList(0)}.` },
  { lead: 'Four days:', rest: `10 paid hours a day: ${tens} with a 30-minute unpaid lunch.` },
];

function Cell({ mins, label }: { mins: number | null; label: string }) {
  return (
    <td data-k={label}>
      {mins === null ? (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">no lunch break on a shift this short</span>
        </>
      ) : (
        <>
          <b>{hoursMinutes(mins)}</b> <span>{decimalHours(mins)}</span>
        </>
      )}
    </td>
  );
}

export default function ShiftHoursChartPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const nineToFive = findShift('9:00', '17:00');

  return (
    <StationChrome currentTool="shift-hours-chart" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / <Link href="/tools/timesheet/">Work hours</Link> / Shift hours chart
        </nav>
        <h1 className="st-h1">Shift Hours Chart</h1>
        <p className="st-lede">How many hours common shifts are, with and without an unpaid lunch</p>
      </div>

      <section className="st-departures st-shifts mb-section" aria-labelledby="shift-chart-title">
        <div className="st-chart-head">
          <div>
            <h2 id="shift-chart-title">How many hours is a shift?</h2>
            <p>
              Clock hours, then paid hours after an unpaid lunch, with decimal hours for timesheets.{' '}
              {clock12(nineToFive.start)} to {clock12(nineToFive.end)} is {durationWords(shiftMinutes(nineToFive.start, nineToFive.end))},
              or {dec(paidMinutes(nineToFive.start, nineToFive.end, 30)!)} paid after a 30-minute lunch.
            </p>
          </div>
          <PrintChartButton chart="shift_hours" />
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">Shift</th>
              <th scope="col">No break</th>
              {LUNCHES.map((l) => (
                <th key={l} scope="col">
                  {l === 60 ? '1-hour lunch' : `${l}-min lunch`}
                </th>
              ))}
            </tr>
          </thead>
          {SHIFT_GROUPS.map((g) => (
            <tbody key={g.id}>
              <tr className="st-shift-group">
                <th scope="colgroup" colSpan={2 + LUNCHES.length}>
                  {g.name}
                </th>
              </tr>
              {SHIFTS.filter((s) => s.group === g.id).map((s) => (
                <tr key={`${s.start}-${s.end}`}>
                  <th scope="row">
                    {range12(s)}
                    <span className="st-shift-24">
                      {range24(s)}
                      {isOvernight(s) ? ' (next day)' : ''}
                    </span>
                  </th>
                  <Cell mins={shiftMinutes(s.start, s.end)} label="No break" />
                  {LUNCHES.map((l) => (
                    <Cell key={l} mins={paidMinutes(s.start, s.end, l)} label={l === 60 ? '1-hour lunch' : `${l}-min lunch`} />
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
        <p>
          Hours and minutes, then decimal hours. Short shifts have no lunch columns. On the two nights a year the clocks
          change, an overnight shift runs an hour longer or shorter:{' '}
          <Link href="/articles/shift-work-hours-calculator/">night shift hours</Link>. Different times, or a whole week:{' '}
          <Link href="/tools/timesheet/">work hours calculator</Link>.
        </p>
      </section>

      <StationFold summary="40-hour weeks, breaks and common questions">
        <QuickAnswers heading="Which shifts make a 40-hour week?" intro="Five days of 8 paid hours:" items={WEEKS} />

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
              <Link href="/tools/timesheet/" className="text-primary hover:text-primary/80 font-semibold">
                Work hours calculator
              </Link>{' '}
              — your own shifts and breaks, totalled for the week, with gross pay
            </li>
            <li>
              <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
                Time duration calculator
              </Link>{' '}
              — the exact time between any two times
            </li>
            <li>
              <Link href="/tools/decimal-hours/" className="text-primary hover:text-primary/80 font-semibold">
                Minutes to decimal chart
              </Link>{' '}
              — every minute of the hour as a decimal
            </li>
            <li>
              <Link href="/tools/overtime/" className="text-primary hover:text-primary/80 font-semibold">
                Overtime calculator
              </Link>{' '}
              — hours past 40 at time and a half
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
