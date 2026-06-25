'use client';

import EventPage from '@/components/EventPage';

export default function July4thCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">4th of July</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How many days until Independence Day?"
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
          Counting down to the <strong>4th of July</strong> — <strong>Independence Day</strong> in the
          United States. The live timer above updates every second and automatically rolls over to next
          year&apos;s July 4 once the day has passed.
        </>
      }
      faqs={[
        {
          question: 'How many days until the 4th of July?',
          answer:
            'The live countdown above shows the exact number of days, hours, minutes, and seconds remaining until July 4th this year.',
        },
        {
          question: 'What does the 4th of July celebrate?',
          answer:
            'Independence Day marks the adoption of the Declaration of Independence on July 4, 1776, in the United States.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer: 'Yes — once the 4th of July passes, the countdown automatically targets next year’s July 4.',
        },
      ]}
    />
  );
}
