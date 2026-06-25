'use client';

import EventPage from '@/components/EventPage';

export default function NewYearCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">New Year</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How many days until the New Year?"
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
            'The live countdown above shows the exact number of days, hours, minutes, and seconds remaining until January 1.',
        },
        {
          question: "When is New Year's Day?",
          answer: 'New Year’s Day is January 1, and New Year’s Eve is the night before, on December 31.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer: 'Yes — once the new year begins, the countdown automatically targets the next January 1.',
        },
      ]}
    />
  );
}
