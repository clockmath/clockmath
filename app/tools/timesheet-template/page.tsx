'use client';

import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import TimesheetTemplateTool from '@/components/TimesheetTemplate';
import { useDarkMode } from '@/hooks/use-dark-mode';

// Nov 2026: a blank timesheet to print, save as a PDF or open in a
// spreadsheet (lib/timesheetTemplate.ts). The sheet is the page; the filled-in
// version is the work hours calculator's Print button.

const FAQS = [
  {
    question: 'How do I fill in a timesheet?',
    answer:
      'For each day you work, write the time you started (time in), when your lunch break began and ended (lunch out and lunch in), and when you finished (time out). Then work out the hours for the day and add up the week. Sign it, and have your supervisor sign it if your employer asks for that.',
  },
  {
    question: 'How do I work out the total hours for a day?',
    answer:
      'Take the time in from the time out, then take off the lunch break. In at 8:00 AM, lunch from 12:00 to 12:30, out at 4:30 PM: 8:00 to 4:30 is 8 hours 30 minutes, less 30 minutes of lunch is 8 hours. Write it as a decimal for payroll: 7 hours 45 minutes is 7.75, because 45 ÷ 60 = 0.75.',
  },
  {
    question: 'What is the difference between a weekly and a biweekly timesheet?',
    answer:
      'A weekly timesheet covers seven days, for people paid every week. A biweekly one covers 14 days, for people paid every two weeks, with a total for each week as well as the period. Keep the two weeks separate: in the US, overtime is counted per week (hours over 40 in that week), not over the two weeks together.',
  },
  {
    question: 'How do I save the timesheet as a PDF?',
    answer:
      'Press “Print or save as PDF” and choose “Save as PDF” (or “Microsoft Print to PDF” on Windows) as the printer. On an iPhone or iPad, tap Print, then Share, then Save to Files.',
  },
  {
    question: 'Does the Excel version add up the hours?',
    answer:
      'Yes. Download the CSV and open it in Excel or Google Sheets, then type each time as you would on a clock (8:00 AM). The Hours column fills in by itself, less the lunch break, and the totals add up each week and the period. A shift that goes past midnight counts correctly too.',
  },
  {
    question: 'How long should an employer keep timesheets?',
    answer:
      'In the US, the Fair Labor Standards Act asks employers to keep time cards for at least two years and payroll records for at least three (29 CFR 516.5 and 516.6). Many states ask for longer, so check your state’s rules.',
  },
];

export default function TimesheetTemplatePage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  return (
    <StationChrome currentTool="timesheet-template" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / <Link href="/tools/timesheet/">Work hours</Link> / Timesheet template
        </nav>
        <h1 className="st-h1">Printable Timesheet Template</h1>
        <p className="st-lede">A free weekly or biweekly timesheet with lunch breaks and signature lines, to print, save as a PDF or open in Excel</p>
      </div>

      <TimesheetTemplateTool />

      <p className="max-w-3xl mx-auto mb-section text-muted-foreground">
        Rather add up the hours on screen? The <Link href="/tools/timesheet/">work hours calculator</Link> totals your
        shifts, takes off the breaks and works out the pay, then prints the filled-in timesheet. For how long common
        shifts are, see the <Link href="/tools/shift-hours-chart/">shift hours chart</Link>.
      </p>

      <StationFold summary="Filling it in and common questions">
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
              — your shifts and breaks, totalled for the week, with gross pay
            </li>
            <li>
              <Link href="/tools/decimal-hours/" className="text-primary hover:text-primary/80 font-semibold">
                Minutes to decimal chart
              </Link>{' '}
              — every minute of the hour as a decimal, for the hours column
            </li>
            <li>
              <Link href="/tools/overtime/" className="text-primary hover:text-primary/80 font-semibold">
                Overtime calculator
              </Link>{' '}
              — hours past 40 at time and a half
            </li>
            <li>
              <Link href="/calendar/2027/" className="text-primary hover:text-primary/80 font-semibold">
                2027 calendar
              </Link>{' '}
              — the year with federal holidays, to print
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
