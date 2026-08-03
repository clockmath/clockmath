'use client';

import EventPage from '@/components/EventPage';

export default function CanadaDayCountdownPage() {
  return (
    <EventPage
      heading={'Canada Day Countdown'}
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
          question: 'What day of the week is Canada Day 2027?',
          answer:
            'July 1, 2027 falls on a Thursday. Canada Day is a statutory holiday nationwide, marking Confederation on July 1, 1867.',
        },
        {
          question: 'When is Canada Day?',
          answer:
            'Canada Day is July 1 every year, and the live countdown above shows exactly how long remains until the next one, down to the second.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer: 'Yes — once Canada Day passes, the countdown automatically targets next year’s July 1.',
        },
      ]}
    />
  );
}
