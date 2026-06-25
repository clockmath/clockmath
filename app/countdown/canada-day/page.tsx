'use client';

import EventPage from '@/components/EventPage';

export default function CanadaDayCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">Canada Day</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How many days until Canada Day?"
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
          Counting down to <strong>Canada Day</strong> on <strong>July 1</strong>, Canada&apos;s national
          holiday. The live timer above updates every second and automatically rolls over to next year&apos;s
          July 1 once the day has passed.
        </>
      }
      faqs={[
        {
          question: 'How many days until Canada Day?',
          answer:
            'The live countdown above shows the exact number of days, hours, minutes, and seconds remaining until Canada Day this year.',
        },
        {
          question: 'When is Canada Day?',
          answer: 'Canada Day is celebrated on July 1 every year.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer: 'Yes — once Canada Day passes, the countdown automatically targets next year’s July 1.',
        },
      ]}
    />
  );
}
