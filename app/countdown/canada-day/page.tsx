'use client';

import EventPage from '@/components/EventPage';
import HolidayDatesTable, { sundayToMonday } from '@/components/HolidayDatesTable';

export default function CanadaDayCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until Canada Day?'}
      tagline="Live countdown to July 1 — days, hours, minutes, and seconds"
      lastUpdated="2026-10-15"
      breadcrumb="Canada Day"
      recurring={{ month: 6, day: 1 }}
      countdownTitle="Canada Day"
      arrivedLabel="Happy Canada Day! 🍁"
      facts={[
        { label: 'Date', value: 'July 1' },
        { label: 'Country', value: 'Canada' },
        { label: 'Happens', value: 'Every year' },
      ]}
      intro={
        <>
          Counting down to <strong>Canada Day</strong>, <strong>July 1</strong>, Canada&apos;s national
          holiday, in your own timezone. Once the day has passed, the countdown moves on to next year&apos;s.
        </>
      }
      extraContent={
        <HolidayDatesTable
          name="Canada Day"
          month={6}
          day={1}
          observed={sundayToMonday}
          observedLabel="Holiday"
          note="When July 1 falls on a Sunday, Canada Day is held on Monday, July 2."
        />
      }
      faqs={[
        {
          question: 'How many days until Canada Day?',
          answer:
            'Canada Day is July 1. The line at the top of this page gives the days left until the next one, updated daily.',
        },
        {
          question: 'What day of the week is Canada Day 2027?',
          answer:
            'July 1, 2027 falls on a Thursday. In 2029 it is a Sunday, so the holiday moves to Monday, July 2.',
        },
        {
          question: 'What does Canada Day celebrate?',
          answer:
            'Confederation. On July 1, 1867, the British North America Act joined Nova Scotia, New Brunswick and the Province of Canada into one country, the Dominion of Canada. It is a statutory holiday across the country.',
        },
      ]}
    />
  );
}
