'use client';

import EventPage from '@/components/EventPage';
import HolidayDatesTable, { usFederalObserved } from '@/components/HolidayDatesTable';

export default function ChristmasCountdownPage() {
  return (
    <EventPage
      board={{ color: '#1f5f3f' }}
      heading={'How Many Days Until Christmas?'}
      tagline="Live countdown to December 25 — days, hours, minutes, and seconds"
      lastUpdated="2026-10-15"
      breadcrumb="Christmas"
      recurring={{ month: 11, day: 25 }}
      countdownTitle="Christmas"
      arrivedLabel="Merry Christmas! 🎄"
      facts={[
        { label: 'Date', value: 'December 25' },
        { label: 'Christmas Eve', value: 'December 24' },
        { label: 'First to celebrate', value: 'Kiritimati, Kiribati' },
      ]}
      intro={
        <>
          Counting down to <strong>Christmas Day</strong>, <strong>December 25</strong>, in your own
          timezone. Once the day has passed, the countdown moves on to next year&apos;s Christmas.
        </>
      }
      extraContent={
        <HolidayDatesTable
          name="Christmas"
          month={11}
          day={25}
          observed={usFederalObserved}
          observedLabel="US federal holiday observed"
          note="When Christmas falls on a weekend, the US federal holiday moves to the Friday before or the Monday after."
        />
      }
      faqs={[
        {
          question: 'How many days until Christmas?',
          answer:
            'Christmas Day is December 25. The line at the top of this page gives the days and weeks left, updated daily. Christmas 2026 falls on a Friday.',
        },
        {
          question: 'How many sleeps until Christmas?',
          answer:
            'The same as the number of days at the top of this page: each night between now and Christmas morning is one sleep. On Christmas Eve, it is one sleep to go.',
        },
        {
          question: 'What day of the week is Christmas 2026?',
          answer:
            'Christmas Day 2026 falls on a Friday, giving most people a three-day weekend. Christmas Eve is Thursday, December 24. In 2027 Christmas is a Saturday, so the US federal holiday is Friday, December 24.',
        },
        {
          question: 'Where does Christmas arrive first?',
          answer:
            'Kiritimati (Christmas Island) in Kiribati, at UTC+14. It reaches midnight on December 25 at 10 AM on December 24 in London and 5 AM in New York. American Samoa, at UTC−11, is among the last inhabited places, at 6 AM on Christmas Day in New York, so Christmas morning takes about 25 hours to reach everywhere people live.',
        },
      ]}
    />
  );
}
