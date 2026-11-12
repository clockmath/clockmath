'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import { countdownProps } from '@/lib/countdowns';

// Spider-Man: Beyond the Spider-Verse (Sony Pictures Animation), the third
// Spider-Verse film: Fri Jun 18, 2027 in US theaters. Moved Jun 4 → Jun 25
// (2025) → Jun 18, 2027 (The Hollywood Reporter, via Shortlist and the
// Express Tribune; TheWrap and Variety for the earlier moves; checked
// Nov 12, 2026). Dates have moved before: recheck when the first trailer
// lands. The board counts to the start of Jun 18 in the visitor's timezone.

export default function BeyondTheSpiderVerseCountdownPage() {
  return (
    <EventPage
      {...countdownProps('beyond-the-spider-verse')}
      heading={'How Many Days Until Beyond the Spider-Verse?'}
      tagline="Time until Spider-Man: Beyond the Spider-Verse hits theaters on June 18, 2027"
      lastUpdated="2026-11-12"
      breadcrumb="Beyond the Spider-Verse"
      facts={[
        { label: 'Release date', value: 'Friday, June 18, 2027' },
        { label: 'Studio', value: 'Sony Pictures Animation' },
        { label: 'Earlier dates', value: 'June 4, then June 25, 2027' },
      ]}
      intro={
        <>
          <strong>Spider-Man: Beyond the Spider-Verse</strong>, the third animated Spider-Verse film after Into the
          Spider-Verse (2018) and Across the Spider-Verse (2023), is due in theaters on{' '}
          <strong>Friday, June 18, 2027</strong>. Sony has moved the date twice: from June 4 to June 25, 2027, then a
          week earlier to June 18, the weekend of Father&apos;s Day and Juneteenth. The countdown above runs to the start
          of release day in your timezone. Waiting for a live-action Spider-Man too? The{' '}
          <Link href="/countdown/avengers-doomsday/" className="text-primary hover:text-primary/80 font-semibold">
            Avengers: Doomsday countdown
          </Link>{' '}
          comes first.
        </>
      }
      faqs={[
        {
          question: 'How many days until Beyond the Spider-Verse comes out?',
          answer:
            'Spider-Man: Beyond the Spider-Verse is due in theaters on Friday, June 18, 2027. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to the second.',
        },
        {
          question: 'When does Beyond the Spider-Verse come out?',
          answer: 'June 18, 2027, in theaters. That is the date Sony Pictures set most recently, a week earlier than its previous June 25 date.',
        },
        {
          question: 'Has Beyond the Spider-Verse been delayed?',
          answer:
            'Several times. It was first planned for 2024 as Across the Spider-Verse Part Two, then set for June 4, 2027, moved to June 25, 2027, and finally moved up a week to June 18, 2027.',
        },
        {
          question: 'Is Beyond the Spider-Verse the last Spider-Verse movie?',
          answer:
            'It is the third film and completes the story that Across the Spider-Verse (2023) left on a cliffhanger, following Miles Morales.',
        },
        {
          question: 'Is Beyond the Spider-Verse coming out on Father’s Day weekend?',
          answer:
            'Yes. June 18, 2027 is the Friday before Father’s Day (Sunday, June 20) and falls on the Juneteenth holiday weekend: Juneteenth, June 19, is a Saturday in 2027, so the federal holiday is observed on Friday, June 18.',
        },
      ]}
    />
  );
}
