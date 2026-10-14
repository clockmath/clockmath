/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../../../components/ArticleLayout";

// This guide used to be titled "Overtime Hours Calculator – Fast & Simple
// Online Tool" and every in-body link pointed at the homepage duration
// calculator — so once /tools/overtime shipped (Aug 2026), the article
// competed with the real tool for the tool query while never linking to it.
// It now targets the how-to intent and hands tool-seekers to /tools/overtime.
const TITLE = "How to Calculate Overtime Hours and Pay | ClockMath";
const DESCRIPTION =
  "Work out overtime by hand: the 40-hour weekly rule, daily overtime in states like California, time-and-a-half math, and minutes to decimal hours — with worked examples.";

const LINK = "text-emerald-600 hover:text-emerald-500 font-medium";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clockmath.com/articles/overtime-hours-calculator/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: "https://clockmath.com/articles/overtime-hours-calculator/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-v2.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function OvertimeHoursCalculatorPage() {
  return (
    <ArticleLayout
      title="How to Calculate Overtime Hours and Pay"
      description="The rules that decide when overtime starts, and the arithmetic that turns it into pay."
      publishDate="2026-10-14"
      category="calculator"
      currentPath="/articles/overtime-hours-calculator"
    >
      <p>
        If you just want the number, the <Link href="/tools/overtime" className={LINK}>overtime calculator</Link> splits
        your hours into regular and overtime and works out the pay. This guide explains the rules behind it, so you
        can check a paycheck or do the math yourself.
      </p>

      <h2>When overtime starts: the 40-hour week</h2>
      <p>
        Under the US Fair Labor Standards Act, non-exempt employees earn at least 1.5 times their regular rate for
        every hour over 40 in a workweek. Federal law has no daily limit — a 10-hour day isn't overtime on its own if
        the week stays at 40 or under.
      </p>
      <p>
        Each workweek stands alone. A 35-hour week followed by a 45-hour week earns 5 hours of overtime, not zero —
        employers can't average the two. The workweek is any fixed, recurring 7-day period; it doesn't have to run
        Sunday to Saturday.
      </p>

      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: 46 hours at $20/hour</h3>
        <div className="space-y-2 text-sm">
          <div>Regular: 40 hours × $20 = <strong>$800</strong></div>
          <div>Overtime rate: $20 × 1.5 = $30/hour</div>
          <div>Overtime: 6 hours × $30 = <strong>$180</strong></div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <strong>Total: $980</strong>
          </div>
        </div>
      </div>

      <h2>Daily overtime: California and a few other states</h2>
      <p>
        Some states add a daily rule on top of the weekly one. California is the best known: over 8 hours in a workday
        earns 1.5×, and over 12 hours earns double time. Under a daily rule, a 10-hour day is 8 regular hours and 2
        overtime hours — even in a week that totals 40.
      </p>
      <p>
        That difference is bigger than it looks. Four 10-hour days add up to exactly 40 hours: no overtime under the
        federal weekly rule, but 8 overtime hours under California's daily one.
      </p>

      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: a 13-hour day in California at $20/hour</h3>
        <div className="space-y-2 text-sm">
          <div>First 8 hours × $20 = <strong>$160</strong></div>
          <div>Hours 9–12: 4 × $30 = <strong>$120</strong></div>
          <div>Hour 13: 1 × $40 (double time) = <strong>$40</strong></div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <strong>Total for the day: $320</strong>
          </div>
        </div>
      </div>

      <h2>Minutes become decimal hours first</h2>
      <p>
        Pay is calculated in decimal hours, so convert minutes before multiplying: divide by 60. A week of 42 hours
        45 minutes is 42.75 hours, which makes 2.75 overtime hours. At $18/hour that's 2.75 × $27 = $74.25 in
        overtime. The <Link href="/tools/decimal-hours" className={LINK}>decimal hours converter</Link> has the full
        minutes-to-decimal chart.
      </p>

      <h2>Double time, holidays, and weekends</h2>
      <p>
        Outside a handful of state rules like California's, double time and holiday or weekend premiums usually come
        from your contract or employer policy rather than federal law. If yours pays double after a set number of
        hours, the calculation is the same — just change the multiplier and the threshold.
      </p>

      <h2>Who isn't owed overtime</h2>
      <p>
        Many salaried employees are classified as exempt and aren't entitled to overtime pay. Whether you're exempt
        depends on your duties and salary, not just your job title. Rules also vary by state and contract, so treat
        this guide as the arithmetic, not legal advice.
      </p>

      <h2>Do it in the calculator</h2>
      <p>
        Add up the week's shifts in the <Link href="/tools/timesheet" className={LINK}>work hours calculator</Link>, then
        enter the total in the <Link href="/tools/overtime" className={LINK}>overtime calculator</Link>. Its threshold
        and multiplier default to 40 hours and 1.5× and can be changed to match your rules. To check a single day under
        a daily rule, set the threshold to 8. It applies one overtime rate at a time, so for a day past 12 hours, work
        out the double-time hours separately.
      </p>
    </ArticleLayout>
  );
}
