'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import KeyDates from '@/components/KeyDates';
import { countdownProps } from '@/lib/countdowns';

// Ramadan 1448 AH. Expected first day of fasting Mon Feb 8, 2027 (Saudi
// Umm al-Qura calendar; UAE astronomers agree), so the first tarawih is the
// evening of Feb 7; Eid al-Fitr Tue Mar 9, or Wed Mar 10 if the month runs
// 30 days (The National, Khaleej Times, Gulf News; checked Nov 12, 2026).
// Every date is "expected" until the crescent moon is sighted, and can
// differ by a day between countries. Ramadan 2028 is expected to begin about
// Jan 28, 2028: add it once announced, before this page's dates pass.

const DATES = [
  { what: 'First night of Ramadan', note: 'Expected; first tarawih prayers after sunset', date: '2027-02-07' },
  { what: 'First day of fasting', note: 'Expected', date: '2027-02-08' },
  { what: 'Eid al-Fitr', note: 'Expected; March 10 if Ramadan lasts 30 days', date: '2027-03-09' },
];

export default function RamadanCountdownPage() {
  return (
    <EventPage
      {...countdownProps('ramadan')}
      heading={'When Does Ramadan 2027 Start?'}
      tagline="Expected Monday, February 8, 2027, with Eid al-Fitr on March 9 or 10"
      lastUpdated="2026-11-12"
      breadcrumb="Ramadan 2027"
      facts={[
        { label: 'First day of fasting', value: 'Monday, February 8, 2027 (expected)' },
        { label: 'First night', value: 'Sunday, February 7, after sunset' },
        { label: 'Eid al-Fitr', value: 'Tuesday, March 9 or Wednesday, March 10' },
        { label: 'Length', value: '29 or 30 days' },
      ]}
      intro={
        <>
          <strong>Ramadan 2027</strong> is expected to begin on <strong>Monday, February 8</strong>, the first day of
          fasting, with the first night of tarawih prayers on the evening of Sunday, February 7. It lasts 29 or 30 days,
          so <strong>Eid al-Fitr</strong> falls on <strong>Tuesday, March 9 or Wednesday, March 10</strong>. The exact
          days depend on the sighting of the new crescent moon and can differ by a day from country to country. Because
          the Islamic calendar follows the moon, Ramadan comes about 11 days earlier each year; in 2027 it starts two
          days after{' '}
          <Link href="/countdown/lunar-new-year/" className="text-primary hover:text-primary/80 font-semibold">
            Lunar New Year
          </Link>
          .
        </>
      }
      extraContent={
        <KeyDates
          title="Ramadan 2027 key dates"
          dates={DATES}
          footnote="Expected dates, from the astronomical calendars used in Saudi Arabia and the UAE; local moon-sighting committees confirm them. Days are counted to the start of each date in your own timezone."
        >
          The Islamic day begins at sunset, so the first night of Ramadan is the evening before the first fast.
        </KeyDates>
      }
      faqs={[
        {
          question: 'When does Ramadan 2027 start?',
          answer:
            'Ramadan 2027 is expected to start on Monday, February 8, 2027, the first day of fasting. The first tarawih prayers are on the evening of Sunday, February 7. The date is confirmed by the sighting of the crescent moon and may be a day later in some countries.',
        },
        {
          question: 'When is Eid al-Fitr 2027?',
          answer:
            'Eid al-Fitr 2027 is expected on Tuesday, March 9, or on Wednesday, March 10 if Ramadan lasts 30 days. It is announced on the evening before, after the moon sighting.',
        },
        {
          question: 'How many days until Ramadan?',
          answer:
            'The line at the top of this page gives the days and weeks left until the expected first day of fasting, February 8, 2027, updated daily.',
        },
        {
          question: 'How long are the fasts in Ramadan 2027?',
          answer:
            'Fasting runs from dawn to sunset. Ramadan 2027 falls in late winter in the Northern Hemisphere, so the fasts are shorter than in recent years: roughly 11 to 13 hours a day in cities such as New York and London, getting longer through the month.',
        },
        {
          question: 'Why does Ramadan change every year?',
          answer:
            'Ramadan is the ninth month of the Islamic calendar, which follows the moon. A lunar year is about 354 days, 11 days shorter than the solar year, so Ramadan moves about 11 days earlier each year. Ramadan 2028 is expected to begin in late January.',
        },
      ]}
    />
  );
}
