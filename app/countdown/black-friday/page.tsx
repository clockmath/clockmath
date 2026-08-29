'use client';

import EventPage from '@/components/EventPage';

export default function BlackFridayCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until Black Friday?'}
      tagline="Live countdown to the day after Thanksgiving"
      lastUpdated="2026-08-29"
      breadcrumb="Black Friday"
      nthWeekday={{ month: 10, weekday: 4, n: 4, offsetDays: 1 }}
      countdownTitle="Black Friday"
      arrivedLabel="It's Black Friday! 🛍️"
      facts={[
        { label: 'Black Friday 2026', value: 'Friday, November 27' },
        { label: 'Rule', value: 'Day after Thanksgiving' },
        { label: 'Cyber Monday', value: 'The following Monday' },
      ]}
      intro={
        <>
          Counting down to <strong>Black Friday</strong>, the day after US Thanksgiving and the
          traditional start of the holiday shopping season. Because Thanksgiving is the fourth
          Thursday of November, Black Friday moves each year — the timer above always tracks the
          next one automatically.
        </>
      }
      faqs={[
        {
          question: 'How many days until Black Friday?',
          answer:
            'Black Friday is the day after Thanksgiving — the live counter at the top of this page shows exactly how many days, hours, and minutes remain right now. Black Friday 2026 is Friday, November 27.',
        },
        {
          question: 'When is Black Friday 2026?',
          answer:
            'Black Friday 2026 is Friday, November 27 — the day after Thanksgiving (fourth Thursday of November). In 2027 it falls on November 26, and in 2028 on November 24.',
        },
        {
          question: 'Do Black Friday sales start before the day itself?',
          answer:
            'Increasingly yes — many large retailers run "early Black Friday" deals through November, and online sales often go live the evening of Thanksgiving. The day itself still tends to carry the headline offers.',
        },
        {
          question: 'When is Cyber Monday?',
          answer:
            'Cyber Monday is the Monday after Thanksgiving — three days after Black Friday. In 2026 that is November 30.',
        },
        {
          question: 'Is Black Friday a public holiday?',
          answer:
            'No — it is not a federal holiday, though many employers give it as a day off since it falls between Thanksgiving and the weekend. Stores are very much open; US stock markets trade a shortened session, closing at 1:00 PM Eastern.',
        },
      ]}
    />
  );
}
