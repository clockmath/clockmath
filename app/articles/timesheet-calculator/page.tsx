/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../../../components/ArticleLayout";

// This guide used to be titled "Timesheet Calculator – Calculate Weekly Hours
// for Payroll", competing with /tools/timesheet for the same query while
// linking only to the homepage duration calculator. Its example week also
// totalled hours without taking off lunch, then told readers they must. It now
// covers totalling a week by hand and hands tool-seekers to /tools/timesheet.
const TITLE = "How to Total a Weekly Timesheet for Payroll | ClockMath";
const DESCRIPTION =
  "Add up a week of shifts correctly: total the minutes first, convert to decimal hours, apply US rounding rules and spot where overtime starts.";

const LINK = "text-primary hover:text-primary font-medium";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clockmath.com/articles/timesheet-calculator/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: "https://clockmath.com/articles/timesheet-calculator/",
    images: [{ url: "/og/tool/guides.png?v=3", width: 1200, height: 630, alt: "ClockMath" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/tool/guides.png?v=3"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TimesheetCalculatorPage() {
  return (
    <ArticleLayout
      title="How to Total a Weekly Timesheet for Payroll"
      description="From five days of clock times to one weekly figure, without the rounding errors."
      publishDate="2026-10-14"
      category="calculator"
      currentPath="/articles/timesheet-calculator"
    >
      <p>
        The <Link href="/tools/timesheet" className={LINK}>work hours calculator</Link> totals a week of shifts for you,
        with breaks, pay, and a CSV export. This guide explains how the total is worked out, so you can check a timesheet
        before it goes to payroll.
      </p>

      <h2>Work out each day first</h2>
      <p>
        For each shift, subtract start from end and take off unpaid breaks. <Link href="/articles/work-hours-calculator" className={LINK}>How
        to calculate hours worked</Link> walks through a single day step by step.
      </p>

      <div className="st-aside bg-card p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example week, 30-minute unpaid lunch each day</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Monday:</strong> 8:30 AM – 5:00 PM = 8h 30m − 30m = 8h 00m</div>
          <div><strong>Tuesday:</strong> 9:00 AM – 5:30 PM = 8h 30m − 30m = 8h 00m</div>
          <div><strong>Wednesday:</strong> 8:45 AM – 5:15 PM = 8h 30m − 30m = 8h 00m</div>
          <div><strong>Thursday:</strong> 8:30 AM – 5:00 PM = 8h 30m − 30m = 8h 00m</div>
          <div><strong>Friday:</strong> 9:00 AM – 4:00 PM = 7h 00m − 30m = 6h 30m</div>
          <div className="pt-2 border-t border-slate-200 dark:border-border">
            <strong>Week: 38 hours 30 minutes = 38.5 hours</strong>
          </div>
        </div>
      </div>

      <h2>Add up minutes, then convert once</h2>
      <p>
        Total the week in hours and minutes, and only then convert to decimal. Converting each day first and rounding
        as you go lets small errors pile up.
      </p>
      <p>
        Five days of 7 hours 50 minutes is 39 hours 10 minutes, which is 39.17 hours. Round each day to 7.83 first and
        the week comes out at 39.15 — a minute short. Across a team and a year, that adds up.
      </p>

      <h2>Decimal hours</h2>
      <p>
        Divide the leftover minutes by 60: 15 minutes is 0.25, 30 is 0.5, 45 is 0.75. A common slip is writing
        7 hours 45 minutes as 7.45 instead of 7.75. The <Link href="/tools/decimal-hours" className={LINK}>decimal hours
        converter</Link> has every minute from 1 to 60.
      </p>

      <h2>Rounding clock times</h2>
      <p>
        Many employers round punch times. In the US, federal rules allow rounding to the nearest 5, 6, or 15 minutes, as
        long as it evens out over time and doesn't consistently work against employees. With 15-minute rounding, 1 to 7
        minutes past the quarter hour rounds down and 8 to 14 rounds up — so 8:07 is recorded as 8:00 and 8:08 as 8:15.
        Rounding that only ever goes the employer's way isn't allowed.
      </p>

      <h2>Where overtime starts</h2>
      <p>
        Under the US federal rule, hours over 40 in a workweek are overtime, paid at 1.5 times the regular rate. Each
        workweek is totalled on its own — a short week can't offset a long one. If your total goes past 40,
        the <Link href="/tools/overtime" className={LINK}>overtime calculator</Link> splits regular and overtime pay,
        and <Link href="/articles/overtime-hours-calculator" className={LINK}>how to calculate overtime</Link> covers
        the rules, including states with daily overtime.
      </p>

      <h2>Before you submit</h2>
      <ul>
        <li>Every day has a start and an end, and overnight shifts end on the next day</li>
        <li>Only unpaid breaks are subtracted</li>
        <li>The week was totalled in minutes before converting to decimal</li>
        <li>The total matches the pay period your employer uses</li>
      </ul>
    </ArticleLayout>
  );
}
