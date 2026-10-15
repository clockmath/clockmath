'use client';

import EventPage from '@/components/EventPage';
import HolidayDatesTable, { usFederalObserved } from '@/components/HolidayDatesTable';

export default function NewYearCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until New Year?'}
      tagline="Live countdown to midnight, January 1 — down to the second"
      lastUpdated="2026-10-15"
      breadcrumb="New Year"
      recurring={{ month: 0, day: 1 }}
      countdownTitle="New Year"
      arrivedLabel="Happy New Year! 🎉"
      facts={[
        { label: 'Date', value: 'January 1' },
        { label: "New Year's Eve", value: 'December 31' },
        { label: 'First to celebrate', value: 'Kiritimati, Kiribati' },
      ]}
      intro={
        <>
          Counting down to midnight on <strong>January 1</strong> in your own timezone. Once the new year
          arrives, the countdown moves on to the next one.
        </>
      }
      extraContent={
        <HolidayDatesTable
          name="New Year's Day"
          month={0}
          day={1}
          observed={usFederalObserved}
          observedLabel="US federal holiday observed"
          note="When January 1 falls on a Saturday, the US federal holiday is the Friday before — December 31 of the old year."
        />
      }
      faqs={[
        {
          question: 'How many days until New Year?',
          answer:
            "New Year's Day is January 1. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to midnight in your timezone.",
        },
        {
          question: 'What day of the week is New Year’s Day 2027?',
          answer:
            'January 1, 2027 falls on a Friday, so New Year’s Eve 2026 is a Thursday night and the new year starts with a long weekend.',
        },
        {
          question: 'Where does the new year start first?',
          answer:
            'Kiritimati (Christmas Island) in Kiribati, at UTC+14, reaches midnight first — at 5 AM on December 31 in New York and 10 AM in London. American Samoa, at UTC−11, is among the last inhabited places, at 6 AM on January 1 in New York.',
        },
        {
          question: 'What time is midnight in London, Tokyo or Sydney in New York?',
          answer:
            'On December 31, 2026: Sydney reaches midnight at 8 AM New York time, Tokyo at 10 AM, and London at 7 PM. The timezone converter works it out for any other city.',
        },
      ]}
    />
  );
}
