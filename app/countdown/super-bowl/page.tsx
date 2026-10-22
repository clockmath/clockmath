'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import { countdownProps } from '@/lib/countdowns';

// Super Bowl LXI: Sun Feb 14, 2027, SoFi Stadium, Inglewood (Wikipedia and
// NFL-linked listings, checked Oct 15, 2026). Kickoff time not announced —
// counts to the day. After the game, roll this page to Super Bowl LXII.

export default function SuperBowlCountdownPage() {
  return (
    <EventPage
      {...countdownProps('super-bowl')}
      heading={'Super Bowl LXI Countdown'}
      tagline="Sunday, February 14, 2027 — SoFi Stadium, Inglewood, California"
      lastUpdated="2026-10-15"
      breadcrumb="Super Bowl"
      facts={[
        { label: 'Date', value: 'Sunday, Feb 14, 2027' },
        { label: 'Stadium', value: 'SoFi Stadium, Inglewood' },
        { label: 'Kickoff', value: 'Not announced yet' },
      ]}
      intro={
        <>
          <strong>Super Bowl LXI</strong>, the 61st Super Bowl, is on <strong>Sunday, February 14, 2027</strong> at SoFi
          Stadium in Inglewood, California. It is the first Super Bowl played on Valentine&apos;s Day — see the{' '}
          <Link href="/countdown/valentines-day/" className="text-primary hover:text-primary/80 font-semibold">
            Valentine&apos;s Day countdown
          </Link>
          . The countdown runs to the start of game day in your timezone; the NFL hasn&apos;t announced the kickoff
          time yet.
        </>
      }
      faqs={[
        {
          question: 'When is the Super Bowl in 2027?',
          answer:
            'Super Bowl LXI is on Sunday, February 14, 2027. The line at the top of this page gives the days and weeks left, updated daily.',
        },
        {
          question: 'Where is Super Bowl LXI being played?',
          answer: 'At SoFi Stadium in Inglewood, California, in the Los Angeles area.',
        },
        {
          question: 'What time does the Super Bowl start?',
          answer:
            'The NFL has not announced the kickoff time for Super Bowl LXI yet. Recent Super Bowls have kicked off at about 6:30 PM Eastern, which is 3:30 PM Pacific.',
        },
        {
          question: 'Is the Super Bowl on Valentine’s Day?',
          answer:
            'Yes. February 14, 2027 is both Super Bowl Sunday and Valentine’s Day — the first time the two have fallen on the same day.',
        },
        {
          question: 'What does LXI mean?',
          answer: 'It is the Roman numeral for 61: Super Bowl LXI is the 61st Super Bowl.',
        },
      ]}
    />
  );
}
