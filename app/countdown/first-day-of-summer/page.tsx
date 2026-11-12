'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import SeasonTables from '@/components/SeasonTables';
import { countdownProps } from '@/lib/countdowns';
import { momentIn } from '@/lib/seasons';

// The June solstice, to the minute (lib/seasons.ts, listed through
// Jun 21, 2030). The board counts to the moment itself; in 2027 it is
// already Jun 22 in eastern Australia.
const { target } = countdownProps('first-day-of-summer');
const AT = target!.getTime();
const YEAR = target!.getFullYear();
const ET = momentIn(AT, 'America/New_York');
const UTC = momentIn(AT, 'UTC');

export default function FirstDayOfSummerPage() {
  return (
    <EventPage
      {...countdownProps('first-day-of-summer')}
      heading={`When Is the First Day of Summer ${YEAR}?`}
      tagline={`The June solstice: ${ET} Eastern time`}
      lastUpdated="2026-11-12"
      breadcrumb={`First day of summer ${YEAR}`}
      facts={[
        { label: 'June solstice', value: `${UTC} UTC` },
        { label: 'Eastern time', value: ET },
        { label: 'Pacific time', value: momentIn(AT, 'America/Los_Angeles') },
        { label: 'UK time', value: momentIn(AT, 'Europe/London') },
      ]}
      intro={
        <>
          Astronomical summer in the Northern Hemisphere starts at the <strong>June solstice</strong>, when the Sun is
          farthest north and the day is the longest of the year. In {YEAR} that happens at <strong>{UTC} UTC</strong>,
          which is <strong>{ET}</strong> in New York. It is one instant everywhere, so the local date depends on your
          timezone. The countdown above runs to that moment in your own timezone. South of the equator the same moment
          is the first day of winter and the shortest day. Meteorologists count summer from June 1 instead. Before
          summer comes the{' '}
          <Link href="/countdown/first-day-of-spring/" className="text-primary hover:text-primary/80 font-semibold">
            first day of spring
          </Link>
          , and for the long weekend after it the{' '}
          <Link href="/countdown/july-4th/" className="text-primary hover:text-primary/80 font-semibold">
            4th of July countdown
          </Link>
          .
        </>
      }
      extraContent={<SeasonTables kind="summer" at={AT} name="summer" />}
      faqs={[
        {
          question: `When is the first day of summer ${YEAR}?`,
          answer: `The June solstice is at ${UTC} UTC: ${ET} Eastern time and ${momentIn(AT, 'America/Los_Angeles')} Pacific time. In the UK it is ${momentIn(AT, 'Europe/London')}.`,
        },
        {
          question: 'How many days until summer?',
          answer:
            'The line at the top of this page gives the days and weeks left until the June solstice, updated daily, and the timer counts down to the minute it happens.',
        },
        {
          question: 'Is the first day of summer the longest day of the year?',
          answer:
            'Yes, in the Northern Hemisphere. The June solstice is the day with the most daylight; how much more depends on how far north you are. The earliest sunrise and latest sunset fall a few days either side of it.',
        },
        {
          question: 'Is the first day of summer June 20 or June 21?',
          answer: `It depends on the year and on where you are. The solstice falls on June 20 or 21 in UTC. In ${YEAR} it is ${momentIn(AT, 'UTC').split(',').slice(0, 2).join(',')} in UTC.`,
        },
        {
          question: 'What is the difference between astronomical and meteorological summer?',
          answer:
            'Astronomical summer starts at the June solstice and runs to the September equinox. Meteorological summer is the three full months of June, July and August, so it always starts on June 1.',
        },
      ]}
    />
  );
}
