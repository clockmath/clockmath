'use client';

import EventPage from '@/components/EventPage';
import { UserDateCountdown } from '@/components/UserDateCountdown';

export default function RetirementCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">Retirement</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="How long until you retire?"
      breadcrumb="Retirement"
      countdownSlot={
        <UserDateCountdown
          storageKey="clockmath-retirement-date"
          title="Retirement"
          arrivedLabel="You're retired! 🎉"
          prompt="Your retirement date"
          defaultYearsAhead={10}
        />
      }
      intro={
        <>
          Pick your <strong>retirement date</strong> above and watch the live countdown tick down to the
          big day — years, months, days, hours, minutes, and seconds. Your date is saved in your browser,
          so it&apos;ll be waiting for you next time you visit.
        </>
      }
      faqs={[
        {
          question: 'How do I use the retirement countdown?',
          answer:
            'Choose your planned retirement date with the calendar above. The timer instantly shows how much time is left and updates every second.',
        },
        {
          question: 'Is my retirement date saved?',
          answer:
            'Yes — your date is stored locally in your browser on this device. It is never sent to a server, so it stays private.',
        },
        {
          question: 'Can I change my retirement date later?',
          answer: 'Absolutely. Just pick a new date from the calendar and the countdown updates right away.',
        },
      ]}
    />
  );
}
