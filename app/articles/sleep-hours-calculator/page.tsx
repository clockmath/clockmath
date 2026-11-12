/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../../../components/ArticleLayout";
import { ExampleAnswer } from "@/components/station/ExampleAnswer";
import { Flap } from "@/components/station/Flap";

// Back from the Oct 14 2026 merge into /tools/sleep/ (Nov 2026). The merge
// was decided on Google data, where both pages sat on pages 3–4; on Bing,
// which sends ~5x Google's clicks, this guide was the site's #1 click page
// (176 clicks a quarter, position ~4.9, Copilot-cited for "if I slept at X
// and woke up at Y" questions). Four weeks after Bing processed the 301 it
// had dropped the guide without passing its queries to the tool: sleep
// clicks on Bing went from 46 to 5 per 16 days, Copilot citations 234 → 35 a
// day. Title and heading are the ones that ranked, unchanged on purpose
// (pages retitled on Oct 17 2026 all lost Bing). The body is the method,
// worked on the nights people ask about, not the tool's own examples.
const TITLE = "Sleep Hours Calculator – Find Out Exactly How Long You Slept";
const DESCRIPTION =
  "How many hours did you sleep? Count to midnight, then add the time after it. Worked examples for common bedtimes, 12 AM vs 12 PM, and decimal hours.";

const LINK = "text-primary hover:text-primary font-medium";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clockmath.com/articles/sleep-hours-calculator/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: "https://clockmath.com/articles/sleep-hours-calculator/",
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

// Bedtimes from the questions Bing showed this guide for (Oct 2026), worked
// out by hand: none repeats the sleep tool's "Hours slept on common nights".
const NIGHTS: Array<[string, string, string]> = [
  ["12:00 AM (midnight)", "6:00 AM", "6 hours"],
  ["9:00 PM", "6:00 AM", "9 hours"],
  ["10:30 PM", "7:00 AM", "8 hours 30 minutes"],
  ["11:30 PM", "6:45 AM", "7 hours 15 minutes"],
  ["9:41 PM", "6:30 AM", "8 hours 49 minutes"],
  ["11:09 PM", "4:50 AM", "5 hours 41 minutes"],
];

export default function SleepHoursCalculatorPage() {
  return (
    <ArticleLayout
      title="How Many Hours of Sleep Did I Get?"
      description="Count the time to midnight, then add the time after it."
      publishDate="2026-11-12"
      category="calculator"
      currentPath="/articles/sleep-hours-calculator"
    >
      <p>
        The <Link href="/tools/sleep" className={LINK}>sleep calculator</Link> works out how long you slept as soon as
        you enter the two times. This guide shows the method behind it, so you can check a night in your head, and the
        two places people most often get it wrong: noon and midnight, and the time it took to fall asleep.
      </p>

      <h2>Count to midnight, then add the morning</h2>
      <p>
        Subtracting 11:20 PM from 6:45 AM doesn't work, because the wake-up time is on the next day. Split the night at
        midnight instead: the minutes from your bedtime to 12:00 AM, plus the hours from midnight to the time you woke.
      </p>

      <div className="st-aside bg-card p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: bed at 11:20 PM, up at 6:45 AM</h3>
        <div className="space-y-2 text-sm">
          <div>11:20 PM to midnight = 40 minutes</div>
          <div>Midnight to 6:45 AM = 6 hours 45 minutes</div>
          <div>40 minutes + 6 hours 45 minutes = <strong>7 hours 25 minutes</strong></div>
          <ExampleAnswer label="Total sleep: 7 hours 25 minutes">Total sleep <Flap value="7" /> h <Flap value="25" /> m</ExampleAnswer>
        </div>
      </div>

      <p>
        In 24-hour time it's one step: if the wake-up time is smaller than the bedtime, add 24 hours to it. 6:45 becomes
        30:45, and 30:45 − 23:20 is 7:25.
      </p>

      <h2>Common nights, worked out</h2>
      <ul>
        {NIGHTS.map(([bed, wake, total]) => (
          <li key={bed}>
            <strong>{bed} to {wake}:</strong> {total}
          </li>
        ))}
      </ul>

      <h2>Slept at 12: AM or PM?</h2>
      <p>
        12:00 AM is midnight, the start of the day; 12:00 PM is noon. "I slept at 12 and woke up at 6" almost always
        means midnight to 6:00 AM, which is 6 hours. Asleep at 12:00 AM and up at 12:00 PM is a full 12 hours. If a
        night comes out 12 hours longer or shorter than you expected, an AM/PM mix-up is the usual cause.
      </p>

      <h2>Time in bed isn't time asleep</h2>
      <p>
        Bedtime to wake-up is your time in bed. To estimate the sleep itself, take off how long it took you to drop off
        and any long stretch you lay awake in the night. In bed at 10:15 PM and up at 5:40 AM is 7 hours 25 minutes in
        bed; if it took you 20 minutes to fall asleep and you were awake for half an hour around 3 AM, you slept about
        6 hours 35 minutes.
      </p>

      <h2>In decimal hours</h2>
      <p>
        Sleep trackers and spreadsheets often want decimal hours: divide the minutes by 60. 7 hours 25 minutes is
        7 + 25 ÷ 60 = 7.42 hours; 8 hours 49 minutes is 8.82. The <Link href="/tools/decimal-hours" className={LINK}>minutes
        to decimal converter</Link> has the full chart.
      </p>

      <h2>Is it enough?</h2>
      <p>
        The American Academy of Sleep Medicine and the CDC recommend 7 or more hours a night for adults, and 8 to 10 for
        teenagers. If you're planning tonight rather than counting last night, the{" "}
        <Link href="/tools/sleep" className={LINK}>sleep calculator</Link> also suggests bedtimes that end on a full
        90-minute sleep cycle for the time you need to be up.
      </p>

      <h2>The two clock-change nights</h2>
      <p>
        On the night the clocks go back (in the US, the first Sunday in November) you sleep an hour longer than the
        clock says: 11:00 PM to 7:00 AM is 9 hours, not 8. On the night they go forward, the second Sunday in March, the
        same night is 7 hours. <Link href="/countdown/daylight-saving-time" className={LINK}>When the clocks
        change</Link> has the dates for other countries.
      </p>
    </ArticleLayout>
  );
}
