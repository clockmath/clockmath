'use client';

import EventPage from '@/components/EventPage';

export default function HalloweenCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">Halloween</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How many days until Halloween?"
      breadcrumb="Halloween"
      recurring={{ month: 9, day: 31 }}
      countdownTitle="Halloween"
      arrivedLabel="Happy Halloween! 🎃"
      facts={[
        { label: 'Date', value: 'October 31' },
        { label: 'Also known as', value: "All Hallows' Eve" },
        { label: 'Happens', value: 'Every year' },
      ]}
      intro={
        <>
          Counting down to <strong>Halloween</strong> on <strong>October 31</strong>. The live timer above
          updates every second and automatically rolls over to next year&apos;s Halloween once the day has
          passed — so it&apos;s always accurate.
        </>
      }
      faqs={[
        {
          question: 'What day of the week is Halloween 2026?',
          answer:
            'Halloween 2026 — October 31 — falls on a Saturday, ideal for trick-or-treating and weekend parties without a school night.',
        },
        {
          question: 'When is Halloween?',
          answer:
            'Halloween is October 31 every year, and the live countdown above shows exactly how long remains until the next one, down to the second.',
        },
        {
          question: 'Does this countdown reset each year?',
          answer:
            'Yes — once Halloween has passed, the countdown automatically targets next year’s October 31.',
        },
      ]}
    />
  );
}
