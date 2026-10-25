/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../../../components/ArticleLayout";
import { ExampleAnswer } from "@/components/station/ExampleAnswer";
import { Flap } from "@/components/station/Flap";

// This guide used to be titled "Shift Work Hours Calculator – Track Overnight
// & Rotating Shifts", competing with /tools/timesheet for the same query while
// linking only to the homepage duration calculator — and crediting that
// calculator with break deduction it doesn't have. It now covers the method
// for overnight shifts and hands tool-seekers to /tools/timesheet.
//
// /tools/timesheet counts real elapsed time across daylight-saving changes
// (since Oct 2026), which the daylight-saving section relies on.
const TITLE = "How to Calculate Hours for Overnight and Night Shifts | ClockMath";
const DESCRIPTION =
  "Hours for shifts that cross midnight: the add-24-hours method, 12-hour shifts, which week the hours count toward, and daylight-saving nights.";

const LINK = "text-primary hover:text-primary font-medium";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://clockmath.com/articles/shift-work-hours-calculator/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: "https://clockmath.com/articles/shift-work-hours-calculator/",
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

export default function ShiftWorkHoursCalculatorPage() {
  return (
    <ArticleLayout
      title="How to Calculate Hours for Overnight and Night Shifts"
      description="Why ordinary subtraction fails after midnight, and the one-step fix."
      publishDate="2026-10-14"
      category="calculator"
      currentPath="/articles/shift-work-hours-calculator"
    >
      <p>
        The <Link href="/tools/timesheet" className={LINK}>work hours calculator</Link> handles shifts that cross
        midnight automatically. This guide shows the method behind it, plus the two nights a year when the clock gives
        the wrong answer.
      </p>

      <h2>Why subtraction breaks after midnight</h2>
      <p>
        A shift from 11:00 PM to 7:30 AM is 23:00 to 7:30 in 24-hour time. Subtract the usual way and you get a negative
        number, because the end time is on the next day.
      </p>

      <h2>The fix: add 24 hours to the end time</h2>
      <p>
        If the end time is earlier than the start, add 24 hours to it before subtracting. 7:30 becomes 31:30, and
        31:30 − 23:00 is 8 hours 30 minutes. Then take off any unpaid break, exactly as for a day shift.
      </p>

      <div className="st-aside bg-card p-6 rounded-xl my-6">
        <h3 className="font-bold text-lg mb-3">Example: 11:00 PM to 7:30 AM, 30-minute break</h3>
        <div className="space-y-2 text-sm">
          <div>End 7:30 + 24 = 31:30</div>
          <div>31:30 − 23:00 = <strong>8 hours 30 minutes</strong></div>
          <div>Minus the unpaid break: − 30 minutes</div>
          <ExampleAnswer>Hours worked <Flap value="8" /> hours</ExampleAnswer>
        </div>
      </div>

      <h2>12-hour shifts</h2>
      <p>
        A 7:00 PM to 7:00 AM shift is 12 hours on the clock: 7:00 + 24 = 31:00, and 31:00 − 19:00 = 12:00. With a
        30-minute unpaid meal break, that's 11 hours 30 minutes, or 11.5 hours. Three of those in a week is 34.5 hours;
        four is 46, which is 6 hours over the federal 40-hour overtime line.
      </p>

      <h2>Which week the hours count toward</h2>
      <p>
        Under the US federal rule, hours count toward the workweek in which they're worked. If a night shift starts on
        the last day of your workweek and ends on the first day of the next, the hours after midnight belong to the new
        week. That matters for overtime, which is worked out one week at a time — see <Link href="/articles/overtime-hours-calculator" className={LINK}>how
        to calculate overtime</Link>.
      </p>

      <h2>The two daylight-saving nights</h2>
      <p>
        On the night the clocks go back, a shift that spans 2:00 AM is an hour longer than the clock says. In the US
        that's the first Sunday in November (see <Link href="/countdown/daylight-saving-time" className={LINK}>when
        the clocks change</Link> for other countries): a 10:00 PM to 6:00 AM shift on November 1, 2026 is 9 hours worked, not 8.
        On the night the clocks go forward — the second Sunday in March — the same shift is 7 hours, as on March 14,
        2027.
      </p>
      <p>
        You're owed pay for the hours you actually worked, so it's worth checking your timesheet on those nights. The
        work hours calculator counts the real hours for you and marks the shift “+1h clock change” or “−1h clock
        change.” Places that don't change their clocks — most of Arizona, Hawaii, and since 2026 British Columbia —
        have no adjustment to make.
      </p>

      <h2>Rotating schedules</h2>
      <p>
        On rotating shifts, work out each shift on its own and total the week in hours and minutes before converting to
        decimal. <Link href="/articles/timesheet-calculator" className={LINK}>How to total a weekly timesheet</Link> covers
        the weekly total, and the <Link href="/tools/timesheet" className={LINK}>work hours calculator</Link> takes a
        mix of day and night shifts in one sheet.
      </p>
    </ArticleLayout>
  );
}
