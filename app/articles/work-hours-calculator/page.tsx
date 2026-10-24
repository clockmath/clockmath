/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../../../components/ArticleLayout";

// This guide used to be titled "Calculate Work Hours Instantly – Free Online
// Tool", competing with /tools/timesheet (the actual work hours calculator)
// for the same query, while linking only to the homepage duration calculator
// — and promising that calculator a break-deduction feature it doesn't have.
// It now covers the method for a single day and hands tool-seekers to
// /tools/timesheet. Weekly totals: timesheet-calculator. Overnight shifts:
// shift-work-hours-calculator.
const TITLE = "How to Calculate Hours Worked, With Breaks | ClockMath";
const DESCRIPTION =
  "Work out a day's hours by hand: switch to 24-hour time, subtract, take off unpaid breaks, and convert to decimal hours for payroll — with worked examples.";

const LINK = "text-primary hover:text-primary font-medium";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clockmath.com/articles/work-hours-calculator/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: "https://clockmath.com/articles/work-hours-calculator/",
    images: [{ url: "/og-v3.png", width: 1200, height: 630, alt: "ClockMath" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-v3.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WorkHoursCalculatorPage() {
  return (
    <ArticleLayout
      title="How to Calculate Hours Worked, With Breaks"
      description="The four steps from clock-in and clock-out times to a number payroll can use."
      publishDate="2026-10-14"
      category="calculator"
      currentPath="/articles/work-hours-calculator"
    >
      <p>
        If you just want the total, the <Link href="/tools/timesheet" className={LINK}>work hours calculator</Link> takes
        start, end, and break times for each shift and gives hours, decimal hours, and pay. This guide shows the method
        behind it for a single day.
      </p>

      <h2>Step 1: Switch to 24-hour time</h2>
      <p>
        AM/PM is where most hand calculations go wrong. Add 12 to any PM hour except 12 PM itself: 5:45 PM becomes
        17:45, while 9:15 AM stays 9:15.
      </p>

      <h2>Step 2: Subtract start from end</h2>
      <p>
        Subtract the start time from the end time. 17:45 − 9:15 is 8 hours 30 minutes. If the minutes come out negative,
        borrow an hour: 16:20 − 7:50 is 15:80 − 7:50, which is 8 hours 30 minutes.
      </p>

      <h2>Step 3: Take off unpaid breaks</h2>
      <p>
        Subtract only the breaks you aren't paid for. In the US, short rest breaks — roughly 5 to 20 minutes — generally
        count as paid work time under federal law. A genuine meal break, usually 30 minutes or more with no work
        expected, doesn't have to be paid. State rules and employment contracts can add to this, so check yours.
      </p>

      <div className="st-aside bg-card p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: 9:15 AM to 5:45 PM, 30-minute lunch</h3>
        <div className="space-y-2 text-sm">
          <div>In 24-hour time: 17:45 − 9:15 = <strong>8 hours 30 minutes</strong></div>
          <div>Minus the unpaid lunch: − 30 minutes</div>
          <div className="pt-2 border-t border-slate-200 dark:border-border">
            <strong>Hours worked: 8 hours (8.00)</strong>
          </div>
        </div>
      </div>

      <h2>Step 4: Convert minutes to decimal hours</h2>
      <p>
        Payroll systems want decimal hours, so divide the leftover minutes by 60. 15 minutes is 0.25, 30 minutes is 0.5,
        and 45 minutes is 0.75. The <Link href="/tools/decimal-hours" className={LINK}>decimal hours converter</Link> has
        every minute from 1 to 60.
      </p>

      <div className="st-aside bg-card p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: 7:50 AM to 4:20 PM, 45-minute lunch</h3>
        <div className="space-y-2 text-sm">
          <div>16:20 − 7:50 = <strong>8 hours 30 minutes</strong></div>
          <div>Minus the unpaid lunch: − 45 minutes = 7 hours 45 minutes</div>
          <div className="pt-2 border-t border-slate-200 dark:border-border">
            <strong>In decimal: 7 + 45 ÷ 60 = 7.75 hours</strong>
          </div>
        </div>
      </div>

      <h2>Common mistakes</h2>
      <ul>
        <li><strong>Writing 7:45 as 7.45.</strong> 7 hours 45 minutes is 7.75 hours. At $20/hour, that slip underpays $6.</li>
        <li><strong>Subtracting paid breaks.</strong> Only unpaid time comes off.</li>
        <li><strong>Mixing AM and PM.</strong> Convert to 24-hour time before you subtract.</li>
      </ul>

      <h2>More than one day</h2>
      <p>
        To total a week for payroll, see <Link href="/articles/timesheet-calculator" className={LINK}>how to total a
        weekly timesheet</Link>. For shifts that run past midnight, see <Link href="/articles/shift-work-hours-calculator" className={LINK}>how
        to calculate overnight shift hours</Link>. Or enter every shift in the <Link href="/tools/timesheet" className={LINK}>work
        hours calculator</Link>, which handles breaks, overnight shifts, and pay together.
      </p>
    </ArticleLayout>
  );
}
