'use client';

import EventPage from '@/components/EventPage';

export default function WeekendCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">Weekend</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How long until the weekend?"
      breadcrumb="Weekend"
      weekly={{ weekday: 6 }}
      countdownTitle="the weekend"
      arrivedLabel="It's the weekend! 🎉"
      facts={[
        { label: 'Counts to', value: 'Saturday' },
        { label: 'Resets', value: 'Every week' },
        { label: 'Updates', value: 'Every second' },
      ]}
      intro={
        <>
          Counting down to <strong>Saturday</strong> — the start of the weekend. The live timer above
          updates every second and automatically resets to the next Saturday each week, so it&apos;s always
          counting down to your next break.
        </>
      }
      faqs={[
        {
          question: 'How long until the weekend?',
          answer:
            'The live countdown above shows the exact number of days, hours, minutes, and seconds remaining until Saturday.',
        },
        {
          question: 'What day does this count down to?',
          answer: 'This timer counts down to Saturday at midnight, the start of the weekend.',
        },
        {
          question: 'Does it reset every week?',
          answer: 'Yes — once Saturday arrives, the countdown automatically targets the next Saturday.',
        },
      ]}
    />
  );
}
