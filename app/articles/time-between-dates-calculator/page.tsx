/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../../../components/ArticleLayout";

// This guide used to be titled "Time Between Two Dates Calculator – Free
// Online Tool", which pitted it against the homepage (the actual tool) for
// the same query; GSC had it as "Crawled – currently not indexed" (Oct 2026).
// It now targets the how-to intent and hands tool-seekers to the homepage.
const TITLE = "How to Calculate the Time Between Two Dates | ClockMath";
const DESCRIPTION =
  "Count the days between two dates by hand: month lengths, leap years, inclusive vs. exclusive counting, and crossing into a new year — with worked examples.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clockmath.com/articles/time-between-dates-calculator/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: "https://clockmath.com/articles/time-between-dates-calculator/",
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

export default function TimeBetweenDatesCalculatorPage() {
  return (
    <ArticleLayout
      title="How to Calculate the Time Between Two Dates"
      description="The counting method behind date math — so you can check a result, or work one out on paper."
      publishDate="2026-10-14"
      category="calculator"
      currentPath="/articles/time-between-dates-calculator"
    >
      <p>
        If you just need the answer, the <Link href="/" className="text-primary hover:text-primary font-medium">time duration calculator</Link> gives
        it instantly, times of day included. This guide shows how the counting actually works, so you can check a
        result or do it without a computer.
      </p>

      <h2>The method: count to the end of each month</h2>
      <ol>
        <li><strong>Days left in the starting month:</strong> that month's length minus the start day.</li>
        <li><strong>Full months in between:</strong> add each one's length.</li>
        <li><strong>The ending month:</strong> add the end day's number.</li>
      </ol>

      <div className="st-aside bg-card p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: March 1 to April 15, 2025</h3>
        <div className="space-y-2 text-sm">
          <div>March has 31 days, so 31 − 1 = <strong>30</strong> days left in March</div>
          <div>No full months in between</div>
          <div>April 15 adds <strong>15</strong></div>
          <div className="pt-2 border-t border-slate-200 dark:border-border">
            <strong>30 + 15 = 45 days</strong>
          </div>
        </div>
      </div>

      <h2>Month lengths and leap years</h2>
      <p>
        April, June, September, and November have 30 days. February has 28 — or 29 in a leap year. Every other
        month has 31.
      </p>
      <p>
        A year is a leap year if it divides by 4, except century years, which must also divide by 400. So 2024 and
        2028 are leap years, 2000 was one, and 1900 was not. Getting this wrong is the most common mistake in hand
        counting, and it only bites when your span includes the end of February.
      </p>
      <p>
        January 15 to March 10 is <strong>55 days</strong> in 2024 (16 + 29 + 10) but <strong>54 days</strong> in
        2025 (16 + 28 + 10).
      </p>

      <h2>Inclusive or exclusive?</h2>
      <p>
        The method above counts the gap between two dates, which is what "how long until" usually means. If both the
        first and last day count — a three-day conference running March 1 to March 3, say — add one. March 1 to
        April 15 is 45 days apart, but 46 days if you count both ends.
      </p>

      <h2>Crossing into a new year</h2>
      <p>
        Nothing changes; December just has 31 days. December 20, 2025 to January 5, 2026 is 31 − 20 = 11 days left in
        December, plus 5, for <strong>16 days</strong>.
      </p>

      <h2>Turning days into weeks and hours</h2>
      <p>
        Divide by 7 for weeks: 45 days is 6 weeks and 3 days. Multiply by 24 for hours: 45 days is 1,080 hours. One
        caveat — if the span crosses a daylight-saving change, the real elapsed time is an hour more or less than
        days × 24.
      </p>

      <h2>Where this comes up</h2>
      <ul>
        <li><strong>Deadlines:</strong> days until a project is due</li>
        <li><strong>Events:</strong> how long until a wedding, trip, or conference</li>
        <li><strong>Ages:</strong> exact age in years, months, and days</li>
        <li><strong>Contracts:</strong> time left on an agreement or subscription</li>
      </ul>

      <p>
        For spans that include times of day, or when you'd rather not count, the <Link href="/" className="text-primary hover:text-primary font-medium">time duration calculator</Link> gives
        a calendar-accurate breakdown. To watch the days tick down to a future date, use
        the <Link href="/tools/countdown" className="text-primary hover:text-primary font-medium">countdown timer</Link>.
      </p>
    </ArticleLayout>
  );
}
