'use client';

import EventPage from '@/components/EventPage';

export default function ChristmasCountdownPage() {
  return (
    <EventPage
      heading={'Christmas Countdown'}
      tagline="How many days until Christmas?"
      lastUpdated="2026-08-03"
      breadcrumb="Christmas"
      recurring={{ month: 11, day: 25 }}
      countdownTitle="Christmas"
      arrivedLabel="Merry Christmas! 🎄"
      facts={[
        { label: 'Date', value: 'December 25' },
        { label: 'Christmas Eve', value: 'December 24' },
        { label: 'Happens', value: 'Every year' },
      ]}
      intro={
        <>
          Counting down to <strong>Christmas Day</strong>, celebrated every <strong>December 25</strong>.
          The live timer above updates every second and automatically rolls over to next year&apos;s
          Christmas once the day has passed — so it&apos;s always accurate.
        </>
      }
      faqs={[
        {
          question: 'What day of the week is Christmas 2026?',
          answer:
            'Christmas Day 2026 — December 25 — falls on a Friday, giving most people a three-day holiday weekend. Christmas Eve is Thursday, December 24.',
        },
        {
          question: 'When is Christmas?',
          answer:
            'Christmas Day is December 25 every year, and the live countdown above shows exactly how long remains until the next one, down to the second.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer:
            'Yes — once Christmas has passed, the countdown automatically targets next year’s December 25.',
        },
      ]}
    />
  );
}
