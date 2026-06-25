'use client';

import EventPage from '@/components/EventPage';

export default function ChristmasCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">Christmas</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How many days until Christmas?"
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
          question: 'How many days until Christmas?',
          answer:
            'The live countdown above shows the exact number of days, hours, minutes, and seconds remaining until Christmas Day this year.',
        },
        {
          question: 'When is Christmas?',
          answer: 'Christmas Day falls on December 25 every year.',
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
