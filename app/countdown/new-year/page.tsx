'use client';

import EventPage from '@/components/EventPage';

export default function NewYearCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until New Year?'}
      tagline="Live countdown to midnight, January 1 — down to the second"
      lastUpdated="2026-08-03"
      breadcrumb="New Year"
      recurring={{ month: 0, day: 1 }}
      countdownTitle="New Year"
      arrivedLabel="Happy New Year! 🎉"
      facts={[
        { label: 'Date', value: 'January 1' },
        { label: "New Year's Eve", value: 'December 31' },
        { label: 'Happens', value: 'Every year' },
      ]}
      intro={
        <>
          Counting down to <strong>New Year&apos;s Day</strong> on <strong>January 1</strong>. The live
          timer above updates every second and automatically targets the next January 1 once the new year
          arrives — so it stays accurate year after year.
        </>
      }
      faqs={[
        {
          question: 'How many days until New Year?',
          answer:
            "New Year's Day is January 1 — the live counter at the top of this page counts down to midnight with the exact days, hours, minutes, and seconds remaining right now.",
        },
        {
          question: 'What day of the week is New Year’s Day 2027?',
          answer:
            'January 1, 2027 falls on a Friday, so New Year’s Eve 2026 is a Thursday night and the new year starts with a long weekend.',
        },
        {
          question: "When is New Year's Day?",
          answer:
            'New Year’s Day is January 1, and New Year’s Eve is the night before, December 31. The countdown above ticks down to midnight in your own timezone.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer: 'Yes — once the new year begins, the countdown automatically targets the next January 1.',
        },
      ]}
    />
  );
}
