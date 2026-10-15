'use client';

import EventPage from '@/components/EventPage';
import HolidayDatesTable, { usFederalObserved } from '@/components/HolidayDatesTable';

export default function July4thCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until the 4th of July?'}
      tagline="Live countdown to July 4 — days, hours, minutes, and seconds"
      lastUpdated="2026-10-15"
      breadcrumb="4th of July"
      recurring={{ month: 6, day: 4 }}
      countdownTitle="the 4th of July"
      arrivedLabel="Happy 4th of July! 🎆"
      facts={[
        { label: 'Date', value: 'July 4' },
        { label: 'Holiday', value: 'Independence Day' },
        { label: 'Happens', value: 'Every year' },
      ]}
      intro={
        <>
          Counting down to the <strong>4th of July</strong>, Independence Day in the United States, in your
          own timezone. Once the day has passed, the countdown moves on to next year&apos;s July 4.
        </>
      }
      extraContent={
        <HolidayDatesTable
          name="4th of July"
          month={6}
          day={4}
          observed={usFederalObserved}
          observedLabel="Federal holiday observed"
          note="When July 4 falls on a weekend, the federal holiday moves to the Friday before or the Monday after."
        />
      }
      faqs={[
        {
          question: 'How many days until the 4th of July?',
          answer:
            'Independence Day is July 4. The line at the top of this page gives the days left until the next one, updated daily.',
        },
        {
          question: 'What day of the week is July 4th, 2027?',
          answer:
            'July 4, 2027 falls on a Sunday, so the federal holiday is observed on Monday, July 5 — a three-day weekend for most workers.',
        },
        {
          question: 'What does the 4th of July celebrate?',
          answer:
            'Independence Day marks the adoption of the Declaration of Independence on July 4, 1776.',
        },
      ]}
    />
  );
}
