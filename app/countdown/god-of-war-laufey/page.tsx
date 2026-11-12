'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import { countdownProps } from '@/lib/countdowns';

// God of War Laufey (Santa Monica Studio, Sony Interactive Entertainment):
// Thu May 20, 2027, PS5. Delayed about three months from Feb 16, 2027 on
// Nov 4, 2026, its first delay (Gematsu, Game Informer, GamesRadar; checked
// Nov 12, 2026). Some outlets gave the old date as Feb 17. No PC version or
// unlock hour announced: the board counts to midnight on May 20 in the
// visitor's own timezone.

export default function GodOfWarLaufeyCountdownPage() {
  return (
    <EventPage
      {...countdownProps('god-of-war-laufey')}
      heading={'How Many Days Until God of War Laufey?'}
      tagline="Time until God of War Laufey releases on PS5, May 20, 2027"
      lastUpdated="2026-11-12"
      breadcrumb="God of War Laufey"
      facts={[
        { label: 'Release date', value: 'Thursday, May 20, 2027' },
        { label: 'Platform', value: 'PlayStation 5' },
        { label: 'Original date', value: 'February 16, 2027 (delayed Nov 4, 2026)' },
        { label: 'Developer', value: 'Santa Monica Studio' },
      ]}
      intro={
        <>
          <strong>God of War Laufey</strong>, the next God of War from Santa Monica Studio, releases on{' '}
          <strong>Thursday, May 20, 2027</strong> on PlayStation 5. It was due on February 16, 2027; on November 4,
          2026 Sony and Santa Monica Studio moved it back about three months to give the game more time. The countdown
          above runs to the start of release day in your timezone; Sony hasn&apos;t announced an unlock hour yet. Want
          to know how long the delay is in days? The{' '}
          <Link href="/tools/days-between-dates/?from=2027-02-16&to=2027-05-20" className="text-primary hover:text-primary/80 font-semibold">
            days between dates calculator
          </Link>{' '}
          works it out: 93 days.
        </>
      }
      faqs={[
        {
          question: 'How many days until God of War Laufey comes out?',
          answer:
            'God of War Laufey releases on Thursday, May 20, 2027. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to the second.',
        },
        {
          question: 'When does God of War Laufey come out?',
          answer: 'May 20, 2027, on PlayStation 5.',
        },
        {
          question: 'Was God of War Laufey delayed?',
          answer:
            'Yes, once. On November 4, 2026, Sony Interactive Entertainment and Santa Monica Studio moved it from February 16, 2027 to May 20, 2027, about three months later, saying the team needed more time to finish the game.',
        },
        {
          question: 'Is God of War Laufey on PC?',
          answer:
            'Not at launch. It is announced for PlayStation 5 only. The last two God of War games came to PC years after their PlayStation release, but Sony has not announced a PC version of Laufey.',
        },
        {
          question: 'What time does God of War Laufey unlock?',
          answer:
            'Sony has not announced an unlock time yet. The countdown here runs to midnight on May 20 in your timezone. The PlayStation Store listing usually shows the unlock time closer to launch.',
        },
      ]}
    />
  );
}
