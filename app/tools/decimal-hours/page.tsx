'use client';

import React from 'react';
import Link from 'next/link';
import { DecimalHoursTool } from '@/components/DecimalHoursTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import QuickAnswers, { type QuickAnswer } from '@/components/QuickAnswers';
import PrintChartButton from '@/components/PrintChartButton';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { decimalToMinutes, formatMinutes, minutesToDecimal, roundingBands } from '@/lib/decimalTime';

// "15 minutes in decimal" alone drew 4.5K Copilot citations to this page in
// 3 months (Bing AI Performance, Oct 2026), while "10/20/40/45 minutes in
// decimal" (5K–10K citations each across all sites) barely cited it — only
// 15 had an answer worded the way people ask. So each lead is the query.
const dec = (minutes: number) => minutesToDecimal(minutes).toFixed(2);

const COMMON: QuickAnswer[] = [
  ...[5, 10, 15, 20, 25].map((m) => ({ lead: `${m} minutes in decimal`, rest: `is ${dec(m)} hours (${m}\u00a0÷\u00a060).` })),
  { lead: '30 minutes in decimal', rest: `(half an hour) is ${dec(30)} hours.` },
  ...[35, 40, 45, 50].map((m) => ({ lead: `${m} minutes in decimal`, rest: `is ${dec(m)} hours (${m}\u00a0÷\u00a060).` })),
  { lead: '1 hour 30 minutes', rest: `is ${(1 + minutesToDecimal(30)).toFixed(2)} hours.` },
  { lead: '7 hours 45 minutes', rest: `is ${(7 + minutesToDecimal(45)).toFixed(2)} hours — not 7.45.` },
];

// Nov 2026: the other half of the Copilot gap. "0.8 hours in minutes",
// ".1 hours in minutes" and "time decimal chart" cite other sites, which
// answer the reverse lookup; this page only went minutes → decimal.
const mins = (decimal: number) => formatMinutes(decimalToMinutes(decimal));

const REVERSE: QuickAnswer[] = [
  ...[0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9].map((d) => ({
    lead: `${d} hours in minutes`,
    rest: `is ${mins(d)} minutes (${d}\u00a0×\u00a060).`,
  })),
  { lead: '0.33 hours in minutes', rest: `is ${mins(0.33)} minutes, about 20.` },
  { lead: '7.8 hours', rest: `is 7 hours ${mins(0.8)} minutes — not 7:80.` },
];

const TENTHS = roundingBands(6);
const QUARTERS = roundingBands(15);

const FAQS = [
  {
    question: 'What is 15 minutes in decimal?',
    answer: `15 minutes is ${dec(15)} hours: 15 ÷ 60 = 0.25, a quarter of an hour. So 8 hours 15 minutes is 8.25 hours.`,
  },
  {
    question: 'What is 45 minutes as a decimal?',
    answer: `45 minutes is ${dec(45)} hours: 45 ÷ 60 = 0.75, three quarters of an hour. So 7 hours 45 minutes is 7.75 hours.`,
  },
  {
    question: 'What is half an hour in decimal?',
    answer: `Half an hour (30 minutes) is ${dec(30)} hours, usually written 0.5. So 7 hours 30 minutes is 7.5 hours.`,
  },
  {
    question: 'How do I read a time to decimal chart?',
    answer:
      'Find the minutes in a “Min” column; the number next to it is that many minutes as a fraction of an hour. Add it to the whole hours: 8 hours 20 minutes is 8 + 0.33 = 8.33 hours. The decimal-to-minutes chart works the other way: 0.80 is 48 minutes, so 7.80 hours is 7 hours 48 minutes.',
  },
  {
    question: 'What is 0.1 hours in minutes?',
    answer: `0.1 hours is ${mins(0.1)} minutes (0.1 × 60), a tenth of an hour. So 7.1 hours is 7 hours 6 minutes, and each 0.1 on a timesheet is 6 minutes.`,
  },
  {
    question: 'How many minutes is 0.8 hours?',
    answer: `0.8 hours is ${mins(0.8)} minutes (0.8 × 60). So 7.8 hours is 7 hours 48 minutes, not 7 hours 80 minutes.`,
  },
  {
    question: 'How do I convert minutes to decimal hours?',
    answer:
      'Divide the minutes by 60. 45 minutes is 45 ÷ 60 = 0.75, so 7 hours 45 minutes is 7.75 decimal hours. The converter above does this instantly in both directions.',
  },
  {
    question: 'Why does payroll use decimal hours instead of hours and minutes?',
    answer:
      'Pay is calculated as hours × hourly rate, and that multiplication needs a decimal. 7:45 at $20/hour is 7.75 × $20 = $155.00 — treating 7:45 as “7.45” would underpay by $6.00.',
  },
  {
    question: 'What is the difference between rounding to 2 decimals and payroll rounding?',
    answer:
      'This chart shows exact values rounded to 2 decimal places. Some payroll systems instead round worked time to the nearest tenth of an hour (6-minute steps) or quarter hour (15-minute steps) before converting — check which policy your employer uses.',
  },
  {
    question: 'How does rounding to the nearest tenth of an hour work?',
    answer:
      'The hour is split into ten 6-minute steps. Rounding to the nearest step, 0–2 minutes past the hour is .0, 3–8 minutes is .1, 9–14 is .2, and so on up to 57–60, which is a full hour. Billing in 6-minute units (lawyers, consultants) usually rounds up instead: 1–6 minutes is .1, 7–12 is .2.',
  },
  {
    question: 'What is the 7-minute rule for rounding time?',
    answer:
      'It is rounding to the nearest quarter hour: 1–7 minutes past a quarter rounds down, 8–14 rounds up. So a 9:07 punch counts as 9:00 and 9:08 as 9:15. US wage-hour rules allow it (along with rounding to the nearest 5 minutes or tenth of an hour) as long as it averages out and doesn’t always favour the employer.',
  },
  {
    question: 'How do I convert decimal hours back to minutes?',
    answer:
      'Multiply the fraction by 60. For 7.75 hours: 0.75 × 60 = 45, so it’s 7 hours 45 minutes. The decimal-to-hours converter above handles any value, like 8.33 → 8h 20m.',
  },
];

