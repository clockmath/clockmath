'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import ClockChangeCountdown from '@/components/ClockChangeCountdown';

// Every date and offset on this page was computed from IANA tzdata 2026c, not
// written from memory (Oct 2026). The live countdown is per-visitor; the table
// is the 2026–27 season and needs a yearly refresh.
const LINK = 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium';
const CARD = 'bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6';
const H2 = 'text-xl font-bold text-foreground dark:text-slate-100 mb-3';
const BODY = 'text-muted-foreground dark:text-slate-400';

const DATES: Array<{ where: string; rule: string; back: string; forward: string }> = [
  {
    where: 'US and most of Canada',
    rule: 'First Sunday in November · second Sunday in March',
    back: 'Sun, Nov 1, 2026 · 2:00 → 1:00 AM',
    forward: 'Sun, Mar 14, 2027 · 2:00 → 3:00 AM',
  },
  {
    where: 'UK and Ireland',
    rule: 'Last Sunday in October · last Sunday in March',
    back: 'Sun, Oct 25, 2026 · 2:00 → 1:00 AM',
    forward: 'Sun, Mar 28, 2027 · 1:00 → 2:00 AM',
  },
  {
    where: 'European Union',
    rule: 'Same days as the UK, at 1:00 AM UTC everywhere',
    back: 'Sun, Oct 25, 2026 · 3:00 → 2:00 AM in Paris and Berlin',
    forward: 'Sun, Mar 28, 2027 · 2:00 → 3:00 AM in Paris and Berlin',
  },
  {
    where: 'Australia: NSW, Victoria, ACT, Tasmania, South Australia',
    rule: 'First Sunday in April · first Sunday in October',
    back: 'Sun, Apr 4, 2027 · 3:00 → 2:00 AM',
    forward: 'Sun, Oct 3, 2027 · 2:00 → 3:00 AM',
  },
  {
    where: 'New Zealand',
    rule: 'First Sunday in April · last Sunday in September',
    back: 'Sun, Apr 4, 2027 · 3:00 → 2:00 AM',
    forward: 'Sun, Sep 26, 2027 · 2:00 → 3:00 AM',
  },
];

