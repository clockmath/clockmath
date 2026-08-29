'use client';

import EventPage from '@/components/EventPage';

export default function ThanksgivingCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until Thanksgiving?'}
      tagline="Live countdown to the fourth Thursday of November"
      lastUpdated="2026-08-29"
      breadcrumb="Thanksgiving"
      nthWeekday={{ month: 10, weekday: 4, n: 4 }}
      countdownTitle="Thanksgiving"
      arrivedLabel="Happy Thanksgiving! 🦃"
      facts={[
        { label: 'Thanksgiving 2026', value: 'Thursday, November 26' },
        { label: 'Rule', value: '4th Thursday of November' },
        { label: 'Black Friday', value: 'The day after' },
      ]}
      intro={
        <>
          Counting down to <strong>Thanksgiving</strong>, celebrated in the United States on the{' '}
          <strong>fourth Thursday of November</strong>. Because the rule is a weekday rather than a
          fixed date, Thanksgiving moves each year — the timer above always tracks the next one
          automatically, down to the second.
        </>
      }
      faqs={[
        {
          question: 'How many days until Thanksgiving?',
          answer:
            'Thanksgiving falls on the fourth Thursday of November — the live counter at the top of this page shows exactly how many days, hours, and minutes remain right now. Thanksgiving 2026 is Thursday, November 26.',
        },
        {
          question: 'When is Thanksgiving 2026?',
          answer:
            'Thanksgiving 2026 is Thursday, November 26 — the fourth Thursday of the month. In 2027 it falls on November 25, and in 2028 on November 23.',
        },
        {
          question: 'Why does the Thanksgiving date change every year?',
          answer:
            'Since 1941, US federal law has fixed Thanksgiving to the fourth Thursday of November rather than a calendar date. Depending on which weekday November 1 lands on, that Thursday can be anywhere from November 22 to November 28.',
        },
        {
          question: 'When is Black Friday?',
          answer:
            'Black Friday is always the day after Thanksgiving — in 2026 that is Friday, November 27. We have a separate live Black Friday countdown if the sales are what you are waiting for.',
        },
        {
          question: 'Is Canadian Thanksgiving on the same day?',
          answer:
            'No — Canada celebrates Thanksgiving on the second Monday of October, more than a month earlier. This countdown tracks the US holiday.',
        },
      ]}
    />
  );
}
