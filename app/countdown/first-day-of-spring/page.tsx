'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import SeasonTables from '@/components/SeasonTables';
import { countdownProps } from '@/lib/countdowns';
import { momentIn } from '@/lib/seasons';

// The March equinox, to the minute (lib/seasons.ts, listed through
// Mar 20, 2030). The board counts to the moment itself, so in East Asia and
// Australia the answer is a day later than in the Americas and Europe.
const { target } = countdownProps('first-day-of-spring');
const AT = target!.getTime();
const YEAR = target!.getFullYear();
const ET = momentIn(AT, 'America/New_York');
const UTC = momentIn(AT, 'UTC');

export default function FirstDayOfSpringPage() {
  return (
    <EventPage
      {...countdownProps('first-day-of-spring')}
      heading={`When Is the First Day of Spring ${YEAR}?`}
      tagline={`The March equinox: ${ET} Eastern time`}
      lastUpdated="2026-11-12"
      breadcrumb={`First day of spring ${YEAR}`}
      facts={[
        { label: 'March equinox', value: `${UTC} UTC` },
        { label: 'Eastern time', value: ET },
        { label: 'Pacific time', value: momentIn(AT, 'America/Los_Angeles') },
        { label: 'UK time', value: momentIn(AT, 'Europe/London') },
      ]}
      intro={
        <>
          Astronomical spring in the Northern Hemisphere starts at the <strong>March equinox</strong>, when the Sun
          crosses the equator heading north. In {YEAR} that happens at <strong>{UTC} UTC</strong>, which is{' '}
          <strong>{ET}</strong> in New York. It is one instant everywhere, so the date depends on where you are: east of
          about UTC+4 it is already the next day. The countdown above runs to that moment in your own timezone. South of
          the equator the same moment is the first day of autumn. Meteorologists count spring from March 1 instead. After
          spring, the{' '}
          <Link href="/countdown/first-day-of-summer/" className="text-primary hover:text-primary/80 font-semibold">
            first day of summer
          </Link>{' '}
          is the June solstice.
        </>
      }
      extraContent={<SeasonTables kind="spring" at={AT} name="spring" />}
      faqs={[
        {
          question: `When is the first day of spring ${YEAR}?`,
          answer: `The March equinox is at ${UTC} UTC: ${ET} Eastern time and ${momentIn(AT, 'America/Los_Angeles')} Pacific time. In Europe it is ${momentIn(AT, 'Europe/Paris')} Central European time, and in Tokyo and Sydney it is already ${momentIn(AT, 'Asia/Tokyo').split(',').slice(0, 2).join(',')}.`,
        },
        {
          question: 'How many days until spring?',
          answer:
            'The line at the top of this page gives the days and weeks left until the March equinox, updated daily, and the timer counts down to the minute it happens.',
        },
        {
          question: 'Is the first day of spring March 20 or March 21?',
          answer: `It depends on the year and on where you are. The equinox moment falls on March 19, 20 or 21 in UTC; this century it is mostly March 20. In ${YEAR} it is ${momentIn(AT, 'UTC').split(',').slice(0, 2).join(',')} in UTC, and the next calendar day east of about UTC+4.`,
        },
        {
          question: 'What is the difference between astronomical and meteorological spring?',
          answer:
            'Astronomical spring starts at the March equinox and runs to the June solstice. Meteorological spring is the three full months of March, April and May, so it always starts on March 1. Weather services use the meteorological seasons for their statistics.',
        },
        {
          question: 'Are day and night equal on the equinox?',
          answer:
            'Almost, but not quite. Because of how sunrise and sunset are defined and how the atmosphere bends sunlight, most places get slightly more than 12 hours of daylight on the equinox. The day when daylight is exactly 12 hours, the equilux, comes a few days earlier.',
        },
      ]}
    />
  );
}