export default function DaylightSavingTimePage() {
  return (
    <EventPage
      heading="When Do the Clocks Change?"
      tagline="Live countdown to the next clock change where you are — with 2026–27 dates for the US, Canada, the UK, Europe, Australia and New Zealand"
      lastUpdated="2026-10-15"
      breadcrumb="Daylight saving time"
      countdownSlot={<ClockChangeCountdown />}
      facts={[
        { label: 'US & Canada', value: '1st Sun Nov · 2nd Sun Mar' },
        { label: 'UK & EU', value: 'Last Sun Oct · last Sun Mar' },
        { label: 'New in 2026', value: 'BC and Alberta stop changing' },
      ]}
      intro={
        <>
          The countdown above uses your device&apos;s timezone to find the next time <strong>your</strong> clocks change.
          Most of North America and Europe change twice a year — back an hour in the autumn, forward an hour in the
          spring — while much of the world never changes at all.
        </>
      }
      extraContent={
        <>
          <section className={CARD}>
            <h2 className={H2}>Clock change dates for 2026–27</h2>
            {/* Phones: stacked cards — a three-column table hid "Clocks go forward"
                off-screen at 375px. Table from sm up. */}
            <div className="sm:hidden space-y-3">
              {DATES.map((d) => (
                <div key={d.where} className="rounded-xl border border-border/50 dark:border-slate-700/50 p-3">
                  <div className="font-medium text-foreground dark:text-slate-100">{d.where}</div>
                  <div className="text-xs text-muted-foreground mb-2">{d.rule}</div>
                  <div className="text-sm text-foreground dark:text-slate-200">
                    <span className="text-muted-foreground">Back:</span> {d.back}
                  </div>
                  <div className="text-sm text-foreground dark:text-slate-200">
                    <span className="text-muted-foreground">Forward:</span> {d.forward}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[34rem]">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/50 dark:border-slate-700/50">
                    <th className="py-2 px-1 font-semibold">Where</th>
                    <th className="py-2 px-1 font-semibold">Clocks go back</th>
                    <th className="py-2 px-1 font-semibold">Clocks go forward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 dark:divide-slate-700/40">
                  {DATES.map((d) => (
                    <tr key={d.where} className="align-top">
                      <td className="py-2.5 px-1">
                        <div className="font-medium text-foreground dark:text-slate-100">{d.where}</div>
                        <div className="text-xs text-muted-foreground">{d.rule}</div>
                      </td>
                      <td className="py-2.5 px-1 text-foreground dark:text-slate-200">{d.back}</td>
                      <td className="py-2.5 px-1 text-foreground dark:text-slate-200">{d.forward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`${BODY} text-sm mt-3`}>
              Times are local. Because the US and Europe change on different dates, New York and London are four hours
              apart instead of five for about a week around the start of November and two weeks in March.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Fall back, spring forward</h2>
            <p className={`${BODY} mb-3`}>
              When the clocks <strong className="text-foreground dark:text-slate-200">go back</strong>, the hour from 1:00
              to 2:00 AM happens twice, so that night is an hour longer. When they{' '}
              <strong className="text-foreground dark:text-slate-200">go forward</strong>, 2:00 AM jumps straight to
              3:00 AM and the night is an hour shorter.
            </p>
            <p className={BODY}>
              If you work through the night, that changes your hours: a 10:00 PM to 6:00 AM shift is 9 hours on the night
              the clocks go back and 7 hours on the night they go forward. The{' '}
              <Link href="/tools/timesheet" className={LINK}>work hours calculator</Link> counts the hours you actually
              worked, and <Link href="/articles/shift-work-hours-calculator" className={LINK}>this guide to overnight
              shifts</Link> explains why.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>British Columbia and Alberta stopped changing their clocks</h2>
            <p className={`${BODY} mb-3`}>
              Two Canadian provinces dropped clock changes in 2026, so neither goes back on November 1.{' '}
              <strong className="text-foreground dark:text-slate-200">British Columbia</strong> made its last change on
              March 8, 2026 and now stays on UTC−7 all year.{' '}
              <strong className="text-foreground dark:text-slate-200">Alberta</strong> stays on UTC−6 all year under
              legislation passed in May 2026.
            </p>
            <p className={`${BODY} mb-3`}>
              From November to March, that puts Vancouver an hour ahead of Seattle, and Calgary and Edmonton an hour
              ahead of Denver. In summer they line up again. Calgary stays an hour ahead of Vancouver all year.
            </p>
            <p className={BODY}>
              Phones and computers that update their clocks automatically should get this right. An older device that
              hasn&apos;t received the update may still go back an hour on November 1 — worth checking against an
              up-to-date clock. To compare times across the border, use the{' '}
              <Link href="/tools/timezone" className={LINK}>timezone converter</Link>.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Places that don&apos;t change their clocks</h2>
            <ul className={`${BODY} space-y-2 list-disc pl-5`}>
              <li>
                <strong className="text-foreground dark:text-slate-200">United States:</strong> Hawaii, most of Arizona
                (the Navajo Nation does change), Puerto Rico, Guam, the US Virgin Islands, American Samoa, and the
                Northern Mariana Islands
              </li>
              <li>
                <strong className="text-foreground dark:text-slate-200">Canada:</strong> most of Saskatchewan, Yukon
                (since 2020), and from November 2026 British Columbia and Alberta
              </li>
              <li>
                <strong className="text-foreground dark:text-slate-200">Mexico:</strong> stopped in 2022, apart from some
                areas along the US border
              </li>
              <li>
                <strong className="text-foreground dark:text-slate-200">Australia:</strong> Queensland, Western
                Australia, and the Northern Territory
              </li>
              <li>
                <strong className="text-foreground dark:text-slate-200">Asia and Africa:</strong> most countries,
                including Japan, China, and India
              </li>
            </ul>
          </section>
        </>
      }
      faqs={[
        {
          question: 'When do the clocks go back in 2026?',
          answer:
            'In the US and most of Canada, on Sunday, November 1, 2026: at 2:00 AM local time the clocks go back to 1:00 AM. In the UK, Ireland, and the EU it is a week earlier, on Sunday, October 25, 2026.',
        },
        {
          question: 'When do the clocks go forward in 2027?',
          answer:
            'In the US and most of Canada, on Sunday, March 14, 2027, when 2:00 AM jumps to 3:00 AM. In the UK, Ireland, and the EU, on Sunday, March 28, 2027.',
        },
        {
          question: 'Do we gain or lose an hour?',
          answer:
            'You gain an hour when the clocks go back in the autumn, and lose one when they go forward in the spring. The countdown at the top of this page shows which comes next where you are.',
        },
        {
          question: 'Do British Columbia and Alberta change their clocks on November 1, 2026?',
          answer:
            'No. Both provinces stopped changing their clocks in 2026. British Columbia stays on UTC−7 and Alberta stays on UTC−6 all year, so from November to March Vancouver is an hour ahead of Seattle.',
        },
        {
          question: 'Does Arizona change its clocks?',
          answer:
            'No — most of Arizona stays on Mountain Standard Time all year. The Navajo Nation in the northeast of the state is the exception and does change its clocks. Hawaii does not change either.',
        },
        {
          question: 'Why do the US and the UK change their clocks on different dates?',
          answer:
            'The US goes back on the first Sunday in November and the UK on the last Sunday in October, so for about a week New York is four hours behind London instead of five. The same happens for two weeks in March.',
        },
      ]}
    />
  );
}
