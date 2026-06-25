'use client';

import EventPage from '@/components/EventPage';

// Opening ceremony of the Los Angeles 2028 Summer Olympics.
const LA28_OPENING = new Date(2028, 6, 14);

export default function Olympics2028CountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">LA 2028</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Olympics Countdown</span>
        </>
      }
      tagline="Time until the 2028 Summer Olympics"
      breadcrumb="LA 2028 Olympics"
      target={LA28_OPENING}
      countdownTitle="the 2028 Olympics"
      arrivedLabel="The 2028 Olympics have begun! 🏅"
      disclaimer="ClockMath is not affiliated with, endorsed by, or sponsored by the International Olympic Committee (IOC) or the LA28 organizing committee. “Olympic” and related names are trademarks of their respective owners. Dates subject to change."
      facts={[
        { label: 'Opening ceremony', value: 'July 14, 2028' },
        { label: 'Host city', value: 'Los Angeles, USA' },
        { label: 'Closing ceremony', value: 'July 30, 2028' },
      ]}
      intro={
        <>
          Counting down to the <strong>Los Angeles 2028 Summer Olympics</strong>, set to open on{' '}
          <strong>July 14, 2028</strong>. The live timer above shows exactly how many days, hours, minutes,
          and seconds remain until the opening ceremony — updating every second.
        </>
      }
      faqs={[
        {
          question: 'When do the 2028 Olympics start?',
          answer: 'The Los Angeles 2028 Summer Olympics are scheduled to open on July 14, 2028.',
        },
        {
          question: 'Where are the 2028 Olympics being held?',
          answer: 'The 2028 Summer Olympics will be hosted in Los Angeles, United States.',
        },
        {
          question: 'How long do the 2028 Olympics last?',
          answer: 'The Games are scheduled to run from July 14 to July 30, 2028.',
        },
      ]}
    />
  );
}
