'use client';

import EventPage from '@/components/EventPage';
import HolidayDatesTable from '@/components/HolidayDatesTable';

export default function HalloweenCountdownPage() {
  return (
    <EventPage
      board={{ color: '#000000', ink: '#ff8a1f' }}
      heading={'How Many Days Until Halloween?'}
      tagline="Live countdown to October 31 — days, hours, minutes, and seconds"
      lastUpdated="2026-10-15"
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
          Counting down to <strong>Halloween</strong>, <strong>October 31</strong>, in your own timezone.
          Once the day has passed, the countdown moves on to next year&apos;s Halloween.
        </>
      }
      extraContent={
        <HolidayDatesTable name="Halloween" month={9} day={31} />
      }
      faqs={[
        {
          question: 'How many days until Halloween?',
          answer:
            'Halloween is October 31. The line at the top of this page gives the days and weeks left, updated daily. Halloween 2026 falls on a Saturday.',
        },
        {
          question: 'What day of the week is Halloween 2026?',
          answer:
            'Halloween 2026 falls on a Saturday, so trick-or-treating isn’t on a school night. In 2027 it is a Sunday, and in 2028 a Tuesday.',
        },
        {
          question: 'Is Halloween a public holiday?',
          answer:
            'No. Halloween is not a public holiday in the US or Canada, so schools, offices and stores keep their normal hours.',
        },
      ]}
    />
  );
}
