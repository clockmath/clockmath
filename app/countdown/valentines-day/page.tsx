'use client';

import EventPage from '@/components/EventPage';
import HolidayDatesTable from '@/components/HolidayDatesTable';

export default function ValentinesDayCountdownPage() {
  return (
    <EventPage
      board={{ color: '#a3123a' }}
      heading={"How Many Days Until Valentine's Day?"}
      tagline="Live countdown to February 14 — days, hours, minutes, and seconds"
      lastUpdated="2026-10-15"
      breadcrumb="Valentine's Day"
      recurring={{ month: 1, day: 14 }}
      countdownTitle="Valentine's Day"
      arrivedLabel="Happy Valentine's Day! ❤️"
      facts={[
        { label: 'Date', value: 'February 14' },
        { label: 'In 2027', value: 'Sunday' },
        { label: 'Happens', value: 'Every year' },
      ]}
      intro={
        <>
          Counting down to <strong>Valentine&apos;s Day</strong>, <strong>February 14</strong>, in your own timezone.
          Once the day has passed, the countdown moves on to next year&apos;s.
        </>
      }
      extraContent={<HolidayDatesTable name="Valentine's Day" month={1} day={14} />}
      faqs={[
        {
          question: "How many days until Valentine's Day?",
          answer:
            "Valentine's Day is February 14. The line at the top of this page gives the days and weeks left, updated daily. In 2027 it falls on a Sunday.",
        },
        {
          question: "What day of the week is Valentine's Day 2027?",
          answer:
            "Valentine's Day 2027 falls on a Sunday. In 2028 it is a Monday, and in 2029 a Wednesday.",
        },
        {
          question: "Is Valentine's Day a public holiday?",
          answer:
            "No. Valentine's Day is not a public holiday in the US, Canada or the UK, so offices, schools and banks keep their normal hours.",
        },
        {
          question: "When is Galentine's Day?",
          answer:
            "February 13, the day before Valentine's Day — a day for celebrating friends, popularized by the TV show Parks and Recreation in 2010.",
        },
        {
          question: 'What is White Day?',
          answer:
            "March 14, a month after Valentine's Day. In Japan and South Korea, people who received gifts on Valentine's Day give gifts in return.",
        },
      ]}
    />
  );
}