/**
 * A chart board's table: `cols` column pairs of `rows` cells, filled top to
 * bottom (cell index = row + col × rows), like the minutes chart above it.
 */
function PairTable({
  cols,
  rows,
  head,
  cell,
}: {
  cols: number;
  rows: number;
  head: [string, string];
  cell: (index: number) => { key: string; value: string; quarter?: boolean };
}) {
  return (
    <table>
      <thead>
        <tr>
          {Array.from({ length: cols }, (_, c) => (
            <React.Fragment key={c}>
              <th scope="col">{head[0]}</th>
              <th scope="col">{head[1]}</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: cols }, (_, col) => {
              const { key, value, quarter } = cell(row + col * rows);
              return (
                <React.Fragment key={col}>
                  <td className={quarter ? 'st-chart-min q' : 'st-chart-min'}>{key}</td>
                  <td className={quarter ? 'st-chart-dec q' : 'st-chart-dec'}>{value}</td>
                </React.Fragment>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DecimalHoursPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();




  return (
    <StationChrome currentTool="decimal-hours" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Decimal Hours Converter',
          description:
            'Convert hours and minutes to decimal hours (and back) for payroll and timesheets, with minutes-to-decimal, decimal-to-minutes and payroll rounding charts.',
          url: 'https://clockmath.com/tools/decimal-hours/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">

        <nav className="st-crumbs" aria-label="Breadcrumb">

          <Link href="/tools/">Tools</Link> / Decimal Hours

        </nav>

        <h1 className="st-h1">Minutes to Decimal Converter</h1>

        <p className="st-lede">Time to decimal hours and back, for timesheets and payroll</p>

      </div>

      <DecimalHoursTool className="mb-section" />

      {/* The chart the page is named for, on the page (Oct 2026: it sat inside
          the closed "How it works" fold). A departures-style board; the
          quarter hours, the values people look up most, picked out. */}
      <section className="st-departures st-chart mb-section" aria-labelledby="dh-chart-title">
        <div className="st-chart-head">
          <div>
            <h2 id="dh-chart-title">Time to decimal chart: minutes to hours</h2>
            <p>
              Two decimal places, as most timesheet software uses. Print it on one page to keep by the time clock. Going the
              other way? See the <a href="#dh-reverse-title">decimal to minutes chart</a> and the{' '}
              <a href="#dh-rounding-title">rounding chart</a>.
            </p>
          </div>
          <PrintChartButton />
        </div>
        <div className="st-chart-scroll">
          <PairTable
            cols={4}
            rows={15}
            head={['Min', 'Hours']}
            cell={(i) => ({ key: String(i + 1), value: minutesToDecimal(i + 1).toFixed(2), quarter: (i + 1) % 15 === 0 })}
          />
        </div>
        <p>
          Payroll systems that round punch times (to 6 or 15 minutes) do so before converting; this chart shows the values
          before that rounding.
        </p>
      </section>

      {/* Nov 2026: the reverse lookup ("0.8 hours in minutes") as its own
          board, every hundredth so any timesheet figure can be read off.
          Same layout as the chart above: four column pairs, filled top to
          bottom, the quarter hours picked out. */}
      <section className="st-departures st-chart mb-section" aria-labelledby="dh-reverse-title">
        <div className="st-chart-head">
          <div>
            <h2 id="dh-reverse-title">Decimal to minutes chart</h2>
            <p>Every hundredth of an hour in minutes. Hundredths aren’t whole minutes (0.01 hours is 36 seconds), so some show a tenth.</p>
          </div>
          <PrintChartButton chart="decimal_to_minutes" />
        </div>
        <div className="st-chart-scroll">
          <PairTable
            cols={4}
            rows={25}
            head={['Dec', 'Min']}
            cell={(i) => {
              const d = (i + 1) / 100;
              return { key: d.toFixed(2), value: mins(d), quarter: (i + 1) % 25 === 0 };
            }}
          />
        </div>
        <p>Read the whole hours off as they are: 7.80 hours is 7 hours and 0.80 × 60 = 48 minutes.</p>
      </section>

      {/* The rounding charts payroll and billing pages print ("tenths of an
          hour chart", "7 minute rule chart"): minute ranges, not single
          minutes, so they're short tables side by side. */}
      <section className="st-departures st-chart mb-section" aria-labelledby="dh-rounding-title">
        <div className="st-chart-head">
          <div>
            <h2 id="dh-rounding-title">Payroll rounding chart: tenths and quarter hours</h2>
            <p>Minutes past the hour, rounded to the nearest tenth (6 minutes) or quarter (15 minutes) of an hour.</p>
          </div>
          <PrintChartButton chart="rounding" />
        </div>
        <div className="st-chart-cols">
          <div>
            <h3>Tenths of an hour</h3>
            <PairTable
              cols={1}
              rows={TENTHS.length}
              head={['Minutes', 'Hours']}
              cell={(i) => ({ key: `${TENTHS[i].from}–${TENTHS[i].to}`, value: TENTHS[i].decimal.toFixed(1) })}
            />
          </div>
          <div>
            <h3>Quarter hours (7-minute rule)</h3>
            <PairTable
              cols={1}
              rows={QUARTERS.length}
              head={['Minutes', 'Hours']}
              cell={(i) => ({ key: `${QUARTERS[i].from}–${QUARTERS[i].to}`, value: QUARTERS[i].decimal.toFixed(2) })}
            />
          </div>
        </div>
        <p>
          Rounding to the nearest step, halves go up: 3 minutes is 0.1 and 8 minutes is 0.25. Billing in 6-minute units
          usually rounds up instead, so 1–6 minutes is 0.1.
        </p>
      </section>

      <StationFold>
      <QuickAnswers heading="Common minutes to decimal hours" items={COMMON} />
      <QuickAnswers heading="Common decimal hours to minutes" items={REVERSE} />

      {/* Explanation */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          How the conversion works
        </h2>
        <p className="text-muted-foreground mb-3">
          Decimal hours express minutes as a fraction of an hour:{' '}
          <strong className="text-foreground">divide minutes by 60</strong>. So 15 minutes is 0.25,
          30 minutes is 0.50, and 45 minutes is 0.75. Going the other way,{' '}
          <strong className="text-foreground">multiply the fraction by 60</strong>: 8.33 hours is 8
          hours plus 0.33 × 60 ≈ 20 minutes.
        </p>
        <p className="text-muted-foreground">
          The classic payroll mistake is reading the clock digits as decimals — 7:45 is{' '}
          <em>not</em> 7.45 hours. At $20/hour that error underpays 7.75 − 7.45 = 0.30 hours, or
          $6.00, every single shift.
        </p>
      </section>


      {/* FAQ */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">
          Questions
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

      {/* Related */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          Related tools and guides
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/tools/timesheet" className="text-primary hover:text-primary/80 font-semibold">
              Work hours calculator
            </Link>{' '}
            — add up shifts with breaks and see decimal totals and gross pay
          </li>
          <li>
            <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
              Time duration calculator
            </Link>{' '}
            — the exact time between any two times, with decimal output
          </li>
          <li>
            <Link href="/articles/timesheet-calculator" className="text-primary hover:text-primary/80 font-semibold">
              Timesheet calculator guide
            </Link>{' '}
            — weekly totals and payroll conversions, step by step
          </li>
        </ul>
      </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
