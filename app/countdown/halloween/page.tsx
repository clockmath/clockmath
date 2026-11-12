'use client';

import EventPage from '@/components/EventPage';
import { countdownProps } from '@/lib/countdowns';
import HolidayDatesTable from '@/components/HolidayDatesTable';
import WorkingDays from '@/components/WorkingDays';
import { halloweenAhead } from '@/lib/workingDays';

export default function HalloweenCountdownPage() {
  return (
    <EventPage
      {...countdownProps('halloween')}
      heading={'How Many Days Until Halloween?'}
      tagline="Live countdown to October 31 — days, hours, minutes, and seconds"
      lastUpdated="2026-11-12"
      breadcrumb="Halloween"
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
        <>
          <WorkingDays title="Weekends and working days until Halloween" through={halloweenAhead} throughLabel="Halloween">
            Halloween parties usually fall on the weekend before, or on Halloween itself when it is a Saturday.
          </WorkingDays>
          <HolidayDatesTable name="Halloween" month={9} day={31} />
        </>
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
          question: 'How many sleeps until Halloween?',
          answer:
            'The same as the number of days at the top of this page: each night between now and Halloween is one sleep. On October 30, it is one sleep to go.',
        },
        {
          question: 'How many weekends until Halloween?',
          answer:
            'The "Weekends and working days until Halloween" section on this page counts the Saturdays left from today through October 31. Halloween 2027 is on a Sunday, so the weekend of October 30 and 31 is Halloween weekend.',
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
